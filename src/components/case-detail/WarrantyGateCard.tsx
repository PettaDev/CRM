import { memo, useState } from "react";
import { useCrmActions } from "../../context/CrmContext";
import type { ServiceCase } from "../../types";

// GATE 1 — garantia por TEMPO, verificada ANTES do envio do aparelho.
// O agente informa a data de ativação/compra (fonte manual; futuramente a API
// Transsion preenche pelo IMEI). Regra: expirou por tempo → nem precisa enviar.
function WarrantyGateCard({ caso }: { caso: ServiceCase }) {
  const { setAtivacao } = useCrmActions();
  const [data, setData] = useState(caso.ativadoEm ?? "");

  const status = caso.garantiaTempo ?? "pendente";
  const fmt = (d?: string | null) =>
    d ? d.split("-").reverse().join("/") : "—";

  const badge =
    status === "dentro"
      ? { txt: `Dentro da garantia até ${fmt(caso.garantiaExpiraEm)}`, cor: "#16a34a" }
      : status === "expirada"
        ? { txt: `Expirada em ${fmt(caso.garantiaExpiraEm)} — não enviar`, cor: "#dc2626" }
        : { txt: "Pendente de verificação", cor: "#f59e0b" };

  return (
    <section className="card">
      <div className="card-head">
        <h2>Garantia por tempo (Gate 1)</h2>
        <span
          className="badge"
          style={{
            color: badge.cor,
            background: `color-mix(in srgb, ${badge.cor} 14%, transparent)`,
            borderColor: `color-mix(in srgb, ${badge.cor} 32%, transparent)`,
          }}
        >
          {badge.txt}
        </span>
      </div>

      <p className="muted small">
        Verifique pelo IMEI <span className="mono">{caso.imei || "—"}</span> a data
        de ativação/compra. Expirada por tempo → o cliente é avisado e o aparelho{" "}
        <strong>não é enviado</strong>. A validação do caso só libera dentro do prazo.
      </p>

      <div className="gate-row">
        <label className="field">
          <span>Data de ativação / compra</span>
          <input
            className="input"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
          />
        </label>
        <button
          className="btn btn-primary"
          disabled={!data}
          onClick={() => setAtivacao(caso.id, data)}
        >
          Verificar garantia
        </button>
      </div>
    </section>
  );
}

export default memo(WarrantyGateCard);
