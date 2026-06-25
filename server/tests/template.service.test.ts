import { describe, it, expect } from "vitest";
import { TemplateService } from "../src/services/template.service";

describe("TemplateService", () => {
  const svc = new TemplateService();

  it("lista templates e marca requiresValidated no envio_correios", () => {
    const correios = svc.list().find((t) => t.id === "envio_correios");
    expect(correios?.requiresValidated).toBe(true);
  });

  it("render interpola as variáveis e não deixa placeholders", () => {
    const txt = svc.render("imei_sn_caixa", {
      cliente: "Ana",
      marca: "TECNO",
      modelo: "Spark",
    });
    expect(txt).toContain("Ana");
    expect(txt).toContain("TECNO Spark");
    expect(txt).not.toContain("{{");
  });

  it("render de template inexistente lança erro", () => {
    expect(() => svc.render("nao_existe", {})).toThrow();
  });
});
