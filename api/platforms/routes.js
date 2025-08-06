import { Router } from "express";
import { getPlatforms } from "./controller.js";

const router = Router();

router.get("/", getPlatforms);
export default router;
