// ───────────────────────────────────────────────────────────────────────────
// Modelo de domínio — a "linguagem ubíqua" do CRM de assistência técnica.
// Independente de banco e de HTTP (não conhece SQL nem Express).
// ───────────────────────────────────────────────────────────────────────────

export type CaseStatus =
  | "novo"
  | "triagem"
  | "aguardando_peca"
  | "em_reparo"
  | "pronto"
  | "finalizado"
  | "cancelado";

export type Area = "Carlcare" | "TFAE" | "Comercial" | "HQ";

export type DeviceBrand = "TECNO" | "Infinix" | "itel" | "Syinix" | "Oraimo";

export type FormStatus = "nao_enviado" | "enviado" | "preenchido";

export interface StatusEvent {
  status: CaseStatus;
  at: string; // ISO
  by: string;
  note?: string;
}

export interface ServiceCase {
  id: string;
  cliente: string;
  telefone: string;
  cidade: string;
  estado: string;
  marca: DeviceBrand;
  modelo: string;
  imei: string;
  defeito: string;
  status: CaseStatus;
  area: Area;
  responsavel: string;
  canal: "WhatsApp";
  createdAt: string;
  updatedAt: string;
  historico: StatusEvent[];
}

export interface ChatMessage {
  id: string;
  from: "cliente" | "agente";
  text: string;
  at: string;
}

export interface Conversation {
  id: string;
  caseId: string | null;
  cliente: string;
  telefone: string;
  unread: number;
  lastAt: string;
  messages: ChatMessage[];
}

export interface ClientForm {
  nomeCompleto: string;
  cpf: string;
  nascimento: string;
  email: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string;
  marca: DeviceBrand;
  modelo: string;
  imei1: string;
  imei2: string;
  sn: string;
  notaFiscal: string;
  consentimentoLgpd: boolean;
}

export interface Client {
  telefone: string;
  telefoneKey: string;
  formStatus: FormStatus;
  enviadoAt?: string;
  preenchidoAt?: string;
  form?: ClientForm;
}
