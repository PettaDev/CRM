# Backend API — Context (Session 1)

> Carlcare CRM REST API. **Express 5 + TypeScript (ESM) + better-sqlite3 + zod + JWT.**
> This file is the source of truth for backend work. Read it before asking. Keep it updated.
> Companion: [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (layer/concept map, endpoint table).

## Working rules (apply before any major code suggestion)
1. Re-read this file (`server/CLAUDE.md`) first.
2. Respect the existing architecture — fit the layer model below, don't bypass it.
3. Avoid unnecessary rewrites — touch the minimum surface needed.
4. Prefer incremental, production-safe changes (additive, reversible, backward-compatible).

## Stack & commands (run inside `server/`)
- Runtime: Node ≥ 20.12 (uses native `process.loadEnvFile`). ESM (`"type":"module"` — use `.js`-less relative imports, `import type` for types).
- `npm run dev` — tsx watch on `src/index.ts`
- `npm run build` — `tsc` → `dist/`
- `npm start` — `node dist/index.js`
- `npm run migrate` / `npm run seed` / `npm run db:reset`
- `npm test` — vitest (`tests/*.test.ts`, services tested with fake repos)

## Architecture rules (enforce on every change)
Request flow: **route → (validate DTO) → controller → service → repository → SQLite**, errors → central `errorHandler`.

| Layer | Folder | Allowed to know |
|---|---|---|
| Routes | `src/routes` | URL+verb → controller, attach `validate(schema)` / `requireAuth` |
| Controllers | `src/controllers` | HTTP ↔ service translation. **No business logic** |
| Services | `src/services` | Business rules. Depend on repo **interfaces**, never `Sqlite*` classes |
| Repositories | `src/repositories` | SQL only. Map row (snake_case) ↔ domain (camelCase) |
| Domain | `src/domain` | Types, constants, errors. **No HTTP/SQL imports** |
| DTO | `src/dto` | zod schemas + inferred input types |
| Middleware | `src/middleware` | Cross-cutting: validate, error-handler, request-logger, require-auth |
| DB | `src/db` | connection, schema, migrate, seed |
| Composition root | `src/index.ts` | Builds repos → services → controllers, injects all. **Only place that names concrete classes** |
| App factory | `src/app.ts` | `createApp(controllers, requireAuth)` — IoC, no concrete deps |

Hard rules:
- New feature = full vertical slice: `domain/types` → `dto` (zod) → `repository` (interface + Sqlite impl) → `service` → `controller` → `routes`, then wire in `index.ts`.
- Services receive dependencies via constructor. **Never** `new SqliteXRepository()` outside `index.ts`.
- Multi-table writes go through `db.transaction(...)` (see `case.repository.ts`).
- Validate all input at the border with zod via `middleware/validate.ts`. Controllers trust validated input.
- Throw typed errors from `domain/errors.ts` (`NotFoundError`, `ValidationError` 422, `ConflictError` 409, `UnauthorizedError` 401, `ForbiddenError` 403). Never `res.status(...).json(error)` ad hoc — let `errorHandler` shape `{ code, message, details? }`.
- Derived fields (e.g. `foraGarantia`) are computed in the mapper, **not persisted**.

## API conventions
- Base path `/api`. REST: plural resources, HTTP verbs, status codes (201 created, 404, 409, 422).
- Auth: `Authorization: Bearer <JWT>`. Protected routes use the `requireAuth` middleware; `req.user` (typed in `types/express.d.ts`) is `{ id, nome, email, area, role }`.
- Login gate: only `@transsion.com` / `@carlcare.com` (`domain/auth.ts: isAllowedEmail`). JWT TTL 8h, bcrypt password hashes.
- Health: `GET /api/health`.
- Full endpoint list lives in `../ARCHITECTURE.md`.

## Config / env (`src/config/env.ts`)
`PORT` (3001) · `CORS_ORIGIN` (http://localhost:5173) · `DATABASE_FILE` (data/carlcare.sqlite) · `JWT_SECRET` (default dev value).

## Known tech-debt / risks (backlog — confirm before assuming fixed)
1. **`JWT_SECRET` missing from `.env.example`** and falls back to a hardcoded dev secret. Must be set & required in prod (fail fast if unset).
2. **No rate limiting on `POST /api/auth/login`** → brute-force exposure.
3. **No request body size limit** (`express.json()` unbounded) and no security headers (no `helmet`).
4. **`CaseRepository.nextId()`** scans all ids in JS and is race-prone under concurrency; revisit if write volume grows.
5. **N+1 in `ClientRepository.findAll`** (per ARCHITECTURE.md) — candidate for a `LEFT JOIN`.
6. **No pagination** on list endpoints (`GET /cases`, `/clients`, `/conversations`).

## When adding code
- Match existing PT-BR comment style and naming (domain fields are Portuguese: `cliente`, `telefone`, `garantia*`).
- Keep SQL parameterized (named `@param` or positional `?`) — never string-interpolate input.
- Add/adjust a vitest test with a fake repository for new service logic.
