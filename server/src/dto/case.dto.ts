import { z } from "zod";

// Esquemas de validação reutilizáveis (a fonte da verdade dos enums na borda).
export const deviceBrandSchema = z.enum([
  "TECNO",
  "Infinix",
  "itel",
  "Syinix",
  "Oraimo",
]);
export const areaSchema = z.enum(["Carlcare", "TFAE"]);
export const caseStatusSchema = z.enum([
  "novo",
  "validado",
  "aguardando_envio",
  "em_transito",
  "recebido",
  "triagem",
  "fora_garantia",
  "em_reparo",
  "aguardando_peca",
  "pronto",
  "enviado_retorno",
  "finalizado",
  "cancelado",
]);

export const createCaseSchema = z.object({
  // id opcional: permite o cliente (frontend) propor o id; senão o servidor gera.
  id: z.string().optional(),
  cliente: z.string().min(1, "Informe o cliente."),
  telefone: z.string().min(1, "Informe o telefone."),
  cidade: z.string().default(""),
  estado: z.string().default(""),
  marca: deviceBrandSchema,
  modelo: z.string().min(1, "Informe o modelo."),
  imei: z.string().default(""),
  defeito: z.string().min(1, "Descreva o defeito."),
  area: areaSchema,
  responsavel: z.string().min(1, "Informe o responsável."),
  pais: z.string().default("BR"), // país do caso (herda do agente/loja)
});
export type CreateCaseDto = z.infer<typeof createCaseSchema>;

export const updateStatusSchema = z.object({
  status: caseStatusSchema,
  by: z.string().min(1, "Informe o responsável pela mudança."),
  note: z.string().optional(),
});
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
