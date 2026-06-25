import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "../config/env";

// Conexão única (singleton) com o SQLite. Centralizar aqui evita abrir vários
// handles e mantém os PRAGMAs num só lugar.
let instance: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!instance) {
    fs.mkdirSync(path.dirname(config.databaseFile), { recursive: true });
    instance = new Database(config.databaseFile);
    instance.pragma("journal_mode = WAL"); // melhor concorrência leitura/escrita
    instance.pragma("foreign_keys = ON"); // respeita as FOREIGN KEYs
  }
  return instance;
}
