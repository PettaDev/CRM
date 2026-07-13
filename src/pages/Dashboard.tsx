import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import { useAuth } from "../auth/AuthContext";
import { isGestor } from "../auth/roles";
import { useT } from "../settings/SettingsContext";
import { exportWeeklyReport } from "../lib/weeklyReport";
import { countryName } from "../lib/countries";
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
  const { cases: allCases } = useCrm();
  const { user } = useAuth();
  const { t } = useT();
  const [exporting, setExporting] = useState(false);
  const [pais, setPais] = useState("");

  // Filtro por país: problema recebido no WhatsApp ou criado por uma conta de
  // um país fica vinculado a ele. "" = todos.
  const paisesExistentes = useMemo(
    () => [...new Set(allCases.map((c) => c.pais ?? "BR"))].sort(),
    [allCases]
  );
  const cases = useMemo(
    () => (pais ? allCases.filter((c) => (c.pais ?? "BR") === pais) : allCases),
    [allCases, pais]
  );

  async function handleExport() {
    setExporting(true);
    try {
      await exportWeeklyReport(cases);
    } finally {
      setExporting(false);
    }
  }

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
          <h1>{t("dash.title")}</h1>
          <p className="muted">{t("dash.subtitle")}</p>
        </div>
        <div className="page-head-actions">
          <select
            className="input pais-filter"
            value={pais}
            onChange={(e) => setPais(e.target.value)}
            aria-label={t("dash.country")}
          >
            <option value="">{t("dash.allCountries")}</option>
            {paisesExistentes.map((p) => (
              <option key={p} value={p}>
                {countryName(p)}
              </option>
            ))}
          </select>
          {isGestor(user) && (
            <button className="btn" onClick={handleExport} disabled={exporting}>
              {exporting ? "…" : t("dash.export")}
            </button>
          )}
          <Link to="/casos" className="btn btn-primary">
            {t("common.viewAllCases")}
          </Link>
        </div>
      </div>

      <div className="kpi-grid">
        <KpiCard label={t("dash.open")} value={stats.abertos} accent="#0079c1" hint={t("dash.openHint")} />
        <KpiCard label={t("dash.awaitingParts")} value={stats.aguardando} accent="#f59e0b" hint={t("dash.awaitingPartsHint")} />
        <KpiCard label={t("dash.ready")} value={stats.prontos} accent="#0ea5a4" hint={t("dash.readyHint")} />
        <KpiCard label={t("dash.finished")} value={stats.finalizados} accent="#16a34a" hint={t("dash.finishedHint")} />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>{t("dash.byArea")}</h2>
            <span className="muted">{t("dash.totalOpen")}</span>
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
            <h2>{t("dash.byStatus")}</h2>
            <span className="muted">{t("dash.distribution")}</span>
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
          <h2>{t("dash.recent")}</h2>
          <Link to="/casos" className="link">{t("common.seeAll")}</Link>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>{t("th.case")}</th>
                <th>{t("th.client")}</th>
                <th>{t("th.device")}</th>
                <th>{t("th.cityState")}</th>
                <th>{t("th.status")}</th>
                <th>{t("th.updated")}</th>
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
