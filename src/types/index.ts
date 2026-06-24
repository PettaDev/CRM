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

// ───────────────────────────────────────────────────────────────────────────
// Cadastro do cliente (formulário enviado por WhatsApp)
// ───────────────────────────────────────────────────────────────────────────

// Situação do formulário de cadastro de um cliente.
export type FormStatus = "nao_enviado" | "enviado" | "preenchido";

// Dados que o cliente preenche no formulário. O telefone NÃO entra aqui:
// ele já é conhecido pela plataforma (chave de associação) e fica travado.
export interface ClientForm {
  nomeCompleto: string;
  cpf: string;
  nascimento: string; // yyyy-mm-dd
  email: string;
  cep: string;
  rua: string;
  numero: string;
  bairro: string;
  cidade: string;
  estado: string; // UF
  marca: DeviceBrand;
  modelo: string;
  imei1: string; // *#06#
  imei2: string; // *#06# (segundo SIM)
  sn: string; // número de série — *#06#
  notaFiscal: string;
  consentimentoLgpd: boolean;
}

// Cliente (pessoa) associado a um número de WhatsApp.
// `telefoneKey` (somente dígitos) é a chave que liga conversa ↔ cliente ↔ caso.
export interface Client {
  telefone: string; // exibição (+55 11 9...)
  telefoneKey: string; // dígitos normalizados — chave de associação
  formStatus: FormStatus;
  enviadoAt?: string; // ISO — quando o formulário foi enviado
  preenchidoAt?: string; // ISO — quando o cliente preencheu
  form?: ClientForm; // presente quando preenchido
}
