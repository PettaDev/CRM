// ───────────────────────────────────────────────────────────────────────────
// Domínio do CRM de assistência técnica (Carlcare)
// Tipos compartilhados por toda a aplicação.
// ───────────────────────────────────────────────────────────────────────────

// Status do caso/atendimento — espelha o ciclo de vida de um reparo.
export type CaseStatus =
  | "novo"
  | "triagem"
  | "aguardando_peca"
  | "em_reparo"
  | "pronto"
  | "finalizado"
  | "cancelado";

// Áreas/filas internas que acompanham o caso.
export type Area = "Carlcare" | "TFAE" | "Comercial" | "HQ";

// Marcas atendidas pela Carlcare Brasil.
export type DeviceBrand = "TECNO" | "Infinix" | "itel" | "Syinix" | "Oraimo";

// Evento na linha do tempo do caso (mudança de status / anotação).
export interface StatusEvent {
  status: CaseStatus;
  at: string; // ISO datetime
  by: string; // responsável
  note?: string;
}

// Caso de assistência técnica (ticket).
export interface ServiceCase {
  id: string; // ex.: "CC-2026-0007"
  cliente: string;
  telefone: string;
  cidade: string;
  estado: string; // UF
  marca: DeviceBrand;
  modelo: string;
  imei: string;
  defeito: string;
  status: CaseStatus;
  area: Area;
  responsavel: string;
  canal: "WhatsApp";
  createdAt: string; // ISO
  updatedAt: string; // ISO
  historico: StatusEvent[];
}

// Mensagem dentro de uma conversa de WhatsApp.
export interface ChatMessage {
  id: string;
  from: "cliente" | "agente";
  text: string;
  at: string; // ISO
}

// Conversa da caixa de entrada compartilhada, vinculada a um caso.
export interface Conversation {
  id: string;
  caseId: string;
  cliente: string;
  telefone: string;
  unread: number;
  lastAt: string; // ISO
  messages: ChatMessage[];
}

// Atendente/agente.
export interface Agent {
  id: string;
  nome: string;
  area: Area;
  iniciais: string;
}
