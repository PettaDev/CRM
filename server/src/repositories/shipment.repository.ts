import type Database from "better-sqlite3";
import type { Shipment, ShipmentDirection } from "../domain/types";

interface ShipmentRow {
  id: number;
  case_id: string;
  direcao: string;
  codigo_rastreio: string | null;
  enviado_em: string | null;
  transportadora: string;
  criado_em: string;
}

export interface NewShipment {
  direcao: ShipmentDirection;
  codigoRastreio: string | null;
  enviadoEm: string | null;
  transportadora: string;
}

export interface ShipmentRepository {
  add(caseId: string, s: NewShipment, criadoEm: string): Shipment;
  listByCase(caseId: string): Shipment[];
  allGrouped(): Map<string, Shipment[]>;
}

export class SqliteShipmentRepository implements ShipmentRepository {
  constructor(private readonly db: Database.Database) {}

  add(caseId: string, s: NewShipment, criadoEm: string): Shipment {
    const info = this.db
      .prepare(
        `INSERT INTO shipments (case_id, direcao, codigo_rastreio, enviado_em, transportadora, criado_em)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .run(caseId, s.direcao, s.codigoRastreio, s.enviadoEm, s.transportadora, criadoEm);
    return {
      id: Number(info.lastInsertRowid),
      direcao: s.direcao,
      codigoRastreio: s.codigoRastreio,
      enviadoEm: s.enviadoEm,
      transportadora: s.transportadora,
      criadoEm,
    };
  }

  listByCase(caseId: string): Shipment[] {
    const rows = this.db
      .prepare("SELECT * FROM shipments WHERE case_id = ? ORDER BY id ASC")
      .all(caseId) as ShipmentRow[];
    return rows.map((r) => this.map(r));
  }

  allGrouped(): Map<string, Shipment[]> {
    const rows = this.db
      .prepare("SELECT * FROM shipments ORDER BY id ASC")
      .all() as ShipmentRow[];
    const byCase = new Map<string, Shipment[]>();
    for (const r of rows) {
      const list = byCase.get(r.case_id) ?? [];
      list.push(this.map(r));
      byCase.set(r.case_id, list);
    }
    return byCase;
  }

  private map(r: ShipmentRow): Shipment {
    return {
      id: r.id,
      direcao: r.direcao as ShipmentDirection,
      codigoRastreio: r.codigo_rastreio,
      enviadoEm: r.enviado_em,
      transportadora: r.transportadora,
      criadoEm: r.criado_em,
    };
  }
}
