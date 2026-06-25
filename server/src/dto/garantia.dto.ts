import { z } from "zod";

// Triagem de garantia: causas que fazem o aparelho perder a garantia + se liga.
export const updateGarantiaSchema = z.object({
  queda: z.boolean(),
  agua: z.boolean(),
  aberto: z.boolean(),
  aparelhoLiga: z.boolean(),
});
export type UpdateGarantiaDto = z.infer<typeof updateGarantiaSchema>;
