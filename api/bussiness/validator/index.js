import { z } from "zod";

export const createBussinessSchema = z.object({
  name: z.string().min(1, "Bussiness name required"),
  phone: z.string().min(8, "Phone min contain 8 chars"),
});
