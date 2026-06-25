import type { ConversationRepository } from "../repositories/conversation.repository";
import type { ClientRepository } from "../repositories/client.repository";
import type { CaseRepository } from "../repositories/case.repository";
import type { TemplateService } from "./template.service";
import type { AddMessageDto } from "../dto/message.dto";
import type {
  ChatMessage,
  Client,
  Conversation,
  ServiceCase,
} from "../domain/types";
import { NotFoundError, ConflictError } from "../domain/errors";
import { phoneKey } from "../utils/phone";
import { UNIT_ADDRESS } from "../domain/constants";

// Serviço da caixa de entrada. Coordena conversa + cliente + caso + templates
// (caso de uso de mensageria). Dependências injetadas por construtor.
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly clients: ClientRepository,
    private readonly cases: CaseRepository,
    private readonly templates: TemplateService,
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
    this.getById(id);
    this.conversations.addMessage(id, this.newMessage(dto.from, dto.text));
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
    this.conversations.addMessage(id, this.newMessage("agente", text));

    const client = this.clients.findByKey(key);
    if (!client) throw new NotFoundError("Cliente", key);
    return { conversation: this.getById(id), client };
  }

  // Envia um template renderizado. Aplica o GATE: templates marcados como
  // `requiresValidated` exigem o caso validado (ex.: endereço dos Correios).
  sendTemplate(id: string, templateId: string): Conversation {
    const conv = this.getById(id);
    const caso = conv.caseId ? this.cases.findById(conv.caseId) : null;
    const def = this.templates.get(templateId); // 404 se não existir

    if (def.requiresValidated && !(caso && caso.validadoEm)) {
      throw new ConflictError(
        "O caso precisa estar validado antes de enviar esta mensagem (ex.: endereço dos Correios)."
      );
    }

    const client = this.clients.findByKey(phoneKey(conv.telefone)) ?? undefined;
    const text = this.templates.render(templateId, this.buildVars(caso, client));
    this.conversations.addMessage(id, this.newMessage("agente", text));
    return this.getById(id);
  }

  // ── helpers ──
  private newMessage(from: "cliente" | "agente", text: string): ChatMessage {
    return { id: `m-${Date.now()}`, from, text, at: new Date().toISOString() };
  }

  private buildVars(
    caso: ServiceCase | null,
    client: Client | undefined
  ): Record<string, string> {
    const form = client?.form;
    const primeiroNome = (caso?.cliente ?? form?.nomeCompleto ?? "cliente").split(" ")[0];
    return {
      cliente: primeiroNome,
      nomeCompleto: form?.nomeCompleto ?? caso?.cliente ?? "",
      caseId: caso?.id ?? "",
      marca: caso?.marca ?? form?.marca ?? "",
      modelo: caso?.modelo ?? form?.modelo ?? "",
      imei: caso?.imei || form?.imei1 || "",
      destinatario: UNIT_ADDRESS.destinatario,
      enderecoUnidade: UNIT_ADDRESS.endereco,
      complemento: UNIT_ADDRESS.complemento,
      bairro: UNIT_ADDRESS.bairro,
      cep: UNIT_ADDRESS.cep,
      telefoneUnidade: UNIT_ADDRESS.telefone,
    };
  }
}
