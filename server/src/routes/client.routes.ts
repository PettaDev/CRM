import { Router, type RequestHandler } from "express";
import { validate } from "../middleware/validate";
import { clientFormSchema } from "../dto/client.dto";
import type { ClientController } from "../controllers/client.controller";

export function clientRoutes(
  controller: ClientController,
  requireAuth: RequestHandler
): Router {
  const router = Router();
  router.get("/", requireAuth, controller.list); // protegido (agente)
  router.get("/:key", controller.getByKey); // público — página do formulário
  router.post("/:key/form", validate(clientFormSchema), controller.submitForm); // público
  return router;
}
