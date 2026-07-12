import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { UserRepository } from "../repositories/user.repository";
import type { LoginDto } from "../dto/auth.dto";
import type { Area, Role, User } from "../domain/types";
import { isAllowedEmail } from "../domain/auth";
import { ForbiddenError, UnauthorizedError } from "../domain/errors";

export interface AuthResult {
  token: string;
  user: User;
}

interface TokenPayload {
  sub: string;
  nome: string;
  email: string;
  area: Area;
  role: Role;
  pais: string;
}

// Regras de autenticação: valida domínio, confere a senha (bcrypt) e emite JWT.
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly jwtSecret: string
  ) {}

  login(dto: LoginDto): AuthResult {
    const email = dto.email.trim().toLowerCase();

    // Gate de domínio: só @transsion.com ou @carlcare.com.
    if (!isAllowedEmail(email)) {
      throw new ForbiddenError(
        "Acesso restrito a e-mails @transsion.com ou @carlcare.com."
      );
    }

    const rec = this.users.findByEmail(email);
    if (!rec || !bcrypt.compareSync(dto.password, rec.senhaHash)) {
      throw new UnauthorizedError("E-mail ou senha inválidos.");
    }

    const user: User = {
      id: rec.id,
      nome: rec.nome,
      email: rec.email,
      area: rec.area,
      role: rec.role,
      pais: rec.pais,
    };
    const token = jwt.sign(
      { nome: user.nome, email: user.email, area: user.area, role: user.role, pais: user.pais },
      this.jwtSecret,
      { subject: user.id, expiresIn: "8h" }
    );
    return { token, user };
  }

  verify(token: string): User {
    try {
      const p = jwt.verify(token, this.jwtSecret) as TokenPayload;
      return { id: p.sub, nome: p.nome, email: p.email, area: p.area, role: p.role, pais: p.pais ?? "BR" };
    } catch {
      throw new UnauthorizedError("Sessão inválida ou expirada.");
    }
  }
}
