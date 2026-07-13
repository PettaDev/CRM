// ───────────────────────────────────────────────────────────────────────────
// Domínio do CRM de assistência técnica (Carlcare)
// Tipos compartilhados por toda a aplicação.
// ───────────────────────────────────────────────────────────────────────────

// Status do caso/atendimento — ciclo de vida no modelo "mail-in" (envio).
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

// Remessa (Correios) — perna de ida/volta vinculada ao caso.
export type ShipmentDirection = "ida" | "volta";
export interface Shipment {
  id: number;
  direcao: ShipmentDirection;
  codigoRastreio: string | null;
  enviadoEm: string | null;
  transportadora: string;
  criadoEm: string;
}

// Áreas/filas internas que acompanham o caso.
export type Area = "Carlcare" | "TFAE";

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
  loteId?: string | null; // remessa que agrupa casos de um mesmo envio
  pais?: string; // código do país (BR, AR, …)
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
  // Campos do fluxo mail-in (opcionais: o mock não os preenche, o backend sim).
  garantiaQueda?: boolean;
  garantiaAgua?: boolean;
  garantiaAberto?: boolean;
  foraGarantia?: boolean; // derivado das causas acima
  aparelhoLiga?: boolean;
  validadoEm?: string | null; // gate de validação
  shipments?: Shipment[];
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
// Um aparelho do formulário — cada um vira um CASO próprio (lojas enviam vários).
export interface FormDevice {
  marca: DeviceBrand;
  modelo: string;
  imei1: string; // *#06#
  imei2: string; // *#06# (segundo SIM)
  sn: string; // número de série — *#06#
  notaFiscal: string;
  defeito: string;
}

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
  // Legado: dados do 1º aparelho (compatibilidade com telas/mocks antigos).
  marca: DeviceBrand;
  modelo: string;
  imei1: string; // *#06#
  imei2: string; // *#06# (segundo SIM)
  sn: string; // número de série — *#06#
  notaFiscal: string;
  consentimentoLgpd: boolean;
  // Todos os aparelhos do envio (1..N). Opcional para os mocks antigos.
  aparelhos?: FormDevice[];
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
