import type Database from "better-sqlite3";
import type {
  Area,
  CaseStatus,
  DeviceBrand,
  ServiceCase,
  StatusEvent,
} from "../domain/types";

// Linhas cruas do banco (snake_case). Ficam encapsuladas no repositório —
// nenhuma outra camada conhece esse formato.
interface CaseRow {
  id: string;
  cliente: string;
  telefone: string;
  cidade: string;
  estado: string;
  marca: string;
  modelo: string;
  imei: string;
  defeito: string;
  status: string;
  area: string;
  responsavel: string;
  canal: string;
  created_at: string;
  updated_at: string;
}

interface EventRow {
  case_id: string;
  status: string;
  at: string;
  by_who: string;
  note: string | null;
}

// Porta (interface) — os serviços dependem desta abstração, não do SQLite (DIP).
export interface CaseRepository {
  findAll(): ServiceCase[];
  findById(id: string): ServiceCase | null;
  insert(c: ServiceCase): void;
  appendStatus(
    id: string,
    status: CaseStatus,
    updatedAt: string,
    event: StatusEvent
  ): void;
  nextId(): string;
}

// Adaptador SQLite.
export class SqliteCaseRepository implements CaseRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): ServiceCase[] {
    const rows = this.db
      .prepare("SELECT * FROM cases ORDER BY updated_at DESC")
      .all() as CaseRow[];
    const events = this.db
      .prepare("SELECT * FROM case_status_events ORDER BY id ASC")
      .all() as EventRow[];

    const byCase = new Map<string, StatusEvent[]>();
    for (const e of events) {
      const list = byCase.get(e.case_id) ?? [];
      list.push(this.mapEvent(e));
      byCase.set(e.case_id, list);
    }
    return rows.map((r) => this.mapCase(r, byCase.get(r.id) ?? []));
  }

  findById(id: string): ServiceCase | null {
    const row = this.db.prepare("SELECT * FROM cases WHERE id = ?").get(id) as
      | CaseRow
      | undefined;
    if (!row) return null;
    const events = this.db
      .prepare("SELECT * FROM case_status_events WHERE case_id = ? ORDER BY id ASC")
      .all(id) as EventRow[];
    return this.mapCase(
      row,
      events.map((e) => this.mapEvent(e))
    );
  }

  insert(c: ServiceCase): void {
    const tx = this.db.transaction((caso: ServiceCase) => {
      this.db
        .prepare(
          `INSERT INTO cases (id, cliente, telefone, cidade, estado, marca, modelo, imei, defeito, status, area, responsavel, canal, created_at, updated_at)
           VALUES (@id, @cliente, @telefone, @cidade, @estado, @marca, @modelo, @imei, @defeito, @status, @area, @responsavel, @canal, @createdAt, @updatedAt)`
        )
        .run({
          id: caso.id,
          cliente: caso.cliente,
          telefone: caso.telefone,
          cidade: caso.cidade,
          estado: caso.estado,
          marca: caso.marca,
          modelo: caso.modelo,
          imei: caso.imei,
          defeito: caso.defeito,
          status: caso.status,
          area: caso.area,
          responsavel: caso.responsavel,
          canal: caso.canal,
          createdAt: caso.createdAt,
          updatedAt: caso.updatedAt,
        });
      const insEvent = this.db.prepare(
        "INSERT INTO case_status_events (case_id, status, at, by_who, note) VALUES (?, ?, ?, ?, ?)"
      );
      for (const ev of caso.historico) {
        insEvent.run(caso.id, ev.status, ev.at, ev.by, ev.note ?? null);
      }
    });
    tx(c);
  }

  appendStatus(
    id: string,
    status: CaseStatus,
    updatedAt: string,
    event: StatusEvent
  ): void {
    const tx = this.db.transaction(() => {
      this.db
        .prepare("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?")
        .run(status, updatedAt, id);
      this.db
        .prepare(
          "INSERT INTO case_status_events (case_id, status, at, by_who, note) VALUES (?, ?, ?, ?, ?)"
        )
        .run(id, event.status, event.at, event.by, event.note ?? null);
    });
    tx();
  }

  // Gera o próximo identificador legível (CC-AAAA-NNNN).
  nextId(): string {
    const rows = this.db.prepare("SELECT id FROM cases").all() as { id: string }[];
    const max = rows.reduce((acc, r) => {
      const n = Number(r.id.split("-")[2]);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `CC-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
  }

  // ── Mapeadores (anti-corruption: traduzem linha do banco ↔ domínio) ──
  private mapCase(r: CaseRow, historico: StatusEvent[]): ServiceCase {
    return {
      id: r.id,
      cliente: r.cliente,
      telefone: r.telefone,
      cidade: r.cidade,
      estado: r.estado,
      marca: r.marca as DeviceBrand,
      modelo: r.modelo,
      imei: r.imei,
      defeito: r.defeito,
      status: r.status as CaseStatus,
      area: r.area as Area,
      responsavel: r.responsavel,
      canal: "WhatsApp",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      historico,
    };
  }

  private mapEvent(e: EventRow): StatusEvent {
    const ev: StatusEvent = {
      status: e.status as CaseStatus,
      at: e.at,
      by: e.by_who,
    };
    if (e.note) ev.note = e.note;
    return ev;
  }
}
