import type { ConversationRepository } from "../repositories/conversation.repository";
import type { ClientRepository } from "../repositories/client.repository";
import type { AddMessageDto } from "../dto/message.dto";
import type { ChatMessage, Client, Conversation } from "../domain/types";
import { NotFoundError } from "../domain/errors";
import { phoneKey } from "../utils/phone";

// Caso de uso "envio de formulário" cruza dois agregados (conversa + cliente),
// por isso o serviço coordena os dois repositórios. `frontendBaseUrl` é injetado
// (não hardcoded) para montar o link do formulário.
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly clients: ClientRepository,
    private readonly frontendBaseUrl: string
  ) {}

  list(): Conversation[] {
    return this.conversations.findAll();
  }

  getById(id: string): Conversation {
    const conv = this.conversations.findById(id);
    if (!conv) throw new NotFoundError("Conversa", id);
    return conv;
  }

  addMessage(id: string, dto: AddMessageDto): Conversation {
    this.getById(id); // valida existência
    const message: ChatMessage = {
      id: `m-${Date.now()}`,
      from: dto.from,
      text: dto.text,
      at: new Date().toISOString(),
    };
    this.conversations.addMessage(id, message);
    return this.getById(id);
  }

  markRead(id: string): Conversation {
    this.getById(id);
    this.conversations.markRead(id);
    return this.getById(id);
  }

  sendForm(id: string): { conversation: Conversation; client: Client } {
    const conv = this.getById(id);
    const key = phoneKey(conv.telefone);
    const now = new Date().toISOString();
    this.clients.markEnviado(key, conv.telefone, now);

    const link = `${this.frontendBaseUrl}/#/form/${key}`;
    const text =
      `Olá, ${conv.cliente.split(" ")[0]}! 👋 Aqui é a Carlcare. ` +
      `Para agilizar seu atendimento, preencha seu cadastro: ${link}`;
    this.conversations.addMessage(id, {
      id: `m-${Date.now()}`,
      from: "agente",
      text,
      at: now,
    });

    const client = this.clients.findByKey(key);
    if (!client) throw new NotFoundError("Cliente", key);
    return { conversation: this.getById(id), client };
  }
}
