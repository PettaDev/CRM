import { config } from "./config/env";
import { getDb } from "./db/connection";
import { migrate } from "./db/migrate";
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
import { WhatsAppService } from "./services/whatsapp.service";
import { requireAuth as makeRequireAuth } from "./middleware/require-auth";
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

// Banco recém-criado (produção/db zerado): garante um admin para o primeiro
// login. Credenciais vêm de ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME.
if (userRepo.count() === 0) {
  userRepo.create({
    id: "u-admin",
    nome: config.adminName,
    email: config.adminEmail,
    area: "HQ",
    role: "gestor",
    senhaHash: bcrypt.hashSync(config.adminPassword, 10),
  });
  console.log(`✓ Admin inicial criado: ${config.adminEmail}`);
  if (!process.env.ADMIN_PASSWORD) {
    console.warn("⚠ ADMIN_PASSWORD não definido — usando a senha padrão. Troque em produção!");
  }
}

const templateService = new TemplateService();
const authService = new AuthService(userRepo, config.jwtSecret);
const requireAuth = makeRequireAuth(authService);
const whatsapp = new WhatsAppService(config.whatsappToken, config.whatsappPhoneId);

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
  clients: new ClientController(new ClientService(clientRepo)),
  conversations: new ConversationController(conversationService),
  stats: new StatsController(new StatsService(statsRepo)),
  templates: new TemplateController(templateService),
  auth: new AuthController(authService),
};

const app = createApp(controllers, requireAuth, conversationService);
app.listen(config.port, () => {
  console.log(
    `🚀 API Carlcare CRM em http://localhost:${config.port}/api  (origem CORS: ${config.corsOrigin})`
  );
  if (config.staticDir) console.log(`   Servindo frontend de: ${config.staticDir}`);
  console.log(
    `   WhatsApp Cloud API: ${whatsapp.enabled ? "ATIVA" : "desligada (modo simulado — ver docs/WHATSAPP.md)"}`
  );
});
