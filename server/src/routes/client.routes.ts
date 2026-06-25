import { Router } from "express";
import { validate } from "../middleware/validate";
import { clientFormSchema } from "../dto/client.dto";
import type { ClientController } from "../controllers/client.controller";

export function clientRoutes(controller: ClientController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.get("/:key", controller.getByKey);
  // O cliente envia o formulário preenchido (associado pela chave de telefone).
  router.post("/:key/form", validate(clientFormSchema), controller.submitForm);
  return router;
}
