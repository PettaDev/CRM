import { describe, it, expect, beforeEach } from "vitest";
import { CaseService } from "../src/services/case.service";
import { ConflictError, NotFoundError } from "../src/domain/errors";
import { FakeCaseRepository, FakeShipmentRepository } from "./fakes";

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
  let caseRepo: FakeCaseRepository;
  let shipRepo: FakeShipmentRepository;
  let service: CaseService;

  beforeEach(() => {
    caseRepo = new FakeCaseRepository();
    shipRepo = new FakeShipmentRepository();
    service = new CaseService(caseRepo, shipRepo);
  });

  it("cria caso com status 'novo' e defaults", () => {
    const c = service.create(baseInput);
    expect(c.status).toBe("novo");
    expect(c.foraGarantia).toBe(false);
    expect(c.aparelhoLiga).toBe(true);
    expect(c.validadoEm).toBeNull();
    expect(c.historico).toHaveLength(1);
  });

  it("FSM: permite novo → validado e grava validadoEm (gate)", () => {
    const c = service.create(baseInput);
    const v = service.changeStatus(c.id, { status: "validado", by: "Bia" });
    expect(v.status).toBe("validado");
    expect(v.validadoEm).not.toBeNull();
  });

  it("FSM: bloqueia transição inválida (novo → em_reparo)", () => {
    const c = service.create(baseInput);
    expect(() =>
      service.changeStatus(c.id, { status: "em_reparo", by: "Bia" })
    ).toThrow(ConflictError);
  });

  it("garantia: foraGarantia é DERIVADO das causas", () => {
    const c = service.create(baseInput);
    const g = service.updateGarantia(c.id, {
      queda: true,
      agua: false,
      aberto: false,
      aparelhoLiga: false,
    });
    expect(g.foraGarantia).toBe(true);
    expect(g.aparelhoLiga).toBe(false);
  });

  it("remessa: adiciona shipment (rastreio) ao caso", () => {
    const c = service.create(baseInput);
    const r = service.addShipment(c.id, {
      direcao: "ida",
      codigoRastreio: "BR123456789",
      transportadora: "Correios",
    });
    expect(r.shipments).toHaveLength(1);
    expect(r.shipments[0].codigoRastreio).toBe("BR123456789");
  });

  it("busca por IMEI (fallback de identificação)", () => {
    const c = service.create(baseInput);
    const found = service.findByImei("356938035643809");
    expect(found).toHaveLength(1);
    expect(found[0].id).toBe(c.id);
  });

  it("getById inexistente lança NotFoundError", () => {
    expect(() => service.getById("CC-9999")).toThrow(NotFoundError);
  });
});
