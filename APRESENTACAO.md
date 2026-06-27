# Carlcare CRM — Apresentação

Sistema de atendimento e assistência técnica (reparo de celulares) no modelo de
**envio do aparelho pelos Correios (mail-in)**. Este documento explica para que
serve, o que muda em relação ao processo atual e como a plataforma funciona na
prática.

---

## 1. Como é o processo hoje (sem a ferramenta)

O atendimento acontece no WhatsApp "solto", com os dados anotados à mão. Problemas:

- Mensagens longas digitadas manualmente a cada cliente (endereço dos Correios,
  instruções de envio, termos de garantia).
- Pacotes que chegam **sem o nome correto ou sem dados** não são cadastrados até
  a identificação — o que **atrasa o reparo**.
- Dados do cliente incompletos ou errados (CPF, endereço, IMEI).
- Sem visão de quantos casos existem, em que etapa estão e por equipe.

## 2. O que a plataforma faz

Centraliza o atendimento em um só lugar, ligando tudo pelo **número de WhatsApp**
e pelo **IMEI** do aparelho: cadastro do cliente, abertura e acompanhamento do
caso, mensagens padronizadas, controle do envio (Correios) e indicadores.

---

## 3. O que você trouxe e como virou funcionalidade

| O que você trouxe | Como ficou na plataforma | Ganho |
|---|---|---|
| As mensagens padrão da Carlcare (endereço dos Correios, pedir data + rastreio, questionário de retorno, termo de garantia, aviso de divergência) | **Biblioteca de modelos**: o agente envia em 1 clique, já com os dados preenchidos | Padroniza e acelera; sem erro de digitação |
| "O endereço dos Correios só depois da validação" | **Trava de validação**: o sistema só libera esse modelo depois que o caso é validado | Evita mandar aparelho de caso inválido |
| "O rastreio é feito pelo IMEI quando o cliente não informa o código" | **Busca por IMEI**: o pacote é identificado mesmo sem o código de rastreio | O pacote não fica perdido |
| "Informar o IMEI para vincular ao número" | Cliente e aparelho ficam ligados pelo **número + IMEI** | Liga conversa ↔ cliente ↔ caso sem confusão |
| "`*#06#` para pegar IMEI/SN; se não liga, pegar na caixa" | **Instrução automática** no formulário: se o aparelho liga, mostra `*#06#`; se não liga, mostra a etiqueta da caixa | O cliente sempre consegue informar o IMEI |
| "Todos os campos obrigatórios; CPF 11 dígitos; e-mail com @; CEP preenche o endereço" | **Formulário com validação** e **CEP automático** (ViaCEP) — o cliente só digita o número | Cadastro completo e correto de primeira |
| "Divergência ou falta de dados atrasa o reparo" | Campos obrigatórios + validação garantem dados consistentes | Menos pacotes parados por dado faltando |
| Logo **Carlcare Service** + azul e verde | Identidade aplicada na plataforma inteira | Cara da marca |
| Áreas **Carlcare / TFAE / Comercial / HQ** | Dashboard mostra os casos por área | Visão por equipe |

---

## 4. Fluxo feliz (passo a passo)

**Exemplo:** Tiago tem um TECNO Spark 20 Pro que **não liga**.

1. **Contato** — Tiago chama no WhatsApp. O agente vê a conversa na caixa de
   entrada e abre o atendimento.
2. **Cadastro** — Em 1 clique, o sistema envia a Tiago um **link de cadastro**.
   O telefone já vem **travado** (a associação não depende do que ele digita).
3. **Preenchimento** — Tiago preenche o formulário:
   - CPF, nascimento e e-mail (validados);
   - digita o **CEP** → rua, bairro, cidade e UF aparecem sozinhos; ele só põe o
     número;
   - como o aparelho **não liga**, a instrução já mostra "pegue o IMEI 1, IMEI 2
     e o SN na etiqueta da caixa";
   - aceita o consentimento LGPD e envia.
4. **Vínculo** — Os dados ficam ligados ao número e ao IMEI. O caso aparece na
   plataforma.
5. **Validação (trava)** — O agente analisa e **valida** o caso. Só então o
   sistema libera o modelo com o **endereço dos Correios**, enviado a Tiago.
6. **Envio** — Tiago posta o aparelho e informa a data e o código de rastreio.
   Se esquecer o código, a unidade identifica o pacote **pelo IMEI**.
7. **Recebimento e triagem** — Aparelho recebido → **triagem de garantia**
   (queda / água / aberto antes). Em garantia → segue para reparo.
8. **Acompanhamento** — A cada mudança de status, o cliente é **avisado
   automaticamente**.
9. **Retorno** — Reparo pronto → o aparelho é **enviado de volta**, com o
   rastreio de volta registrado.
10. **Conclusão** — Caso finalizado → mensagem de finalização e pesquisa.

Durante todo o processo, o **dashboard** mostra quantos casos estão abertos, em
cada etapa e por equipe.

---

## 5. Resultados (por público)

O fluxo gera valor para os três públicos envolvidos:

- **Cliente — satisfação:** cadastro rápido (CEP automático, instruções claras de
  IMEI/SN), acompanhamento automático a cada etapa e menos idas e vindas.
- **Equipe — organização:** atendimento padronizado (modelos prontos), processo
  controlado (não pula etapas) e cada caso ligado ao cliente e ao IMEI.
- **TFAE / Gestão — análise:** dashboard por equipe e por status e um **relatório
  de problemas (defeitos)** para identificar padrões — quais modelos/marcas e áreas
  mais falham e qual a taxa fora de garantia.

Em resumo: menos retrabalho e pacotes trocados, atendimento mais rápido, cadastro
correto de primeira e conformidade com a LGPD (consentimento; IMEI mascarado).

---

## 6. Situação atual e próximos passos

**Atual:** protótipo funcional com dados de exemplo (frontend + backend + banco),
com 13 testes automatizados.

**Próximos passos:**
1. **Relatório de defeitos** por modelo/marca/área e taxa fora de garantia
   (análise do TFAE/Gestão) — pode ser feito já sobre os dados atuais.
2. Integração com a **WhatsApp Business API** (envio real das mensagens).
3. **Banco de produção** (PostgreSQL/Supabase).
4. **Login e permissões** por equipe.
5. **Piloto** com 20 a 50 atendimentos reais.
