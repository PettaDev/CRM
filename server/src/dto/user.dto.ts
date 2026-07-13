import { z } from "zod";
import { isAllowedEmail } from "../domain/auth";
import { areaSchema } from "./case.dto";

// Criação de conta pela Administração (gestor). Mesma trava de domínio do login.
export const createUserSchema = z.object({
  nome: z.string().min(1, "Informe o nome."),
  email: z
    .string()
    .email("E-mail inválido.")
    .refine(isAllowedEmail, "Só e-mails @transsion.com ou @carlcare.com."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  area: areaSchema,
  role: z.enum(["agente", "gestor"]),
  pais: z.string().length(2).default("BR"),
});
export type CreateUserDto = z.infer<typeof createUserSchema>;
