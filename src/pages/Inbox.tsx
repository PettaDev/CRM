import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import StatusBadge from "../components/StatusBadge";
import { IconSend } from "../components/icons";
import {
  FORM_STATUS_META,
  maskImei,
  phoneKey,
  templateFinalizacao,
  templateInicio,
  timeAgo,
  formatDateTime,
  formatTime,
} from "../lib/meta";
import type { Client, FormStatus } from "../types";

export default function Inbox() {
  const { conversations, cases, clients, sendMessage, markRead, sendForm } = useCrm();
  const [selectedId, setSelectedId] = useState<string>(
    conversations[0] ? conversations[0].id : ""
  );
  const [draft, setDraft] = useState("");
  const [sideTab, setSideTab] = useState<"caso" | "cliente">("caso");

  const ordered = useMemo(
    () => [...conversations].sort((a, b) => b.lastAt.localeCompare(a.lastAt)),
    [conversations]
  );

  const conversa = conversations.find((c) => c.id === selectedId);
  const caso = conversa ? cases.find((c) => c.id === conversa.caseId) : undefined;
  const client = conversa
    ? clients.find((c) => c.telefoneKey === phoneKey(conversa.telefone))
    : undefined;

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
              <button className="chip-btn" onClick={() => sendForm(conversa.id)}>
                Enviar formulário
              </button>
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

      {/* Painel lateral: Caso | Cliente */}
      {conversa && (
        <aside className="inbox-side">
          <div className="seg side-seg">
            <button
              className={"seg-btn" + (sideTab === "caso" ? " active" : "")}
              onClick={() => setSideTab("caso")}
            >
              Caso
            </button>
            <button
              className={"seg-btn" + (sideTab === "cliente" ? " active" : "")}
              onClick={() => setSideTab("cliente")}
            >
              Cliente
            </button>
          </div>

          {sideTab === "caso" ? (
            caso ? (
              <>
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
              </>
            ) : (
              <p className="muted small">Nenhum caso vinculado a esta conversa.</p>
            )
          ) : (
            <ClientPanel client={client} onSend={() => sendForm(conversa.id)} />
          )}
        </aside>
      )}
    </div>
  );
}

function FormStatusBadge({ status }: { status: FormStatus }) {
  const meta = FORM_STATUS_META[status];
  return (
    <span
      className="badge"
      style={{
        color: meta.color,
        background: `color-mix(in srgb, ${meta.color} 14%, transparent)`,
        borderColor: `color-mix(in srgb, ${meta.color} 32%, transparent)`,
      }}
    >
      <span className="badge-dot" style={{ background: meta.color }} />
      {meta.label}
    </span>
  );
}

// Painel "Detalhes do cliente" — mostra os dados do formulário que o cliente
// preencheu, ou as ações de envio quando ainda não preenchido.
function ClientPanel({
  client,
  onSend,
}: {
  client: Client | undefined;
  onSend: () => void;
}) {
  const status: FormStatus = client?.formStatus ?? "nao_enviado";
  const form = client?.form;

  return (
    <>
      <div className="inbox-side-head">
        <span className="info-card-title">Detalhes do cliente</span>
        <FormStatusBadge status={status} />
      </div>

      {status === "preenchido" && form ? (
        <>
          <dl className="kv">
            <dt>Nome</dt>
            <dd>{form.nomeCompleto}</dd>
            <dt>CPF</dt>
            <dd className="mono">{form.cpf || "—"}</dd>
            <dt>Nascimento</dt>
            <dd>
              {form.nascimento ? form.nascimento.split("-").reverse().join("/") : "—"}
            </dd>
            <dt>E-mail</dt>
            <dd>{form.email || "—"}</dd>
            <dt>WhatsApp</dt>
            <dd className="mono">{client?.telefone}</dd>
            <dt>Endereço</dt>
            <dd>
              {form.rua}
              {form.numero ? `, ${form.numero}` : ""}
              {form.bairro ? ` — ${form.bairro}` : ""}
              <br />
              {form.cidade}/{form.estado}
              {form.cep ? ` · CEP ${form.cep}` : ""}
            </dd>
            <dt>Aparelho</dt>
            <dd>
              {form.marca} {form.modelo}
            </dd>
            <dt>IMEI 1</dt>
            <dd className="mono">{form.imei1 || "—"}</dd>
            <dt>IMEI 2</dt>
            <dd className="mono">{form.imei2 || "—"}</dd>
            <dt>SN</dt>
            <dd className="mono">{form.sn || "—"}</dd>
            <dt>Nota fiscal</dt>
            <dd className="mono">{form.notaFiscal || "—"}</dd>
          </dl>
          {client?.preenchidoAt && (
            <p className="muted small">
              Preenchido em {formatDateTime(client.preenchidoAt)}
            </p>
          )}
        </>
      ) : status === "enviado" ? (
        <>
          <p className="muted small">
            Formulário enviado
            {client?.enviadoAt ? ` em ${formatDateTime(client.enviadoAt)}` : ""}.
            Aguardando o cliente preencher.
          </p>
          <Link to={`/form/${client?.telefoneKey}`} className="btn btn-ghost full">
            Abrir formulário (simular cliente)
          </Link>
          <button className="btn full" onClick={onSend}>
            Reenviar formulário
          </button>
        </>
      ) : (
        <>
          <p className="muted small">
            O cadastro ainda não foi enviado para este cliente.
          </p>
          <button className="btn btn-primary full" onClick={onSend}>
            Enviar formulário
          </button>
        </>
      )}
    </>
  );
}
