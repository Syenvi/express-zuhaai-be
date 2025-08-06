import { PrismaClient } from "@prisma/client";
import { connectWhatsAppStart } from "./connect.js";
import log from "../utils/logger.js";

const waSessions = new Map(); // key: sessionId, value: { sock, userId, connectedPlatformId }
const sessionData = new Map(); // cache the agent,product,and bussiness
const prisma = new PrismaClient();
export const initAllWhatsAppSessions = async () => {
  log.info("Whatsapp session init");
  const activePlatforms = await prisma.connectedPlatform.findMany({
    where: { is_active: true },
  });

  for (const platform of activePlatforms) {
    const sessionId = `user-${platform.user_id}-cp-${platform.id}`;
    if (waSessions.has(sessionId)) continue;

    const { sock } = await connectWhatsAppStart(platform.user_id, platform.id);
    waSessions.set(sessionId, {
      sock,
    });

    const agent = await prisma.agent.findFirst({
      where: { user_id: platform.user_id },
      take: 1,
    });

    const products = await prisma.product.findMany({
      where: { user_id: platform.user_id },
    });

    setSessionData(platform.user_id, platform.id, {
      agent,
      products,
    });
  }
};

export const getSessionId = (userId, connectedPlatformId) =>
  `user-${userId}-cp-${connectedPlatformId}`;

export const setSession = (userId, connectedPlatformId, sock) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  waSessions.set(sessionId, { sock });
};

export const getSession = (userId, connectedPlatformId) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  waSessions.get(sessionId);
};

export const deleteSession = (userId, connectedPlatformId) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  waSessions.delete(sessionId);
  log.info(`[WA-MANAGER] Session deleted: ${sessionId}`);
};

export const setSessionData = (userId, connectedPlatformId, data) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  sessionData.set(sessionId, data);
};

export const getSessionData = (userId, connectedPlatformId) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  return sessionData.get(sessionId);
};

export const refreshSessionData = async (userId, platformId) => {
  const agent = await prisma.agent.findFirst({ where: { user_id: userId } });
  const products = await prisma.product.findMany({
    where: { user_id: userId },
  });

  setSessionData(userId, platformId, { agent, products });
};

export const deleteSessionData = (userId, connectedPlatformId) => {
  const sessionId = getSessionId(userId, connectedPlatformId);
  sessionData.delete(sessionId);
};

export { waSessions };
