import { z } from "zod";

export const addMessageSchema = z.object({
  text: z.string().min(1, "Mensagem vazia."),
  from: z.enum(["cliente", "agente"]).default("agente"),
});
export type AddMessageDto = z.infer<typeof addMessageSchema>;
