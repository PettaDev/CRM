import { http } from "./client";

export interface AdminUser {
  id: string;
  nome: string;
  email: string;
  area: string;
  role: string;
  pais: string;
}

export interface NewUserInput {
  nome: string;
  email: string;
  senha: string;
  area: string;
  role: string;
}

// Contas de acesso (Administração — gestor).
export const usersApi = {
  list: () => http.get<AdminUser[]>("/users"),
  create: (u: NewUserInput) => http.post<AdminUser>("/users", u),
  remove: (id: string) => http.del<void>(`/users/${id}`),
};
