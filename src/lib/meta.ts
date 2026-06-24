import type { Area, CaseStatus, DeviceBrand, ServiceCase } from "../types";

// ───────────────────────────────────────────────────────────────────────────
// Metadados visuais e textuais do domínio.
// ───────────────────────────────────────────────────────────────────────────

interface StatusMeta {
  label: string;
  // Cor base usada para o badge (texto/borda) — o fundo é derivado com alfa.
  color: string;
}

// Ordem também define o fluxo do kanban / funil.
export const STATUS_ORDER: CaseStatus[] = [
  "novo",
  "triagem",
  "aguardando_peca",
  "em_reparo",
  "pronto",
  "finalizado",
  "cancelado",
];

export const STATUS_META: Record<CaseStatus, StatusMeta> = {
  novo: { label: "Novo", color: "#64748b" },
  triagem: { label: "Triagem", color: "#6366f1" },
  aguardando_peca: { label: "Aguardando peça", color: "#f59e0b" },
  em_reparo: { label: "Em reparo", color: "#0d6efd" },
  pronto: { label: "Pronto p/ retirada", color: "#0ea5a4" },
  finalizado: { label: "Finalizado", color: "#16a34a" },
  cancelado: { label: "Cancelado", color: "#dc2626" },
};

export const AREAS: Area[] = ["Carlcare", "TFAE", "Comercial", "HQ"];

export const AREA_DESC: Record<Area, string> = {
  Carlcare: "Atendimento e reparo (loja/autorizada)",
  TFAE: "Engenharia de campo / pós-venda técnico",
  Comercial: "Relacionamento e vendas",
  HQ: "Matriz / consolidação e indicadores",
};

export const BRANDS: DeviceBrand[] = ["TECNO", "Infinix", "itel", "Syinix", "Oraimo"];

// Considera-se "aberto" tudo que ainda não foi concluído nem cancelado.
export function isOpen(status: CaseStatus): boolean {
  return status !== "finalizado" && status !== "cancelado";
}

// ───────────────────────────────────────────────────────────────────────────
// Formatação
// ───────────────────────────────────────────────────────────────────────────

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

// "há 5 min", "há 2 h", "há 3 d"
export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return `há ${d} d`;
}

// Mascara o IMEI deixando só os últimos 4 dígitos (boa prática LGPD em telas).
export function maskImei(imei: string): string {
  const clean = imei.replace(/\D/g, "");
  if (clean.length <= 4) return clean;
  return `•••• •••• ${clean.slice(-4)}`;
}

// ───────────────────────────────────────────────────────────────────────────
// Templates de automação de WhatsApp (mock — prontos para virar templates
// aprovados na Meta Cloud API).
// ───────────────────────────────────────────────────────────────────────────

export function templateInicio(c: ServiceCase): string {
  return (
    `Olá, ${c.cliente.split(" ")[0]}! Aqui é a Carlcare. ✅\n` +
    `Recebemos seu ${c.marca} ${c.modelo} e abrimos o atendimento ${c.id}.\n` +
    `Defeito relatado: ${c.defeito}.\n` +
    `Você pode acompanhar o andamento por aqui mesmo. Em breve traremos novidades!`
  );
}

export function templateFinalizacao(c: ServiceCase): string {
  return (
    `${c.cliente.split(" ")[0]}, boas notícias! 🎉\n` +
    `O reparo do seu ${c.marca} ${c.modelo} (atendimento ${c.id}) foi concluído.\n` +
    `Já pode retirar na unidade de ${c.cidade}/${c.estado}. Obrigado por escolher a Carlcare!`
  );
}
