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

  it("FSM: permite novo → validado APÓS o Gate 1 (garantia por tempo ok)", () => {
    const c = service.create(baseInput);
    // Gate 1: ativação recente → dentro da garantia por tempo.
    const hoje = new Date().toISOString().slice(0, 10);
    const g = service.setAtivacao(c.id, hoje);
    expect(g.garantiaTempo).toBe("dentro");

    const v = service.changeStatus(c.id, { status: "validado", by: "Bia" });
    expect(v.status).toBe("validado");
    expect(v.validadoEm).not.toBeNull();
  });

  it("Gate 1: bloqueia validar sem informar a ativação (pendente)", () => {
    const c = service.create(baseInput);
    expect(() =>
      service.changeStatus(c.id, { status: "validado", by: "Bia" })
    ).toThrow(ConflictError);
  });

  it("Orçamento: exige valor antes de enviar; recusa vira devolução sem reparo", () => {
    const c = service.create(baseInput);
    // chega até fora_garantia (expirada por tempo)
    service.setAtivacao(c.id, "2020-01-15");
    service.changeStatus(c.id, { status: "fora_garantia", by: "Bia" });

    // sem valor definido → 409
    expect(() =>
      service.changeStatus(c.id, { status: "orcamento_enviado", by: "Bia" })
    ).toThrow(ConflictError);

    service.setOrcamento(c.id, 249.9);
    const o = service.changeStatus(c.id, { status: "orcamento_enviado", by: "Bia" });
    expect(o.status).toBe("orcamento_enviado");
    expect(o.orcamentoValor).toBe(249.9);

    // cliente recusou → devolução sem custo
    const d = service.changeStatus(c.id, { status: "devolucao_sem_reparo", by: "Bia" });
    expect(d.status).toBe("devolucao_sem_reparo");
  });

  it("Controle de qualidade: reparo → QC; reprovado volta ao reparo; aprovado → pronto", () => {
    const c = service.create(baseInput);
    service.setAtivacao(c.id, new Date().toISOString().slice(0, 10));
    service.changeStatus(c.id, { status: "validado", by: "Bia" });
    service.changeStatus(c.id, { status: "triagem", by: "Bia" });
    service.changeStatus(c.id, { status: "em_reparo", by: "Bia" });

    // reparo não vai direto a pronto — passa pelo QC
    expect(() =>
      service.changeStatus(c.id, { status: "pronto", by: "Bia" })
    ).toThrow(ConflictError);

    service.changeStatus(c.id, { status: "controle_qualidade", by: "Bia" });
    // reprovado → volta ao reparo (loop)
    service.changeStatus(c.id, { status: "em_reparo", by: "Bia", note: "QC reprovou" });
    service.changeStatus(c.id, { status: "controle_qualidade", by: "Bia" });
    const p = service.changeStatus(c.id, { status: "pronto", by: "Bia" });
    expect(p.status).toBe("pronto");
  });

  it("Gate 1: garantia por tempo expirada bloqueia o envio (nem precisa enviar)", () => {
    const c = service.create(baseInput);
    const g = service.setAtivacao(c.id, "2020-01-15"); // muito além dos 12 meses
    expect(g.garantiaTempo).toBe("expirada");
    expect(g.garantiaExpiraEm).toBe("2021-01-15");

    expect(() =>
      service.changeStatus(c.id, { status: "validado", by: "Bia" })
    ).toThrow(ConflictError);
    // Caminho correto: direto para fora de garantia, sem coleta.
    const f = service.changeStatus(c.id, { status: "fora_garantia", by: "Bia" });
    expect(f.status).toBe("fora_garantia");
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
