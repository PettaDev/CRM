import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Logo from "../components/Logo";
import { BRANDS } from "../lib/meta";
import { crmApi } from "../api/crm.api";
import type { Client, ClientForm as ClientFormData, DeviceBrand } from "../types";

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

const onlyDigits = (s: string): string => s.replace(/\D/g, "");

function formatCpf(s: string): string {
  const d = onlyDigits(s).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function formatCep(s: string): string {
  const d = onlyDigits(s).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

type Errors = Partial<Record<keyof ClientFormData, string>>;

// Todos os campos são obrigatórios (exceto IMEI 2 — 2º SIM). CPF = 11 dígitos,
// e-mail precisa do @, CEP = 8 dígitos.
function validate(form: ClientFormData): Errors {
  const e: Errors = {};
  if (!form.nomeCompleto.trim()) e.nomeCompleto = "Obrigatório.";
  if (onlyDigits(form.cpf).length !== 11) e.cpf = "O CPF deve ter 11 dígitos.";
  if (!form.nascimento) e.nascimento = "Obrigatório.";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) e.email = "E-mail inválido (precisa do @).";
  if (onlyDigits(form.cep).length !== 8) e.cep = "O CEP deve ter 8 dígitos.";
  if (!form.rua.trim()) e.rua = "Obrigatório.";
  if (!form.numero.trim()) e.numero = "Obrigatório.";
  if (!form.bairro.trim()) e.bairro = "Obrigatório.";
  if (!form.cidade.trim()) e.cidade = "Obrigatório.";
  if (form.estado.trim().length !== 2) e.estado = "Informe a UF.";
  if (!form.modelo.trim()) e.modelo = "Obrigatório.";
  if (!form.imei1.trim()) e.imei1 = "Obrigatório.";
  if (!form.sn.trim()) e.sn = "Obrigatório.";
  if (!form.notaFiscal.trim()) e.notaFiscal = "Obrigatório.";
  if (!form.consentimentoLgpd) e.consentimentoLgpd = "É necessário aceitar.";
  return e;
}

type CepStatus = "idle" | "loading" | "ok" | "error";

// Página pública que o cliente abre pelo link recebido no WhatsApp.
// O telefone vem da plataforma (token = telefoneKey) e fica travado.
export default function ClientForm() {
  const { token } = useParams();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<ClientFormData>(EMPTY);
  const [aparelhoLiga, setAparelhoLiga] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [cepStatus, setCepStatus] = useState<CepStatus>("idle");
  const [sent, setSent] = useState(false);
  const [submitErr, setSubmitErr] = useState("");

  // Carrega o próprio cadastro pelo token (endpoint público) — independente de
  // login e do contexto do app de agentes.
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    crmApi
      .getClient(token)
      .then((c) => {
        if (cancelled) return;
        setClient(c);
        if (c.form) setForm(c.form);
      })
      .catch(() => {
        if (!cancelled) setClient(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const set = <K extends keyof ClientFormData>(key: K, value: ClientFormData[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  // Busca o endereço no ViaCEP quando o CEP tem 8 dígitos (autopreenchimento).
  useEffect(() => {
    const cep = onlyDigits(form.cep);
    if (cep.length !== 8) {
      setCepStatus("idle");
      return;
    }
    let cancelled = false;
    setCepStatus("loading");
    fetch(`https://viacep.com.br/ws/${cep}/json/`)
      .then((r) => r.json())
      .then(
        (data: {
          erro?: boolean;
          logradouro?: string;
          bairro?: string;
          localidade?: string;
          uf?: string;
        }) => {
          if (cancelled) return;
          if (data.erro) {
            setCepStatus("error");
            return;
          }
          setForm((f) => ({
            ...f,
            rua: data.logradouro || f.rua,
            bairro: data.bairro || f.bairro,
            cidade: data.localidade || f.cidade,
            estado: data.uf || f.estado,
          }));
          setCepStatus("ok");
        }
      )
      .catch(() => {
        if (!cancelled) setCepStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [form.cep]);

  if (loading) {
    return (
      <div className="form-page">
        <div className="form-page-card">
          <Logo />
          <p className="muted">Carregando…</p>
        </div>
      </div>
    );
  }

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

  const errors = validate(form);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length > 0) {
      setSubmitted(true);
      return;
    }
    if (!token) return;
    setSubmitErr("");
    try {
      await crmApi.submitForm(token, form);
      setSent(true);
    } catch {
      setSubmitErr("Não foi possível enviar. Tente novamente.");
    }
  }

  // Helpers de exibição de erro.
  const err = (k: keyof ClientFormData) => (submitted ? errors[k] : undefined);
  const cls = (k: keyof ClientFormData, locked = false) =>
    "input" + (err(k) ? " invalid" : "") + (locked ? " locked" : "");
  // Campos preenchidos pelo ViaCEP ficam travados (cliente só põe o número).
  const cepLocked = (k: keyof ClientFormData) =>
    cepStatus === "ok" && !!String(form[k]);

  return (
    <div className="form-page">
      <form className="form-page-card" onSubmit={handleSubmit} noValidate>
        <div className="form-page-head">
          <Logo />
          <span className="chip">Cadastro de atendimento</span>
        </div>
        <p className="muted">
          Preencha seus dados para agilizar o atendimento — leva 2 minutos. 🔒 Seus
          dados são tratados conforme a LGPD. Todos os campos são obrigatórios.
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
              className={cls("nomeCompleto")}
              value={form.nomeCompleto}
              onChange={(e) => set("nomeCompleto", e.target.value)}
            />
            {err("nomeCompleto") && <span className="field-error">{err("nomeCompleto")}</span>}
          </label>
          <label className="field">
            <span>CPF *</span>
            <input
              className={cls("cpf")}
              value={form.cpf}
              inputMode="numeric"
              onChange={(e) => set("cpf", formatCpf(e.target.value))}
              placeholder="000.000.000-00"
            />
            {err("cpf") && <span className="field-error">{err("cpf")}</span>}
          </label>
          <label className="field">
            <span>Data de nascimento *</span>
            <input
              className={cls("nascimento")}
              type="date"
              value={form.nascimento}
              onChange={(e) => set("nascimento", e.target.value)}
            />
            {err("nascimento") && <span className="field-error">{err("nascimento")}</span>}
          </label>
          <label className="field span-2">
            <span>E-mail *</span>
            <input
              className={cls("email")}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="voce@email.com"
            />
            {err("email") && <span className="field-error">{err("email")}</span>}
          </label>
        </div>

        <h2 className="form-section-title">Endereço</h2>
        <div className="form-grid bare">
          <label className="field">
            <span>CEP *</span>
            <input
              className={cls("cep")}
              value={form.cep}
              inputMode="numeric"
              onChange={(e) => set("cep", formatCep(e.target.value))}
              placeholder="00000-000"
            />
            {cepStatus === "loading" && <span className="field-hint">Buscando endereço…</span>}
            {cepStatus === "error" && <span className="field-error">CEP não encontrado.</span>}
            {cepStatus === "ok" && <span className="field-ok">Endereço preenchido ✓</span>}
            {err("cep") && cepStatus !== "error" && (
              <span className="field-error">{err("cep")}</span>
            )}
          </label>
          <label className="field">
            <span>Número *</span>
            <input
              className={cls("numero")}
              value={form.numero}
              onChange={(e) => set("numero", e.target.value)}
            />
            {err("numero") && <span className="field-error">{err("numero")}</span>}
          </label>
          <label className="field span-2">
            <span>Rua *</span>
            <input
              className={cls("rua", cepLocked("rua"))}
              value={form.rua}
              readOnly={cepLocked("rua")}
              onChange={(e) => set("rua", e.target.value)}
            />
            {err("rua") && <span className="field-error">{err("rua")}</span>}
          </label>
          <label className="field">
            <span>Bairro *</span>
            <input
              className={cls("bairro", cepLocked("bairro"))}
              value={form.bairro}
              readOnly={cepLocked("bairro")}
              onChange={(e) => set("bairro", e.target.value)}
            />
            {err("bairro") && <span className="field-error">{err("bairro")}</span>}
          </label>
          <label className="field">
            <span>Cidade *</span>
            <input
              className={cls("cidade", cepLocked("cidade"))}
              value={form.cidade}
              readOnly={cepLocked("cidade")}
              onChange={(e) => set("cidade", e.target.value)}
            />
            {err("cidade") && <span className="field-error">{err("cidade")}</span>}
          </label>
          <label className="field">
            <span>UF *</span>
            <input
              className={cls("estado", cepLocked("estado"))}
              value={form.estado}
              maxLength={2}
              readOnly={cepLocked("estado")}
              onChange={(e) => set("estado", e.target.value.toUpperCase())}
              placeholder="SP"
            />
            {err("estado") && <span className="field-error">{err("estado")}</span>}
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
            <span>Marca *</span>
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
            <span>Modelo *</span>
            <input
              className={cls("modelo")}
              value={form.modelo}
              onChange={(e) => set("modelo", e.target.value)}
              placeholder="Ex.: Spark 20 Pro"
            />
            {err("modelo") && <span className="field-error">{err("modelo")}</span>}
          </label>
          <label className="field">
            <span>IMEI 1 *</span>
            <input
              className={cls("imei1")}
              value={form.imei1}
              onChange={(e) => set("imei1", e.target.value)}
              placeholder="15 dígitos"
            />
            {err("imei1") && <span className="field-error">{err("imei1")}</span>}
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
            <span>Número de série (SN) *</span>
            <input
              className={cls("sn")}
              value={form.sn}
              onChange={(e) => set("sn", e.target.value)}
            />
            {err("sn") && <span className="field-error">{err("sn")}</span>}
          </label>
          <label className="field">
            <span>Nº da nota fiscal *</span>
            <input
              className={cls("notaFiscal")}
              value={form.notaFiscal}
              onChange={(e) => set("notaFiscal", e.target.value)}
            />
            {err("notaFiscal") && <span className="field-error">{err("notaFiscal")}</span>}
          </label>
        </div>

        <label className={"consent" + (err("consentimentoLgpd") ? " invalid" : "")}>
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

        {submitErr && <div className="login-error">{submitErr}</div>}
        <button className="btn btn-primary full" type="submit">
          Enviar cadastro
        </button>
      </form>
    </div>
  );
}
