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
import { createApp } from "./app";

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

const templateService = new TemplateService();

const controllers = {
  cases: new CaseController(new CaseService(caseRepo, shipmentRepo)),
  clients: new ClientController(new ClientService(clientRepo)),
  conversations: new ConversationController(
    new ConversationService(
      conversationRepo,
      clientRepo,
      caseRepo,
      templateService,
      config.corsOrigin
    )
  ),
  stats: new StatsController(new StatsService(statsRepo)),
  templates: new TemplateController(templateService),
};

const app = createApp(controllers);
app.listen(config.port, () => {
  console.log(
    `🚀 API Carlcare CRM em http://localhost:${config.port}/api  (origem CORS: ${config.corsOrigin})`
  );
});
