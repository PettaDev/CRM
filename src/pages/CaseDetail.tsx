import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import StatusBadge from "../components/StatusBadge";
import { IconPhone, IconPin } from "../components/icons";
import {
  STATUS_META,
  formatDateTime,
  maskImei,
  statusOptions,
  templateFinalizacao,
  templateInicio,
} from "../lib/meta";
import type { CaseStatus, ShipmentDirection } from "../types";

export default function CaseDetail() {
  const { id } = useParams();
  const { cases, updateCaseStatus, updateGarantia, addShipment } = useCrm();
  const caso = cases.find((c) => c.id === id);

  const [novoStatus, setNovoStatus] = useState<CaseStatus>(() => caso?.status ?? "novo");
  const [nota, setNota] = useState("");
  const [revealImei, setRevealImei] = useState(false);

  // Triagem de garantia (estado local do formulário).
  const [queda, setQueda] = useState(() => caso?.garantiaQueda ?? false);
  const [agua, setAgua] = useState(() => caso?.garantiaAgua ?? false);
  const [aberto, setAberto] = useState(() => caso?.garantiaAberto ?? false);
  const [liga, setLiga] = useState(() => caso?.aparelhoLiga ?? true);

  // Registro de remessa.
  const [shipDir, setShipDir] = useState<ShipmentDirection>("ida");
  const [shipCode, setShipCode] = useState("");

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

  const shipments = caso.shipments ?? [];

  function aplicarStatus() {
    if (!caso) return;
    if (novoStatus === caso.status && !nota.trim()) return;
    updateCaseStatus(caso.id, novoStatus, caso.responsavel, nota.trim() || undefined);
    setNota("");
  }

  function salvarGarantia() {
    if (!caso) return;
    updateGarantia(caso.id, { queda, agua, aberto, aparelhoLiga: liga });
  }

  function registrarEnvio() {
    if (!caso) return;
    addShipment(caso.id, {
      direcao: shipDir,
      codigoRastreio: shipCode.trim() || undefined,
    });
    setShipCode("");
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

          <section className="card">
            <div className="card-head">
              <h2>Defeito relatado</h2>
            </div>
            <p>{caso.defeito}</p>
          </section>

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
                {statusOptions(caso.status).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_META[s].label}
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

          <section className="card">
            <div className="card-head">
              <h2>Logística (Correios)</h2>
            </div>
            {shipments.length === 0 ? (
              <p className="muted small">Nenhuma remessa registrada.</p>
            ) : (
              <ul className="ship-list">
                {shipments.map((s) => (
                  <li key={s.id}>
                    <span className="chip">{s.direcao === "ida" ? "Ida" : "Volta"}</span>
                    <span className="mono">{s.codigoRastreio ?? "sem rastreio"}</span>
                    <span className="muted small">{s.transportadora}</span>
                  </li>
                ))}
              </ul>
            )}
            <div className="status-update">
              <select
                className="input"
                value={shipDir}
                onChange={(e) => setShipDir(e.target.value as ShipmentDirection)}
              >
                <option value="ida">Ida (cliente → unidade)</option>
                <option value="volta">Volta (unidade → cliente)</option>
              </select>
              <input
                className="input"
                placeholder="Código de rastreio (opcional)"
                value={shipCode}
                onChange={(e) => setShipCode(e.target.value)}
              />
              <button className="btn" onClick={registrarEnvio}>
                Registrar envio
              </button>
            </div>
            <p className="muted small">
              Sem o código, o pacote é identificado pelo IMEI ({maskImei(caso.imei)}) vinculado ao número.
            </p>
          </section>

          <section className="card">
            <div className="card-head">
              <h2>Linha do tempo</h2>
            </div>
            <ol className="timeline">
              {[...caso.historico].reverse().map((ev, i) => (
                <li className="timeline-item" key={i}>
                  <span
                    className="timeline-dot"
                    style={{ background: STATUS_META[ev.status].color }}
                  />
                  <div className="timeline-body">
                    <div className="timeline-top">
                      <StatusBadge status={ev.status} />
                      <span className="muted">{formatDateTime(ev.at)}</span>
                    </div>
                    {ev.note && <p className="timeline-note">{ev.note}</p>}
                    <span className="muted">por {ev.by}</span>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <aside className="stack-lg">
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
        </aside>
      </div>
    </div>
  );
}

function InfoCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="info-card">
      <span className="info-card-title">{title}</span>
      {children}
    </div>
  );
}
