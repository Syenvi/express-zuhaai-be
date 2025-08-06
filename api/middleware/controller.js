import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { promisify } from "util";

const prisma = new PrismaClient();

const verifyToken = promisify(jwt.verify);

export const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token =
      (authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null) || req.cookies?.access_token;

    if (!token) {
      return res.status(401).json({ status: false, message: "Unauthorized" });
    }

    const decoded = await verifyToken(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        profile: true,
      },
    });

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Simpan user ke request untuk middleware berikutnya
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ status: false, message: "Unauthorized" });
  }
};
