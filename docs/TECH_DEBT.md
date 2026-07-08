# TECHNICAL DEBT BACKLOG — Carlcare CRM

> Inventory from the 2026-06-30 codebase scan. Each item: Problem · Root Cause ·
> Severity · Effort · Impact · Strategy. Severity = maintainability risk, not
> user-facing bug. Behavior-preserving unless stated.
> Effort: S (<1h) · M (half-day) · L (1d+).

Legend — **Sev**: Low / Med / High · **Eff**: S/M/L · **Imp**: maintainability gain.

| ID | Title | Sev | Eff | Imp |
|----|-------|-----|-----|-----|
| TD-01 | `CrmContext` god-context (low cohesion, 341 lines) | High | L | High |
| TD-02 | Duplicated optimistic-update + best-effort-persist boilerplate | Med | M | High |
| TD-03 | `addCase` depends on `cases` → invalidates whole context memo | Med | S | Med |
| TD-04 | Color-pill (`color-mix`) styling duplicated 3× | Med | S | Med |
| TD-05 | `localStorage` keys as scattered magic strings | Low | S | Med |
| TD-06 | "initials from name" logic duplicated 3× | Low | S | Low |
| TD-07 | Warranty derivation rule duplicated (context vs Reports) + unused `/stats` | Med | M | Med |
| TD-08 | `AGENTS` imported from `data/mock` in a production component | Med | M | Med |
| TD-09 | ViaCEP `fetch` inline in `ClientForm` bypasses API layer | Med | S | Med |
| TD-10 | `CaseDetail` large multi-responsibility component (~310 lines) | Med | L | Med |
| TD-11 | `Cases.tsx` mixes list page + `NewCaseModal` (~388 lines) | Low | M | Low |
| TD-12 | Collision-prone IDs (`m-${Date.now()}`, `Date.now()`) | Low | S | Low |
| TD-13 | Dashboard/Reports recompute aggregates with repeated `filter` passes | Low | M | Low |
| TD-14 | Stringly-typed filter sentinels (`"todos"/"todas"`) | Low | S | Low |
| TD-15 | No tests; logic embedded in components/context lowers testability | Med | L | High |

---

## TD-01 — `CrmContext` is a god-context — 🔄 IN PROGRESS (phased)
- **Problem:** `context/CrmContext.tsx` owns *all* domain state (cases,
  conversations, clients, apiStatus) and 9 mutations in one `value`. Any change to
  any slice re-renders every consumer (Dashboard, Inbox, Cases, Layout…).
- **Root cause:** No separation between unrelated aggregates; single value object.
- **Constraint:** Keep `useCrm()` as an unchanged facade throughout. No Redux.

**Phased plan (agreed 2026-06-30):**
- **Phase 1 — ✅ DONE (2026-06-30).** Split `value` into internally memoized
  `state` (`CrmState`) and `actions` (`CrmActions`) groups; recombine into the
  same flat `value`. `CrmContextValue = CrmState & CrmActions`. `actions` is now
  a permanently stable reference (all action deps `[]`). **Zero behavior change**
  — `value` still changes when data changes, so consumer re-renders are identical.
  Pure scaffolding for Phase 2. `tsc -b` clean.
- **Phase 2 — ✅ DONE (2026-06-30).** Two contexts (`CrmStateContext`,
  `CrmActionsContext`) nested in `CrmProvider`; added `useCrmState()` /
  `useCrmActions()`. `useCrm()` is now a recombining facade (reads both, returns
  the flat object) — fully backward compatible, no consumer broken. `tsc -b`
  clean. **Consumer audit (action-only = immediate win):**
  - **action-only:** `NewCaseModal` (`Cases.tsx`) — uses only `addCase`.
    ✅ migrated to `useCrmActions()`; no longer re-renders on cases/conversations/
    clients changes.
  - **state-only** (no perf delta, migrated for clarity where touched):
    `Dashboard`, `Layout`, `Reports`, `Automations`, `Cases` page (→ `useCrmState`).
  - **mixed** (must subscribe to state — stay on `useCrm`): `Inbox`, `CaseDetail`.
- **Phase 3 — TODO (evaluate).** Consider per-aggregate providers (Cases /
  Conversations / Clients). **Blocker to design around:** `sendForm` is the only
  cross-aggregate mutation (writes clients + conversations) → needs a thin
  orchestration layer rather than living in a single aggregate provider.
- **Risk:** Phase 1 very low; Phase 2 low (additive hooks); Phase 3 medium
  (consumer migration + orchestration). Each lands behind the `useCrm` facade.

## TD-02 — Duplicated mutation boilerplate — ✅ DONE (2026-06-30)
> Extracted `patchById` + `upsertByKey` (pure, `src/lib/collections.ts`) and
> `persist(promise)` (`src/api/client.ts`). All 9 mutations rewritten through them
> and **reordered into domain clusters** (Casos / Conversas / Clientes /
> Cross-domain). Deliberately did **not** add an `optimistic(update, call)`
> wrapper — state updates vary (single/dual setter, upsert), so a combined wrapper
> added indirection without removing lines. `tsc -b` passes; behavior 1:1.
>
> **TD-01 input:** `sendForm` is the **only** cross-aggregate mutation (writes
> `clients` AND `conversations`). A clean per-provider split can't contain it — it
> needs a coordinating layer or must live in the workflow's owning provider.

- **Problem:** ~8 mutations repeated: `const now = new Date().toISOString()` →
  `setX(prev => prev.map(c => c.id === id ? {...c, …} : c))` →
  `void crmApi.x(...).catch(() => {})`. Clients added a 2nd repeated shape:
  upsert-by-`telefoneKey` (`sendForm`, `submitForm`).
- **Root cause:** No shared "patch entity by id + persist" helper.
- **Strategy (as built):** `patchById(list, id, patch)` where `patch` is
  `Partial<T> | (item) => Partial<T>`; `upsertByKey(list, keyOf, key, update,
  create)`; `persist(p)` for best-effort fire-and-forget.

## TD-03 — `addCase` over-broad dependency — ✅ DONE (2026-06-30)
> Resolved for both `addCase` (`[cases]`) and `sendForm` (`[conversations]`) using
> `casesRef`/`conversationsRef` synced in an effect. All 10 actions now stable
> (`[]`). Standalone runtime gain ~0 today (value memo still keyed on data);
> the win is the architectural precondition for TD-01. `tsc -b` passes.

- **Problem:** `addCase = useCallback(..., [cases])` recreates on every cases
  change, invalidating the whole `value` memo → defeats the memoization.
- **Root cause:** `nextCaseId(cases)` reads current state from closure.
- **Strategy:** Compute the next id inside a functional update
  (`setCases(prev => [novo(prev), ...prev])`) so the dependency drops to `[]`.
  Watch the `return id` contract — derive id before/inside without re-reading.
- **Risk:** Low; preserve returned id used by `Cases` to navigate.

## TD-04 — Duplicated color-pill styling
- **Problem:** The `color-mix(... 14%/32% ...)` badge style block is copy-pasted in
  `StatusBadge.tsx`, `Inbox.tsx` (`FormStatusBadge`) and `CaseDetail.tsx`
  (fora-de-garantia badge).
- **Root cause:** No shared `<Badge color label dot? />` atom.
- **Strategy:** Create `components/Badge.tsx`; refactor the 3 sites to use it.
  `StatusBadge`/`FormStatusBadge` become thin wrappers mapping meta → `<Badge>`.
- **Risk:** Low (visual parity check).

## TD-05 — Scattered storage keys
- **Problem:** `"crm.token"` appears in both `client.ts` and `AuthContext.tsx`;
  `"crm.lang"`, `"crm.theme"` inline in `SettingsContext`.
- **Strategy:** `lib/storage.ts` with `STORAGE_KEYS` const (+ optional typed
  get/set). Replace literals.
- **Risk:** Low.

## TD-06 — Duplicated initials logic
- **Problem:** `name.split(" ").slice(0,2).map(p => p[0]).join("")` repeated in
  `Layout` (user + notif) and `Inbox`.
- **Strategy:** `lib/meta.ts` (or `lib/text.ts`) → `initials(name: string)`.
- **Risk:** Trivial.

## TD-07 — Warranty rule duplicated + server stat ignored
- **Problem:** "out of warranty" is derived as `queda||agua||aberto` in
  `CrmContext.updateGarantia`, but `Reports.tsx` re-derives it differently
  (`foraGarantia || queda || agua || aberto`). Two sources of one business rule.
  Separately, backend `GET /stats` exists but Dashboard recomputes client-side.
- **Root cause:** Domain rule not centralized.
- **Strategy:** Add `isForaGarantia(case)` to `lib/meta.ts`; use it in both
  places. (Stats endpoint adoption is a Backend-session decision — note only.)
- **Risk:** Low for the helper; confirm the two predicates were meant to be equal.

## TD-08 — Mock coupling in production code
- **Problem:** `Cases.tsx` imports `AGENTS` from `data/mock`; `EMPTY` uses
  `AGENTS[0].nome` (runtime crash if list empty; couples UI to seed ordering).
- **Strategy:** Source agents from API/context. Until backend provides them, at
  least guard `AGENTS[0]?.nome ?? ""` and isolate the import. Coordinate with
  Backend session for an `/agents` endpoint.
- **Risk:** Med (depends on backend availability).

## TD-09 — ViaCEP fetch bypasses API layer
- **Problem:** `ClientForm.tsx` calls `fetch("https://viacep.com.br/...")`
  directly — a hidden external dependency outside `api/`.
- **Strategy:** Move to `api/cep.api.ts` (`lookupCep(cep)`), keep the effect in
  the component. Improves testability/mocking.
- **Risk:** Low.

## TD-10 — `CaseDetail` does too much — ✅ DONE (2026-06-30)
> Decomposed into `src/components/case-detail/`: `CaseDetail` (orchestrator) +
> `CaseInfoGrid`, `DefeitoCard`, `StatusUpdateCard`, `WarrantyTriageCard`,
> `ShipmentCard`, `CaseTimeline`, `WhatsAppAutomationsCard`. All children
> `React.memo`. The three form cards are **action-only** (`useCrmActions()` only,
> no state-context subscription) holding their own input state. Orchestrator uses
> `useCrmState()` for `cases.find` and holds **no** form state; redundant
> `if (!caso) return` guards gone (non-null `caso`/fields passed as props).
> `App.tsx` import updated; old `src/pages/CaseDetail.tsx` removed. `tsc -b` clean.
>
> **Behavior change (requested):** stale-on-navigation **fixed** — stateful cards
> carry distinct `key`s (`info-/status-/warranty-/ship-${caso.id}`; distinct to
> avoid duplicate-sibling-key warnings) so they remount and re-sync when `:id`
> changes. Bonus: revealed IMEI resets per case (privacy/LGPD).
>
> **Perf realized:** typing in any form no longer re-renders siblings (local
> state contained); and because memoized children take a ref-stable `caso`,
> conversation/client activity (which still re-renders the orchestrator via the
> monolithic state context) **no longer re-renders the case cards**. Per-aggregate
> contexts (TD-01 P3) would remove even the orchestrator re-render.

- **Problem (was):** One component rendered + managed local state for status,
  warranty, shipment, timeline, automations; repeated `if (!caso) return` guards.

## TD-11 — `Cases.tsx` page + modal in one file
- **Strategy:** Extract `NewCaseModal` to `components/` or `pages/cases/`. Low
  priority; do alongside TD-08 since both touch the modal.

## TD-12 — Weak ID generation
- **Problem:** `m-${Date.now()}` / `Date.now()` for message & shipment ids can
  collide on rapid actions.
- **Strategy:** Small `genId(prefix)` util (counter or `crypto.randomUUID()`).
- **Risk:** Low.

## TD-13 — Repeated aggregate passes
- **Problem:** Dashboard runs many `cases.filter(...)` passes; Reports defines a
  `count` helper inside `useMemo`.
- **Strategy:** Single-pass reducers; hoist `count` to `lib/`. Premature to
  optimize at current data sizes — bundle with TD-07 if/when stats centralize.

## TD-14 — Stringly-typed sentinels
- **Strategy:** Name the `"todos"/"todas"` filter unions or use `null` for "all".

## TD-15 — No test coverage — 🔄 IN PROGRESS (2026-06-30)
> Vitest 4 set up (`npm test` / `npm run test:watch`), scoped to
> `src/**/*.test.*` via `vite.config.ts` `test.include` (the `server/` package has
> its own runner — must not be swept). First suite:
> `src/lib/collections.test.ts` — **17 tests, all green**, covering `patchById`
> and `upsertByKey` incl. explicit **reference-preservation** (`toBe`) assertions
> that `React.memo` relies on. `tsc -b` clean (test files are typechecked).
>
> **Reference-preservation audit (confirmed by tests):**
> - `patchById`: unchanged items keep their reference (`: item` branch); the
>   matched item gets a **new** reference; the array is **always** new (`map`).
> - `upsertByKey`: unchanged items keep their reference in both branches; the
>   matched item's reference is preserved **iff** `update` returns the same object
>   (the `sendForm` "already preenchido" guard exploits this); array always new.
>
> **Minor notes (not blocking):** `patchById` allocates a new array even on a
> no-match call; an empty patch still yields a new matched-item reference;
> `upsertByKey` is O(2n) (`some` + `map`). All acceptable at current scale.
>
> **Remaining:** consider tests for `lib/meta` pure fns (`nextCaseId` if hoisted,
> `maskImei`, `timeAgo`, `statusOptions`) and the future extracted helpers
> (`initials`, `isForaGarantia`). Component tests deferred.

- **Strategy:** As pure helpers get extracted, add Vitest unit tests for them
  first — highest ROI, lowest risk. Defer component tests.
