import { Router } from "express";
import type { TemplateController } from "../controllers/template.controller";

export function templateRoutes(controller: TemplateController): Router {
  const router = Router();
  router.get("/", controller.list);
  return router;
}
