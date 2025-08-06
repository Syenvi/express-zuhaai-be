import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getPlatforms = async (req, res) => {
  try {
    const platforms = await prisma.platform.findMany();
    res.status(200).json({
      status: true,
      data: platforms,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
