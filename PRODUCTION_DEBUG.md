# Production Debug — Context (Session 4)

> Carlcare CRM. Source of truth for **incident response, RCA, log/runtime investigation**.
> Companions: backend [`server/CLAUDE.md`](server/CLAUDE.md) · [`ARCHITECTURE.md`](ARCHITECTURE.md) · frontend [`FRONTEND_CONTEXT.md`](FRONTEND_CONTEXT.md).
> Keep this updated: append every real incident to the **Incident Log** below.

## System shape (this drives every failure mode)
- **Single Node process**, Express 5 (ESM), served behind Vite frontend (`:5173` → API `:3001`).
- **better-sqlite3 is SYNCHRONOUS** → any slow query / large result set **blocks the entire event loop** → *all* requests stall, not just the slow one. This is the #1 thing to suspect for "everything is slow."
- **SQLite = single writer.** WAL mode is on (`data/carlcare.sqlite{,-wal,-shm}`). Concurrent writes serialize → watch for `SQLITE_BUSY`.
- **bcrypt on login is CPU-heavy** and login has **no rate limit** → a burst of login attempts can pin CPU and starve the event loop.
- Stateless JWT (8h TTL). Restart does **not** invalidate tokens *unless* `JWT_SECRET` changed (it falls back to a hardcoded dev value if unset — see risk #1).

## Observability surface (what we actually have)
| Signal | Where | Gaps (why monitoring may miss things) |
|---|---|---|
| Request logs | `middleware/request-logger.ts` → **console (stdout)** | No file, no rotation, **ephemeral** — gone on restart. No request ID / correlation. |
| Errors | `middleware/error-handler.ts` → console (stderr), shaped `{code,message,details?}` | Only logs what reaches the handler; thrown-before-route or event-loop stalls won't appear. |
| Health | `GET /api/health` | Liveness only — does **not** check DB. Can return 200 while SQLite is locked. |
| Metrics / traces / APM | **none** | No latency/CPU/mem/p99, no slow-query log. Latency regressions are invisible until a human notices. |

**Implication for "why didn't monitoring catch it?":** almost always *because we have no metrics and logs are ephemeral console output.* Capturing logs to a file/aggregator is the standing prevention item.

## Top predicted failure modes (ranked, evidence-first)
1. **Event-loop stall → global latency** caused by `ClientRepository.findAll` N+1 and/or unpaginated list endpoints (`/cases`, `/clients`, `/conversations`). Symptom: *all* endpoints slow at once, including `/health`. Evidence: request-logger durations climb together; sqlite file/row growth.
2. **`SQLITE_BUSY` / write contention** under concurrent writes; `CaseRepository.nextId()` scans all ids in JS (race-prone). Symptom: intermittent 500s on POST/PUT, not on GET.
3. **CPU spike from login brute force** (no rate limit + bcrypt). Symptom: CPU pinned, latency up, many `POST /api/auth/login` in logs.
4. **OOM / large-payload** — `express.json()` has no body-size limit. Symptom: memory climb, process restart/crash on a single big request.
5. **Auth "mass logout" / 401 storm** — `JWT_SECRET` changed between deploys (or env unset → dev fallback). Symptom: every authed request 401 right after a deploy.
6. **Deploy regression** — check recent commits **first** (see `git log`). Most recent: notifications dropdown / dark-theme / login-JWT work.

## Triage runbook (fast path)
1. **Scope**: one endpoint or everything? Everything slow ⇒ suspect event-loop/DB (causes #1–#4). One endpoint ⇒ that route/query.
2. **Recent change first**: `git log --oneline -10`; correlate incident start with last deploy.
3. **Liveness vs readiness**: `curl :3001/api/health` (200 ≠ healthy DB). Then hit a real read endpoint and time it.
4. **DB lock/size**: check `data/carlcare.sqlite-wal` size (large/growing WAL = long-running/again-blocked writes); look for `SQLITE_BUSY` in stderr.
5. **Process**: CPU% and RSS of the node process. Pinned CPU ⇒ bcrypt/login or a hot sync query. Climbing RSS ⇒ payload/leak.
6. **Logs**: scan request-logger durations (find the slow route) and error-handler `code`s. Logs are console-only — capture them *now* before restart wipes them.
7. **Isolate**: reproduce the slow call directly against the API with `curl`/timing, bypassing the frontend.

## Standing rules for this session (apply to EVERY suggestion)
- **Read this file first**, then reason evidence-only — no conclusion without logs / traces / metrics / code.
- **Symptom ≠ root cause** — keep them explicitly separate.
- **Production-safe mitigation first**; defer deep refactor.
- **Check recent changes first**: deploys, config/env changes, migrations (`git log --oneline -10`).
- Consider **infra / application / database / third-party** failure domains *separately*.
- State an explicit **confidence level (High / Medium / Low)** for every hypothesis.
- Answer the four questions every time: why did it happen · why **now** · why wasn't it detected earlier · how to prevent recurrence.

## Incident response template (use for every incident)
1. **Incident Summary**
2. **Symptoms**
3. **Possible Root Causes** — ranked by likelihood, each with confidence (H/M/L)
4. **Evidence Supporting Each Hypothesis** — logs / traces / metrics / code; note where evidence is missing
5. **Investigation Plan**
6. **Immediate Mitigation** (production-safe)
7. **Permanent Fix**
8. **Prevention**

Stack-specific checklist (run through these before concluding): event-loop blocking · slow SQLite queries · WAL locks / `SQLITE_BUSY` · memory pressure · CPU spikes · login brute-force / bcrypt saturation · N+1 amplification · unbounded payloads.

## Incident Log
<!-- newest first. Format: -->
<!-- ### YYYY-MM-DD — <short title> -->
<!-- Symptom / Root cause / Fix / Prevention -->
_(none recorded yet)_
