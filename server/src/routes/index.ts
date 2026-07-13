import { Router, type RequestHandler } from "express";
import { authRoutes } from "./auth.routes";
import { webhookRoutes } from "./webhook.routes";
import { sheetRoutes } from "./sheet.routes";
import { userRoutes } from "./user.routes";
import { requireRole } from "../middleware/require-role";
import type { ConversationService } from "../services/conversation.service";
import type { SqliteSheetRepository } from "../repositories/sheet.repository";
import type { UserRepository } from "../repositories/user.repository";
import type { WhatsAppDispatcher } from "../services/whatsapp.service";
import { caseRoutes } from "./case.routes";
import { clientRoutes } from "./client.routes";
import { conversationRoutes } from "./conversation.routes";
import { statsRoutes } from "./stats.routes";
import { templateRoutes } from "./template.routes";
import type { AuthController } from "../controllers/auth.controller";
import type { CaseController } from "../controllers/case.controller";
import type { ClientController } from "../controllers/client.controller";
import type { ConversationController } from "../controllers/conversation.controller";
import type { StatsController } from "../controllers/stats.controller";
import type { TemplateController } from "../controllers/template.controller";

export interface Controllers {
  auth: AuthController;
  cases: CaseController;
  clients: ClientController;
  conversations: ConversationController;
  stats: StatsController;
  templates: TemplateController;
}

export function buildRoutes(
  c: Controllers,
  requireAuth: RequestHandler,
  conversationService: ConversationService,
  sheetRepo: SqliteSheetRepository,
  userRepo: UserRepository,
  whatsapp: WhatsAppDispatcher
): Router {
  const router = Router();

  // Público: login (e /auth/me é protegido lá dentro).
  router.use("/auth", authRoutes(c.auth, requireAuth));

  // Público: webhook da WhatsApp Cloud API (quem chama é a Meta).
  router.use("/webhook", webhookRoutes(conversationService, whatsapp));

  // Protegido — exige agente autenticado.
  router.use("/cases", requireAuth, caseRoutes(c.cases));
  router.use("/conversations", requireAuth, conversationRoutes(c.conversations));
  router.use("/stats", requireAuth, statsRoutes(c.stats));
  router.use("/templates", requireAuth, templateRoutes(c.templates));

  // Clientes: a lista é protegida; o formulário (que o cliente abre) é público.
  router.use("/clients", clientRoutes(c.clients, requireAuth));

  // Planilhas operacionais — administração (gestor).
  router.use("/sheets", requireAuth, requireRole("gestor"), sheetRoutes(sheetRepo));

  // Contas de acesso — administração (gestor).
  router.use("/users", requireAuth, requireRole("gestor"), userRoutes(userRepo));

  // Situação do WhatsApp por país — administração (gestor).
  router.get("/admin/whatsapp", requireAuth, requireRole("gestor"), (_req, res) => {
    res.json(whatsapp.status());
  });

  return router;
}
