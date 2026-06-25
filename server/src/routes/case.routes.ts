import { Router } from "express";
import { validate } from "../middleware/validate";
import { createCaseSchema, updateStatusSchema } from "../dto/case.dto";
import type { CaseController } from "../controllers/case.controller";

export function caseRoutes(controller: CaseController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/", validate(createCaseSchema), controller.create);
  router.patch("/:id/status", validate(updateStatusSchema), controller.updateStatus);
  return router;
}
