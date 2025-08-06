import { Router } from "express";
import { authMiddleware } from "../middleware/controller.js";
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
} from "./controller.js";
import { upload } from "../middleware/uplaodMiddleware.js";
import { createProductSchema } from "./validator/index.js";
import { validate } from "../middleware/validatorMiddleware.js";

const router = Router();

router.get("/", authMiddleware, getProducts);
router.post(
  "/",
  authMiddleware,
  upload.single("image"),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400).json({
        status: false,
        message: "Image is required",
      });
    }
    next();
  },
  validate(createProductSchema),
  createProduct
);
router.patch("/:id", authMiddleware, upload.single("image"), updateProduct);
router.delete("/:id", authMiddleware, deleteProduct);

export default router;
