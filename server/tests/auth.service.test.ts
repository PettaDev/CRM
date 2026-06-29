import { describe, it, expect } from "vitest";
import bcrypt from "bcryptjs";
import { AuthService } from "../src/services/auth.service";
import type {
  UserRecord,
  UserRepository,
} from "../src/repositories/user.repository";
import { ForbiddenError, UnauthorizedError } from "../src/domain/errors";

class FakeUserRepo implements UserRepository {
  private rec: UserRecord = {
    id: "u-1",
    nome: "Beatriz Nunes",
    email: "bia@carlcare.com",
    area: "Carlcare",
    role: "agente",
    senhaHash: bcrypt.hashSync("secret123", 8),
  };
  findByEmail(email: string): UserRecord | null {
    return email === this.rec.email ? this.rec : null;
  }
}

describe("AuthService", () => {
  const svc = new AuthService(new FakeUserRepo(), "test-secret");

  it("bloqueia e-mail de domínio não permitido", () => {
    expect(() =>
      svc.login({ email: "alguem@gmail.com", password: "secret123" })
    ).toThrow(ForbiddenError);
  });

  it("rejeita senha incorreta", () => {
    expect(() =>
      svc.login({ email: "bia@carlcare.com", password: "errada" })
    ).toThrow(UnauthorizedError);
  });

  it("loga com sucesso e o token verifica de volta", () => {
    const { token, user } = svc.login({
      email: "bia@carlcare.com",
      password: "secret123",
    });
    expect(user.email).toBe("bia@carlcare.com");
    expect(token.length).toBeGreaterThan(20);

    const back = svc.verify(token);
    expect(back.id).toBe("u-1");
    expect(back.role).toBe("agente");
    expect(back.area).toBe("Carlcare");
  });

  it("verify lança em token inválido", () => {
    expect(() => svc.verify("token.invalido.xyz")).toThrow(UnauthorizedError);
  });
});
