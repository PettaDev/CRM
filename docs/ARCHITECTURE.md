# ARCHITECTURE — Carlcare CRM (Frontend)

> Session 3 (Refactor) context file. Read before any refactor.
> Last synced: 2026-06-30 · Stack snapshot from `package.json` + `src/`.

## 1. Stack

| Concern | Choice |
|---|---|
| UI | React **19.2** |
| Build | **Vite 8** + `@vitejs/plugin-react` |
| Language | TypeScript ~6.0 (strict assumed via `tsc -b`) |
| Routing | `react-router-dom` **7**, `HashRouter` |
| State | React Context API (no Redux/Zustand/RTK Query) |
| Data fetching | Hand-rolled `fetch` wrapper (`src/api/client.ts`) |
| Styling | Single global `src/index.css` + CSS variables (`data-theme`) |
| Tests | **Vitest 4** — `npm test` (scoped to `src/**/*.test.*`; `server/` excluded) |
| Lint | No `lint` script; `eslint-disable` comments present in source |

## 2. Module map

```
src/
├── main.tsx                 # React root
├── App.tsx                  # Providers + HashRouter + routes
├── api/
│   ├── client.ts            # fetch wrapper: BASE url, auth header, ApiError
│   ├── crm.api.ts           # REST methods (1:1 endpoint mapping) + DTO types
│   └── auth.api.ts          # login / me
├── auth/AuthContext.tsx     # session (user, token, login, logout)
├── settings/SettingsContext.tsx  # i18n lang + theme (localStorage)
├── context/CrmContext.tsx   # ALL domain state + mutations (god-context)
├── components/
│   ├── Layout.tsx           # shell: sidebar + topbar + notif dropdown
│   ├── RequireAuth.tsx      # route guard; mounts CrmProvider when authed
│   ├── StatusBadge.tsx      # colored status pill
│   ├── Logo.tsx, icons.tsx  # presentational
│   └── case-detail/         # CaseDetail orchestrator + 7 memo'd cards (TD-10)
├── pages/                   # Dashboard, Inbox, Cases, Automations,
│                            # Reports, ClientForm, Login
├── lib/meta.ts              # domain metadata, FSM, formatters, WA templates
├── lib/collections.ts       # patchById / upsertByKey (pure, TD-02)
├── i18n/dictionaries.ts     # pt/en/es/zh flat dictionaries (~355 lines)
├── data/mock.ts             # AGENTS, CASES, CONVERSATIONS, CLIENTS seed
└── types/index.ts           # domain types
```

## 3. Provider tree & data flow

```
<SettingsProvider>          (i18n + theme — always mounted)
  <AuthProvider>            (session — always mounted)
    <HashRouter>
      /login, /form/:token  → PUBLIC (no CrmProvider)
      <RequireAuth>         → redirects to /login if no user
        <CrmProvider>       → mounted ONLY when authenticated
          <Layout><Outlet/> → all protected pages
```

Key consequence: **`CrmProvider` is mounted by the route guard**, so domain
state hydrates only after auth. The public client form (`/form/:token`) talks to
the API directly via `crmApi`, bypassing `CrmContext` entirely.

## 4. Core architectural patterns (intentional — preserve)

1. **Offline-first / optimistic UI.** Local React state is the source of truth.
   On mount `CrmProvider` tries to hydrate from the backend; if it fails it keeps
   the mock seed (`apiStatus: "offline"`). Every mutation updates local state
   first, then fires a **best-effort** `crmApi.*().catch(() => {})`.
2. **`telefoneKey` association.** Digits-only phone (`phoneKey()`) is the join key
   linking Conversation ↔ Client ↔ Case. Used as the public form token.
3. **Status FSM.** `TRANSITIONS` in `lib/meta.ts` mirrors the backend state
   machine and drives the status dropdown.
4. **Domain metadata centralized** in `lib/meta.ts` (status labels/colors, areas,
   brands, formatters, WhatsApp templates).
5. **Thin API layer.** Components/contexts never call `fetch` directly — they go
   through `crmApi` → `http` → `client.ts`. (One violation: ViaCEP in
   `ClientForm.tsx`, see TECH_DEBT.)

## 5. Backend contract (observed from `crm.api.ts`)

REST, `VITE_API_URL` (default `http://localhost:3001/api`), Bearer token in
`localStorage["crm.token"]`. Notable: backend exposes `GET /stats`
(`DashboardStats`) but the frontend **recomputes** dashboard/report aggregates
client-side instead of using it (see TECH_DEBT TD-07).

## 6. Naming convention (current reality)

Mixed **Portuguese domain vocabulary** (`caso`, `novoStatus`, `aplicarStatus`,
`responsavel`) and **English framework/handler vocabulary** (`handleSubmit`,
`addCase`, `useMemo`). Domain types/fields are Portuguese. See CONVENTIONS.md.
