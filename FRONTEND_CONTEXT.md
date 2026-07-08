# Frontend Context — Carlcare CRM (Session 2: Frontend React)

> Reusable context for the React frontend. Read this first instead of relying on chat history.

## Working rules (read before ANY major code suggestion)
1. **Read this file first** before proposing major changes.
2. **Respect the current architecture and stack** (see below). No drive-by rewrites.
3. **No new libraries** unless clearly justified AND explicitly requested. Specifically
   banned unless I ask by name: **Redux, Zustand, React Query/TanStack Query, Tailwind**,
   or any other major dependency.
4. **Prefer existing patterns:** Context API, plain CSS, current folder structure.
5. **Incremental, production-safe improvements** over big-bang refactors.
6. **Priorities, in order:** re-render optimization → state-management simplicity →
   component reusability → UX consistency → performance.
7. **Before any refactor, explain in this order:**
   1) Current problem  2) Root cause  3) Proposed solution  4) Tradeoffs.

### When analyzing components, actively hunt for:
- Unnecessary re-renders · prop drilling · overly large components
- Bad hook dependency arrays · state duplication · memory leaks · poor accessibility

## Stack (actual, verified)
- **React 19.2** + **react-dom 19.2**
- **Vite 8** (`vite.config.ts`), build = `tsc -b && vite build`
- **TypeScript ~6.0** (strict via `tsconfig.app.json`)
- **react-router-dom 7** — `HashRouter` (SPA, hash routing)
- **Styling:** plain CSS via `src/index.css` (CSS variables for theming). **No Tailwind, no CSS Modules.**
- **State:** React Context only. **No Zustand / Redux / React Query.**
- **Data fetching:** hand-rolled fetch wrapper in `src/api/client.ts`.

## Architecture map
```
src/
  main.tsx                 # entry
  App.tsx                  # providers + routes (HashRouter)
  api/
    client.ts              # fetch wrapper / base client
    auth.api.ts            # auth endpoints
    crm.api.ts             # CRM endpoints (cases, conversations, clients, forms)
  auth/AuthContext.tsx     # JWT auth state
  context/CrmContext.tsx   # ALL CRM domain state (cases/conversations/clients)
  settings/SettingsContext.tsx  # i18n + theme (PT/EN/ES/zh, light/dark)
  components/
    Layout.tsx, RequireAuth.tsx, Logo.tsx, StatusBadge.tsx, icons.tsx
  pages/
    Login, Dashboard, Inbox, Cases, CaseDetail, Automations, Reports, ClientForm
  i18n/dictionaries.ts     # translation strings
  data/mock.ts             # CASES / CLIENTS / CONVERSATIONS seed data
  lib/meta.ts              # phoneKey, templateFormulario helpers
  types/index.ts           # domain types
```

## Provider tree
`SettingsProvider` → `AuthProvider` → `HashRouter` → routes.
`RequireAuth` mounts `CrmProvider` (CRM state only exists behind auth).
Public routes (no sidebar/CRM): `/login`, `/form/:token`.

## State model — "offline-first / optimistic UI"
`CrmContext` is the UI source of truth. On mount it hydrates from the backend
(`Promise.all` of listCases/listConversations/listClients); on failure it keeps
the mock seed (graceful degradation) and sets `apiStatus: "offline"`.
Every mutation updates local state immediately, then persists best-effort:
`void crmApi.x(...).catch(() => {})`.

## ⚠️ Known frontend risks / tech debt (to watch in this session)
1. **God-context re-renders.** `CrmContext` packs cases + conversations + clients +
   all mutators into a single `value`. Any mutation (e.g. `markRead`, `sendMessage`)
   changes the memoized `value`, so **every** `useCrm()` consumer re-renders even if
   it only reads `clients`. Candidate fixes: split into state vs. dispatch contexts,
   or per-slice contexts, or a selector pattern (`useContextSelector` / Zustand).
2. **`addCase` / `sendForm` depend on `cases` / `conversations`** in their `useCallback`
   deps → callbacks (and thus `value`) get new identities on every data change. Use
   functional `setState` to drop the deps where possible.
3. **No data-fetching cache layer** — manual fetch + local state. If server sync grows,
   evaluate TanStack Query for caching/dedup/retries.
4. **HashRouter** — fine for static hosting, but no clean URLs / SSR. Intentional for now.

## Conventions
- Comments and domain language are in **Portuguese (pt-BR)**; match it when editing.
- IDs: cases use `CC-<year>-<seq4>` (`nextCaseId` in CrmContext).
- Keep optimistic-update + best-effort-persist pattern for new mutations.
- i18n: add strings to `src/i18n/dictionaries.ts` for all 4 locales (PT/EN/ES/zh).

## Ignored from context
See `.claudeignore`: node_modules, dist, build, coverage, *.log, package-lock.json,
.next, storybook-static.
