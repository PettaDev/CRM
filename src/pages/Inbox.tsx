import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import StatusBadge from "../components/StatusBadge";
import { IconSend } from "../components/icons";
import {
  maskImei,
  templateFinalizacao,
  templateInicio,
  timeAgo,
  formatTime,
} from "../lib/meta";

export default function Inbox() {
  const { conversations, cases, sendMessage, markRead } = useCrm();
  const [selectedId, setSelectedId] = useState<string>(
    conversations[0] ? conversations[0].id : ""
  );
  const [draft, setDraft] = useState("");

  const ordered = useMemo(
    () => [...conversations].sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
    [conversations]
  );

  const conversa = conversations.find((c) => c.id === selectedId);
  const caso = conversa ? cases.find((c) => c.id === conversa.caseId) : undefined;

  function selecionar(idConv: string) {
    setSelectedId(idConv);
    markRead(idConv);
  }

  function enviar(text: string) {
    const t = text.trim();
    if (!t || !conversa) return;
    sendMessage(conversa.id, t);
    setDraft("");
  }

  return (
    <div className="inbox">
      {/* Lista de conversas */}
      <div className="inbox-list">
        <div className="inbox-list-head">
          <h2>Conversas</h2>
          <span className="chip">{ordered.length}</span>
        </div>
        <div className="inbox-list-scroll">
          {ordered.map((cv) => {
            const initials = cv.cliente
              .split(" ")
              .slice(0, 2)
              .map((p) => p[0])
              .join("");
            const last = cv.messages[cv.messages.length - 1];
            return (
              <button
                key={cv.id}
                className={"conv" + (cv.id === selectedId ? " active" : "")}
                onClick={() => selecionar(cv.id)}
              >
                <div className="avatar">{initials}</div>
                <div className="conv-body">
                  <div className="conv-top">
                    <strong>{cv.cliente}</strong>
                    <span className="muted small">{timeAgo(cv.lastAt)}</span>
                  </div>
                  <div className="conv-bottom">
                    <span className="conv-preview muted">
                      {last ? (last.from === "agente" ? "Você: " : "") + last.text : ""}
                    </span>
                    {cv.unread > 0 && <span className="unread">{cv.unread}</span>}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Thread */}
      {conversa ? (
        <div className="inbox-thread">
          <div className="thread-head">
            <div>
              <strong>{conversa.cliente}</strong>
              <span className="muted small"> · {conversa.telefone}</span>
            </div>
            {caso && (
              <Link to={`/casos/${caso.id}`} className="mono link small">
                {caso.id}
              </Link>
            )}
          </div>

          <div className="thread-scroll">
            {conversa.messages.map((m) => (
              <div
                key={m.id}
                className={"wa-msg " + (m.from === "agente" ? "out" : "in")}
              >
                <div className="wa-bubble">{m.text}</div>
                <span className="wa-time">{formatTime(m.at)}</span>
              </div>
            ))}
          </div>

          <div className="composer">
            <div className="composer-quick">
              {caso && (
                <>
                  <button className="chip-btn" onClick={() => enviar(templateInicio(caso))}>
                    Enviar início
                  </button>
                  <button className="chip-btn" onClick={() => enviar(templateFinalizacao(caso))}>
                    Enviar finalização
                  </button>
                </>
              )}
            </div>
            <form
              className="composer-row"
              onSubmit={(e) => {
                e.preventDefault();
                enviar(draft);
              }}
            >
              <input
                className="input"
                placeholder="Escreva uma mensagem…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn btn-primary" type="submit" disabled={!draft.trim()}>
                <IconSend width={18} height={18} /> Enviar
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="inbox-thread empty">
          <p className="muted">Selecione uma conversa.</p>
        </div>
      )}

      {/* Painel do caso */}
      {caso && (
        <aside className="inbox-side">
          <div className="inbox-side-head">
            <span className="info-card-title">Caso vinculado</span>
            <StatusBadge status={caso.status} />
          </div>
          <dl className="kv">
            <dt>Atendimento</dt>
            <dd className="mono">{caso.id}</dd>
            <dt>Aparelho</dt>
            <dd>
              {caso.marca} {caso.modelo}
            </dd>
            <dt>IMEI</dt>
            <dd className="mono">{maskImei(caso.imei)}</dd>
            <dt>Cidade/UF</dt>
            <dd>
              {caso.cidade}/{caso.estado}
            </dd>
            <dt>Área</dt>
            <dd>
              <span className="chip">{caso.area}</span>
            </dd>
            <dt>Defeito</dt>
            <dd>{caso.defeito}</dd>
          </dl>
          <Link to={`/casos/${caso.id}`} className="btn btn-ghost full">
            Abrir caso completo
          </Link>
        </aside>
      )}
    </div>
  );
}
