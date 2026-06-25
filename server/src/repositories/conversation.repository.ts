import type Database from "better-sqlite3";
import type { ChatMessage, Conversation } from "../domain/types";

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
  addMessage(conversationId: string, message: ChatMessage): void;
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
