import type Database from "better-sqlite3";
import type { ChatMessage, Conversation } from "../domain/types";
import { phoneKey } from "../utils/phone";

interface ConvRow {
  id: string;
  case_id: string | null;
  cliente: string;
  telefone: string;
  unread: number;
  last_at: string;
}

interface MsgRow {
  id: string;
  conversation_id: string;
  sender: string;
  text: string;
  at: string;
}

export interface ConversationRepository {
  findAll(): Conversation[];
  findById(id: string): Conversation | null;
  /** Busca pela chave do telefone (só dígitos) — usada pelo webhook do WhatsApp. */
  findByPhoneKey(phoneKey: string): Conversation | null;
  create(conv: Conversation): void;
  addMessage(conversationId: string, message: ChatMessage): void;
  /** Mensagem vinda do CLIENTE: além de registrar, incrementa o contador de não lidas. */
  addInboundMessage(conversationId: string, message: ChatMessage): void;
  markRead(conversationId: string): void;
}

export class SqliteConversationRepository implements ConversationRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): Conversation[] {
    const rows = this.db
      .prepare("SELECT * FROM conversations ORDER BY last_at DESC")
      .all() as ConvRow[];
    const msgs = this.db
      .prepare("SELECT * FROM messages ORDER BY at ASC")
      .all() as MsgRow[];

    const byConv = new Map<string, ChatMessage[]>();
    for (const m of msgs) {
      const list = byConv.get(m.conversation_id) ?? [];
      list.push(this.mapMessage(m));
      byConv.set(m.conversation_id, list);
    }
    return rows.map((r) => this.mapConv(r, byConv.get(r.id) ?? []));
  }

  findById(id: string): Conversation | null {
    const row = this.db
      .prepare("SELECT * FROM conversations WHERE id = ?")
      .get(id) as ConvRow | undefined;
    if (!row) return null;
    const msgs = this.db
      .prepare("SELECT * FROM messages WHERE conversation_id = ? ORDER BY at ASC")
      .all(id) as MsgRow[];
    return this.mapConv(
      row,
      msgs.map((m) => this.mapMessage(m))
    );
  }

  findByPhoneKey(key: string): Conversation | null {
    // Normaliza em JS com o mesmo util usado no resto do sistema (phoneKey).
    // A tabela de conversas é pequena; a clareza vale mais que o índice aqui.
    const rows = this.db
      .prepare("SELECT id, telefone FROM conversations ORDER BY last_at DESC")
      .all() as Array<Pick<ConvRow, "id" | "telefone">>;
    const hit = rows.find((r) => phoneKey(r.telefone) === key);
    return hit ? this.findById(hit.id) : null;
  }

  create(conv: Conversation): void {
    this.db
      .prepare(
        "INSERT INTO conversations (id, case_id, cliente, telefone, unread, last_at) VALUES (?, ?, ?, ?, ?, ?)"
      )
      .run(conv.id, conv.caseId, conv.cliente, conv.telefone, conv.unread, conv.lastAt);
  }

  addInboundMessage(conversationId: string, message: ChatMessage): void {
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO messages (id, conversation_id, sender, text, at) VALUES (?, ?, ?, ?, ?)"
        )
        .run(message.id, conversationId, message.from, message.text, message.at);
      this.db
        .prepare(
          "UPDATE conversations SET last_at = ?, unread = unread + 1 WHERE id = ?"
        )
        .run(message.at, conversationId);
    });
    tx();
  }

  // Adiciona mensagem do agente: registra e atualiza "última atividade"/lê.
  addMessage(conversationId: string, message: ChatMessage): void {
    const tx = this.db.transaction(() => {
      this.db
        .prepare(
          "INSERT INTO messages (id, conversation_id, sender, text, at) VALUES (?, ?, ?, ?, ?)"
        )
        .run(message.id, conversationId, message.from, message.text, message.at);
      this.db
        .prepare("UPDATE conversations SET last_at = ?, unread = 0 WHERE id = ?")
        .run(message.at, conversationId);
    });
    tx();
  }

  markRead(conversationId: string): void {
    this.db
      .prepare("UPDATE conversations SET unread = 0 WHERE id = ?")
      .run(conversationId);
  }

  private mapConv(r: ConvRow, messages: ChatMessage[]): Conversation {
    return {
      id: r.id,
      caseId: r.case_id,
      cliente: r.cliente,
      telefone: r.telefone,
      unread: r.unread,
      lastAt: r.last_at,
      messages,
    };
  }

  private mapMessage(m: MsgRow): ChatMessage {
    return {
      id: m.id,
      from: m.sender as ChatMessage["from"],
      text: m.text,
      at: m.at,
    };
  }
}
