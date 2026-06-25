import { z } from "zod";
import { deviceBrandSchema } from "./case.dto";

// Formulário que o cliente preenche. O telefone NÃO entra aqui — ele vem do
// token (chave de associação) e não é digitado pelo cliente.
// Todos os campos obrigatórios (exceto IMEI 2 — 2º SIM). Mesmas regras do
// frontend, aplicadas de novo aqui — o servidor é a autoridade (defesa em
// profundidade).
export const clientFormSchema = z
  .object({
    nomeCompleto: z.string().min(1, "Informe o nome completo."),
    cpf: z
      .string()
      .refine((s) => s.replace(/\D/g, "").length === 11, "O CPF deve ter 11 dígitos."),
    nascimento: z.string().min(1, "Informe a data de nascimento."),
    email: z.string().email("E-mail inválido."),
    cep: z
      .string()
      .refine((s) => s.replace(/\D/g, "").length === 8, "O CEP deve ter 8 dígitos."),
    rua: z.string().min(1, "Informe a rua."),
    numero: z.string().min(1, "Informe o número."),
    bairro: z.string().min(1, "Informe o bairro."),
    cidade: z.string().min(1, "Informe a cidade."),
    estado: z.string().min(2, "Informe a UF."),
    marca: deviceBrandSchema,
    modelo: z.string().min(1, "Informe o modelo."),
    imei1: z.string().min(1, "Informe o IMEI 1."),
    imei2: z.string().default(""),
    sn: z.string().min(1, "Informe o número de série (SN)."),
    notaFiscal: z.string().min(1, "Informe a nota fiscal."),
    consentimentoLgpd: z.boolean(),
  })
  .refine((d) => d.consentimentoLgpd === true, {
    message: "É necessário aceitar o consentimento LGPD.",
    path: ["consentimentoLgpd"],
  });
export type ClientFormDto = z.infer<typeof clientFormSchema>;
