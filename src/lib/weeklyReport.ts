import type { ServiceCase } from "../types";

// Relatório semanal em Excel (.xlsx) para análise do TFAE/Gestão:
// TOP problemas reportados + TOP celulares defeituosos dos últimos 7 dias.
// A lib (SheetJS) é importada sob demanda para não pesar o bundle inicial.

interface RankRow {
  posicao: number;
  item: string;
  ocorrencias: number;
  percentual: string;
}

function rank(values: string[], topN = 15): RankRow[] {
  const counts = new Map<string, { label: string; n: number }>();
  for (const v of values) {
    const label = v.trim().replace(/\s+/g, " ");
    if (!label) continue;
    const key = label.toLowerCase();
    const cur = counts.get(key);
    if (cur) cur.n += 1;
    else counts.set(key, { label, n: 1 });
  }
  const total = values.filter((v) => v.trim()).length || 1;
  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, topN)
    .map((c, i) => ({
      posicao: i + 1,
      item: c.label,
      ocorrencias: c.n,
      percentual: `${((c.n / total) * 100).toFixed(1)}%`,
    }));
}

export async function exportWeeklyReport(cases: ServiceCase[]): Promise<void> {
  const XLSX = await import("xlsx");

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
  const semana = cases.filter((c) => new Date(c.createdAt) >= weekAgo);

  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  // ── Aba 1: Resumo ──
  const resumo = [
    ["Relatório semanal — Carlcare CRM"],
    ["Período", `${fmt(weekAgo)} a ${fmt(now)}`],
    ["Gerado em", now.toLocaleString("pt-BR")],
    [],
    ["Casos abertos na semana", semana.length],
    ["Fora de garantia (mau uso)", semana.filter((c) => c.foraGarantia).length],
    ["Finalizados na semana", semana.filter((c) => c.status === "finalizado").length],
    ["Cancelados na semana", semana.filter((c) => c.status === "cancelado").length],
  ];

  // ── Aba 2: TOP problemas ──
  const topProblemas = rank(semana.map((c) => c.defeito));

  // ── Aba 3: TOP celulares defeituosos (marca + modelo) ──
  const topModelos = rank(semana.map((c) => `${c.marca} ${c.modelo}`));

  // ── Aba 4: casos da semana (dados brutos p/ conferência) ──
  const casos = semana.map((c) => ({
    Caso: c.id,
    Cliente: c.cliente,
    Telefone: c.telefone,
    Marca: c.marca,
    Modelo: c.modelo,
    IMEI: c.imei,
    Defeito: c.defeito,
    Status: c.status,
    "Fora de garantia": c.foraGarantia ? "SIM" : "não",
    "Cidade/UF": `${c.cidade}/${c.estado}`,
    País: c.pais ?? "BR",
    Lote: c.loteId ?? "",
    Abertura: fmt(new Date(c.createdAt)),
  }));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumo), "Resumo");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      topProblemas.map((r) => ({
        "#": r.posicao,
        Problema: r.item,
        Ocorrências: r.ocorrencias,
        "% da semana": r.percentual,
      }))
    ),
    "TOP problemas"
  );
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(
      topModelos.map((r) => ({
        "#": r.posicao,
        Aparelho: r.item,
        Ocorrências: r.ocorrencias,
        "% da semana": r.percentual,
      }))
    ),
    "TOP celulares"
  );
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(casos), "Casos da semana");

  XLSX.writeFile(wb, `relatorio-semanal-carlcare-${fmt(now)}.xlsx`);
}
