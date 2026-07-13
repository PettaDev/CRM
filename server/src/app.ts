import express, { type Express, type RequestHandler } from "express";
import path from "node:path";
import fs from "node:fs";
import cors from "cors";
import { config } from "./config/env";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { buildRoutes, type Controllers } from "./routes";
import type { ConversationService } from "./services/conversation.service";
import type { SqliteSheetRepository } from "./repositories/sheet.repository";
import type { UserRepository } from "./repositories/user.repository";

// Fábrica do app Express. Recebe os controllers e o middleware de autenticação
// por parâmetro (inversão de controle) — facilita testar e trocar implementações.
export function createApp(
  controllers: Controllers,
  requireAuth: RequestHandler,
  conversationService: ConversationService,
  sheetRepo: SqliteSheetRepository,
  userRepo: UserRepository
): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use(
    "/api",
    buildRoutes(controllers, requireAuth, conversationService, sheetRepo, userRepo)
  );

  // Produção: o mesmo processo serve o build do frontend (single service —
  // sem CORS entre front e API). STATIC_DIR aponta para o dist/ do Vite.
  if (config.staticDir && fs.existsSync(config.staticDir)) {
    const index = path.join(config.staticDir, "index.html");
    app.use(express.static(config.staticDir));
    // Fallback SPA: qualquer GET fora de /api devolve o index.html.
    app.use((req, res, next) => {
      if (req.method === "GET" && !req.path.startsWith("/api")) {
        res.sendFile(index);
      } else {
        next();
      }
    });
  }

  // Tem que ser o ÚLTIMO middleware.
  app.use(errorHandler);

  return app;
}
