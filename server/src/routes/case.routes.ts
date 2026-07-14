import { Router } from "express";
import { validate } from "../middleware/validate";
import {
  ativacaoSchema,
  createCaseSchema,
  orcamentoSchema,
  updateStatusSchema,
} from "../dto/case.dto";
import { addShipmentSchema } from "../dto/shipment.dto";
import { updateGarantiaSchema } from "../dto/garantia.dto";
import type { CaseController } from "../controllers/case.controller";

export function caseRoutes(controller: CaseController): Router {
  const router = Router();
  router.get("/", controller.list); // suporta ?imei=
  router.get("/:id", controller.getById);
  router.post("/", validate(createCaseSchema), controller.create);
  router.patch("/:id/status", validate(updateStatusSchema), controller.updateStatus);
  router.patch("/:id/garantia", validate(updateGarantiaSchema), controller.updateGarantia);
  router.patch("/:id/ativacao", validate(ativacaoSchema), controller.setAtivacao);
  router.patch("/:id/orcamento", validate(orcamentoSchema), controller.setOrcamento);
  router.post("/:id/shipments", validate(addShipmentSchema), controller.addShipment);
  return router;
}
