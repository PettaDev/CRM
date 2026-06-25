import type { Area, CaseStatus } from "./types";

// Ordem canônica do fluxo de status (também usada no funil/kanban).
export const STATUS_ORDER: CaseStatus[] = [
  "novo",
  "triagem",
  "aguardando_peca",
  "em_reparo",
  "pronto",
  "finalizado",
  "cancelado",
];

export const AREAS: Area[] = ["Carlcare", "TFAE", "Comercial", "HQ"];

// Um caso é considerado "aberto" enquanto não foi concluído nem cancelado.
export const CLOSED_STATUSES: CaseStatus[] = ["finalizado", "cancelado"];
