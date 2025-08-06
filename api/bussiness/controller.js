import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createBussiness = async (req, res) => {
  try {
    const existingBussiness = await prisma.bussiness.findFirst({
      where: { user_id: req.user.id },
    });

    if (existingBussiness) {
      return res.status(400).json({
        status: false,
        message: "You already have bussiness to your account.",
      });
    }

    const post = await prisma.bussiness.create({
      data: {
        name: req.body.name,
        user_id: req.user.id,
        phone: req.body.phone,
      },
    });

    res.status(201).json({
      status: true,
      data: post,
    });
  } catch {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
