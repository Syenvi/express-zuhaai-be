import { Router } from "express";
import { authMiddleware } from "../middleware/controller.js";
import { createBussiness } from "./controller.js";
import multer from "multer";
import { validate } from "../middleware/validatorMiddleware.js";
import { createBussinessSchema } from "./validator/index.js";
const upload = multer();

const router = Router();

router.post(
  "/",
  authMiddleware,
  upload.none(),
  validate(createBussinessSchema),
  createBussiness
);

export default router;
