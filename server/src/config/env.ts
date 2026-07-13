import path from "node:path";
import { COUNTRIES } from "../domain/countries";

// Carrega variáveis de um arquivo .env, se existir (recurso nativo do Node 20.12+).
try {
  process.loadEnvFile(path.resolve(process.cwd(), ".env"));
} catch {
  // Sem arquivo .env — usa os valores padrão abaixo.
}

// Configuração tipada da aplicação (12-factor: config vem do ambiente).
export interface AppConfig {
  port: number;
  corsOrigin: string;
  /** URL pública do app (usada nos links enviados ao cliente, ex.: formulário). */
  publicUrl: string;
  databaseFile: string;
  jwtSecret: string;
  /** Diretório do build do frontend a servir em produção ("" = não servir). */
  staticDir: string;
  /** Admin criado automaticamente quando a tabela users está vazia. */
  adminEmail: string;
  adminPassword: string;
  adminName: string;
  /** SEED_DEMO=1: popula dados de demonstração no boot SE o banco estiver vazio. */
  seedDemo: boolean;
  /**
   * WhatsApp Cloud API (Meta) — UM NÚMERO POR PAÍS.
   * Ativar um país = definir WHATSAPP_TOKEN_<CC> e WHATSAPP_PHONE_ID_<CC> no
   * Render (ex.: _BR, _AR) — sem deploy. As variáveis sem sufixo valem p/ BR.
   */
  whatsapp: Record<string, { token: string; phoneId: string }>;
  whatsappVerifyToken: string;
}

function readWhatsappByCountry(): Record<string, { token: string; phoneId: string }> {
  const out: Record<string, { token: string; phoneId: string }> = {};
  for (const c of COUNTRIES) {
    const token = process.env[`WHATSAPP_TOKEN_${c.code}`] ?? "";
    const phoneId = process.env[`WHATSAPP_PHONE_ID_${c.code}`] ?? "";
    if (token && phoneId) out[c.code] = { token, phoneId };
  }
  // Legado (sem sufixo) = Brasil, se o BR não tiver as variáveis novas.
  const legacyToken = process.env.WHATSAPP_TOKEN ?? "";
  const legacyPhone = process.env.WHATSAPP_PHONE_ID ?? "";
  if (!out.BR && legacyToken && legacyPhone) {
    out.BR = { token: legacyToken, phoneId: legacyPhone };
  }
  return out;
}

// RENDER_EXTERNAL_URL é injetada pelo Render com a URL pública do serviço.
const publicUrl =
  process.env.PUBLIC_URL ??
  process.env.RENDER_EXTERNAL_URL ??
  "http://localhost:5173";

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? publicUrl,
  publicUrl,
  databaseFile: path.resolve(
    process.cwd(),
    process.env.DATABASE_FILE ?? "data/carlcare.sqlite"
  ),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-troque-em-producao",
  staticDir: process.env.STATIC_DIR
    ? path.resolve(process.cwd(), process.env.STATIC_DIR)
    : "",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@carlcare.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "carlcare123",
  adminName: process.env.ADMIN_NAME ?? "Administrador",
  seedDemo: process.env.SEED_DEMO === "1",
  whatsapp: readWhatsappByCountry(),
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "carlcare-verify",
};
