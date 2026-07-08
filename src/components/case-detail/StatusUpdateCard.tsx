import { memo, useState } from "react";
import { useCrmActions } from "../../context/CrmContext";
import { useT } from "../../settings/SettingsContext";
import { statusOptions } from "../../lib/meta";
import type { CaseStatus } from "../../types";

// Subárvore "action-only": consome apenas ações (useCrmActions) — não assina o
// contexto de estado. O estado local (novoStatus, nota) é reiniciado via `key`
// no pai quando o caso muda.
function StatusUpdateCard({
  caseId,
  status,
  responsavel,
}: {
  caseId: string;
  status: CaseStatus;
  responsavel: string;
}) {
  const { updateCaseStatus } = useCrmActions();
  const { t } = useT();
  const [novoStatus, setNovoStatus] = useState<CaseStatus>(status);
  const [nota, setNota] = useState("");

  function aplicarStatus() {
    if (novoStatus === status && !nota.trim()) return;
    updateCaseStatus(caseId, novoStatus, responsavel, nota.trim() || undefined);
    setNota("");
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2>Atualizar status</h2>
        <span className="muted small">transições válidas (FSM)</span>
      </div>
      <div className="status-update">
        <select
          className="input"
          value={novoStatus}
          onChange={(e) => setNovoStatus(e.target.value as CaseStatus)}
        >
          {statusOptions(status).map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
        <input
          className="input"
          placeholder="Anotação (opcional)"
          value={nota}
          onChange={(e) => setNota(e.target.value)}
        />
        <button className="btn btn-primary" onClick={aplicarStatus}>
          Aplicar
        </button>
      </div>
    </section>
  );
}

export default memo(StatusUpdateCard);
