import { useEffect, useMemo, useState } from "react";
import { useT } from "../settings/SettingsContext";
import { sheetsApi, type SheetRow } from "../api/sheets.api";

// Página "Planilhas" — réplica editável do Excel da unidade.
// Abas: Trocas Total · Banco de aparelhos lacrados · Modelos (Infinix/TECNO/itel).
// Cada célula é um input; a edição salva no banco ao sair do campo (blur).

interface ColumnDef {
  key: string;
  label: string;
  width?: string;
  options?: string[]; // vira um <select> (ex.: STATUS do estoque)
}

interface TabDef {
  id: string; // id da aba na UI
  sheet: string; // planilha na API
  label: string;
  columns: ColumnDef[];
  /** filtro fixo aplicado às linhas (ex.: marca = TECNO) */
  where?: Record<string, string>;
  /** valores pré-preenchidos ao adicionar linha nesta aba */
  defaults?: Record<string, string>;
}

const STATUS_OPTIONS = ["DISPONIVEL", "TROCA", "DESMONTADO"];

const TABS: TabDef[] = [
  {
    id: "trocas",
    sheet: "trocas",
    label: "📊 Trocas Total",
    columns: [
      { key: "nome", label: "Nome", width: "16%" },
      { key: "envio", label: "Envio / Retirada caixa", width: "22%" },
      { key: "modelo", label: "Modelo", width: "14%" },
      { key: "imei", label: "IMEI", width: "13%" },
      { key: "modeloNovo", label: "Modelo (novo)", width: "14%" },
      { key: "imeiNovo", label: "IMEI (novo)", width: "13%" },
      { key: "gjs", label: "GJS" },
    ],
  },
  {
    id: "estoque",
    sheet: "estoque",
    label: "📦 Banco de lacrados",
    columns: [
      { key: "modelo", label: "Modelo", width: "28%" },
      { key: "imei", label: "IMEI", width: "22%" },
      { key: "nEstoque", label: "Nº estoque", width: "12%" },
      { key: "status", label: "Status", width: "16%", options: STATUS_OPTIONS },
      { key: "obs", label: "Obs" },
    ],
  },
  {
    id: "infinix",
    sheet: "modelos",
    label: "📱 Infinix",
    where: { marca: "Infinix" },
    defaults: { marca: "Infinix" },
    columns: [
      { key: "codigo", label: "Código", width: "22%" },
      { key: "modelo", label: "Modelo", width: "50%" },
      { key: "geracao", label: "Geração" },
    ],
  },
  {
    id: "tecno",
    sheet: "modelos",
    label: "📱 TECNO",
    where: { marca: "TECNO" },
    defaults: { marca: "TECNO" },
    columns: [
      { key: "codigo", label: "Código", width: "22%" },
      { key: "modelo", label: "Modelo", width: "50%" },
      { key: "geracao", label: "Geração" },
    ],
  },
  {
    id: "itel",
    sheet: "modelos",
    label: "📱 itel",
    where: { marca: "itel" },
    defaults: { marca: "itel" },
    columns: [
      { key: "codigo", label: "Código", width: "22%" },
      { key: "modelo", label: "Modelo", width: "50%" },
      { key: "geracao", label: "Geração" },
    ],
  },
];

export default function Sheets() {
  const { t } = useT();
  const [tabId, setTabId] = useState(TABS[0].id);
  const [rows, setRows] = useState<SheetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [savingId, setSavingId] = useState<number | null>(null);

  const tab = TABS.find((x) => x.id === tabId) ?? TABS[0];

  // Carrega a planilha da aba ativa (abas de modelos compartilham a mesma).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    sheetsApi
      .list(tab.sheet)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tab.sheet]);

  const visible = useMemo(() => {
    let list = rows;
    if (tab.where) {
      list = list.filter((r) =>
        Object.entries(tab.where!).every(([k, v]) => r[k] === v)
      );
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((r) =>
        tab.columns.some((c) => (r[c.key] ?? "").toLowerCase().includes(q))
      );
    }
    return list;
  }, [rows, tab, search]);

  // Painel do estoque: contagem por modelo × status (como no Excel original).
  const painel = useMemo(() => {
    if (tab.id !== "estoque") return null;
    const by = new Map<string, { disp: number; troca: number; desm: number }>();
    for (const r of visible) {
      const m = (r.modelo || "—").toUpperCase();
      const e = by.get(m) ?? { disp: 0, troca: 0, desm: 0 };
      if (r.status === "TROCA") e.troca += 1;
      else if (r.status === "DESMONTADO") e.desm += 1;
      else e.disp += 1;
      by.set(m, e);
    }
    const linhas = [...by.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    const tot = { disp: 0, troca: 0, desm: 0 };
    for (const [, e] of linhas) {
      tot.disp += e.disp;
      tot.troca += e.troca;
      tot.desm += e.desm;
    }
    return { linhas, tot };
  }, [tab.id, visible]);

  function setCell(id: number, key: string, value: string) {
    setRows((list) => list.map((r) => (r.id === id ? { ...r, [key]: value } : r)));
  }

  // Salva a célula ao sair do campo (padrão Excel: edita → confirma).
  async function saveCell(id: number, key: string, value: string) {
    setSavingId(id);
    try {
      await sheetsApi.update(tab.sheet, id, { [key]: value });
    } catch {
      // recarrega a linha do servidor num erro (ex.: status inválido)
      const data = await sheetsApi.list(tab.sheet).catch(() => null);
      if (data) setRows(data);
    } finally {
      setSavingId(null);
    }
  }

  async function addRow() {
    const created = await sheetsApi
      .create(tab.sheet, tab.defaults ?? {})
      .catch(() => null);
    if (created) setRows((list) => [...list, created]);
  }

  async function removeRow(id: number) {
    setRows((list) => list.filter((r) => r.id !== id));
    await sheetsApi.remove(tab.sheet, id).catch(() => {});
  }

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>{t("nav.sheets")}</h1>
          <p className="muted">{t("sheets.subtitle")}</p>
        </div>
        <button className="btn btn-primary" onClick={addRow}>
          + {t("sheets.addRow")}
        </button>
      </div>

      <div className="sheet-tabs">
        {TABS.map((x) => (
          <button
            key={x.id}
            className={"sheet-tab" + (x.id === tabId ? " active" : "")}
            onClick={() => setTabId(x.id)}
          >
            {x.label}
          </button>
        ))}
      </div>

      {painel && (
        <section className="card sheet-panel">
          <div className="card-head">
            <h2>{t("sheets.panel")}</h2>
            <span className="muted">
              {t("sheets.available")}: <strong>{painel.tot.disp}</strong> ·{" "}
              {t("sheets.swap")}: <strong>{painel.tot.troca}</strong> ·{" "}
              {t("sheets.dismantled")}: <strong>{painel.tot.desm}</strong>
            </span>
          </div>
          <div className="sheet-panel-chips">
            {painel.linhas.map(([modelo, e]) => (
              <span key={modelo} className="chip sheet-chip">
                {modelo}: <strong>{e.disp}</strong>
                <span className="muted"> / {e.troca} / {e.desm}</span>
              </span>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <div className="card-head">
          <h2>
            {tab.label} <span className="muted">({visible.length})</span>
          </h2>
          <input
            className="input sheet-search"
            placeholder={t("sheets.search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="muted">…</p>
        ) : (
          <div className="table-wrap sheet-wrap">
            <table className="table sheet-table">
              <thead>
                <tr>
                  <th className="sheet-rownum">#</th>
                  {tab.columns.map((c) => (
                    <th key={c.key} style={c.width ? { width: c.width } : undefined}>
                      {c.label}
                    </th>
                  ))}
                  <th className="sheet-rownum" />
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => (
                  <tr key={r.id} className={savingId === r.id ? "sheet-saving" : ""}>
                    <td className="sheet-rownum muted">{i + 1}</td>
                    {tab.columns.map((c) => (
                      <td key={c.key} className="sheet-cell">
                        {c.options ? (
                          <select
                            className="sheet-input"
                            value={r[c.key] ?? ""}
                            onChange={(e) => {
                              setCell(r.id, c.key, e.target.value);
                              void saveCell(r.id, c.key, e.target.value);
                            }}
                          >
                            {c.options.map((o) => (
                              <option key={o} value={o}>
                                {o}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            className="sheet-input"
                            value={r[c.key] ?? ""}
                            onChange={(e) => setCell(r.id, c.key, e.target.value)}
                            onBlur={(e) => void saveCell(r.id, c.key, e.target.value)}
                          />
                        )}
                      </td>
                    ))}
                    <td className="sheet-rownum">
                      <button
                        className="sheet-del"
                        title={t("sheets.deleteRow")}
                        onClick={() => void removeRow(r.id)}
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
