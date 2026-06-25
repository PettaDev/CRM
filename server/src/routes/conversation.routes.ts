import { Router } from "express";
import { validate } from "../middleware/validate";
import { addMessageSchema } from "../dto/message.dto";
import type { ConversationController } from "../controllers/conversation.controller";

export function conversationRoutes(controller: ConversationController): Router {
  const router = Router();
  router.get("/", controller.list);
  router.get("/:id", controller.getById);
  router.post("/:id/messages", validate(addMessageSchema), controller.addMessage);
  router.post("/:id/read", controller.markRead);
  router.post("/:id/send-form", controller.sendForm);
  return router;
}
