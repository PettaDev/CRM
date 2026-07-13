import { getCountry } from "./countries";

// ───────────────────────────────────────────────────────────────────────────
// Gate 1 — garantia por TEMPO (verificada ANTES do envio do aparelho).
// Regra do processo: "se passou a por tempo, nem precisa enviar".
// Fonte hoje: MANUAL (agente informa a data de ativação/compra do IMEI).
// Fonte futura: API interna Transsion (IMEI → data de ativação) — basta criar
// outra implementação de WarrantyProvider, a regra abaixo não muda.
// ───────────────────────────────────────────────────────────────────────────

export type WarrantyTimeStatus = "pendente" | "dentro" | "expirada";

export interface WarrantyInfo {
  status: WarrantyTimeStatus;
  ativadoEm: string | null; // yyyy-mm-dd
  expiraEm: string | null; // yyyy-mm-dd (ativação + prazo do país)
}

// Porta para a fonte automática (API Transsion). A implementação manual não
// tem fonte — devolve null e o agente digita a data.
export interface WarrantyProvider {
  lookup(imei: string): Promise<WarrantyInfo | null>;
}

export class ManualWarrantyProvider implements WarrantyProvider {
  async lookup(): Promise<WarrantyInfo | null> {
    return null; // sem fonte automática — entrada manual pelo agente
  }
}

// Status DERIVADO (nunca persistido): sempre coerente com a data e o prazo
// do país no momento da leitura.
export function computeWarranty(
  ativadoEm: string | null,
  pais: string,
  now: Date = new Date()
): WarrantyInfo {
  if (!ativadoEm) return { status: "pendente", ativadoEm: null, expiraEm: null };

  const months = getCountry(pais)?.warrantyMonths ?? 12;
  const exp = new Date(`${ativadoEm}T00:00:00`);
  exp.setMonth(exp.getMonth() + months);
  const expiraEm = exp.toISOString().slice(0, 10);

  return {
    status: now > exp ? "expirada" : "dentro",
    ativadoEm,
    expiraEm,
  };
}
