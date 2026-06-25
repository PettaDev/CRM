import { useState } from "react";
import { useParams } from "react-router-dom";
import { useCrm } from "../context/CrmContext";
import Logo from "../components/Logo";
import { BRANDS, phoneKey } from "../lib/meta";
import type { ClientForm as ClientFormData, DeviceBrand } from "../types";

const EMPTY: ClientFormData = {
  nomeCompleto: "",
  cpf: "",
  nascimento: "",
  email: "",
  cep: "",
  rua: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  marca: "TECNO",
  modelo: "",
  imei1: "",
  imei2: "",
  sn: "",
  notaFiscal: "",
  consentimentoLgpd: false,
};

// Página pública que o cliente abre pelo link recebido no WhatsApp.
// O telefone vem da plataforma (token = telefoneKey) e fica travado — a
// associação não depende do que o cliente digita.
export default function ClientForm() {
  const { token } = useParams();
  const { clients, cases, submitForm } = useCrm();
  const client = clients.find((c) => c.telefoneKey === token);
  // Caso vinculado pelo telefone — define o default da instrução de IMEI/SN.
  const casoVinc = cases.find((c) => phoneKey(c.telefone) === token);
  const defeitoNaoLiga = /n[ãa]o\s+liga/i.test(casoVinc?.defeito ?? "");
  const [form, setForm] = useState<ClientFormData>(client?.form ?? EMPTY);
  const [aparelhoLiga, setAparelhoLiga] = useState(() => !defeitoNaoLiga);
  const [sent, setSent] = useState(false);

  const set = <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  if (!token || !client) {
    return (
      <div className="form-page">
        <div className="form-page-card">
          <Logo />
          <h1>Link inválido</h1>
          <p className="muted">
            Este link de cadastro não é válido ou expirou. Fale com a Carlcare pelo
            WhatsApp.
          </p>
        </div>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="form-page">
        <div className="form-page-card form-success">
          <div className="form-success-check">✓</div>
          <h1>Cadastro enviado!</h1>
          <p className="muted">
            Obrigado, {form.nomeCompleto.split(" ")[0] || "cliente"}. Recebemos seus
            dados e já associamos ao seu atendimento. Pode voltar para a conversa no
            WhatsApp. 🔒
          </p>
        </div>
      </div>
    );
  }

  const canSave =
    form.nomeCompleto.trim() && form.imei1.trim() && form.consentimentoLgpd;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSave || !token) return;
    submitForm(token, form);
    setSent(true);
  }

  return (
    <div className="form-page">
      <form className="form-page-card" onSubmit={handleSubmit}>
        <div className="form-page-head">
          <Logo />
          <span className="chip">Cadastro de atendimento</span>
        </div>
        <p className="muted">
          Preencha seus dados para agilizar o atendimento — leva 2 minutos. 🔒 Seus
          dados são tratados conforme a LGPD.
        </p>

        <label className="field">
          <span>WhatsApp (não editável)</span>
          <input className="input locked" value={client.telefone} readOnly />
        </label>

        <h2 className="form-section-title">Seus dados</h2>
        <div className="form-grid bare">
          <label className="field span-2">
            <span>Nome completo *</span>
            <input
              className="input"
              value={form.nomeCompleto}
              onChange={(e) => set("nomeCompleto", e.target.value)}
            />
          </label>
          <label className="field">
            <span>CPF</span>
            <input
              className="input"
              value={form.cpf}
              onChange={(e) => set("cpf", e.target.value)}
              placeholder="000.000.000-00"
            />
          </label>
          <label className="field">
            <span>Data de nascimento</span>
            <input
              className="input"
              type="date"
              value={form.nascimento}
              onChange={(e) => set("nascimento", e.target.value)}
            />
          </label>
          <label className="field span-2">
            <span>E-mail</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
        </div>

        <h2 className="form-section-title">Endereço</h2>
        <div className="form-grid bare">
          <label className="field">
            <span>CEP</span>
            <input
              className="input"
              value={form.cep}
              onChange={(e) => set("cep", e.target.value)}
              placeholder="00000-000"
            />
          </label>
          <label className="field">
            <span>Número</span>
            <input
              className="input"
              value={form.numero}
              onChange={(e) => set("numero", e.target.value)}
            />
          </label>
          <label className="field span-2">
            <span>Rua</span>
            <input
              className="input"
              value={form.rua}
              onChange={(e) => set("rua", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Bairro</span>
            <input
              className="input"
              value={form.bairro}
              onChange={(e) => set("bairro", e.target.value)}
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
            <span>UF</span>
            <input
              className="input"
              value={form.estado}
              maxLength={2}
              onChange={(e) => set("estado", e.target.value.toUpperCase())}
              placeholder="SP"
            />
          </label>
        </div>

        <h2 className="form-section-title">Seu aparelho</h2>

        <div className="liga-toggle">
          <span>O aparelho liga?</span>
          <div className="seg">
            <button
              type="button"
              className={"seg-btn" + (aparelhoLiga ? " active" : "")}
              onClick={() => setAparelhoLiga(true)}
            >
              Sim
            </button>
            <button
              type="button"
              className={"seg-btn" + (!aparelhoLiga ? " active" : "")}
              onClick={() => setAparelhoLiga(false)}
            >
              Não
            </button>
          </div>
        </div>

        <div className="callout">
          {aparelhoLiga ? (
            <>
              <strong>📱 Onde encontrar IMEI 1, IMEI 2 e número de série (SN)?</strong>
              <p>
                Abra o teclado de chamada e digite <code>*#06#</code>. Os códigos
                aparecem na tela — basta copiar abaixo.
              </p>
            </>
          ) : (
            <>
              <strong>📦 Aparelho não liga? Use a caixa.</strong>
              <p>
                Localize o IMEI 1, IMEI 2 e o número de série (SN) na{" "}
                <code>etiqueta da caixa</code> em que o aparelho veio e copie abaixo.
              </p>
            </>
          )}
        </div>
        <div className="form-grid bare">
          <label className="field">
            <span>Marca</span>
            <select
              className="input"
              value={form.marca}
              onChange={(e) => set("marca", e.target.value as DeviceBrand)}
            >
              {BRANDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </label>
          <label className="field">
            <span>Modelo</span>
            <input
              className="input"
              value={form.modelo}
              onChange={(e) => set("modelo", e.target.value)}
              placeholder="Ex.: Spark 20 Pro"
            />
          </label>
          <label className="field">
            <span>IMEI 1 *</span>
            <input
              className="input"
              value={form.imei1}
              onChange={(e) => set("imei1", e.target.value)}
              placeholder="15 dígitos"
            />
          </label>
          <label className="field">
            <span>IMEI 2</span>
            <input
              className="input"
              value={form.imei2}
              onChange={(e) => set("imei2", e.target.value)}
              placeholder="2º SIM (se houver)"
            />
          </label>
          <label className="field">
            <span>Número de série (SN)</span>
            <input
              className="input"
              value={form.sn}
              onChange={(e) => set("sn", e.target.value)}
            />
          </label>
          <label className="field">
            <span>Nº da nota fiscal</span>
            <input
              className="input"
              value={form.notaFiscal}
              onChange={(e) => set("notaFiscal", e.target.value)}
            />
          </label>
        </div>

        <label className="consent">
          <input
            type="checkbox"
            checked={form.consentimentoLgpd}
            onChange={(e) => set("consentimentoLgpd", e.target.checked)}
          />
          <span>
            Autorizo a Carlcare a tratar meus dados pessoais para a execução deste
            atendimento técnico, conforme a LGPD (Lei nº 13.709/2018). *
          </span>
        </label>

        <button className="btn btn-primary full" type="submit" disabled={!canSave}>
          Enviar cadastro
        </button>
      </form>
    </div>
  );
}
