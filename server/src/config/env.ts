import path from "node:path";

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
  /** WhatsApp Cloud API (Meta). Vazios = integração desligada (modo simulado). */
  whatsappToken: string;
  whatsappPhoneId: string;
  whatsappVerifyToken: string;
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
  whatsappToken: process.env.WHATSAPP_TOKEN ?? "",
  whatsappPhoneId: process.env.WHATSAPP_PHONE_ID ?? "",
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "carlcare-verify",
};
