import { http } from "./client";
import type {
  Area,
  CaseStatus,
  Client,
  ClientForm,
  Conversation,
  ServiceCase,
  ShipmentDirection,
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

export interface GarantiaInput {
  queda: boolean;
  agua: boolean;
  aberto: boolean;
  aparelhoLiga: boolean;
}

export interface ShipmentInput {
  direcao: ShipmentDirection;
  codigoRastreio?: string;
  enviadoEm?: string;
  transportadora?: string;
}

export interface TemplateSummary {
  id: string;
  nome: string;
  descricao: string;
  requiresValidated: boolean;
}

// Camada de acesso à API: cada método mapeia 1:1 para um endpoint REST.
export const crmApi = {
  listCases: () => http.get<ServiceCase[]>("/cases"),
  createCase: (input: NewCaseInput & { id?: string }) =>
    http.post<ServiceCase>("/cases", input),
  updateCaseStatus: (id: string, status: CaseStatus, by: string, note?: string) =>
    http.patch<ServiceCase>(`/cases/${id}/status`, { status, by, note }),
  updateGarantia: (id: string, g: GarantiaInput) =>
    http.patch<ServiceCase>(`/cases/${id}/garantia`, g),
  addShipment: (id: string, s: ShipmentInput) =>
    http.post<ServiceCase>(`/cases/${id}/shipments`, s),
  findByImei: (imei: string) =>
    http.get<ServiceCase[]>(`/cases?imei=${encodeURIComponent(imei)}`),

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

  listTemplates: () => http.get<TemplateSummary[]>("/templates"),
  sendTemplate: (conversationId: string, templateId: string) =>
    http.post<Conversation>(`/conversations/${conversationId}/templates`, {
      templateId,
    }),
};
