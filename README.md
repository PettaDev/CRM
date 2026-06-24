# Carlcare CRM

Protótipo de **CRM de atendimento e assistência técnica** inspirado na
[Carlcare Brasil](https://www.carlcare.com/br/), com os fluxos de um CRM de
WhatsApp no estilo do template open-source
[wacrm](https://github.com/ArnasDon/wacrm).

> ⚠️ **Protótipo navegável com dados fictícios.** Não há integração real com
> WhatsApp/Supabase ainda — o objetivo é validar a experiência, a identidade
> visual e os fluxos antes de um piloto controlado.

## O que tem aqui

- **Visão geral (dashboard)** — indicadores por área (Carlcare, TFAE, Comercial,
  HQ) e por status do caso.
- **Caixa de entrada compartilhada** — conversas de WhatsApp (mock), com o caso
  vinculado lado a lado e atalhos de automação.
- **Casos** — tabela e kanban, filtros por status/área/busca e criação de novos
  atendimentos com os campos: cliente, telefone, marca, modelo, **IMEI**,
  cidade, **UF**, defeito, área e responsável.
- **Caso (detalhe)** — dados do cliente/aparelho, troca de status com linha do
  tempo e prévia das mensagens automáticas.
- **Automações** — regras de disparo, prévia dos templates de WhatsApp e o
  fluxo de piloto recomendado.

## Stack

- React 19 + TypeScript
- Vite
- React Router (HashRouter — compatível com hospedagem estática)
- Sem dependências de UI: design system próprio em CSS (identidade Carlcare)

## Como rodar

```bash
npm install
npm run dev      # http://localhost:5173
```

Outros comandos:

```bash
npm run build    # type-check + build de produção (saída em dist/)
npm run preview  # serve o build localmente
```

## Estrutura

```
src/
  components/   Layout, Logo, StatusBadge, ícones
  context/      CrmContext — estado vivo (casos, conversas, ações)
  data/         mock.ts — dados fictícios (casos, conversas, agentes)
  lib/          meta.ts — status/áreas, formatadores, templates de WhatsApp
  pages/        Dashboard, Inbox, Cases, CaseDetail, Automations
  types/        modelos de domínio
```

## Próximos passos (para virar produção)

1. **WhatsApp Business API** (Meta Cloud API) com número aprovado e templates.
2. **Supabase** (PostgreSQL + Auth + RLS) substituindo os dados mock.
3. **Webhooks** de entrada para criar/atualizar casos a partir das mensagens.
4. **LGPD** — tratamento de dados sensíveis (IMEI, telefone, CPF), consentimento
   e controle de acesso por perfil/área.
5. **Validação** com Carlcare, TFAE, Comercial e HQ em um piloto de 20–50
   atendimentos reais.

## Deploy (GitHub Pages)

O `vite.config.ts` usa `base: "/CRM/"` no build de produção (compatível com
`https://<usuário>.github.io/CRM/`). O roteamento é por hash, então não exige
configuração de servidor.
