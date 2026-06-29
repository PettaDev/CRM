import { http } from "./client";

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  area: string;
  role: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export const authApi = {
  login: (email: string, password: string) =>
    http.post<LoginResult>("/auth/login", { email, password }),
  me: () => http.get<AuthUser>("/auth/me"),
};
