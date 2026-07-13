import { config } from "./config/env";
import { getDb } from "./db/connection";
import { migrate } from "./db/migrate";
import { seedDemo } from "./db/seed";
import { SqliteCaseRepository } from "./repositories/case.repository";
import { SqliteClientRepository } from "./repositories/client.repository";
import { SqliteConversationRepository } from "./repositories/conversation.repository";
import { SqliteShipmentRepository } from "./repositories/shipment.repository";
import { SqliteStatsRepository } from "./repositories/stats.repository";
import { CaseService } from "./services/case.service";
import { ClientService } from "./services/client.service";
import { ConversationService } from "./services/conversation.service";
import { StatsService } from "./services/stats.service";
import { TemplateService } from "./services/template.service";
import { CaseController } from "./controllers/case.controller";
import { ClientController } from "./controllers/client.controller";
import { ConversationController } from "./controllers/conversation.controller";
import { StatsController } from "./controllers/stats.controller";
import { TemplateController } from "./controllers/template.controller";
import { SqliteUserRepository } from "./repositories/user.repository";
import { AuthService } from "./services/auth.service";
import { AuthController } from "./controllers/auth.controller";
import { WhatsAppRegistry } from "./services/whatsapp.service";
import { requireAuth as makeRequireAuth } from "./middleware/require-auth";
import { SqliteSheetRepository } from "./repositories/sheet.repository";
import { TROCAS_DATA, ESTOQUE_DATA, MODELOS_DATA } from "./data/planilha-data";
import { createApp } from "./app";
import bcrypt from "bcryptjs";

// ─── Composition Root ───
// Único lugar que conhece as implementações concretas e monta o grafo de
// dependências (repos → services → controllers). O resto do código só conhece
// abstrações.
migrate(); // garante o schema antes de subir
const db = getDb();

const caseRepo = new SqliteCaseRepository(db);
const clientRepo = new SqliteClientRepository(db);
const conversationRepo = new SqliteConversationRepository(db);
const shipmentRepo = new SqliteShipmentRepository(db);
const statsRepo = new SqliteStatsRepository(db);
const userRepo = new SqliteUserRepository(db);

// SEED_DEMO=1 (apresentação): popula os dados de demonstração no boot, mas SÓ
// se o banco estiver vazio — nunca sobrescreve dados reais já cadastrados.
// Útil no Render free, onde o disco é efêmero e o banco renasce a cada deploy.
if (config.seedDemo) {
  if (caseRepo.findAll().length === 0) {
    seedDemo();
    console.log("✓ SEED_DEMO=1 — dados de demonstração carregados.");
  } else {
    console.log("• SEED_DEMO=1 ignorado: o banco já tem dados.");
  }
}

// Garante o usuário admin (ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME) — tanto
// no banco recém-criado quanto após o seed de demonstração.
if (!userRepo.findByEmail(config.adminEmail)) {
  userRepo.create({
    id: "u-admin",
    nome: config.adminName,
    email: config.adminEmail,
    area: "TFAE",
    role: "gestor",
    pais: "BR",
    senhaHash: bcrypt.hashSync(config.adminPassword, 10),
  });
  console.log(`✓ Admin criado: ${config.adminEmail}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("⚠ ADMIN_PASSWORD não definido — usando a senha padrão. Troque em produção!");
  }
}

// Planilhas operacionais: importa os dados da planilha original quando as
// tabelas estão vazias (dados de referência/base — independem do SEED_DEMO).
const sheetRepo = new SqliteSheetRepository(db);
const PLANILHA_SEED: Array<[string, Record<string, string>[]]> = [
  ["trocas", TROCAS_DATA],
  ["estoque", ESTOQUE_DATA],
  ["modelos", MODELOS_DATA],
];
for (const [sheet, data] of PLANILHA_SEED) {
  if (sheetRepo.count(sheet) === 0 && data.length > 0) {
    const load = db.transaction(() => {
      for (const row of data) sheetRepo.insert(sheet, row);
    });
    load();
    console.log(`✓ Planilha "${sheet}" importada: ${data.length} linhas.`);
  }
}

const templateService = new TemplateService();
const authService = new AuthService(userRepo, config.jwtSecret);
const requireAuth = makeRequireAuth(authService);
// Um número de WhatsApp por país (WHATSAPP_TOKEN_<CC> / WHATSAPP_PHONE_ID_<CC>).
const whatsapp = new WhatsAppRegistry(config.whatsapp);

const conversationService = new ConversationService(
  conversationRepo,
  clientRepo,
  caseRepo,
  templateService,
  config.publicUrl,
  whatsapp
);

const controllers = {
  cases: new CaseController(new CaseService(caseRepo, shipmentRepo)),
  clients: new ClientController(new ClientService(clientRepo, caseRepo, db)),
  conversations: new ConversationController(conversationService),
  stats: new StatsController(new StatsService(statsRepo)),
  templates: new TemplateController(templateService),
  auth: new AuthController(authService),
};

const app = createApp(
  controllers,
  requireAuth,
  conversationService,
  sheetRepo,
  userRepo,
  whatsapp
);
app.listen(config.port, () => {
  console.log(
    `🚀 API Carlcare CRM em http://localhost:${config.port}/api  (origem CORS: ${config.corsOrigin})`
  );
  if (config.staticDir) console.log(`   Servindo frontend de: ${config.staticDir}`);
  const ativos = whatsapp
    .status()
    .filter((s) => s.ativo)
    .map((s) => s.pais);
  console.log(
    `   WhatsApp Cloud API: ${ativos.length ? `ATIVA (${ativos.join(", ")})` : "desligada (modo simulado — ver docs/WHATSAPP.md)"}`
  );
});
