import { Router } from "express";
import { authMiddleware } from "../middleware/controller.js";
import {
  createAgent,
  deleteAgent,
  getAgent,
  getAgents,
  updateAgent,
} from "./controller.js";
import { validate } from "../middleware/validatorMiddleware.js";
import { createAgentSchema } from "./validator/index.js";
import multer from "multer";

const router = Router();
const upload = multer();

router.get("/", authMiddleware, getAgents);
router.get("/:id", authMiddleware, getAgent);
router.post(
  "/",
  authMiddleware,
  upload.none(),
  validate(createAgentSchema),
  createAgent
);
router.patch("/:id", authMiddleware, updateAgent);
router.delete("/:id", authMiddleware, deleteAgent);

export default router;
