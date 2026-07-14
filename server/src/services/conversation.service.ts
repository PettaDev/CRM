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
import { countryFromPhone } from "../domain/countries";
import type { WhatsAppDispatcher } from "./whatsapp.service";

// Serviço da caixa de entrada. Coordena conversa + cliente + caso + templates
// (caso de uso de mensageria). Dependências injetadas por construtor.
export class ConversationService {
  constructor(
    private readonly conversations: ConversationRepository,
    private readonly clients: ClientRepository,
    private readonly cases: CaseRepository,
    private readonly templates: TemplateService,
    private readonly frontendBaseUrl: string,
    // Opcional: quando configurado (docs/WHATSAPP.md), toda mensagem do agente
    // sai também pelo WhatsApp real — pelo NÚMERO DO PAÍS da conversa.
    private readonly whatsapp?: WhatsAppDispatcher
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
    const conv = this.getById(id);
    this.conversations.addMessage(id, this.newMessage(dto.from, dto.text));
    if (dto.from === "agente") this.deliver(conv.pais, conv.telefone, dto.text);
    return this.getById(id);
  }

  // Mensagem recebida pelo WEBHOOK do WhatsApp. Se já existe conversa para o
  // telefone, anexa (e marca como não lida); senão, abre uma conversa nova.
  // `pais` vem do número que RECEBEU (phone_number_id); sem ele, cai no DDI.
  receiveInbound(
    phone: string,
    name: string,
    text: string,
    pais?: string
  ): Conversation {
    const key = phoneKey(phone);
    const existing = this.conversations.findByPhoneKey(key);
    const msg = this.newMessage("cliente", text);

    if (existing) {
      this.conversations.addInboundMessage(existing.id, msg);
      return this.getById(existing.id);
    }

    const conv: Conversation = {
      id: `cv-${Date.now()}`,
      caseId: null,
      cliente: name,
      telefone: `+${key}`,
      pais: pais ?? countryFromPhone(key),
      unread: 0, // o INSERT registra 0; a mensagem abaixo incrementa para 1
      lastAt: msg.at,
      messages: [],
    };
    this.conversations.create(conv);
    this.conversations.addInboundMessage(conv.id, msg);
    return this.getById(conv.id);
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
    this.deliver(conv.pais, conv.telefone, text);

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
    this.deliver(conv.pais, conv.telefone, text);
    return this.getById(id);
  }

  // ── helpers ──

  // Entrega best-effort pelo WhatsApp real (número do país da conversa): a
  // mensagem já está no banco; falha de rede não quebra o fluxo do agente.
  private deliver(pais: string, phone: string, text: string): void {
    void this.whatsapp?.send(pais, phone, text).catch((err) => {
      console.error("[whatsapp] falha na entrega:", err);
    });
  }

  private newMessage(from: "cliente" | "agente", text: string): ChatMessage {
    return { id: `m-${Date.now()}`, from, text, at: new Date().toISOString() };
  }

  private buildVars(
    caso: ServiceCase | null,
    client: Client | undefined
  ): Record<string, string> {
    const form = client?.form;
    const primeiroNome = (caso?.cliente ?? form?.nomeCompleto ?? "cliente").split(" ")[0];
    const orcamento =
      caso?.orcamentoValor != null
        ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
            caso.orcamentoValor
          )
        : "(valor não definido)";
    return {
      cliente: primeiroNome,
      nomeCompleto: form?.nomeCompleto ?? caso?.cliente ?? "",
      caseId: caso?.id ?? "",
      orcamento,
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
