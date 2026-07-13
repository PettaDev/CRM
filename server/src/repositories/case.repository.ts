import type Database from "better-sqlite3";
import type {
  Area,
  CaseStatus,
  DeviceBrand,
  ServiceCase,
  StatusEvent,
} from "../domain/types";

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
  pais: string;
  lote_id: string | null;
  canal: string;
  garantia_queda: number;
  garantia_agua: number;
  garantia_aberto: number;
  aparelho_liga: number;
  validado_em: string | null;
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

export interface GarantiaInput {
  queda: boolean;
  agua: boolean;
  aberto: boolean;
  aparelhoLiga: boolean;
}

// Porta (interface) — os serviços dependem desta abstração, não do SQLite (DIP).
// `shipments` NÃO é responsabilidade deste repo (vem do ShipmentRepository);
// o serviço compõe os dois. Aqui sempre devolvemos `shipments: []`.
export interface CaseRepository {
  findAll(): ServiceCase[];
  findById(id: string): ServiceCase | null;
  findByImei(imei: string): ServiceCase[];
  insert(c: ServiceCase): void;
  appendStatus(
    id: string,
    status: CaseStatus,
    updatedAt: string,
    event: StatusEvent
  ): void;
  updateGarantia(id: string, g: GarantiaInput, updatedAt: string): void;
  nextId(): string;
}

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
    return this.mapCase(row, this.loadEvents(id));
  }

  findByImei(imei: string): ServiceCase[] {
    const rows = this.db
      .prepare("SELECT * FROM cases WHERE imei = ? ORDER BY updated_at DESC")
      .all(imei) as CaseRow[];
    return rows.map((r) => this.mapCase(r, this.loadEvents(r.id)));
  }

  insert(c: ServiceCase): void {
    const tx = this.db.transaction((caso: ServiceCase) => {
      this.db
        .prepare(
          `INSERT INTO cases (id, cliente, telefone, cidade, estado, marca, modelo, imei, defeito, status, area, responsavel, pais, lote_id, canal, garantia_queda, garantia_agua, garantia_aberto, aparelho_liga, validado_em, created_at, updated_at)
           VALUES (@id, @cliente, @telefone, @cidade, @estado, @marca, @modelo, @imei, @defeito, @status, @area, @responsavel, @pais, @loteId, @canal, @garantiaQueda, @garantiaAgua, @garantiaAberto, @aparelhoLiga, @validadoEm, @createdAt, @updatedAt)`
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
          pais: caso.pais,
          loteId: caso.loteId,
          canal: caso.canal,
          garantiaQueda: caso.garantiaQueda ? 1 : 0,
          garantiaAgua: caso.garantiaAgua ? 1 : 0,
          garantiaAberto: caso.garantiaAberto ? 1 : 0,
          aparelhoLiga: caso.aparelhoLiga ? 1 : 0,
          validadoEm: caso.validadoEm,
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
      // Ao validar, grava a data de validação (gate) — sem sobrescrever se já houver.
      if (status === "validado") {
        this.db
          .prepare(
            "UPDATE cases SET status = ?, updated_at = ?, validado_em = COALESCE(validado_em, ?) WHERE id = ?"
          )
          .run(status, updatedAt, updatedAt, id);
      } else {
        this.db
          .prepare("UPDATE cases SET status = ?, updated_at = ? WHERE id = ?")
          .run(status, updatedAt, id);
      }
      this.db
        .prepare(
          "INSERT INTO case_status_events (case_id, status, at, by_who, note) VALUES (?, ?, ?, ?, ?)"
        )
        .run(id, event.status, event.at, event.by, event.note ?? null);
    });
    tx();
  }

  updateGarantia(id: string, g: GarantiaInput, updatedAt: string): void {
    this.db
      .prepare(
        "UPDATE cases SET garantia_queda = ?, garantia_agua = ?, garantia_aberto = ?, aparelho_liga = ?, updated_at = ? WHERE id = ?"
      )
      .run(g.queda ? 1 : 0, g.agua ? 1 : 0, g.aberto ? 1 : 0, g.aparelhoLiga ? 1 : 0, updatedAt, id);
  }

  nextId(): string {
    const rows = this.db.prepare("SELECT id FROM cases").all() as { id: string }[];
    const max = rows.reduce((acc, r) => {
      const n = Number(r.id.split("-")[2]);
      return Number.isFinite(n) && n > acc ? n : acc;
    }, 0);
    return `CC-${new Date().getFullYear()}-${String(max + 1).padStart(4, "0")}`;
  }

  private loadEvents(id: string): StatusEvent[] {
    const events = this.db
      .prepare("SELECT * FROM case_status_events WHERE case_id = ? ORDER BY id ASC")
      .all(id) as EventRow[];
    return events.map((e) => this.mapEvent(e));
  }

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
      pais: r.pais,
      loteId: r.lote_id,
      canal: "WhatsApp",
      garantiaQueda: !!r.garantia_queda,
      garantiaAgua: !!r.garantia_agua,
      garantiaAberto: !!r.garantia_aberto,
      // Conclusão DERIVADA — não persistida, sempre coerente com as causas.
      foraGarantia: !!(r.garantia_queda || r.garantia_agua || r.garantia_aberto),
      aparelhoLiga: !!r.aparelho_liga,
      validadoEm: r.validado_em,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      historico,
      shipments: [], // preenchido pelo serviço via ShipmentRepository
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
