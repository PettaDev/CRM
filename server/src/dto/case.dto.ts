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
  "orcamento_enviado",
  "devolucao_sem_reparo",
  "em_reparo",
  "aguardando_peca",
  "controle_qualidade",
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

// Gate 1: data de ativação/compra do aparelho (garantia por tempo).
export const ativacaoSchema = z.object({
  ativadoEm: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use aaaa-mm-dd)."),
});
export type AtivacaoDto = z.infer<typeof ativacaoSchema>;

// Orçamento do reparo pago (fluxo fora de garantia).
export const orcamentoSchema = z.object({
  valor: z.number().positive("O valor deve ser maior que zero."),
});
export type OrcamentoDto = z.infer<typeof orcamentoSchema>;

export const updateStatusSchema = z.object({
  status: caseStatusSchema,
  by: z.string().min(1, "Informe o responsável pela mudança."),
  note: z.string().optional(),
});
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
