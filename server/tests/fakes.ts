// Repositórios FALSOS (in-memory) usados nos testes. Graças à DIP, os serviços
// rodam sem banco. Cada fake replica o comportamento essencial do adaptador real.
import type { CaseRepository, GarantiaInput } from "../src/repositories/case.repository";
import type {
  NewShipment,
  ShipmentRepository,
} from "../src/repositories/shipment.repository";
import type { ConversationRepository } from "../src/repositories/conversation.repository";
import type { ClientRepository } from "../src/repositories/client.repository";
import type {
  CaseStatus,
  ChatMessage,
  Client,
  ClientForm,
  Conversation,
  ServiceCase,
  Shipment,
  StatusEvent,
} from "../src/domain/types";

export class FakeCaseRepository implements CaseRepository {
  store = new Map<string, ServiceCase>();
  private seq = 0;

  findAll(): ServiceCase[] {
    return [...this.store.values()];
  }
  findById(id: string): ServiceCase | null {
    return this.store.get(id) ?? null;
  }
  findByImei(imei: string): ServiceCase[] {
    return [...this.store.values()].filter((c) => c.imei === imei);
  }
  insert(c: ServiceCase): void {
    this.store.set(c.id, c);
  }
  appendStatus(
    id: string,
    status: CaseStatus,
    updatedAt: string,
    event: StatusEvent
  ): void {
    const c = this.store.get(id);
    if (!c) return;
    c.status = status;
    c.updatedAt = updatedAt;
    if (status === "validado" && !c.validadoEm) c.validadoEm = updatedAt;
    c.historico.push(event);
  }
  updateGarantia(id: string, g: GarantiaInput, updatedAt: string): void {
    const c = this.store.get(id);
    if (!c) return;
    c.garantiaQueda = g.queda;
    c.garantiaAgua = g.agua;
    c.garantiaAberto = g.aberto;
    c.aparelhoLiga = g.aparelhoLiga;
    c.foraGarantia = g.queda || g.agua || g.aberto;
    c.updatedAt = updatedAt;
  }
  nextId(): string {
    this.seq += 1;
    return `CC-TEST-${String(this.seq).padStart(4, "0")}`;
  }
}

export class FakeShipmentRepository implements ShipmentRepository {
  store = new Map<string, Shipment[]>();
  private seq = 0;

  add(caseId: string, s: NewShipment, criadoEm: string): Shipment {
    this.seq += 1;
    const ship: Shipment = {
      id: this.seq,
      direcao: s.direcao,
      codigoRastreio: s.codigoRastreio,
      enviadoEm: s.enviadoEm,
      transportadora: s.transportadora,
      criadoEm,
    };
    const list = this.store.get(caseId) ?? [];
    list.push(ship);
    this.store.set(caseId, list);
    return ship;
  }
  listByCase(caseId: string): Shipment[] {
    return this.store.get(caseId) ?? [];
  }
  allGrouped(): Map<string, Shipment[]> {
    return new Map(this.store);
  }
}

export class FakeConversationRepository implements ConversationRepository {
  store = new Map<string, Conversation>();

  findAll(): Conversation[] {
    return [...this.store.values()];
  }
  findById(id: string): Conversation | null {
    return this.store.get(id) ?? null;
  }
  addMessage(conversationId: string, message: ChatMessage): void {
    const c = this.store.get(conversationId);
    if (!c) return;
    c.messages.push(message);
    c.lastAt = message.at;
    c.unread = 0;
  }
  markRead(conversationId: string): void {
    const c = this.store.get(conversationId);
    if (c) c.unread = 0;
  }
}

export class FakeClientRepository implements ClientRepository {
  store = new Map<string, Client>();

  findAll(): Client[] {
    return [...this.store.values()];
  }
  findByKey(key: string): Client | null {
    return this.store.get(key) ?? null;
  }
  markEnviado(key: string, telefone: string, enviadoAt: string): void {
    const ex = this.store.get(key);
    if (ex && ex.formStatus === "preenchido") return;
    this.store.set(key, {
      telefone,
      telefoneKey: key,
      formStatus: "enviado",
      enviadoAt,
    });
  }
  savePreenchido(
    key: string,
    telefone: string,
    form: ClientForm,
    preenchidoAt: string
  ): void {
    this.store.set(key, {
      telefone,
      telefoneKey: key,
      formStatus: "preenchido",
      preenchidoAt,
      form,
    });
  }
}
