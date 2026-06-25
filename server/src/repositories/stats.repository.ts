import type Database from "better-sqlite3";
import type { Area, CaseStatus } from "../domain/types";
import { AREAS, STATUS_ORDER } from "../domain/constants";

export interface DashboardStats {
  abertos: number;
  aguardandoPeca: number;
  prontos: number;
  finalizados: number;
  porArea: { area: Area; total: number; abertos: number }[];
  porStatus: { status: CaseStatus; total: number }[];
}

export interface StatsRepository {
  dashboard(): DashboardStats;
}

// Demonstra agregação no banco (GROUP BY / SUM CASE) em vez de contar em memória.
export class SqliteStatsRepository implements StatsRepository {
  constructor(private readonly db: Database.Database) {}

  dashboard(): DashboardStats {
    const statusRows = this.db
      .prepare("SELECT status, COUNT(*) AS total FROM cases GROUP BY status")
      .all() as { status: string; total: number }[];

    const areaRows = this.db
      .prepare(
        `SELECT area,
                COUNT(*) AS total,
                SUM(CASE WHEN status NOT IN ('finalizado','cancelado') THEN 1 ELSE 0 END) AS abertos
         FROM cases GROUP BY area`
      )
      .all() as { area: string; total: number; abertos: number }[];

    const statusMap = new Map(statusRows.map((r) => [r.status, r.total]));
    const areaMap = new Map(areaRows.map((r) => [r.area, r]));

    // Preenche zeros para garantir que todos os status/áreas apareçam.
    const porStatus = STATUS_ORDER.map((status) => ({
      status,
      total: statusMap.get(status) ?? 0,
    }));
    const porArea = AREAS.map((area) => {
      const r = areaMap.get(area);
      return { area, total: r?.total ?? 0, abertos: r?.abertos ?? 0 };
    });

    return {
      abertos: porArea.reduce((n, x) => n + x.abertos, 0),
      aguardandoPeca: statusMap.get("aguardando_peca") ?? 0,
      prontos: statusMap.get("pronto") ?? 0,
      finalizados: statusMap.get("finalizado") ?? 0,
      porArea,
      porStatus,
    };
  }
}
