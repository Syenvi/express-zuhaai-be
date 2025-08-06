import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import productRoutes from "./api/products/routes.js";
import authRoutes from "./api/auth/routes.js";
import bussinessRoutes from "./api/bussiness/routes.js";
import agentsRoutes from "./api/agents/routes.js";
import connectedPlatformRoutes from "./api/connected-platforms/routes.js";
import platformRoutes from "./api/platforms/routes.js";
import cookieParser from "cookie-parser";
import { initAllWhatsAppSessions } from "./whatsapp/wa-manager.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/api/auth", authRoutes);
app.use("/api/business", bussinessRoutes);
app.use("/api/products", productRoutes);
app.use("/api/agents", agentsRoutes);
app.use("/api/connected-platforms", connectedPlatformRoutes);
app.use("/api/platforms", platformRoutes);
app.use("/product-images", express.static("product-images"));

app.listen(process.env.APP_PORT, async () => {
  console.log(`Server up and Running in port ${process.env.APP_PORT}...`);

  try {
    await initAllWhatsAppSessions();
    console.log("✅ Semua sesi WhatsApp aktif berhasil dijalankan.");
  } catch (err) {
    console.error("❌ Gagal memulai sesi WhatsApp:", err);
  }
});
