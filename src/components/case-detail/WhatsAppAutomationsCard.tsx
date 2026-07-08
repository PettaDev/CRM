import { memo } from "react";
import { Link } from "react-router-dom";
import { templateFinalizacao, templateInicio } from "../../lib/meta";
import type { ServiceCase } from "../../types";

function WhatsAppAutomationsCard({ caso }: { caso: ServiceCase }) {
  return (
    <section className="card">
      <div className="card-head">
        <h2>Automações de WhatsApp</h2>
      </div>
      <p className="muted small">
        Mensagens enviadas automaticamente ao cliente. Prontas para virar
        <em> templates aprovados</em> na Meta Cloud API.
      </p>

      <div className="automation">
        <span className="automation-label">Início do atendimento</span>
        <div className="wa-bubble">{templateInicio(caso)}</div>
      </div>

      <div className="automation">
        <span className="automation-label">Finalização do reparo</span>
        <div className="wa-bubble">{templateFinalizacao(caso)}</div>
      </div>

      <Link to="/inbox" className="btn btn-ghost full">
        Abrir conversa na caixa de entrada
      </Link>
    </section>
  );
}

export default memo(WhatsAppAutomationsCard);
