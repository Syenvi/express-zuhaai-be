import { PrismaClient } from "@prisma/client";
import { connectWhatsAppStart } from "../../whatsapp/connect.js";
import { setSession } from "../../whatsapp/wa-manager.js";

const prisma = new PrismaClient();

export const getConnectedPlatforms = async (req, res) => {
  try {
    const connectedPlatforms = await prisma.connectedPlatform.findMany({
      where: {
        user_id: req.user.id,
      },
      include: {
        platform: true,
      },
    });
    res.status(200).json({
      status: true,
      data: connectedPlatforms,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getDetailConnectedPlatform = async (req, res) => {
  try {
    const connectedPlatformId = parseInt(req.params.id);
    const connectedPlatform = await prisma.connectedPlatform.findFirst({
      where: {
        id: connectedPlatformId,
      },
      include: {
        platform: true,
      },
    });
    res.status(200).json({
      status: true,
      data: connectedPlatform,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const createConnectedPlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const existingBussiness = await prisma.bussiness.findFirst({
      where: {
        user_id: userId,
      },
    });
    if (!existingBussiness) {
      return res.status(400).json({
        status: false,
        message: "You must create a business first",
      });
    }
    const { platform_id, platform_identifier } = req.body;
    const existingIdentifier = await prisma.connectedPlatform.findUnique({
      where: {
        platform_identifier,
      },
    });

    if (existingIdentifier && existingIdentifier.id !== connectedPlatformId) {
      return res.status(400).json({
        status: false,
        message: "Platform identifier already in use by another platform",
      });
    }
    const post = await prisma.connectedPlatform.create({
      data: {
        platform_id,
        platform_identifier,
        user_id: userId,
      },
      include: {
        platform: true,
      },
    });
    res.status(201).json({
      status: true,
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const updateConnectedPlatform = async (req, res) => {
  try {
    const { platform_id, platform_identifier } = req.body;
    const connectedPlatformId = parseInt(req.params.id);

    const existingConnectedPlatform = await prisma.connectedPlatform.findUnique(
      {
        where: { id: connectedPlatformId },
      }
    );

    if (
      !existingConnectedPlatform ||
      existingConnectedPlatform.user_id !== req.user.id
    ) {
      return res.status(404).json({
        status: false,
        message: "Connected Platform not found or unauthorized",
      });
    }

    const existingIdentifier = await prisma.connectedPlatform.findUnique({
      where: {
        platform_identifier,
      },
    });

    if (existingIdentifier && existingIdentifier.id !== connectedPlatformId) {
      return res.status(400).json({
        status: false,
        message: "Platform identifier already in use by another platform",
      });
    }

    const updatedConnectedPlatform = await prisma.connectedPlatform.update({
      where: { id: connectedPlatformId },
      data: {
        platform_id,
        platform_identifier,
        is_active: false,
      },
      include: {
        platform: true,
      },
    });
    res.json({
      status: true,
      data: updatedConnectedPlatform,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const deleteConnectedPlatform = async (req, res) => {
  try {
    const connectedPlatformId = parseInt(req.params.id);

    const existingConnectedPlatform = await prisma.connectedPlatform.findUnique(
      {
        where: { id: connectedPlatformId },
      }
    );

    if (
      !existingConnectedPlatform ||
      existingConnectedPlatform.user_id !== req.user.id
    ) {
      return res.status(404).json({
        status: false,
        message: "Connected Platform not found or unauthorized",
      });
    }

    await prisma.connectedPlatform.delete({
      where: { id: connectedPlatformId },
    });

    res.json({
      status: true,
      message: "Connected Platform deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const connectConnectedPlatform = async (req, res) => {
  try {
    const userId = req.user.id;
    const connectedPlatformId = parseInt(req.params.id);

    const existing = await prisma.connectedPlatform.findUnique({
      where: { id: connectedPlatformId },
    });

    if (!existing || existing.user_id !== userId) {
      return res.status(404).json({
        status: false,
        message: "Connected Platform not found or unauthorized",
      });
    }

    if (existing.is_active) {
      return res.status().json({
        status: false,
        message: "Your agent is active !",
      });
    }

    const { sock, qr } = await connectWhatsAppStart(
      userId,
      connectedPlatformId
    );
    setSession(userId, connectedPlatformId, sock);
    res.json({
      status: true,
      message: "Scan QR to connect WhatsApp",
      qr,
      data: existing,
    });
  } catch (err) {
    res.status(500).json({
      status: false,
      message: err.message,
    });
  }
};
