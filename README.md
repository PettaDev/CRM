# Carlcare CRM

CRM **full-stack** de atendimento e assistência técnica, inspirado na
[Carlcare Brasil](https://www.carlcare.com/br/) e nos fluxos do template
open-source [wacrm](https://github.com/ArnasDon/wacrm).

O projeto é estruturado para **estudar conceitos de Software Engineering** —
ver [`ARCHITECTURE.md`](ARCHITECTURE.md) para o mapa de conceitos (camadas,
SOLID, repository, DTO, DI, testes, modelagem de dados, etc.).

```
CRM/
├── src/            Frontend  — React 19 + Vite + TypeScript
├── server/         Backend   — Express + TypeScript (arquitetura em camadas)
│   └── src/db/     Banco     — SQLite (schema, migração, seed)
└── ARCHITECTURE.md Conceitos de SE aplicados
```

## Funcionalidades

- **Dashboard** com indicadores por área (Carlcare/TFAE/Comercial/HQ) e por status.
- **Caixa de entrada** compartilhada (WhatsApp) com o caso vinculado.
- **Casos** em tabela e kanban; campos modelo, **IMEI**, cidade, UF, defeito, status.
- **Cadastro do cliente**: formulário enviado por WhatsApp, **associado pelo número**,
  com IMEI 1, IMEI 2 e SN (instrução `*#06#`) + consentimento LGPD.
- **API REST** + **banco** persistindo tudo; o frontend hidrata da API com
  fallback para mock (offline-first).

## Como rodar (full-stack)

Dois terminais. **Backend primeiro:**

```bash
cd server
npm install
npm run db:reset     # cria o schema e popula o banco (migração + seed)
npm run dev          # API em http://localhost:3001/api
```

**Frontend:**

```bash
npm install
npm run dev          # app em http://localhost:5173
```

O indicador na barra superior mostra **API conectada** (verde) ou
**API offline (mock)** se o backend não estiver no ar.

> Só quer ver a UI? Rode apenas o frontend — ele funciona sozinho com dados mock.

## Scripts

**Frontend** (`/`): `npm run dev` · `npm run build` · `npm run preview`

**Backend** (`/server`):

| Script             | O que faz                                  |
|--------------------|--------------------------------------------|
| `npm run dev`      | Sobe a API com reload (tsx watch)          |
| `npm run build`    | Type-check + compila para `dist/`          |
| `npm start`        | Roda o build (`node dist/index.js`)        |
| `npm run migrate`  | Aplica o schema                            |
| `npm run seed`     | Popula o banco com dados de exemplo        |
| `npm run db:reset` | `migrate` + `seed`                         |
| `npm test`         | Testes unitários (vitest)                  |

## Stack

- **Frontend:** React 19, TypeScript, Vite, React Router (HashRouter); design
  system próprio em CSS (sem libs de UI).
- **Backend:** Node, Express 5, TypeScript; validação com zod.
- **Banco:** SQLite (`better-sqlite3`). DDL PostgreSQL/Supabase em
  [`server/docs/schema.postgres.sql`](server/docs/schema.postgres.sql).

## Próximos passos (rumo à produção)

1. **WhatsApp Business API** (Meta Cloud API) com número aprovado e templates.
2. Trocar o SQLite por **PostgreSQL/Supabase** (basta um novo repositório — DIP).
3. **Autenticação/Autorização** por perfil e área.
4. **LGPD** — tratamento de dados sensíveis (IMEI, CPF, telefone) e consentimento.
5. Validação em piloto (20–50 atendimentos) com Carlcare, TFAE, Comercial e HQ.

## Deploy (GitHub Pages — só frontend)

O `vite.config.ts` usa `base: "/CRM/"` no build de produção e roteamento por hash.
O backend exige um host com Node + banco (não roda no Pages).
