import { memo, useState } from "react";
import type { ReactNode } from "react";
import { IconPhone, IconPin } from "../icons";
import { formatDateTime, maskImei } from "../../lib/meta";
import type { ServiceCase } from "../../types";

// Cartões de identificação do caso (somente leitura). O `revealImei` é estado
// local de UI; o pai remonta este componente por `key` ao trocar de caso, então
// o IMEI volta a ficar mascarado em outro atendimento (privacidade/LGPD).
function CaseInfoGrid({ caso }: { caso: ServiceCase }) {
  const [revealImei, setRevealImei] = useState(false);

  return (
    <div className="info-grid">
      <InfoCard title="Cliente">
        <strong>{caso.cliente}</strong>
        <span className="info-line">
          <IconPhone width={16} height={16} /> {caso.telefone}
        </span>
        <span className="chip">{caso.canal}</span>
      </InfoCard>

      <InfoCard title="Aparelho">
        <strong>
          {caso.marca} {caso.modelo}
        </strong>
        <span className="info-line mono">
          IMEI: {revealImei ? caso.imei : maskImei(caso.imei)}
          {caso.imei !== "—" && (
            <button className="link-btn" onClick={() => setRevealImei((v) => !v)}>
              {revealImei ? "ocultar" : "mostrar"}
            </button>
          )}
        </span>
      </InfoCard>

      <InfoCard title="Localização">
        <span className="info-line">
          <IconPin width={16} height={16} /> {caso.cidade}/{caso.estado}
        </span>
        <span className="chip">{caso.area}</span>
      </InfoCard>

      <InfoCard title="Responsável">
        <strong>{caso.responsavel}</strong>
        <span className="muted">
          {caso.validadoEm
            ? `Validado em ${formatDateTime(caso.validadoEm)}`
            : "Aguardando validação"}
        </span>
      </InfoCard>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="info-card">
      <span className="info-card-title">{title}</span>
      {children}
    </div>
  );
}

export default memo(CaseInfoGrid);
