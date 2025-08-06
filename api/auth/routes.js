import { Router } from "express";
import { googleAuth, googleAuthallback, rememberMe } from "./controller.js";
import { authMiddleware } from "../middleware/controller.js";

const router = Router();

router.get("/me", authMiddleware, rememberMe);
router.get("/google", googleAuth);
router.get("/google/callback", googleAuthallback);

export default router;
