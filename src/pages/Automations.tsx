import { useCrm } from "../context/CrmContext";
import { templateFinalizacao, templateInicio } from "../lib/meta";

interface Rule {
  nome: string;
  gatilho: string;
  acao: string;
  ativo: boolean;
}

const RULES: Rule[] = [
  {
    nome: "Início do atendimento",
    gatilho: "Novo caso criado a partir do WhatsApp",
    acao: "Envia confirmação com nº do atendimento e defeito relatado",
    ativo: true,
  },
  {
    nome: "Mudança de status",
    gatilho: "Status do caso é alterado",
    acao: "Notifica o cliente sobre o novo andamento",
    ativo: true,
  },
  {
    nome: "Pronto para retirada",
    gatilho: "Status muda para “Pronto p/ retirada”",
    acao: "Avisa o cliente que o aparelho está disponível na unidade",
    ativo: true,
  },
  {
    nome: "Finalização do reparo",
    gatilho: "Status muda para “Finalizado”",
    acao: "Envia agradecimento e pesquisa de satisfação",
    ativo: false,
  },
];

const PILOTO: string[] = [
  "Piloto interno",
  "Testar com 1 número WhatsApp Business API",
  "Definir campos obrigatórios (modelo, IMEI, cidade, UF, defeito)",
  "Definir status do caso",
  "Automação de início",
  "Automação de finalização",
  "Testar com 20 a 50 atendimentos reais",
  "Validar com Carlcare, TFAE, Comercial e HQ",
];

export default function Automations() {
  const { cases } = useCrm();
  const exemplo = cases[0];

  return (
    <div className="stack-lg">
      <div className="page-head">
        <div>
          <h1>Automações</h1>
          <p className="muted">
            Disparos automáticos via WhatsApp Business API (Meta Cloud API)
          </p>
        </div>
      </div>

      <section className="card no-pad">
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Automação</th>
                <th>Gatilho</th>
                <th>Ação</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {RULES.map((r) => (
                <tr key={r.nome}>
                  <td>
                    <strong>{r.nome}</strong>
                  </td>
                  <td className="muted">{r.gatilho}</td>
                  <td className="muted">{r.acao}</td>
                  <td>
                    <span className={"toggle " + (r.ativo ? "on" : "off")}>
                      {r.ativo ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid-2">
        <section className="card">
          <div className="card-head">
            <h2>Prévia das mensagens</h2>
            <span className="muted small">exemplo: {exemplo.id}</span>
          </div>
          <div className="automation">
            <span className="automation-label">Início do atendimento</span>
            <div className="wa-bubble">{templateInicio(exemplo)}</div>
          </div>
          <div className="automation">
            <span className="automation-label">Finalização do reparo</span>
            <div className="wa-bubble">{templateFinalizacao(exemplo)}</div>
          </div>
        </section>

        <section className="card">
          <div className="card-head">
            <h2>Fluxo de piloto recomendado</h2>
          </div>
          <ol className="stepper">
            {PILOTO.map((step, i) => (
              <li className="stepper-item" key={i}>
                <span className="stepper-num">{i + 1}</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section className="card note">
        <strong>⚠️ Antes de produção</strong>
        <p className="muted">
          Esta é uma versão de protótipo com dados fictícios. Para operar de
          verdade é preciso: número aprovado na <em>WhatsApp Business API</em>,
          projeto <em>Supabase</em> (banco + autenticação), templates aprovados
          pela Meta e adequação à <em>LGPD</em> (dados sensíveis como IMEI, CPF e
          telefone).
        </p>
      </section>
    </div>
  );
}
