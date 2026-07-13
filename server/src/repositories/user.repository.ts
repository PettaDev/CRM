import type Database from "better-sqlite3";
import type { Area, Role, User } from "../domain/types";

interface UserRow {
  id: string;
  nome: string;
  email: string;
  senha_hash: string;
  area: string;
  role: string;
  pais: string;
}

// Inclui o hash da senha — só circula dentro da camada de auth, nunca na API.
export interface UserRecord extends User {
  senhaHash: string;
}

export interface UserRepository {
  findByEmail(email: string): UserRecord | null;
  /** Lista SEM o hash de senha — para a tela de administração. */
  findAll(): User[];
  count(): number;
  create(user: UserRecord): void;
  remove(id: string): boolean;
}

export class SqliteUserRepository implements UserRepository {
  constructor(private readonly db: Database.Database) {}

  findAll(): User[] {
    const rows = this.db
      .prepare("SELECT id, nome, email, area, role, pais FROM users ORDER BY nome")
      .all() as Array<Omit<UserRow, "senha_hash">>;
    return rows.map((r) => ({
      id: r.id,
      nome: r.nome,
      email: r.email,
      area: r.area as Area,
      role: r.role as Role,
      pais: r.pais,
    }));
  }

  remove(id: string): boolean {
    return this.db.prepare("DELETE FROM users WHERE id = ?").run(id).changes > 0;
  }

  count(): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS n FROM users")
      .get() as { n: number };
    return row.n;
  }

  create(user: UserRecord): void {
    this.db
      .prepare(
        `INSERT INTO users (id, nome, email, senha_hash, area, role, pais, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        user.id,
        user.nome,
        user.email.toLowerCase(),
        user.senhaHash,
        user.area,
        user.role,
        user.pais ?? "BR",
        new Date().toISOString()
      );
  }

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
      pais: row.pais,
      senhaHash: row.senha_hash,
    };
  }
}
