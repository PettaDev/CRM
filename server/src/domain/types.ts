// ───────────────────────────────────────────────────────────────────────────
// Modelo de domínio — a "linguagem ubíqua" do CRM de assistência técnica.
// Independente de banco e de HTTP (não conhece SQL nem Express).
// ───────────────────────────────────────────────────────────────────────────

// Ciclo de vida do caso no modelo "mail-in" (envio do aparelho).
export type CaseStatus =
  | "novo"
  | "validado"
  | "aguardando_envio"
  | "em_transito"
  | "recebido"
  | "triagem"
  | "fora_garantia"
  | "em_reparo"
  | "aguardando_peca"
  | "pronto"
  | "enviado_retorno"
  | "finalizado"
  | "cancelado";

export type Area = "Carlcare" | "TFAE";

export type DeviceBrand = "TECNO" | "Infinix" | "itel" | "Syinix" | "Oraimo";

export type FormStatus = "nao_enviado" | "enviado" | "preenchido";

// Usuário interno (agente/gestor) — sem a senha, que nunca sai da camada de auth.
export type Role = "agente" | "gestor";
export interface User {
  id: string;
  nome: string;
  email: string;
  area: Area;
  role: Role;
  pais: string; // código do país (BR, AR, …) — casos criados herdam este país
}

export type ShipmentDirection = "ida" | "volta";

export interface StatusEvent {
  status: CaseStatus;
  at: string; // ISO
  by: string;
  note?: string;
}

// Remessa (Correios). 1:N com o caso — perna de ida e de volta, com reenvios.
export interface Shipment {
  id: number;
  direcao: ShipmentDirection;
  codigoRastreio: string | null;
  enviadoEm: string | null;
  transportadora: string;
  criadoEm: string;
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
  pais: string; // código do país (BR, AR, …)
  loteId: string | null; // remessa que agrupa os casos de um mesmo envio
  canal: "WhatsApp";
  // Triagem de garantia (causas) + conclusão DERIVADA.
  garantiaQueda: boolean;
  garantiaAgua: boolean;
  garantiaAberto: boolean;
  foraGarantia: boolean; // derivado: queda || agua || aberto
  aparelhoLiga: boolean; // direciona a instrução de IMEI/SN (*#06# x caixa)
  validadoEm: string | null; // gate: libera o envio do endereço dos Correios
  createdAt: string;
  updatedAt: string;
  historico: StatusEvent[];
  shipments: Shipment[];
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
  pais: string; // código do país (BR, AR, …)
  unread: number;
  lastAt: string;
  messages: ChatMessage[];
}

// Um aparelho registrado no formulário. Cada aparelho vira um CASO próprio.
export interface FormDevice {
  marca: DeviceBrand;
  modelo: string;
  imei1: string;
  imei2: string;
  sn: string;
  notaFiscal: string;
  defeito: string;
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
  // Legado (1º aparelho) — mantido para compatibilidade com telas/templates.
  marca: DeviceBrand;
  modelo: string;
  imei1: string;
  imei2: string;
  sn: string;
  notaFiscal: string;
  consentimentoLgpd: boolean;
  // Todos os aparelhos do envio (1..N).
  aparelhos: FormDevice[];
}

export interface Client {
  telefone: string;
  telefoneKey: string;
  formStatus: FormStatus;
  enviadoAt?: string;
  preenchidoAt?: string;
  form?: ClientForm;
}
