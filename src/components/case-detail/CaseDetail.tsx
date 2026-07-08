import { Link, useParams } from "react-router-dom";
import { useCrmState } from "../../context/CrmContext";
import StatusBadge from "../StatusBadge";
import { formatDateTime } from "../../lib/meta";
import CaseInfoGrid from "./CaseInfoGrid";
import DefeitoCard from "./DefeitoCard";
import StatusUpdateCard from "./StatusUpdateCard";
import WarrantyTriageCard from "./WarrantyTriageCard";
import ShipmentCard from "./ShipmentCard";
import CaseTimeline from "./CaseTimeline";
import WhatsAppAutomationsCard from "./WhatsAppAutomationsCard";

// Orquestrador: resolve o caso pela rota e compõe os cartões. Não detém estado
// de formulário — cada cartão gerencia o seu. As subárvores com estado recebem
// `key` baseada no id para reiniciar ao trocar de caso (corrige o estado preso
// em navegação A→B sem desmontagem).
export default function CaseDetail() {
  const { id } = useParams();
  const { cases } = useCrmState();
  const caso = cases.find((c) => c.id === id);

  if (!caso) {
    return (
      <div className="empty-state">
        <h1>Caso não encontrado</h1>
        <p className="muted">O atendimento “{id}” não existe ou foi removido.</p>
        <Link to="/casos" className="btn btn-primary">
          Voltar para os casos
        </Link>
      </div>
    );
  }

  return (
    <div className="stack-lg">
      <div className="breadcrumb">
        <Link to="/casos" className="link">Casos</Link>
        <span className="muted"> / </span>
        <span className="mono">{caso.id}</span>
      </div>

      <div className="page-head">
        <div>
          <h1>{caso.cliente}</h1>
          <p className="muted">
            {caso.marca} {caso.modelo} · aberto em {formatDateTime(caso.createdAt)}
          </p>
        </div>
        <StatusBadge status={caso.status} />
      </div>

      <div className="grid-detail">
        <div className="stack-lg">
          <CaseInfoGrid key={`info-${caso.id}`} caso={caso} />
          <DefeitoCard defeito={caso.defeito} />
          <StatusUpdateCard
            key={`status-${caso.id}`}
            caseId={caso.id}
            status={caso.status}
            responsavel={caso.responsavel}
          />
          <WarrantyTriageCard key={`warranty-${caso.id}`} caso={caso} />
          <ShipmentCard key={`ship-${caso.id}`} caso={caso} />
          <CaseTimeline historico={caso.historico} />
        </div>

        <aside className="stack-lg">
          <WhatsAppAutomationsCard caso={caso} />
        </aside>
      </div>
    </div>
  );
}
