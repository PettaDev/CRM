import { describe, it, expect, beforeEach } from "vitest";
import { ConversationService } from "../src/services/conversation.service";
import { TemplateService } from "../src/services/template.service";
import { ConflictError } from "../src/domain/errors";
import {
  FakeCaseRepository,
  FakeClientRepository,
  FakeConversationRepository,
} from "./fakes";
import type { ServiceCase } from "../src/domain/types";

function makeCase(over: Partial<ServiceCase>): ServiceCase {
  return {
    id: "CC-1",
    cliente: "Felipe Carvalho",
    telefone: "+55 51 98444-3311",
    cidade: "Porto Alegre",
    estado: "RS",
    marca: "Infinix",
    modelo: "Hot 50",
    imei: "350998123456780",
    defeito: "não liga",
    status: "novo",
    area: "Carlcare",
    responsavel: "Beatriz Nunes",
    canal: "WhatsApp",
    garantiaQueda: false,
    garantiaAgua: false,
    garantiaAberto: false,
    foraGarantia: false,
    aparelhoLiga: true,
    validadoEm: null,
    createdAt: "",
    updatedAt: "",
    historico: [],
    shipments: [],
    ...over,
  };
}

describe("ConversationService — gate de validação dos templates", () => {
  let conv: FakeConversationRepository;
  let cli: FakeClientRepository;
  let cas: FakeCaseRepository;
  let svc: ConversationService;

  beforeEach(() => {
    conv = new FakeConversationRepository();
    cli = new FakeClientRepository();
    cas = new FakeCaseRepository();
    svc = new ConversationService(
      conv,
      cli,
      cas,
      new TemplateService(),
      "http://localhost:5173"
    );
    conv.store.set("cv-1", {
      id: "cv-1",
      caseId: "CC-1",
      cliente: "Felipe Carvalho",
      telefone: "+55 51 98444-3311",
      unread: 0,
      lastAt: "",
      messages: [],
    });
  });

  it("BLOQUEIA envio_correios quando o caso não está validado", () => {
    cas.store.set("CC-1", makeCase({ validadoEm: null }));
    expect(() => svc.sendTemplate("cv-1", "envio_correios")).toThrow(ConflictError);
  });

  it("PERMITE envio_correios quando validado e injeta o endereço da unidade", () => {
    cas.store.set(
      "CC-1",
      makeCase({ status: "validado", validadoEm: "2026-01-01T00:00:00Z" })
    );
    const updated = svc.sendTemplate("cv-1", "envio_correios");
    const last = updated.messages.at(-1);
    expect(last?.from).toBe("agente");
    expect(last?.text).toContain("Av. Paulista");
  });

  it("template sem gate (imei_sn_caixa) pode ser enviado direto", () => {
    cas.store.set("CC-1", makeCase({}));
    const updated = svc.sendTemplate("cv-1", "imei_sn_caixa");
    expect(updated.messages.at(-1)?.text).toContain("etiqueta da caixa");
  });
});
