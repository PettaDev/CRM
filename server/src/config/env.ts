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
  databaseFile: string;
  jwtSecret: string;
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  databaseFile: path.resolve(
    process.cwd(),
    process.env.DATABASE_FILE ?? "data/carlcare.sqlite"
  ),
  jwtSecret: process.env.JWT_SECRET ?? "dev-secret-troque-em-producao",
};
