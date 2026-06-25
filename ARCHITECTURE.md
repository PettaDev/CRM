# Arquitetura & Conceitos de Software Engineering

Este projeto é um CRM full-stack (frontend + backend + banco) propositalmente
estruturado para **estudar conceitos de engenharia de software** em código real.
Abaixo, onde cada conceito aparece.

```
┌─────────────────────────────┐     HTTP/JSON      ┌──────────────────────────────┐
│  FRONTEND (React + Vite)     │  ───────────────▶  │  BACKEND (Express + TS)       │
│                              │                    │                               │
│  pages → components          │   GET /cases       │  routes → controllers         │
│  context (estado + UI)       │   POST /clients/.. │      → services (regras)      │
│  api/ (client HTTP)          │  ◀───────────────  │      → repositories (dados)   │
└─────────────────────────────┘     JSON            │      → SQLite (banco)         │
                                                    └──────────────────────────────┘
```

## Fluxo de uma requisição (ex.: cliente envia o formulário)

```
POST /api/clients/5511955550001/form
  → middleware CORS / json / logger
  → validate(clientFormSchema)        # DTO: valida e saneia o corpo (zod)
  → ClientController.submitForm        # traduz HTTP ↔ serviço (fino)
  → ClientService.submitForm           # REGRA DE NEGÓCIO (associa pelo telefone)
  → ClientRepository.savePreenchido    # ACESSO A DADOS (SQL + transação)
  → SQLite                             # persiste (clients + client_forms)
  ← Client (JSON)                      # resposta
  (erro em qualquer ponto → errorHandler centralizado → { code, message })
```

## Camadas do backend e responsabilidades

| Camada            | Pasta                  | Responsabilidade                                   |
|-------------------|------------------------|----------------------------------------------------|
| Rotas             | `src/routes`           | Mapeia URL+verbo → controller (+ validação)         |
| Controllers       | `src/controllers`      | Traduz HTTP ↔ serviço. **Sem** regra de negócio     |
| Services          | `src/services`         | Regras de negócio / casos de uso                    |
| Repositories      | `src/repositories`     | Acesso a dados (SQL). Mapeia linha ↔ domínio         |
| Domínio           | `src/domain`           | Tipos, constantes e erros (não conhece HTTP/SQL)    |
| DTO               | `src/dto`              | Esquemas de validação (zod) + tipos de entrada      |
| Middleware        | `src/middleware`       | Preocupações transversais (validação, erro, log)    |
| DB                | `src/db`               | Conexão, schema, migração e seed                    |
| Composition root  | `src/index.ts`         | Monta o grafo de dependências e sobe o servidor     |

## Conceitos aplicados (e onde olhar)

- **Arquitetura em camadas / separação de responsabilidades** — cada pasta tem
  uma única razão para mudar. A UI não sabe SQL; o domínio não sabe HTTP.
- **SOLID**
  - *S* (Single Responsibility): controller só faz HTTP; service só regra; repo só dados.
  - *D* (Dependency Inversion): serviços dependem de **interfaces** de repositório
    (`CaseRepository`), não da classe `SqliteCaseRepository`. Ver `services/*` + `repositories/*`.
  - *O/L/I*: trocar o SQLite por Postgres = nova classe que implementa a mesma interface.
- **Repository Pattern** — `repositories/*.repository.ts` (interface + adaptador SQLite).
- **DTO + validação na borda** — `dto/*.dto.ts` (zod) + `middleware/validate.ts`.
- **Injeção de dependência / Composition Root** — `src/index.ts` cria
  repos → services → controllers e injeta tudo. Facilita teste e troca de implementação.
- **Tratamento de erros centralizado** — `domain/errors.ts` (hierarquia `AppError`)
  + `middleware/error-handler.ts` (um único lugar decide status/forma da resposta).
- **Testabilidade** — `tests/case.service.test.ts` testa o serviço com um
  **repositório falso** (sem banco), graças à DIP.
- **Modelagem de dados / normalização** — `db/schema.ts`: histórico de status e
  mensagens em tabelas-filho (1:N), FOREIGN KEYs, CHECK constraints, índices.
- **Transações** — operações multi-tabela (criar caso + eventos, enviar form) são
  atômicas (`db.transaction(...)`).
- **Migração & seed** — `db/migrate.ts` / `db/seed.ts` (scripts versionáveis).
- **Configuração por ambiente (12-factor)** — `config/env.ts` lê de `.env`.
- **REST** — recursos no plural, verbos HTTP, status codes (201 criado, 404, 409, 422).
- **Mapeamento / Anti-corruption** — repositórios convertem linha do banco
  (snake_case) ↔ objeto de domínio (camelCase); nenhuma outra camada vê SQL.
- **Offline-first / UI otimista (frontend)** — `context/CrmContext.tsx`: o estado
  local é a fonte de verdade da UI; hidrata do backend e persiste best-effort,
  com fallback ao mock se a API estiver fora (degradação graciosa).
- **Chave de associação** — `utils/phone.ts` (back) e `lib/meta.ts` (front)
  normalizam o telefone; é a chave que liga conversa ↔ cliente ↔ caso.

## Endpoints

| Método | Rota                                  | Ação                                  |
|--------|---------------------------------------|---------------------------------------|
| GET    | `/api/health`                         | Healthcheck                           |
| GET    | `/api/cases`                          | Lista casos                           |
| GET    | `/api/cases/:id`                      | Detalhe do caso                       |
| POST   | `/api/cases`                          | Cria caso                             |
| PATCH  | `/api/cases/:id/status`               | Muda status (+ evento no histórico)   |
| GET    | `/api/conversations`                  | Lista conversas                       |
| POST   | `/api/conversations/:id/messages`     | Envia mensagem                        |
| POST   | `/api/conversations/:id/read`         | Marca como lida                       |
| POST   | `/api/conversations/:id/send-form`    | Dispara o formulário ao cliente       |
| GET    | `/api/clients`                        | Lista clientes                        |
| GET    | `/api/clients/:key`                   | Cliente por telefone (chave)          |
| POST   | `/api/clients/:key/form`              | Cliente envia o cadastro preenchido   |
| GET    | `/api/stats`                          | Indicadores do dashboard (GROUP BY)   |

## Exercícios sugeridos (para praticar)

1. Adicionar paginação a `GET /cases` (query params + validação).
2. Criar um `PostgresCaseRepository` implementando `CaseRepository` (troca via DIP).
3. Resolver o N+1 em `ClientRepository.findAll` com um `LEFT JOIN`.
4. Extrair `phoneKey` para um pacote `shared/` consumido por front e back.
5. Adicionar autenticação (middleware) e autorização por perfil/área.
6. Cobrir `ClientService` e `ConversationService` com testes (como em `tests/`).
