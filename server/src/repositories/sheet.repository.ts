import type Database from "better-sqlite3";
import { getSheet } from "../domain/sheets";
import { NotFoundError } from "../domain/errors";

export type SheetRow = { id: number } & Record<string, string>;

// Repositório genérico das planilhas operacionais. A whitelist de colunas vem
// de domain/sheets.ts — chaves fora dela são simplesmente ignoradas, e o nome
// da aba é validado antes de montar qualquer SQL.
export class SqliteSheetRepository {
  constructor(private readonly db: Database.Database) {}

  private def(sheet: string) {
    const def = getSheet(sheet);
    if (!def) throw new NotFoundError("Planilha", sheet);
    return def;
  }

  list(sheet: string): SheetRow[] {
    const def = this.def(sheet);
    const select = Object.entries(def.cols)
      .map(([key, col]) => `${col} AS ${key}`)
      .join(", ");
    return this.db
      .prepare(`SELECT id, ${select} FROM ${def.table} ORDER BY id ASC`)
      .all() as SheetRow[];
  }

  count(sheet: string): number {
    const def = this.def(sheet);
    const row = this.db
      .prepare(`SELECT COUNT(*) AS n FROM ${def.table}`)
      .get() as { n: number };
    return row.n;
  }

  insert(sheet: string, data: Record<string, unknown>): SheetRow {
    const def = this.def(sheet);
    const keys = Object.keys(def.cols).filter((k) => data[k] !== undefined);
    const cols = keys.map((k) => def.cols[k]);
    const placeholders = keys.map(() => "?").join(", ");
    const values = keys.map((k) => String(data[k]));
    const result = keys.length
      ? this.db
          .prepare(
            `INSERT INTO ${def.table} (${cols.join(", ")}) VALUES (${placeholders})`
          )
          .run(...values)
      : this.db.prepare(`INSERT INTO ${def.table} DEFAULT VALUES`).run();
    return this.getById(sheet, Number(result.lastInsertRowid));
  }

  update(sheet: string, id: number, data: Record<string, unknown>): SheetRow {
    const def = this.def(sheet);
    const keys = Object.keys(def.cols).filter((k) => data[k] !== undefined);
    if (keys.length) {
      const sets = keys.map((k) => `${def.cols[k]} = ?`).join(", ");
      const values = keys.map((k) => String(data[k]));
      const r = this.db
        .prepare(`UPDATE ${def.table} SET ${sets} WHERE id = ?`)
        .run(...values, id);
      if (r.changes === 0) throw new NotFoundError("Linha", String(id));
    }
    return this.getById(sheet, id);
  }

  remove(sheet: string, id: number): void {
    const def = this.def(sheet);
    const r = this.db.prepare(`DELETE FROM ${def.table} WHERE id = ?`).run(id);
    if (r.changes === 0) throw new NotFoundError("Linha", String(id));
  }

  private getById(sheet: string, id: number): SheetRow {
    const def = this.def(sheet);
    const select = Object.entries(def.cols)
      .map(([key, col]) => `${col} AS ${key}`)
      .join(", ");
    const row = this.db
      .prepare(`SELECT id, ${select} FROM ${def.table} WHERE id = ?`)
      .get(id) as SheetRow | undefined;
    if (!row) throw new NotFoundError("Linha", String(id));
    return row;
  }
}
