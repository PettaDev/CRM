# REFACTOR ROADMAP — Carlcare CRM

> Ordered by **(high impact, low risk) first**. Each refactor is
> behavior-preserving unless flagged. Cross-refs → TECH_DEBT.md.
> Created 2026-06-30. Update the Status column as items land.

## Sequencing principle

1. Extract pure helpers/atoms (zero behavior risk, unlock tests).
2. Tame the boilerplate and memoization inside `CrmContext`.
3. Structural splits (god-context, large components).
4. Cross-session items (need Backend) last.

---

## Wave 1 — Pure extractions (low risk, quick wins)

| Step | Items | Risk | Effort | Notes |
|------|-------|------|--------|-------|
| 1.1 | `<Badge>` atom; refactor 3 call sites | Low | S | TD-04 |
| 1.2 | `initials()` helper | Low | S | TD-06 |
| 1.3 | `STORAGE_KEYS` + `lib/storage.ts` | Low | S | TD-05 |
| 1.4 | `isForaGarantia()` domain helper; use in context + Reports | Low | S | TD-07 |
| 1.5 | `genId(prefix)` util | Low | S | TD-12 |

→ Vitest is now set up (TD-15); add unit tests for 1.1–1.5 as they're extracted.

## Wave 2 — `CrmContext` internals (medium risk)

| Step | Items | Risk | Effort | Notes |
|------|-------|------|--------|-------|
| 2.1 | ✅ **DONE** `patchById`+`upsertByKey`+`persist`; dedupe & domain-group mutations | Low | M | TD-02 |
| 2.2 | ✅ **DONE** Stabilize `addCase` + `sendForm` via latest-state refs (deps → `[]`) | Low | S | TD-03 |
| 2.3 | ✅ **DONE** Split `value` into memoized `{ state, actions }` (flat facade kept) | Low | S | TD-01 P1 |
| 2.4 | ✅ **DONE** `CrmStateContext`/`CrmActionsContext` + `useCrmState`/`useCrmActions`; `useCrm` facade; `NewCaseModal` → `useCrmActions` | Low | M | TD-01 P2 |

## Wave 3 — Structural splits (medium risk)

| Step | Items | Risk | Effort | Notes |
|------|-------|------|--------|-------|
| 3.1 | ✅ **DONE** Decompose `CaseDetail` → `components/case-detail/` (7 memo'd cards; 3 action-only); fix stale-on-nav via keys | Med | L | TD-10 |
| 3.2 | Extract `NewCaseModal` from `Cases.tsx` | Low | M | TD-11 |
| 3.3 | Move ViaCEP into `api/cep.api.ts` | Low | S | TD-09 |
| 3.4 | Name filter sentinels / use `null` for "all" | Low | S | TD-14 |

## Wave 4 — Cross-session (needs Backend session)

| Step | Items | Risk | Effort | Notes |
|------|-------|------|--------|-------|
| 4.1 | `/agents` endpoint → remove `AGENTS` mock coupling | Med | M | TD-08 |
| 4.2 | Adopt `GET /stats` for Dashboard; drop client recompute | Med | M | TD-07/TD-13 |
| 4.3 | Per-aggregate providers + orchestration for `sendForm` (CrmContext phase 3) | Med | L | TD-01 P3 |

---

## Working agreement for this session

Before proposing/applying any refactor:
1. Read ARCHITECTURE / CONVENTIONS / REFACTOR_ROADMAP / TECH_DEBT.
2. Confirm it preserves the **offline-first optimistic** contract and the
   `useCrm` public API.
3. State **complexity · risk · expected impact** per the AskUser format.
4. Prefer the smallest reversible step; one wave item per change set.

## Status log

- 2026-06-30 — Docs bootstrapped; backlog inventoried (15 items).
- 2026-06-30 — **TD-03 done** (Wave 2.2, prioritized ahead of Wave 1 by
  architectural impact). `addCase` and `sendForm` now read latest state via
  `casesRef`/`conversationsRef`; both `useCallback` deps are `[]`. All 10 CrmContext
  actions are now referentially stable → unblocks TD-01's `{state, actions}` split.
  `tsc -b` clean. No behavior change (refs hold latest committed state).
- 2026-06-30 — **TD-02 done** (Wave 2.1). New `src/lib/collections.ts`
  (`patchById`, `upsertByKey`) + `persist()` in `src/api/client.ts`. All 9
  mutations rewritten through the helpers and reordered into domain clusters
  (Casos/Conversas/Clientes/Cross-domain). No `optimistic()` wrapper (avoided
  overengineering). `tsc -b` clean, behavior 1:1. **Finding:** `sendForm` is the
  lone cross-aggregate mutation — TD-01 must handle it explicitly.
- 2026-06-30 — **TD-01 Phase 1 done** (Wave 2.3). `CrmContextValue` is now
  `CrmState & CrmActions`; provider builds memoized `state` + (stable) `actions`
  and recombines into the same flat `value`. Zero behavior change — pure
  scaffolding for Phase 2. `tsc -b` clean, no consumer touched.
  **Next: TD-01 Phase 2 (Wave 2.4) — two contexts + `useCrmState`/`useCrmActions`,
  where the actual re-render win lands.**
- 2026-06-30 — **TD-01 Phase 2 done** (Wave 2.4). `CrmStateContext` +
  `CrmActionsContext` nested in `CrmProvider`; `useCrmState`/`useCrmActions` added;
  `useCrm` is now a recombining facade (100% backward compatible). First real
  re-render win: `NewCaseModal` migrated to `useCrmActions` (action-only).
  `tsc -b` clean. Mixed consumers (`Inbox`, `CaseDetail`) intentionally stay on
  `useCrm`. **Next: TD-01 Phase 3 (Wave 4.3, evaluate) OR back to Wave 1 quick
  wins (`<Badge>`/`initials`/storage keys) + TD-15 tests for the new helpers.**
- 2026-06-30 — **TD-10 done** (Wave 3.1). `CaseDetail` decomposed into
  `src/components/case-detail/` (orchestrator + 7 `React.memo` cards; the 3 form
  cards are action-only via `useCrmActions`). Stale-on-navigation **fixed** with
  distinct per-card `key`s. `App.tsx` import updated, old `pages/CaseDetail.tsx`
  removed, `tsc -b` clean. This is the first consumer of the Phase 2 split beyond
  `NewCaseModal`. **Next: TD-15 — Vitest for `patchById`/`upsertByKey`.**
- 2026-06-30 — **TD-15 started.** Vitest 4 installed; `test`/`test:watch` scripts;
  discovery scoped to `src/` (server/ excluded). `src/lib/collections.test.ts`:
  17 tests green, incl. `toBe` reference-preservation checks for memo correctness.
  `tsc -b` clean. **Architectural catch:** default Vitest swept `server/` (backend
  package) — fixed via `test.include`. **Next: Wave 1 quick wins (`<Badge>` TD-04,
  `initials` TD-06, storage keys TD-05) with tests, or TD-09 (ViaCEP → api layer).**
