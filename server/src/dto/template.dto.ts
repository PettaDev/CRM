import { z } from "zod";

export const sendTemplateSchema = z.object({
  templateId: z.string().min(1, "Informe o template."),
});
export type SendTemplateDto = z.infer<typeof sendTemplateSchema>;
