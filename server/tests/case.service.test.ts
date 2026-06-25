import { describe, it, expect, beforeEach } from "vitest";
import { CaseService } from "../src/services/case.service";
import type { CaseRepository } from "../src/repositories/case.repository";
import type { CaseStatus, ServiceCase, StatusEvent } from "../src/domain/types";
import { NotFoundError } from "../src/domain/errors";

// Repositório FALSO (in-memory). Como o serviço depende da abstração
// CaseRepository (DIP), conseguimos testar a regra de negócio sem banco.
class FakeCaseRepository implements CaseRepository {
  private store = new Map<string, ServiceCase>();
  private seq = 0;

  findAll(): ServiceCase[] {
    return [...this.store.values()];
  }
  findById(id: string): ServiceCase | null {
    return this.store.get(id) ?? null;
  }
  insert(c: ServiceCase): void {
    this.store.set(c.id, c);
  }
  appendStatus(
    id: string,
    status: CaseStatus,
    updatedAt: string,
    event: StatusEvent
  ): void {
    const c = this.store.get(id);
    if (!c) return;
    c.status = status;
    c.updatedAt = updatedAt;
    c.historico.push(event);
  }
  nextId(): string {
    this.seq += 1;
    return `CC-TEST-${String(this.seq).padStart(4, "0")}`;
  }
}

const baseInput = {
  cliente: "Ana Lima",
  telefone: "+55 11 90000-0000",
  cidade: "São Paulo",
  estado: "SP",
  marca: "TECNO" as const,
  modelo: "Spark 20",
  imei: "356938035643809",
  defeito: "Tela trincada",
  area: "Carlcare" as const,
  responsavel: "Beatriz Nunes",
};

describe("CaseService", () => {
  let repo: FakeCaseRepository;
  let service: CaseService;

  beforeEach(() => {
    repo = new FakeCaseRepository();
    service = new CaseService(repo);
  });

  it("cria um caso já com status 'novo' e o primeiro evento de histórico", () => {
    const caso = service.create(baseInput);
    expect(caso.status).toBe("novo");
    expect(caso.historico).toHaveLength(1);
    expect(caso.historico[0]).toMatchObject({ status: "novo", by: "Beatriz Nunes" });
    expect(service.list()).toHaveLength(1);
  });

  it("lança NotFoundError ao buscar um caso inexistente", () => {
    expect(() => service.getById("CC-9999")).toThrow(NotFoundError);
  });

  it("muda o status e registra um novo evento no histórico", () => {
    const caso = service.create(baseInput);
    const atualizado = service.changeStatus(caso.id, {
      status: "em_reparo",
      by: "Rafael Lima",
      note: "Troca de display",
    });
    expect(atualizado.status).toBe("em_reparo");
    expect(atualizado.historico).toHaveLength(2);
    expect(atualizado.historico.at(-1)).toMatchObject({
      status: "em_reparo",
      by: "Rafael Lima",
      note: "Troca de display",
    });
  });
});
