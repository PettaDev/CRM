import type { CaseStatus } from "./types";

// ───────────────────────────────────────────────────────────────────────────
// Máquina de estados do caso (FSM). A tabela define as transições permitidas;
// o serviço usa isso como GUARD. É aqui que mora o "gate de validação":
// só dá para ir a 'aguardando_envio' (que libera o endereço dos Correios)
// vindo de 'validado'.
// ───────────────────────────────────────────────────────────────────────────

export const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  // "fora_garantia" direto de "novo" = expirou por TEMPO (Gate 1) — o aparelho
  // nem chega a ser enviado ("se passou a por tempo, nem precisa enviar").
  novo: ["validado", "fora_garantia", "cancelado"],
  validado: ["aguardando_envio", "triagem", "cancelado"],
  aguardando_envio: ["em_transito", "cancelado"],
  em_transito: ["recebido", "cancelado"],
  recebido: ["triagem", "cancelado"],
  triagem: ["em_reparo", "fora_garantia", "aguardando_peca", "cancelado"],
  fora_garantia: ["em_reparo", "enviado_retorno", "cancelado"],
  em_reparo: ["aguardando_peca", "pronto", "cancelado"],
  aguardando_peca: ["em_reparo", "pronto", "cancelado"],
  pronto: ["enviado_retorno", "finalizado", "cancelado"],
  enviado_retorno: ["finalizado", "cancelado"],
  finalizado: [],
  cancelado: [],
};

// Permite a transição? Ficar no mesmo status é sempre permitido (ex.: anotação).
export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  if (from === to) return true;
  return TRANSITIONS[from].includes(to);
}

// Próximos status válidos (usado pelo frontend para guiar o dropdown).
export function nextStatuses(from: CaseStatus): CaseStatus[] {
  return TRANSITIONS[from];
}
