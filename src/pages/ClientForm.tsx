import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Logo from "../components/Logo";
import { BRANDS } from "../lib/meta";
import { crmApi } from "../api/crm.api";
import type {
  Client,
  ClientForm as ClientFormData,
  DeviceBrand,
  FormDevice,
} from "../types";

// Dados da PESSOA (os aparelhos ficam num array próprio — lojas enviam vários).
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

const EMPTY_DEVICE: FormDevice = {
  marca: "TECNO",
  modelo: "",
  imei1: "",
  imei2: "",
  sn: "",
  notaFiscal: "",
  defeito: "",
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
type DeviceErrors = Partial<Record<keyof FormDevice, string>>;

// Campos da pessoa — todos obrigatórios. CPF = 11 dígitos, e-mail com @, CEP = 8.
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
  if (!form.consentimentoLgpd) e.consentimentoLgpd = "É necessário aceitar.";
  return e;
}

// Cada aparelho é validado por si (IMEI 2 é o único opcional).
function validateDevice(d: FormDevice): DeviceErrors {
  const e: DeviceErrors = {};
  if (!d.modelo.trim()) e.modelo = "Obrigatório.";
  if (!d.imei1.trim()) e.imei1 = "Obrigatório.";
  if (!d.sn.trim()) e.sn = "Obrigatório.";
  if (!d.notaFiscal.trim()) e.notaFiscal = "Obrigatório.";
  if (!d.defeito.trim()) e.defeito = "Descreva o problema.";
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
  const [devices, setDevices] = useState<FormDevice[]>([EMPTY_DEVICE]);
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
        if (c.form) {
          setForm(c.form);
          if (c.form.aparelhos?.length) setDevices(c.form.aparelhos);
        }
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

  const setDevice = <K extends keyof FormDevice>(i: number, key: K, value: FormDevice[K]) =>
    setDevices((list) => list.map((d, idx) => (idx === i ? { ...d, [key]: value } : d)));

  const addDevice = () => setDevices((list) => [...list, EMPTY_DEVICE]);
  const removeDevice = (i: number) =>
    setDevices((list) => (list.length > 1 ? list.filter((_, idx) => idx !== i) : list));

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
            dados — {devices.length === 1 ? "1 aparelho registrado" : `${devices.length} aparelhos registrados`},
            cada um com seu próprio atendimento. Pode voltar para a conversa no
            WhatsApp. 🔒
          </p>
        </div>
      </div>
    );
  }

  const errors = validate(form);
  const deviceErrors = devices.map(validateDevice);
  const hasDeviceErrors = deviceErrors.some((e) => Object.keys(e).length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (Object.keys(errors).length > 0 || hasDeviceErrors) {
      setSubmitted(true);
      return;
    }
    if (!token) return;
    setSubmitErr("");
    try {
      // Legado: o 1º aparelho também preenche os campos antigos do form.
      const first = devices[0];
      await crmApi.submitForm(token, {
        ...form,
        marca: first.marca,
        modelo: first.modelo,
        imei1: first.imei1,
        imei2: first.imei2,
        sn: first.sn,
        notaFiscal: first.notaFiscal,
        aparelhos: devices,
      });
      setSent(true);
    } catch {
      setSubmitErr("Não foi possível enviar. Tente novamente.");
    }
  }

  // Helpers de exibição de erro.
  const err = (k: keyof ClientFormData) => (submitted ? errors[k] : undefined);
  const dErr = (i: number, k: keyof FormDevice) =>
    submitted ? deviceErrors[i]?.[k] : undefined;
  const cls = (k: keyof ClientFormData, locked = false) =>
    "input" + (err(k) ? " invalid" : "") + (locked ? " locked" : "");
  const dCls = (i: number, k: keyof FormDevice) =>
    "input" + (dErr(i, k) ? " invalid" : "");
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

        <h2 className="form-section-title">
          {devices.length === 1 ? "Seu aparelho" : `Seus aparelhos (${devices.length})`}
        </h2>

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

        {devices.map((d, i) => (
          <fieldset key={i} className="device-block">
            <div className="device-block-head">
              <span className="chip">Aparelho {i + 1}</span>
              {devices.length > 1 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm device-remove"
                  onClick={() => removeDevice(i)}
                >
                  Remover
                </button>
              )}
            </div>
            <div className="form-grid bare">
              <label className="field">
                <span>Marca *</span>
                <select
                  className="input"
                  value={d.marca}
                  onChange={(e) => setDevice(i, "marca", e.target.value as DeviceBrand)}
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
                  className={dCls(i, "modelo")}
                  value={d.modelo}
                  onChange={(e) => setDevice(i, "modelo", e.target.value)}
                  placeholder="Ex.: Spark 20 Pro"
                />
                {dErr(i, "modelo") && <span className="field-error">{dErr(i, "modelo")}</span>}
              </label>
              <label className="field">
                <span>IMEI 1 *</span>
                <input
                  className={dCls(i, "imei1")}
                  value={d.imei1}
                  onChange={(e) => setDevice(i, "imei1", e.target.value)}
                  placeholder="15 dígitos"
                />
                {dErr(i, "imei1") && <span className="field-error">{dErr(i, "imei1")}</span>}
              </label>
              <label className="field">
                <span>IMEI 2</span>
                <input
                  className="input"
                  value={d.imei2}
                  onChange={(e) => setDevice(i, "imei2", e.target.value)}
                  placeholder="2º SIM (se houver)"
                />
              </label>
              <label className="field">
                <span>Número de série (SN) *</span>
                <input
                  className={dCls(i, "sn")}
                  value={d.sn}
                  onChange={(e) => setDevice(i, "sn", e.target.value)}
                />
                {dErr(i, "sn") && <span className="field-error">{dErr(i, "sn")}</span>}
              </label>
              <label className="field">
                <span>Nº da nota fiscal *</span>
                <input
                  className={dCls(i, "notaFiscal")}
                  value={d.notaFiscal}
                  onChange={(e) => setDevice(i, "notaFiscal", e.target.value)}
                />
                {dErr(i, "notaFiscal") && (
                  <span className="field-error">{dErr(i, "notaFiscal")}</span>
                )}
              </label>
              <label className="field span-2">
                <span>Qual o problema deste aparelho? *</span>
                <input
                  className={dCls(i, "defeito")}
                  value={d.defeito}
                  onChange={(e) => setDevice(i, "defeito", e.target.value)}
                  placeholder="Ex.: tela não liga após queda"
                />
                {dErr(i, "defeito") && <span className="field-error">{dErr(i, "defeito")}</span>}
              </label>
            </div>
          </fieldset>
        ))}

        <button type="button" className="btn btn-ghost full add-device" onClick={addDevice}>
          + Adicionar outro aparelho
        </button>

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
          {devices.length === 1
            ? "Enviar cadastro"
            : `Enviar cadastro (${devices.length} aparelhos)`}
        </button>
      </form>
    </div>
  );
}
