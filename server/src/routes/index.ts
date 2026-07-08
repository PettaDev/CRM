import { Router, type RequestHandler } from "express";
import { authRoutes } from "./auth.routes";
import { webhookRoutes } from "./webhook.routes";
import type { ConversationService } from "../services/conversation.service";
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
  conversationService: ConversationService
): Router {
  const router = Router();

  // Público: login (e /auth/me é protegido lá dentro).
  router.use("/auth", authRoutes(c.auth, requireAuth));

  // Público: webhook da WhatsApp Cloud API (quem chama é a Meta).
  router.use("/webhook", webhookRoutes(conversationService));

  // Protegido — exige agente autenticado.
  router.use("/cases", requireAuth, caseRoutes(c.cases));
  router.use("/conversations", requireAuth, conversationRoutes(c.conversations));
  router.use("/stats", requireAuth, statsRoutes(c.stats));
  router.use("/templates", requireAuth, templateRoutes(c.templates));

  // Clientes: a lista é protegida; o formulário (que o cliente abre) é público.
  router.use("/clients", clientRoutes(c.clients, requireAuth));

  return router;
}
