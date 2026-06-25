import { z } from "zod";

export const addShipmentSchema = z.object({
  direcao: z.enum(["ida", "volta"]),
  codigoRastreio: z.string().optional(),
  enviadoEm: z.string().optional(),
  transportadora: z.string().default("Correios"),
});
export type AddShipmentDto = z.infer<typeof addShipmentSchema>;
