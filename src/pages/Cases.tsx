import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCrmActions, useCrmState } from "../context/CrmContext";
import type { NewCaseInput } from "../context/CrmContext";
import { useT } from "../settings/SettingsContext";
import StatusBadge from "../components/StatusBadge";
import { IconPlus } from "../components/icons";
import { AGENTS } from "../data/mock";
import {
  AREAS,
  BRANDS,
  STATUS_META,
  STATUS_ORDER,
  formatDate,
  maskImei,
} from "../lib/meta";
import type { Area, CaseStatus } from "../types";

type View = "tabela" | "kanban";

export default function Cases() {
  const { cases } = useCrmState();
  const { t } = useT();
  const [view, setView] = useState<View>("tabela");
  const [status, setStatus] = useState<CaseStatus | "todos">("todos");
  const [area, setArea] = useState<Area | "todas">("todas");
  const [query, setQuery] = useState("");
  const [showNew, setShowNew] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return cases.filter((c) => {
      if (status !== "todos" && c.status !== status) return false;
      if (area !== "todas" && c.area !== area) return false;
      if (!q) return true;
      return (
        c.cliente.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.imei.includes(q) ||
        `${c.marca} ${c.modelo}`.toLowerCase().includes(q)
      );
    });
  }, [cases, status, area, query]);

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>{t("cases.title")}</h1>
          <p className="muted">
            {filtered.length} / {cases.length} {t("common.cases")}
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>
          <IconPlus width={18} height={18} /> {t("common.newCase")}
        </button>
      </div>

      <div className="toolbar">
        <div className="seg">
          <button
            className={"seg-btn" + (view === "tabela" ? " active" : "")}
            onClick={() => setView("tabela")}
          >
            {t("cases.table")}
          </button>
          <button
            className={"seg-btn" + (view === "kanban" ? " active" : "")}
            onClick={() => setView("kanban")}
          >
            {t("cases.kanban")}
          </button>
        </div>

        <input
          className="input"
          placeholder={t("cases.search")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />

        <select
          className="input"
          value={status}
          onChange={(e) => setStatus(e.target.value as CaseStatus | "todos")}
        >
          <option value="todos">{t("cases.allStatuses")}</option>
          {STATUS_ORDER.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>

        <select
          className="input"
          value={area}
          onChange={(e) => setArea(e.target.value as Area | "todas")}
        >
          <option value="todas">{t("cases.allAreas")}</option>
          {AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
      </div>

      {view === "tabela" ? (
        <section className="card no-pad">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>{t("th.case")}</th>
                  <th>{t("th.client")}</th>
                  <th>{t("th.device")}</th>
                  <th>{t("th.imei")}</th>
                  <th>{t("th.cityState")}</th>
                  <th>{t("th.defect")}</th>
                  <th>{t("th.area")}</th>
                  <th>{t("th.status")}</th>
                  <th>{t("th.updated")}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/casos/${c.id}`} className="mono link">
                        {c.id}
                      </Link>
                    </td>
                    <td>{c.cliente}</td>
                    <td>
                      {c.marca} {c.modelo}
                    </td>
                    <td className="mono muted">{maskImei(c.imei)}</td>
                    <td>
                      {c.cidade}/{c.estado}
                    </td>
                    <td className="cell-clamp">{c.defeito}</td>
                    <td>
                      <span className="chip">{c.area}</span>
                    </td>
                    <td>
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="muted">{formatDate(c.updatedAt)}</td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty">
                      {t("cases.empty")}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <div className="kanban">
          {STATUS_ORDER.map((s) => {
            const col = filtered.filter((c) => c.status === s);
            return (
              <div className="kanban-col" key={s}>
                <div className="kanban-col-head">
                  <span
                    className="kanban-dot"
                    style={{ background: STATUS_META[s].color }}
                  />
                  <strong>{t(`status.${s}`)}</strong>
                  <span className="kanban-count">{col.length}</span>
                </div>
                <div className="kanban-cards">
                  {col.map((c) => (
                    <Link to={`/casos/${c.id}`} className="kanban-card" key={c.id}>
                      <span className="mono muted">{c.id}</span>
                      <strong>{c.cliente}</strong>
                      <span className="kanban-card-device">
                        {c.marca} {c.modelo}
                      </span>
                      <span className="cell-clamp muted">{c.defeito}</span>
                      <span className="chip">{c.area}</span>
                    </Link>
                  ))}
                  {col.length === 0 && (
                    <p className="kanban-empty muted">—</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showNew && <NewCaseModal onClose={() => setShowNew(false)} />}
    </div>
  );
}

const EMPTY: NewCaseInput = {
  cliente: "",
  telefone: "",
  cidade: "",
  estado: "",
  marca: "TECNO",
  modelo: "",
  imei: "",
  defeito: "",
  area: "Carlcare",
  responsavel: AGENTS[0].nome,
};

function NewCaseModal({ onClose }: { onClose: () => void }) {
  const { addCase } = useCrmActions();
  const navigate = useNavigate();
  const [form, setForm] = useState<NewCaseInput>(EMPTY);

  const set = <K extends keyof NewCaseInput>(key: K, value: NewCaseInput[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const canSave =
    form.cliente.trim() && form.telefone.trim() && form.modelo.trim() && form.defeito.trim();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave) return;
    const id = addCase(form);
    navigate(`/casos/${id}`);
  }

  // Sugere responsável padrão da área escolhida.
  const agentesDaArea = AGENTS.filter((a) => a.area === form.area);
  const opcoesResponsavel = agentesDaArea.length ? agentesDaArea : AGENTS;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Novo caso</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>

        <form className="form-grid" onSubmit={handleSubmit}>
          <label className="field span-2">
            <span>Cliente *</span>
            <input
              className="input"
              value={form.cliente}
              onChange={(e) => set("cliente", e.target.value)}
              placeholder="Nome completo"
            />
          </label>

          <label className="field">
            <span>Telefone (WhatsApp) *</span>
            <input
              className="input"
              value={form.telefone}
              onChange={(e) => set("telefone", e.target.value)}
              placeholder="+55 11 90000-0000"
            />
          </label>

          <label className="field">
            <span>Marca</span>
            <select
              className="input"
              value={form.marca}
              onChange={(e) => set("marca", e.target.value as NewCaseInput["marca"])}
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Modelo *</span>
            <input
              className="input"
              value={form.modelo}
              onChange={(e) => set("modelo", e.target.value)}
              placeholder="Ex.: Spark 20 Pro"
            />
          </label>

          <label className="field">
            <span>IMEI</span>
            <input
              className="input"
              value={form.imei}
              onChange={(e) => set("imei", e.target.value)}
              placeholder="15 dígitos"
            />
          </label>

          <label className="field">
            <span>Cidade</span>
            <input
              className="input"
              value={form.cidade}
              onChange={(e) => set("cidade", e.target.value)}
            />
          </label>

          <label className="field">
            <span>Estado (UF)</span>
            <input
              className="input"
              value={form.estado}
              maxLength={2}
              onChange={(e) => set("estado", e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </label>

          <label className="field">
            <span>Área responsável</span>
            <select
              className="input"
              value={form.area}
              onChange={(e) => {
                const a = e.target.value as Area;
                const dono = AGENTS.find((ag) => ag.area === a);
                setForm((f) => ({ ...f, area: a, responsavel: dono ? dono.nome : f.responsavel }));
              }}
            >
              {AREAS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Responsável</span>
            <select
              className="input"
              value={form.responsavel}
              onChange={(e) => set("responsavel", e.target.value)}
            >
              {opcoesResponsavel.map((a) => (
                <option key={a.id} value={a.nome}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>

          <label className="field span-2">
            <span>Defeito relatado *</span>
            <textarea
              className="input"
              rows={3}
              value={form.defeito}
              onChange={(e) => set("defeito", e.target.value)}
              placeholder="Descreva o problema informado pelo cliente"
            />
          </label>

          <div className="modal-actions span-2">
            <button type="button" className="btn" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={!canSave}>
              Criar caso
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
