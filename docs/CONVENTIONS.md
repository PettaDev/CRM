# CONVENTIONS — Carlcare CRM

> Refactor rule: **follow the conventions that already dominate the codebase.**
> Document deviations here; don't silently introduce a new style.

## Language

- **Domain vocabulary is Portuguese** and must stay so: `caso`, `cliente`,
  `responsavel`, `marca`, `modelo`, `defeito`, `garantia`, `remessa`, `area`.
  Domain types and their fields (`ServiceCase.cliente`, `Conversation.telefone`)
  are Portuguese — do not anglicize them (breaks the backend contract).
- **Framework/plumbing vocabulary is English**: `handleSubmit`, `useMemo`,
  `loading`, `error`, component names (`CaseDetail`, `StatusBadge`).
- Local UI handlers may be Portuguese when they act on domain verbs
  (`aplicarStatus`, `salvarGarantia`, `registrarEnvio`, `selecionar`, `enviar`).
  This is the established pattern — keep it; don't mix both for one concept.

## Files & components

- One page per file in `pages/`; **default export** the page component.
- Small private sub-components live **in the same file**, declared **after** the
  default export (e.g. `KpiCard` in `Dashboard.tsx`, `NewCaseModal` in
  `Cases.tsx`, `ClientPanel`/`FormStatusBadge` in `Inbox.tsx`).
  → When a sub-component is reused across files, promote it to `components/`.
- Reusable presentational atoms go in `components/`.
- Cross-cutting pure logic (formatters, domain metadata, derivations) goes in
  `lib/`.

## State & context

- Context hooks throw if used outside their provider
  (`useCrm`, `useAuth`, `useT`) — keep this guard on any new context.
- Context value is wrapped in `useMemo`; callbacks in `useCallback`.
  **Dependency arrays must be honest** — prefer functional `setState(prev => …)`
  updates so callbacks don't depend on the state they mutate (see TD-03).
- `// eslint-disable-next-line react-refresh/only-export-components` precedes the
  hook export co-located with a provider component — keep the pattern.

## API access

- **Never call `fetch` directly** in a component or context. Add a method to
  `crmApi` (or a new `*.api.ts`) and call through `http`.
- API methods map **1:1 to endpoints**; DTO types live next to them in the
  `*.api.ts` file.
- Mutations from `CrmContext` are **best-effort**: optimistic local update first,
  then `void crmApi.x(...).catch(() => {})`. Preserve this contract when
  refactoring — do not make the UI await the network.

## Styling

- Use existing CSS classes from `index.css`; prefer classes over inline styles.
- **Exception today:** dynamic status colors use inline
  `color-mix(in srgb, <color> 14%, transparent)`. This is duplicated 3× and
  should become a single `<Badge>` component (TD-04) — route new color pills
  through it instead of copy-pasting the style object.

## Types

- Domain types in `types/index.ts`; DTOs/inputs co-located in `api/*.ts`
  (e.g. `GarantiaInput`, `ShipmentInput`, `NewCaseInput`).
- Avoid stringly-typed sentinels inline (`"todos"`, `"todas"`); when reused,
  give them a named union/const.

## Testing

- **Runner:** Vitest 4. `npm test` (CI/one-shot) · `npm run test:watch` (dev).
- **Scope:** frontend only — `vite.config.ts` `test.include` limits discovery to
  `src/**/*.test.{ts,tsx}`. The `server/` package owns its own tests; never widen
  this to the repo root.
- **No globals:** import `{ describe, it, expect }` from `"vitest"` explicitly
  (`tsconfig` uses `types: ["vite/client"]`, so Vitest globals aren't injected).
- **Co-locate** tests next to source: `foo.ts` → `foo.test.ts`.
- **Start with pure functions** (`lib/`) — highest ROI. For anything feeding
  `React.memo`, assert **reference preservation** with `toBe`/`not.toBe`, not just
  value equality (`toEqual`).

## Constants

- Centralize magic strings that appear in >1 file:
  - `localStorage` keys (`crm.token`, `crm.lang`, `crm.theme`) — currently
    duplicated (TD-05).
  - ID prefixes (`CC-YYYY-####`, `m-…`).
