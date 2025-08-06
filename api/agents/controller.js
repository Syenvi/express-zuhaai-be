import { PrismaClient } from "@prisma/client";
import { refreshIfActive } from "../../utils/refreshSessionData.js";

const prisma = new PrismaClient();

export const getAgent = async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id: agentId,
      },
    });

    if (!existingAgent || existingAgent.user_id !== req.user.id) {
      return res.status(404).json({
        status: false,
        message: "Agent not found or unauthorized",
      });
    }
    res.status(200).json({
      status: true,
      data: existingAgent,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const getAgents = async (req, res) => {
  try {
    const agents = await prisma.agent.findMany({
      where: {
        user_id: req.user.id,
      },
    });
    res.status(200).json({
      status: true,
      data: agents,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const createAgent = async (req, res) => {
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

    const existingAgent = await prisma.agent.findFirst({
      where: { user_id: req.user.id },
    });

    if (existingAgent) {
      return res.status(400).json({
        status: false,
        message: "You already have an agent assigned to your account.",
      });
    }

    const { name, type } = req.body;
    const default_prompt = `Kamu adalah ${type} untuk bisnis bernama ${name}. Tugas-mu memberi informasi yang jelas, singkat, dan membantu. Gaya bicara-mu ramah, semi-formal, dan pakai emoji untuk berekspresi. Kamu tidak boleh menjawab pertanyaan yang tidak berkaitan dengan ${existingBussiness?.name}.`;

    const default_welcome_message = `Halo! Selamat datang di ${name}. Saya asisten AI yang akan menjawab semua pertanyaan-mu tentang ${existingBussiness?.name}.`;
    const post = await prisma.agent.create({
      data: {
        name,
        type,
        user_id: req.user.id,
        prompt: default_prompt,
        welcome_message: default_welcome_message,
      },
    });

    await refreshIfActive(req.user.id);

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

export const updateAgent = async (req, res) => {
  try {
    const { name, description, prompt, welcome_message, knowledge } = req.body;
    const productId = parseInt(req.params.id);

    const existingAgent = await prisma.agent.findUnique({
      where: { id: productId },
    });

    if (!existingAgent || existingAgent.user_id !== req.user.id) {
      return res.status(404).json({
        status: false,
        message: "Agent not found or unauthorized",
      });
    }

    const updatedAgent = await prisma.agent.update({
      where: { id: productId },
      data: {
        name,
        description,
        prompt,
        welcome_message,
        knowledge,
      },
    });

    await refreshIfActive(req.user.id);

    res.json({
      status: true,
      data: updatedAgent,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

export const deleteAgent = async (req, res) => {
  try {
    const agentId = parseInt(req.params.id);

    const existingAgent = await prisma.agent.findUnique({
      where: { id: agentId },
    });

    if (!existingAgent || existingAgent.user_id !== req.user.id) {
      return res.status(404).json({
        status: false,
        message: "Agent not found or unauthorized",
      });
    }

    await prisma.agent.delete({
      where: { id: agentId },
    });

    await refreshIfActive(req.user.id);

    res.json({
      status: true,
      message: "Agent deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
