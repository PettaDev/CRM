import { http } from "./client";

// Planilhas operacionais (Trocas, Estoque de lacrados, Modelos) — CRUD.
export type SheetRow = { id: number } & Record<string, string>;

export const sheetsApi = {
  list: (sheet: string) => http.get<SheetRow[]>(`/sheets/${sheet}`),
  create: (sheet: string, data: Record<string, string>) =>
    http.post<SheetRow>(`/sheets/${sheet}`, data),
  update: (sheet: string, id: number, data: Record<string, string>) =>
    http.patch<SheetRow>(`/sheets/${sheet}/${id}`, data),
  remove: (sheet: string, id: number) => http.del<void>(`/sheets/${sheet}/${id}`),
};
