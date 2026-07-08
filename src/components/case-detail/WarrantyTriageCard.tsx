import { memo, useState } from "react";
import { useCrmActions } from "../../context/CrmContext";
import type { ServiceCase } from "../../types";

// Subárvore "action-only". Estado local dos checkboxes inicia a partir do caso e
// é reiniciado via `key` no pai quando o caso muda.
function WarrantyTriageCard({ caso }: { caso: ServiceCase }) {
  const { updateGarantia } = useCrmActions();
  const [queda, setQueda] = useState(caso.garantiaQueda ?? false);
  const [agua, setAgua] = useState(caso.garantiaAgua ?? false);
  const [aberto, setAberto] = useState(caso.garantiaAberto ?? false);
  const [liga, setLiga] = useState(caso.aparelhoLiga ?? true);

  function salvarGarantia() {
    updateGarantia(caso.id, { queda, agua, aberto, aparelhoLiga: liga });
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Triagem de garantia</h2>
        {caso.foraGarantia && (
          <span
            className="badge"
            style={{
              color: "#db2777",
              background: "color-mix(in srgb, #db2777 14%, transparent)",
              borderColor: "color-mix(in srgb, #db2777 32%, transparent)",
            }}
          >
            Fora de garantia
          </span>
        )}
      </div>
      <div className="checklist">
        <label>
          <input type="checkbox" checked={queda} onChange={(e) => setQueda(e.target.checked)} />
          Sofreu queda
        </label>
        <label>
          <input type="checkbox" checked={agua} onChange={(e) => setAgua(e.target.checked)} />
          Entrou água
        </label>
        <label>
          <input type="checkbox" checked={aberto} onChange={(e) => setAberto(e.target.checked)} />
          Previamente aberto em outra assistência
        </label>
        <label>
          <input type="checkbox" checked={liga} onChange={(e) => setLiga(e.target.checked)} />
          O aparelho liga
        </label>
      </div>
      <button className="btn btn-primary" onClick={salvarGarantia}>
        Salvar triagem
      </button>
    </section>
  );
}

export default memo(WarrantyTriageCard);
