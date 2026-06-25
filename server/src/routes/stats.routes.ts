import { Router } from "express";
import type { StatsController } from "../controllers/stats.controller";

export function statsRoutes(controller: StatsController): Router {
  const router = Router();
  router.get("/", controller.dashboard);
  return router;
}
