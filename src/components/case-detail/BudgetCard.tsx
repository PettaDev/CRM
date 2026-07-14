import { memo, useState } from "react";
import { useCrmActions } from "../../context/CrmContext";
import type { ServiceCase } from "../../types";

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

// Orçamento do reparo pago — aparece quando o caso está fora de garantia.
// Fluxo: define o valor → envia o template "Orçamento" na inbox → o cliente
// aprova (status → Em reparo) ou recusa (status → Devolução sem reparo).
function BudgetCard({ caso }: { caso: ServiceCase }) {
  const { setOrcamento } = useCrmActions();
  const [valor, setValor] = useState(
    caso.orcamentoValor != null ? String(caso.orcamentoValor) : ""
  );

  const relevante =
    caso.foraGarantia ||
    caso.garantiaTempo === "expirada" ||
    caso.status === "fora_garantia" ||
    caso.status === "orcamento_enviado" ||
    caso.status === "devolucao_sem_reparo";
  if (!relevante) return null;

  const num = Number(valor.replace(",", "."));
  const valido = Number.isFinite(num) && num > 0;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Orçamento (reparo pago)</h2>
        {caso.orcamentoValor != null && (
          <span className="chip">{BRL.format(caso.orcamentoValor)}</span>
        )}
      </div>
      <p className="muted small">
        Fora de garantia: defina o valor, envie o template <strong>“Orçamento”</strong>{" "}
        pela caixa de entrada e registre a resposta no status — aprovou →{" "}
        <strong>Em reparo</strong>; recusou → <strong>Devolução sem reparo</strong>{" "}
        (sem custo ao cliente).
      </p>
      <div className="gate-row">
        <label className="field">
          <span>Valor do reparo (R$)</span>
          <input
            className="input"
            inputMode="decimal"
            placeholder="Ex.: 249,90"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
        </label>
        <button
          className="btn btn-primary"
          disabled={!valido}
          onClick={() => setOrcamento(caso.id, Math.round(num * 100) / 100)}
        >
          Salvar orçamento
        </button>
      </div>
    </section>
  );
}

export default memo(BudgetCard);
