import { Router } from "express";
import { caseRoutes } from "./case.routes";
import { clientRoutes } from "./client.routes";
import { conversationRoutes } from "./conversation.routes";
import { statsRoutes } from "./stats.routes";
import type { CaseController } from "../controllers/case.controller";
import type { ClientController } from "../controllers/client.controller";
import type { ConversationController } from "../controllers/conversation.controller";
import type { StatsController } from "../controllers/stats.controller";

// Conjunto de controllers injetados na borda HTTP.
export interface Controllers {
  cases: CaseController;
  clients: ClientController;
  conversations: ConversationController;
  stats: StatsController;
}

export function buildRoutes(c: Controllers): Router {
  const router = Router();
  router.use("/cases", caseRoutes(c.cases));
  router.use("/clients", clientRoutes(c.clients));
  router.use("/conversations", conversationRoutes(c.conversations));
  router.use("/stats", statsRoutes(c.stats));
  return router;
}
