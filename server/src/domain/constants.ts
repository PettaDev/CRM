import type { Area, CaseStatus } from "./types";

// Ordem canônica do fluxo de status (também usada no funil/kanban).
export const STATUS_ORDER: CaseStatus[] = [
  "novo",
  "validado",
  "aguardando_envio",
  "em_transito",
  "recebido",
  "triagem",
  "fora_garantia",
  "em_reparo",
  "aguardando_peca",
  "pronto",
  "enviado_retorno",
  "finalizado",
  "cancelado",
];

export const AREAS: Area[] = ["Carlcare", "TFAE"];

// Um caso é considerado "aberto" enquanto não foi concluído nem cancelado.
export const CLOSED_STATUSES: CaseStatus[] = ["finalizado", "cancelado"];

// Endereço único de atendimento (usado nos templates dos Correios).
export const UNIT_ADDRESS = {
  destinatario: "CarlCare",
  endereco: "Av. Paulista, Nº 854",
  complemento: "Shopping Top Center, Loja CarlCare",
  bairro: "Bela Vista – São Paulo/SP",
  cep: "01310-914",
  telefone: "(11) 91557-9885",
};
