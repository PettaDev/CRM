// Biblioteca de mensagens padronizadas da Carlcare (data-driven: conteúdo
// separado do código). Placeholders {{var}} são resolvidos pelo TemplateService
// a partir do caso + cliente. `requiresValidated` marca mensagens que só podem
// ser enviadas após o gate de validação (ex.: endereço dos Correios).

export interface TemplateDef {
  id: string;
  nome: string;
  descricao: string;
  requiresValidated?: boolean;
  body: string;
}

export const TEMPLATES: TemplateDef[] = [
  {
    id: "envio_correios",
    nome: "Dados para envio (Correios)",
    descricao: "Endereço da unidade. Só após a validação do caso.",
    requiresValidated: true,
    body:
      "Certo, {{cliente}}, entendido. Será necessário o envio do aparelho para nossa unidade para análise técnica e reparo, se aplicável. Temos apenas uma unidade no estado de São Paulo.\n\n" +
      "Dados para envio (Correios):\n" +
      "• Destinatário: {{destinatario}}\n" +
      "• Endereço: {{enderecoUnidade}}\n" +
      "• Complemento: {{complemento}}\n" +
      "• Bairro: {{bairro}}\n" +
      "• CEP: {{cep}}\n" +
      "• Telefone: {{telefoneUnidade}}\n\n" +
      "No pacote deve constar o nome do questionário e o telefone que entrou em contato. Atendimento: {{caseId}}.",
  },
  {
    id: "instrucao_rastreio",
    nome: "Informar data de envio e rastreio",
    descricao: "Pede data + código de rastreio (fallback por IMEI).",
    body:
      "Assim que enviar o aparelho, informe por escrito aqui:\n" +
      "• Data do envio\n" +
      "• Código de rastreio\n\n" +
      "Caso não tenha o código, identificamos o pacote pelo IMEI ({{imei}}) vinculado ao seu número. Sem esses dados, o cadastro pode atrasar.",
  },
  {
    id: "questionario_retorno",
    nome: "Questionário de retorno",
    descricao: "Endereço, nome completo e CPF para o envio de volta.",
    body:
      "Para o envio de volta, confirme por escrito (o nome deve ser o mesmo do pacote):\n" +
      "• Endereço completo (rua, número, CEP)\n" +
      "• Nome completo\n" +
      "• CPF",
  },
  {
    id: "garantia",
    nome: "Termo de garantia",
    descricao: "Aviso de perda de garantia (queda/água/aberto antes).",
    body:
      "Atenção: se o aparelho sofreu queda, entrou água ou foi previamente aberto em outra assistência técnica, ele perde a garantia, não sendo possível o reparo gratuito.",
  },
  {
    id: "orcamento",
    nome: "Orçamento (fora de garantia)",
    descricao: "Envia o valor do reparo pago e pede aprovação. Exige o valor definido no caso.",
    body:
      "{{cliente}}, a análise técnica do seu {{marca}} {{modelo}} (atendimento {{caseId}}) identificou que o reparo está FORA da garantia.\n\n" +
      "💰 Orçamento do reparo: {{orcamento}}\n\n" +
      "Para prosseguir, responda por escrito:\n" +
      "• APROVO — seguimos com o reparo pago\n" +
      "• NÃO APROVO — devolvemos o aparelho sem custo\n\n" +
      "O orçamento é válido por 7 dias.",
  },
  {
    id: "devolucao_sem_reparo",
    nome: "Devolução sem reparo",
    descricao: "Confirma a recusa do orçamento e a devolução sem custo.",
    body:
      "Tudo bem, {{cliente}}. Como o orçamento não foi aprovado, seu {{marca}} {{modelo}} será devolvido SEM custo e sem reparo (atendimento {{caseId}}).\n\n" +
      "Para o envio de volta, confirme por escrito:\n" +
      "• Endereço completo (rua, número, CEP)\n" +
      "• Nome completo\n" +
      "• CPF",
  },
  {
    id: "atencao_dados",
    nome: "Atenção: divergência de dados",
    descricao: "Aviso de que dados divergentes atrasam o reparo.",
    body:
      "⚠️ ATENÇÃO: divergência ou falta de dados atrasam o reparo. Pacotes com outro nome ou sem dados não são cadastrados nem analisados até a identificação.",
  },
  {
    id: "imei_sn_liga",
    nome: "IMEI/SN — aparelho liga (*#06#)",
    descricao: "Instrução para obter IMEI 1, IMEI 2 e SN via *#06#.",
    body:
      "{{cliente}}, para informar o IMEI 1, IMEI 2 e o número de série (SN): abra o teclado de chamada e digite *#06#. Os códigos aparecem na tela.",
  },
  {
    id: "imei_sn_caixa",
    nome: "IMEI/SN — aparelho não liga (caixa)",
    descricao: "Instrução para obter IMEI/SN na etiqueta da caixa.",
    body:
      "{{cliente}}, como seu {{marca}} {{modelo}} não está ligando, localize o IMEI 1, IMEI 2 e o número de série (SN) na etiqueta da caixa em que o aparelho veio e nos informe por aqui.",
  },
];
