import { Router } from "express";
import { config } from "../config/env";
import type { ConversationService } from "../services/conversation.service";
import {
  extractInboundMessages,
  type WebhookPayload,
} from "../services/whatsapp.service";

// Webhook da WhatsApp Cloud API (Meta). Duas pontas:
//  GET  /api/webhook — "aperto de mão" de verificação (a Meta chama uma vez,
//        na configuração; precisa ecoar o hub.challenge se o token bater).
//  POST /api/webhook — notificações de mensagens recebidas dos clientes.
// Rotas PÚBLICAS por definição (quem chama é a Meta, não um agente logado).
// Guia completo: docs/WHATSAPP.md
export function webhookRoutes(conversations: ConversationService): Router {
  const router = Router();

  router.get("/", (req, res) => {
    const mode = req.query["hub.mode"];
    const token = req.query["hub.verify_token"];
    const challenge = req.query["hub.challenge"];

    if (mode === "subscribe" && token === config.whatsappVerifyToken) {
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  });

  router.post("/", (req, res) => {
    // A Meta exige resposta 200 rápida — senão reenvia e pode desativar o webhook.
    res.sendStatus(200);

    const inbound = extractInboundMessages(req.body as WebhookPayload);
    for (const m of inbound) {
      try {
        const conv = conversations.receiveInbound(m.phone, m.name, m.text);
        console.log(`[whatsapp] mensagem de ${m.phone} → conversa ${conv.id}`);
      } catch (err) {
        console.error("[whatsapp] erro ao processar mensagem recebida:", err);
      }
    }
  });

  return router;
}
