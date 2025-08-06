import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().nonnegative(),
  description: z.string().optional(),
});
