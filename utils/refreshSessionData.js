// Module to refresh session data when user update product / agent

import { refreshSessionData } from "../whatsapp/wa-manager.js";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const refreshIfActive = async (userId) => {
  const platform = await prisma.connectedPlatform.findFirst({
    where: { user_id: userId, is_active: true },
  });

  if (platform) {
    await refreshSessionData(userId, platform.id);
  }
};
