import { useMemo } from "react";
import { useCrm } from "../context/CrmContext";
import { AREAS } from "../lib/meta";

// Relatório de defeitos para análise do TFAE / Gestão.
// Calculado sobre os casos atuais (funciona com mock ou com dados da API).
export default function Reports() {
  const { cases } = useCrm();

  const r = useMemo(() => {
    const total = cases.length;
    const isFora = (c: (typeof cases)[number]) =>
      !!(c.foraGarantia || c.garantiaQueda || c.garantiaAgua || c.garantiaAberto);
    const fora = cases.filter(isFora).length;
    const taxa = total ? Math.round((fora / total) * 100) : 0;

    const count = <T,>(arr: T[], key: (t: T) => string) => {
      const m = new Map<string, number>();
      for (const t of arr) m.set(key(t), (m.get(key(t)) ?? 0) + 1);
      return m;
    };

    const porDefeito = [...count(cases, (c) => c.defeito).entries()]
      .map(([defeito, total]) => ({ defeito, total }))
      .sort((a, b) => b.total - a.total);

    const porModelo = [...count(cases, (c) => `${c.marca}|${c.modelo}`).entries()]
      .map(([k, total]) => {
        const [marca, modelo] = k.split("|");
        return { marca, modelo, total };
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const areaCount = count(cases, (c) => c.area);
    const porArea = AREAS.map((area) => ({ area, total: areaCount.get(area) ?? 0 }));

    return { total, fora, taxa, porDefeito, porModelo, porArea };
  }, [cases]);

  const maxDef = Math.max(1, ...r.porDefeito.map((d) => d.total));
  const maxArea = Math.max(1, ...r.porArea.map((a) => a.total));
  const modelosDistintos = r.porModelo.length;

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>Relatório de defeitos</h1>
          <p className="muted">Análise dos atendimentos · TFAE / Gestão</p>
        </div>
      </div>

      <div className="kpi-grid">
        <ReportKpi label="Total de casos" value={r.total} accent="#0079c1" />
        <ReportKpi label="Fora de garantia" value={r.fora} accent="#db2777" />
        <ReportKpi label="Taxa fora de garantia" value={`${r.taxa}%`} accent="#f59e0b" />
        <ReportKpi label="Modelos distintos" value={modelosDistintos} accent="#3ab54a" />
      </div>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Defeitos mais comuns</h2>
            <span className="muted">ocorrências</span>
          </div>
          <div className="bar-list">
            {r.porDefeito.map((d) => (
              <div className="bar-row" key={d.defeito}>
                <div className="bar-row-label">
                  <strong className="cell-clamp">{d.defeito}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(d.total / maxDef) * 100}%` }}
                  />
                </div>
                <div className="bar-row-value">{d.total}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Casos por área</h2>
            <span className="muted">distribuição</span>
          </div>
          <div className="bar-list">
            {r.porArea.map((a) => (
              <div className="bar-row" key={a.area}>
                <div className="bar-row-label">
                  <strong>{a.area}</strong>
                </div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    style={{ width: `${(a.total / maxArea) * 100}%` }}
                  />
                </div>
                <div className="bar-row-value">{a.total}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="card no-pad">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Aparelho que mais falha</th>
                <th>Marca</th>
                <th>Casos</th>
              </tr>
            </thead>
            <tbody>
              {r.porModelo.map((m) => (
                <tr key={`${m.marca}-${m.modelo}`}>
                  <td>{m.modelo}</td>
                  <td>
                    <span className="chip">{m.marca}</span>
                  </td>
                  <td>{m.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ReportKpi({
  label,
  value,
  accent,
}: {
  label: string;
  value: number | string;
  accent: string;
}) {
  return (
    <div className="kpi-card">
      <span className="kpi-accent" style={{ background: accent }} />
      <div className="kpi-body">
        <span className="kpi-label">{label}</span>
        <strong className="kpi-value">{value}</strong>
      </div>
    </div>
  );
}
