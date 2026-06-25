import { http } from "./client";
import type {
  Area,
  CaseStatus,
  Client,
  ClientForm,
  Conversation,
  ServiceCase,
} from "../types";
import type { NewCaseInput } from "../context/CrmContext";

// Espelha o retorno de GET /stats (agregações do backend).
export interface DashboardStats {
  abertos: number;
  aguardandoPeca: number;
  prontos: number;
  finalizados: number;
  porArea: { area: Area; total: number; abertos: number }[];
  porStatus: { status: CaseStatus; total: number }[];
}

// Camada de acesso à API: cada método mapeia 1:1 para um endpoint REST.
export const crmApi = {
  listCases: () => http.get<ServiceCase[]>("/cases"),
  createCase: (input: NewCaseInput & { id?: string }) =>
    http.post<ServiceCase>("/cases", input),
  updateCaseStatus: (id: string, status: CaseStatus, by: string, note?: string) =>
    http.patch<ServiceCase>(`/cases/${id}/status`, { status, by, note }),

  listConversations: () => http.get<Conversation[]>("/conversations"),
  addMessage: (id: string, text: string, from: "cliente" | "agente" = "agente") =>
    http.post<Conversation>(`/conversations/${id}/messages`, { text, from }),
  markRead: (id: string) => http.post<Conversation>(`/conversations/${id}/read`),
  sendForm: (id: string) =>
    http.post<{ conversation: Conversation; client: Client }>(
      `/conversations/${id}/send-form`
    ),

  listClients: () => http.get<Client[]>("/clients"),
  submitForm: (telefoneKey: string, form: ClientForm) =>
    http.post<Client>(`/clients/${telefoneKey}/form`, form),

  getStats: () => http.get<DashboardStats>("/stats"),
};
