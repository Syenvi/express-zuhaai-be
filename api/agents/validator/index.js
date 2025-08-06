import { AgentType } from "@prisma/client";
import { z } from "zod";

export const createAgentSchema = z.object({
  name: z.string().min(1, "Agent name required"),
  type: z.nativeEnum(AgentType, {
    errorMap: () => ({ message: "Invalid agent type" }),
  }),
  description: z.string().optional(),
  prompt: z.string().optional(),
  knowledge: z.string().optional(),
  welcome_message: z.string().optional(),
});
