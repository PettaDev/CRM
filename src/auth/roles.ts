// Papéis de acesso ao CRM.
//   agente = operacional (Carlcare): atendimento, casos e dashboard.
//   gestor = administrativo (TFAE/HQ): tudo + Administração (contas, WhatsApp/API).
// A trava é dupla: o frontend esconde/bloqueia o que o papel não pode ver, e o
// backend valida de novo nas rotas administrativas (requireRole).
export type Role = "agente" | "gestor";

export function isGestor(user: { role?: string } | null | undefined): boolean {
  return user?.role === "gestor";
}
