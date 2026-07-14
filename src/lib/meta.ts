import type {
  Area,
  CaseStatus,
  DeviceBrand,
  FormStatus,
  ServiceCase,
} from "../types";

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
  "validado",
  "aguardando_envio",
  "em_transito",
  "recebido",
  "triagem",
  "fora_garantia",
  "orcamento_enviado",
  "devolucao_sem_reparo",
  "em_reparo",
  "aguardando_peca",
  "controle_qualidade",
  "pronto",
  "enviado_retorno",
  "finalizado",
  "cancelado",
];

export const STATUS_META: Record<CaseStatus, StatusMeta> = {
  novo: { label: "Novo", color: "#64748b" },
  validado: { label: "Validado", color: "#0891b2" },
  aguardando_envio: { label: "Aguardando envio", color: "#f59e0b" },
  em_transito: { label: "Em trânsito", color: "#8b5cf6" },
  recebido: { label: "Recebido", color: "#14b8a6" },
  triagem: { label: "Triagem", color: "#6366f1" },
  fora_garantia: { label: "Fora de garantia", color: "#db2777" },
  orcamento_enviado: { label: "Orçamento enviado", color: "#ca8a04" },
  devolucao_sem_reparo: { label: "Devolução sem reparo", color: "#e11d48" },
  em_reparo: { label: "Em reparo", color: "#0079c1" },
  aguardando_peca: { label: "Aguardando peça", color: "#d97706" },
  controle_qualidade: { label: "Controle de qualidade", color: "#2563eb" },
  pronto: { label: "Pronto", color: "#0ea5a4" },
  enviado_retorno: { label: "Enviado (retorno)", color: "#7c3aed" },
  finalizado: { label: "Finalizado", color: "#16a34a" },
  cancelado: { label: "Cancelado", color: "#dc2626" },
};

// Máquina de estados (espelha o backend). Usada para guiar o dropdown de status.
export const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  // fora_garantia direto de novo = expirou por TEMPO (Gate 1) — sem coleta.
  novo: ["validado", "fora_garantia", "cancelado"],
  validado: ["aguardando_envio", "triagem", "cancelado"],
  aguardando_envio: ["em_transito", "cancelado"],
  em_transito: ["recebido", "cancelado"],
  recebido: ["triagem", "cancelado"],
  triagem: ["em_reparo", "fora_garantia", "aguardando_peca", "cancelado"],
  fora_garantia: ["orcamento_enviado", "em_reparo", "enviado_retorno", "cancelado"],
  orcamento_enviado: ["em_reparo", "devolucao_sem_reparo", "cancelado"],
  devolucao_sem_reparo: ["enviado_retorno", "finalizado", "cancelado"],
  em_reparo: ["aguardando_peca", "controle_qualidade", "cancelado"],
  aguardando_peca: ["em_reparo", "controle_qualidade", "cancelado"],
  controle_qualidade: ["pronto", "em_reparo", "cancelado"],
  pronto: ["enviado_retorno", "finalizado", "cancelado"],
  enviado_retorno: ["finalizado", "cancelado"],
  finalizado: [],
  cancelado: [],
};

// Status atual + próximos válidos (para o select de mudança de status).
export function statusOptions(current: CaseStatus): CaseStatus[] {
  return [current, ...TRANSITIONS[current].filter((s) => s !== current)];
}

export const AREAS: Area[] = ["Carlcare", "TFAE"];

export const AREA_DESC: Record<Area, string> = {
  Carlcare: "Atendimento e reparo (loja/autorizada)",
  TFAE: "Engenharia de campo / pós-venda técnico",
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

export function templateFormulario(nome: string, link: string): string {
  return (
    `Olá, ${nome.split(" ")[0]}! 👋 Aqui é a Carlcare.\n` +
    `Para agilizar seu atendimento, precisamos de alguns dados do aparelho. ` +
    `É rápido e seguro — preencha pelo link:\n${link}`
  );
}

// ───────────────────────────────────────────────────────────────────────────
// Cliente / cadastro
// ───────────────────────────────────────────────────────────────────────────

// Normaliza o telefone para somente dígitos — chave de associação na plataforma.
export function phoneKey(phone: string): string {
  return phone.replace(/\D/g, "");
}

export const FORM_STATUS_META: Record<FormStatus, { label: string; color: string }> = {
  nao_enviado: { label: "Cadastro não enviado", color: "#64748b" },
  enviado: { label: "Aguardando preenchimento", color: "#f59e0b" },
  preenchido: { label: "Cadastro preenchido", color: "#16a34a" },
};
