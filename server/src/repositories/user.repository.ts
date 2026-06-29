import type Database from "better-sqlite3";
import type { Area, Role, User } from "../domain/types";

interface UserRow {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  area: string;
  role: string;
}

// Inclui o hash da senha — só circula dentro da camada de auth, nunca na API.
export interface UserRecord extends User {
  senhaHash: string;
}

export interface UserRepository {
  findByEmail(email: string): UserRecord | null;
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database.Database) {}

  findByEmail(email: string): UserRecord | null {
    const row = this.db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get(email.toLowerCase()) as UserRow | undefined;
    if (!row) return null;
    return {
      id: row.id,
      nome: row.nome,
      email: row.email,
      area: row.area as Area,
      role: row.role as Role,
      senhaHash: row.senha_hash,
    };
  }
}
