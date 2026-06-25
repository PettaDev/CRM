import { z } from "zod";
import { deviceBrandSchema } from "./case.dto";

// Formulário que o cliente preenche. O telefone NÃO entra aqui — ele vem do
// token (chave de associação) e não é digitado pelo cliente.
export const clientFormSchema = z
  .object({
    nomeCompleto: z.string().min(1, "Informe o nome completo."),
    cpf: z.string().default(""),
    nascimento: z.string().default(""),
    email: z.string().default(""),
    cep: z.string().default(""),
    rua: z.string().default(""),
    numero: z.string().default(""),
    bairro: z.string().default(""),
    cidade: z.string().default(""),
    estado: z.string().default(""),
    marca: deviceBrandSchema,
    modelo: z.string().default(""),
    imei1: z.string().min(1, "Informe o IMEI 1 (disque *#06#)."),
    imei2: z.string().default(""),
    sn: z.string().default(""),
    notaFiscal: z.string().default(""),
    consentimentoLgpd: z.boolean(),
  })
  .refine((d) => d.consentimentoLgpd === true, {
    message: "É necessário aceitar o consentimento LGPD.",
    path: ["consentimentoLgpd"],
  });
export type ClientFormDto = z.infer<typeof clientFormSchema>;
