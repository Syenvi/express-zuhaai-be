import { PrismaClient } from "@prisma/client";
import {
  useMultiFileAuthState,
  makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
} from "baileys";
import path from "path";
import qrcode from "qrcode-terminal";
import log from "../utils/logger.js";
import fsExtra from "fs-extra";
import {
  deleteSession,
  deleteSessionData,
  getSessionData,
  setSessionData,
} from "./wa-manager.js";
import { handleAiResponse } from "../libs/ai-responder.js";

const prisma = new PrismaClient();

export const connectWhatsAppStart = async (userId, connectedPlatformId) => {
  log.info(`LOG FROM : user-${userId}-${connectedPlatformId}`);
  const sessionId = `user-${userId}-cp-${connectedPlatformId}`;
  const sessionPath = path.resolve(`./whatsapp/sessions/${sessionId}`);
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);

  return new Promise(async (resolve, reject) => {
    let stock;
    let qrReturned = false;
    let isSettled = false; // prevent double resolve/reject
    const { version } = await fetchLatestBaileysVersion();
    const startSock = () => {
      log.info("🌐 Starting WhatsApp socket...");

      const sock = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
      });

      sock.ev.on("creds.update", saveCreds);

      sock.ev.on(
        "connection.update",
        async ({ connection, lastDisconnect, qr }) => {
          if (qr && !qrReturned) {
            log.info("QR code generated – waiting to be scanned...");
            qrcode.generate(qr, { small: true });
            qrReturned = true;
            if (!isSettled) {
              isSettled = true;
              resolve({ sock, qr }); // ← return keduanya
            }
          }

          if (connection === "open") {
            log.success("✅ WhatsApp connected successfully.");

            const [agent, products] = await Promise.all([
              prisma.agent.findFirst({ where: { user_id: userId } }),
              prisma.product.findMany({
                where: { user_id: userId },
              }),
            ]);

            setSessionData(userId, connectedPlatformId, {
              agent,
              products,
            });

            await prisma.connectedPlatform.update({
              where: { id: connectedPlatformId },
              data: { is_active: true },
            });
            if (!isSettled) {
              isSettled = true;
              resolve({ sock, qr: null }); // ← reconnect tanpa QR
            }
          }

          if (connection === "close") {
            const reasonCode = lastDisconnect?.error?.output?.statusCode;
            const reasonMessage =
              JSON.stringify(
                lastDisconnect?.error?.output?.payload ||
                  lastDisconnect?.error?.message
              ) || "Unknown reason";

            log.warn(`❌ WhatsApp disconnected. Reason code: ${reasonCode}`);
            log.error(`Reason message: ${reasonMessage}`);

            if (
              reasonCode === 515 ||
              reasonCode === DisconnectReason.restartRequired
            ) {
              log.info("🔁 Restarting WhatsApp socket in 1s...");
              return setTimeout(() => startSock(), 1000);
            }

            await prisma.connectedPlatform.update({
              where: { id: connectedPlatformId },
              data: { is_active: false },
            });

            const sessionPath = path.resolve(
              `./whatsapp/sessions/user-${userId}-cp-${connectedPlatformId}`
            );
            if (await fsExtra.pathExists(sessionPath)) {
              await fsExtra.remove(sessionPath);
              log.info(`[SESSION] Folder sesi dihapus : ${sessionPath}`);
            }

            deleteSession(userId, connectedPlatformId);
            deleteSessionData(userId, connectedPlatformId);

            if (!isSettled) {
              isSettled = true;
              reject(new Error(`WhatsApp disconnected: ${reasonMessage}`));
            }
          }
        }
      );

      sock.ev.on("messages.upsert", async ({ messages }) => {
        for (const msg of messages) {
          if (!msg.message) continue;

          const { remoteJid, fromMe, id, participant } = msg.key;
          const sender = msg.pushName || participant || "Unknown";
          const isGroup = remoteJid.endsWith("@g.us");
          const isStatus = remoteJid === "status@broadcast";
          const isReaction = !!msg.message?.reactionMessage;

          // Deteksi tipe isi pesan
          const messageType = Object.keys(msg.message)[0];
          const data = await getSessionData(userId, connectedPlatformId);
          const { agent, products } = data || {};
          // lalu lanjut ke AI / pemrosesan lainnya

          // Tentukan kategori pesan
          let notifType = "pribadi";
          if (isGroup) notifType = "grup";
          else if (isStatus) notifType = "status";
          else if (isReaction) notifType = "reaksi";

          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            null;

          if (text) {
            const isUserChat = /^\d+@s\.whatsapp\.net$/.test(remoteJid); //filter hanya chat pribadi
            if (!fromMe && isUserChat) {
              const aiReply = await handleAiResponse(agent, products, text);

              // 1. Cek apakah ada tag gambar [IMAGE:123]
              const imageTags = [...aiReply.matchAll(/\[IMAGE:(\d+)\]/g)];

              for (const match of imageTags) {
                const productId = parseInt(match[1]);
                const product = await prisma.product.findUnique({
                  where: { id: productId },
                  include: { images: { take: 1 } },
                });

                if (product?.images?.[0]) {
                  const imagePath = path.resolve(
                    "product-images",
                    product.images[0].url
                  );
                  if (await fsExtra.exists(imagePath)) {
                    await sock.sendMessage(remoteJid, {
                      image: fsExtra.readFileSync(imagePath),
                      caption: `📦 ${product.name}`,
                    });
                    log.info(
                      `[WA][SEND IMAGE] Gambar produk dikirim: ${product.name}`
                    );
                  } else {
                    log.warn(
                      `[WA][IMAGE] Gambar tidak ditemukan di: ${imagePath}`
                    );
                  }
                }
              }

              // 2. Kirim teks reply tanpa tag [IMAGE:x]
              const cleanedText = aiReply.replace(/\[IMAGE:\d+\]/g, "").trim();
              if (cleanedText) {
                await sock.sendMessage(remoteJid, { text: cleanedText });
                log.info(`[WA][SEND TEXT] Balasan AI: ${cleanedText}`);
              }
            }
          }

          // log.info("───────────────────────────────\n");
        }
      });
    };

    // start pertama
    startSock();
  });
};
