import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import StatusBadge from "../components/StatusBadge";
import {
  AREAS,
  AREA_DESC,
  STATUS_META,
  STATUS_ORDER,
  formatDate,
  isOpen,
} from "../lib/meta";
import type { Area, CaseStatus } from "../types";

export default function Dashboard() {
  const { cases } = useCrm();

  const stats = useMemo(() => {
    const abertos = cases.filter((c) => isOpen(c.status)).length;
    const aguardando = cases.filter((c) => c.status === "aguardando_peca").length;
    const prontos = cases.filter((c) => c.status === "pronto").length;
    const finalizados = cases.filter((c) => c.status === "finalizado").length;

    const porArea = AREAS.map((a: Area) => ({
      area: a,
      total: cases.filter((c) => c.area === a).length,
      abertos: cases.filter((c) => c.area === a && isOpen(c.status)).length,
    }));

    const porStatus = STATUS_ORDER.map((s: CaseStatus) => ({
      status: s,
      total: cases.filter((c) => c.status === s).length,
    }));

    return { abertos, aguardando, prontos, finalizados, porArea, porStatus };
  }, [cases]);

  const recentes = useMemo(
    () =>
      [...cases]
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
        .slice(0, 6),
    [cases]
  );

  const maxArea = Math.max(1, ...stats.porArea.map((x) => x.total));
  const maxStatus = Math.max(1, ...stats.porStatus.map((x) => x.total));

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>Visão geral</h1>
          <p className="muted">Atendimentos de assistência técnica · Carlcare Brasil</p>
        </div>
        <Link to="/casos" className="btn btn-primary">
          Ver todos os casos
        </Link>
      </div>

      <div className="kpi-grid">
        <KpiCard label="Casos abertos" value={stats.abertos} accent="#0d6efd" hint="Em andamento" />
        <KpiCard label="Aguardando peça" value={stats.aguardando} accent="#f59e0b" hint="Bloqueados por estoque" />
        <KpiCard label="Prontos p/ retirada" value={stats.prontos} accent="#0ea5a4" hint="Avisar o cliente" />
        <KpiCard label="Finalizados" value={stats.finalizados} accent="#16a34a" hint="Concluídos" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Casos por área</h2>
            <span className="muted">total · abertos</span>
          </div>
          <div className="bar-list">
            {stats.porArea.map((row) => (
              <div className="bar-row" key={row.area}>
                <div className="bar-row-label">
                  <strong>{row.area}</strong>
                  <span className="muted">{AREA_DESC[row.area]}</span>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(row.total / maxArea) * 100}%` }}
                  />
                </div>
                <div className="bar-row-value">
                  {row.total}
                  <span className="muted"> · {row.abertos}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Casos por status</h2>
            <span className="muted">distribuição</span>
          </div>
          <div className="bar-list">
            {stats.porStatus.map((row) => (
              <div className="bar-row" key={row.status}>
                <div className="bar-row-label">
                  <StatusBadge status={row.status} />
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{
                      width: `${(row.total / maxStatus) * 100}%`,
                      background: STATUS_META[row.status].color,
                    }}
                  />
                </div>
                <div className="bar-row-value">{row.total}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card">
        <div className="card-head">
          <h2>Atendimentos recentes</h2>
          <Link to="/casos" className="link">Ver tudo</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Atendimento</th>
                <th>Cliente</th>
                <th>Aparelho</th>
                <th>Cidade/UF</th>
                <th>Status</th>
                <th>Atualizado</th>
              </tr>
            </thead>
            <tbody>
              {recentes.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/casos/${c.id}`} className="mono link">{c.id}</Link>
                  </td>
                  <td>{c.cliente}</td>
                  <td>
                    {c.marca} {c.modelo}
                  </td>
                  <td>
                    {c.cidade}/{c.estado}
                  </td>
                  <td><StatusBadge status={c.status} /></td>
                  <td className="muted">{formatDate(c.updatedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
  hint,
}: {
  label: string;
  value: number;
  accent: string;
  hint: string;
}) {
  return (
    <div className="kpi-card">
      <span className="kpi-accent" style={{ background: accent }} />
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
        <span className="kpi-hint muted">{hint}</span>
      </div>
    </div>
  );
}
