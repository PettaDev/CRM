# WhatsApp Cloud API — guia de integração

Passo a passo para conectar o CRM ao WhatsApp oficial (Meta), da criação da
conta até as mensagens entrando na caixa de entrada da plataforma.

**O código já está pronto.** O backend tem:

| Peça | Arquivo | Função |
|---|---|---|
| Envio | `server/src/services/whatsapp.service.ts` | Manda as mensagens do agente/templates pelo Graph API |
| Webhook | `server/src/routes/webhook.routes.ts` | Recebe as mensagens dos clientes (`GET`/`POST /api/webhook`) |
| Wiring | `server/src/index.ts` | Liga tudo; sem credenciais roda em **modo simulado** (só loga) |

Para ativar, você só precisa preencher 3 variáveis de ambiente:
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID` e `WHATSAPP_VERIFY_TOKEN`.

---

## Etapa 1 — Conta no Meta for Developers

1. Acesse https://developers.facebook.com e faça login com uma conta Facebook.
2. Menu **Meus apps → Criar app**.
3. Caso de uso: **Outro** → tipo **Empresa (Business)**.
4. Dê um nome (ex.: `Carlcare CRM`) e informe seu email → **Criar app**.
5. Se pedir, crie/vincule um **Portfólio empresarial** (Meta Business Suite) —
   é ele que depois passa pela verificação da empresa.

> O **App ID** aparece no topo do painel do app. Anote.

## Etapa 2 — Adicionar o produto WhatsApp

1. No painel do app, seção **Adicionar produtos** → **WhatsApp → Configurar**.
2. A Meta cria automaticamente uma **conta WhatsApp Business (WABA)** de teste
   com um **número de telefone de teste** gratuito.
3. Vá em **WhatsApp → Configuração da API**. Nessa tela você vê:
   - **Phone Number ID** ← copie (vai em `WHATSAPP_PHONE_ID`)
   - **WhatsApp Business Account ID** (WABA ID)
   - **Token de acesso temporário** (vale 24h — bom só para testar)
4. Em **Para**, adicione até 5 números de destinatários de teste (seu celular).
   Cada número recebe um código de confirmação no WhatsApp.
5. Teste pelo botão da própria página ou via `curl`:

```bash
curl -X POST "https://graph.facebook.com/v21.0/SEU_PHONE_NUMBER_ID/messages" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"messaging_product":"whatsapp","to":"5511999998888","type":"template","template":{"name":"hello_world","language":{"code":"en_US"}}}'
```

Se o `hello_world` chegar no seu celular, a conta está funcionando.

## Etapa 3 — Token permanente (o de 24h expira!)

O jeito certo é criar um **System User** no Business Manager:

1. Acesse https://business.facebook.com/settings → **Usuários → Usuários do sistema**.
2. **Adicionar** → nome (ex.: `crm-bot`), função **Administrador**.
3. **Adicionar ativos** → aba **Apps** → selecione o app → marque
   **Gerenciar app**.
4. **Gerar novo token** → selecione o app → marque as permissões:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`
5. Expiração: **Nunca**. Gere e **copie o token na hora** (não dá pra ver de novo).

Esse é o valor de `WHATSAPP_TOKEN`.

> ⚠️ Trate como senha: nunca commite no repositório — só em variável de
> ambiente (no Render: aba *Environment* do serviço).

## Etapa 4 — Webhook (receber mensagens dos clientes)

O webhook precisa de uma **URL pública HTTPS** — por isso configure depois do
deploy (o Render já fornece HTTPS).

1. Defina `WHATSAPP_VERIFY_TOKEN` no ambiente do servidor (qualquer string
   secreta — o `render.yaml` já gera uma; copie o valor no dashboard).
2. No painel do app: **WhatsApp → Configuração** (Webhooks):
   - **URL de callback**: `https://SEU-APP.onrender.com/api/webhook`
   - **Token de verificação**: o mesmo valor de `WHATSAPP_VERIFY_TOKEN`
   - Clique em **Verificar e salvar** — a Meta faz um `GET` no endpoint e o
     backend responde o `hub.challenge` (isso já está implementado).
3. Em **Campos do webhook**, clique **Gerenciar** e **assine o campo `messages`**.

Pronto: quando um cliente mandar mensagem para o número, a Meta faz um `POST`
em `/api/webhook`, o backend associa pelo **telefone (phoneKey)** e a mensagem
aparece na caixa de entrada do CRM (contador de não lidas incluído). Se não
existir conversa para aquele número, o CRM cria uma nova automaticamente.

**Teste local (sem deploy):** exponha a porta com `ngrok http 3001` e use a URL
do ngrok como callback. Lembre de rodar o backend com o mesmo
`WHATSAPP_VERIFY_TOKEN`.

## Etapa 5 — Variáveis no servidor e ativação

No Render (ou `.env` local na pasta `server/`):

```env
WHATSAPP_TOKEN=EAAG...        # token permanente (Etapa 3)
WHATSAPP_PHONE_ID=1055471...  # Phone Number ID (Etapa 2)
WHATSAPP_VERIFY_TOKEN=...     # o mesmo configurado no webhook (Etapa 4)
```

Reinicie o serviço. No log de boot deve aparecer:
`WhatsApp Cloud API: ATIVA`.

A partir daí:
- **Agente responde na inbox** → a mensagem é gravada no banco **e** enviada
  pelo WhatsApp real.
- **Templates** (endereço dos Correios, questionário, garantia…) → idem, com o
  gate de validação preservado.
- **Cliente responde** → entra pelo webhook na conversa certa.

## Etapa 6 — Regras importantes da plataforma (evita dor de cabeça)

- **Janela de 24 horas**: texto livre só pode ser enviado até 24h após a última
  mensagem do cliente. Fora da janela, a Meta só aceita **templates aprovados**
  (criados em *WhatsApp Manager → Modelos de mensagem*, com revisão de ~1 dia).
  Os templates do CRM (`server/src/templates/registry.ts`) devem ser cadastrados
  lá quando forem usados fora da janela.
- **Número de produção**: o número de teste não serve para clientes reais.
  Em *Configuração da API → Adicionar número*, registre um número real da
  empresa (ele **não pode** estar registrado num app WhatsApp comum — precisa
  ser migrado ou exclusivo).
- **Verificação da empresa**: para sair do modo de teste (limite de 5 números)
  é preciso verificar o Portfólio empresarial (CNPJ, site, documentos) em
  *Business Manager → Central de segurança*. Depois de verificado, o limite
  inicial é de 250 conversas iniciadas/dia, subindo automaticamente com o uso.
- **Preço**: conversas **de atendimento** (respondendo cliente) são gratuitas
  desde 2025; conversas **iniciadas pela empresa** via template (marketing/
  utilidade) são cobradas por mensagem. Consulte a tabela de preços da Meta
  para o Brasil.

## Resumo do fluxo

```
Cliente manda "meu celular quebrou"
        │
        ▼
Meta → POST /api/webhook ──► ConversationService.receiveInbound()
        │                     associa pelo telefone → inbox (não lida)
        ▼
Agente responde na plataforma
        │
        ▼
ConversationService.addMessage() ──► grava no banco
        └──► WhatsAppService.sendText() ──► Graph API ──► WhatsApp do cliente
```
