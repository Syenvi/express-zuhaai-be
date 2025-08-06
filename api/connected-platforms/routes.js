import { Router } from "express";
import { authMiddleware } from "../middleware/controller.js";
import {
  connectConnectedPlatform,
  createConnectedPlatform,
  deleteConnectedPlatform,
  getConnectedPlatforms,
  getDetailConnectedPlatform,
  updateConnectedPlatform,
} from "./controller.js";

const router = Router();

router.get("/", authMiddleware, getConnectedPlatforms);
router.get("/:id", authMiddleware, getDetailConnectedPlatform);
router.post("/", authMiddleware, createConnectedPlatform);
router.patch("/:id", authMiddleware, updateConnectedPlatform);
router.delete("/:id", authMiddleware, deleteConnectedPlatform);
router.post("/connect/:id", authMiddleware, connectConnectedPlatform);
export default router;
