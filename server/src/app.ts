import express, { type Express, type RequestHandler } from "express";
import cors from "cors";
import { config } from "./config/env";
import { requestLogger } from "./middleware/request-logger";
import { errorHandler } from "./middleware/error-handler";
import { buildRoutes, type Controllers } from "./routes";

// Fábrica do app Express. Recebe os controllers e o middleware de autenticação
// por parâmetro (inversão de controle) — facilita testar e trocar implementações.
export function createApp(
  controllers: Controllers,
  requireAuth: RequestHandler
): Express {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());
  app.use(requestLogger);

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", ts: new Date().toISOString() });
  });

  app.use("/api", buildRoutes(controllers, requireAuth));

  // Tem que ser o ÚLTIMO middleware.
  app.use(errorHandler);

  return app;
}
