import { getDb } from "./connection";
import { SCHEMA_SQL } from "./schema";

// Aplica o schema (idempotente — usa CREATE TABLE IF NOT EXISTS).
export function migrate(): void {
  getDb().exec(SCHEMA_SQL);
}

// Permite rodar como script: `npm run migrate`.
if (require.main === module) {
  migrate();
  console.log("✓ Migração aplicada com sucesso.");
}
