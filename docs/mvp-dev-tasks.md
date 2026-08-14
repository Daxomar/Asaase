# Asaase MVP — Dev Task Breakdown

**Audience:** Jason (Mobile), David (Dashboard), Josh (Backend), Ernest (AI)  
**Source:** `docs/prd.md` FEAT-001..FEAT-008  
**Audit date:** 2026-08-03  
**Context:** Core features are largely implemented (prior T1–T20 mission). This doc focuses on **research before touching code** and **remaining work to reach hackathon demo-ready MVP**.

---

## Feature ownership map

| FEAT | Feature | Primary | Support |
|------|---------|---------|---------|
| FEAT-001 | Daily Streak Engine | **Jason** | Josh (API), Ernest |
| FEAT-002 | Gamified Eco-Quizzes | **Jason** | Josh |
| FEAT-003 | Camera Scanner UI | **Jason** | Josh (upload), Ernest |
| FEAT-004 | Token Marketplace | **Jason** | Josh |
| FEAT-005 | Vision AI Pipeline | **Ernest** | Josh (route), Jason (capture) |
| FEAT-006 | PostGIS Clustering | **Josh** | Ernest |
| FEAT-007 | LLM Intelligence Brief | **Ernest** | Josh (stream route), **David** (UI) |
| FEAT-008 | NADMO Command Map | **David** | Josh (alerts API) |

---

## Global MVP cut line

### Must ship (demo-blocking)

| Item | Tracks |
|------|--------|
| Local dev runbook: Postgres (docker) + Ollama + all three apps | Josh + Ernest |
| E2E path: mobile scan → vision classify → cluster → dashboard map → LLM brief | All |
| Streak visible on mobile home; quiz awards XP/tokens | Jason + Josh |
| Dashboard live `GET /api/v1/alerts/summary` with severity-colored map | David + Josh |
| AI provider works locally (llava + llama3.2 via Ollama) | Ernest |
| `EXPO_PUBLIC_API_URL` / `NEXT_PUBLIC_API_URL` documented for non-localhost demos | Jason + David |

### Nice-to-have (defer if time-constrained)

| Item | Tracks |
|------|--------|
| Real APNs/FCM push notifications | Jason |
| `GET /api/marketplace/catalog` (catalog currently duplicated in mobile) | Josh + Jason |
| Server-side quiz grading / question bank | Josh |
| Dashboard auto-refresh / WebSocket | David |
| Production cloud AI + hosted Postgres deploy | Josh + Ernest |
| Partner fulfillment for marketplace redemptions | Out of scope |
| Scan awards XP/tokens (PRD only specifies quiz rewards explicitly) | Jason + Josh |

---

## Dependency matrix

| Blocker | Blocked | Contract |
|---------|---------|----------|
| Josh: backend + DB + Ollama up | Ernest, Jason, David | `GET /health`, migrations applied |
| Ernest: Ollama models pulled | Josh scan route, David brief stream | `llava`, `llama3.2` responding |
| Josh: `POST /api/scans/analyze` stable | Jason scan screen | multipart `image` + lat/lng |
| Josh: `GET /api/v1/alerts/summary` | David map | `{ alerts: Alert[] }` from `@asaase/shared` |
| Josh: `GET /api/clusters/:id/summary` stream | David ClusterPopup | `text/plain` chunked stream |
| `@asaase/shared` types | All apps | `BlockageType`, `User`, `Scan`, `Alert` |

---

## Jason — Mobile

### Research (do first)

| # | Task | Where to look |
|---|------|---------------|
| R-M1 | Map existing screens to PRD features | `apps/mobile/src/app/{index,quiz,scan,marketplace}.tsx` |
| R-M2 | Trace API client and env config | `apps/mobile/src/lib/api.ts`, `EXPO_PUBLIC_API_URL` |
| R-M3 | Understand streak model vs UI triggers | `apps/mobile/src/lib/streakReminder.ts`, backend `gmtCalendarDay` in `gamification.ts` |
| R-M4 | Review camera/GPS permission flows | `apps/mobile/src/app/scan.tsx` |
| R-M5 | Read Expo SDK 57 docs for device testing | `apps/mobile/AGENTS.md` → expo.dev v57 |

### Completion (MVP)

| # | Task | FEAT | Priority | Depends on |
|---|------|------|----------|------------|
| C-M1 | **Wire streak ping after quiz complete and scan success** — today only manual "Check in today" calls `/api/streak/ping`; PRD loop expects quiz/scan as qualifying micro-actions | FEAT-001 | **Must** | Josh `/api/streak/ping` |
| C-M2 | **Remove dev stand-in** "Log eco action" button on home (`index.tsx` handleLogEcoAction) | FEAT-001 | **Must** | C-M1 |
| C-M3 | **Physical device QA:** camera capture, high-accuracy GPS, haptics, Lottie confetti on redeem | FEAT-003, FEAT-004 | **Must** | Ernest vision + Josh backend |
| C-M4 | Configure `.env` / `app.config` for demo backend URL (`EXPO_PUBLIC_API_URL`) | — | **Must** | Josh deployed or LAN IP |
| C-M5 | Verify scan result image loads (`API_URL + scan.imageUrl`) on device network | FEAT-003 | **Must** | Josh `/uploads` static |
| C-M6 | Quiz UX polish: ensure &lt;300ms haptic/visual feedback (already local-first; verify on slow network) | FEAT-002 | Should | — |
| C-M7 | Marketplace: switch to `GET /api/marketplace/catalog` when Josh ships it | FEAT-004 | Nice | Josh C-B3 |
| C-M8 | Morning trigger: improve local notification copy/scheduling edge cases | FEAT-001 | Nice | — |

---

## David — Dashboard

### Research (do first)

| # | Task | Where to look |
|---|------|---------------|
| R-D1 | Map dashboard data flow | `apps/dashboard/app/page.tsx`, `lib/api.ts` `useAlerts()` |
| R-D2 | Understand severity → color mapping | `apps/dashboard/data/threat.ts`, `components/RiskMap.tsx` |
| R-D3 | Trace cluster click → LLM brief stream | `components/ClusterPopup.tsx` → `streamClusterSummary()` |
| R-D4 | Review sidebar/reports metrics | `components/ReportsPanel.tsx`, `ThreatRing.tsx` |
| R-D5 | Confirm env var for API | `NEXT_PUBLIC_API_URL` in `lib/api.ts` |

### Completion (MVP)

| # | Task | FEAT | Priority | Depends on |
|---|------|------|----------|------------|
| C-D1 | **Verify live map** with real scan data from Jason's device (clusters appear, severity bands correct) | FEAT-008 | **Must** | Josh alerts API + Jason scans |
| C-D2 | **Verify streaming brief** in ClusterPopup on cluster click; handle AI-down error state gracefully | FEAT-007, FEAT-008 | **Must** | Ernest Ollama + Josh stream route |
| C-D3 | Set `NEXT_PUBLIC_API_URL` for demo environment | FEAT-008 | **Must** | Josh backend URL |
| C-D4 | **Demo script walkthrough:** isolate cluster, read brief, show severity legend | FEAT-008 | **Must** | C-D1, C-D2 |
| C-D5 | Add periodic poll refresh (e.g. 30s) so new scans appear without page reload | FEAT-008 | Nice | — |
| C-D6 | Empty/loading/error states copy polish for NADMO audience | FEAT-008 | Nice | — |
| C-D7 | Deploy dashboard (Vercel/Netlify) for judges | FEAT-008 | Nice | Josh backend CORS + public URL |

---

## Josh — Backend

### Research (do first)

| # | Task | Where to look |
|---|------|---------------|
| R-B1 | Inventory all routes vs PRD/ETB | `apps/backend/src/index.ts`, `routes/{scans,gamification,alerts}.ts` |
| R-B2 | DB schema + PostGIS migrations | `apps/backend/src/db/schema.ts`, `drizzle/`, `docker-compose.yml` |
| R-B3 | Clustering logic | `apps/backend/src/services/clustering.ts` (20m ST_DWithin) |
| R-B4 | Device auth model | `apps/backend/src/middleware/deviceAuth.ts` |
| R-B5 | Shared types contract | `shared/domain/index.ts` |
| R-B6 | Env template | `apps/backend/.env.example` |

### Completion (MVP)

| # | Task | FEAT | Priority | Depends on |
|---|------|------|----------|------------|
| C-B1 | **Write team runbook in root README:** docker postgres up → `pnpm db:migrate` → Ollama → `pnpm dev` | — | **Must** | Ernest R-E1 |
| C-B2 | **Seed/demo verification:** confirm migrations enable PostGIS; insert test scan via mobile or curl | FEAT-006 | **Must** | Ernest vision |
| C-B3 | Add `GET /api/marketplace/catalog` returning reward list (eliminate mobile duplicate) | FEAT-004 | Nice | — |
| C-B4 | Optional: auto streak bump on `quiz/submit` (correct) and `scans/analyze` success — reduces mobile coupling | FEAT-001 | Should | Team decision (open Q2) |
| C-B5 | CORS + static `/uploads` reachable from mobile device on LAN | FEAT-003 | **Must** | — |
| C-B6 | `/health` returns 503 when DB down (already implemented — document for team) | — | **Must** | — |
| C-B7 | Production env doc: `NODE_ENV=production`, `OPENAI_API_KEY`, cloud model names | FEAT-005, FEAT-007 | Nice | Ernest C-E4 |
| C-B8 | Persist `summaryText` on cluster after brief generation (cache for dashboard) | FEAT-007 | Nice | Ernest |

---

## Ernest — AI integration & support

### Research (do first)

| # | Task | Where to look |
|---|------|---------------|
| R-E1 | Provider switcher implementation | `apps/backend/src/ai/provider.ts` |
| R-E2 | Vision call site + schema | `apps/backend/src/routes/scans.ts` — `generateObject` + 4-class enum |
| R-E3 | Brief streaming call site | `apps/backend/src/routes/alerts.ts` — `streamText` + `fullStream` |
| R-E4 | PRD classification targets | `docs/prd.md` FEAT-005, FEAT-007 |
| R-E5 | ETB Ollama setup steps | `docs/etb.md` TASK-1.0 |

### Completion (MVP)

| # | Task | FEAT | Priority | Depends on |
|---|------|------|----------|------------|
| C-E1 | **Document Ollama setup:** install, `ollama pull llava`, `ollama pull llama3.2`, verify `OLLAMA_BASE_URL` | FEAT-005, FEAT-007 | **Must** | — |
| C-E2 | **Vision smoke test:** 4–6 sample drain photos → verify enum output + reasonable confidence | FEAT-005 | **Must** | Josh backend up |
| C-E3 | **Brief smoke test:** cluster with mixed blockage types → stream readable Accra-specific action plan | FEAT-007 | **Must** | Josh cluster data |
| C-E4 | Tune prompts in scans + alerts routes for Ghana context (sachet rubbers, PET, silt, weeds) | FEAT-005, FEAT-007 | Should | C-E2, C-E3 |
| C-E5 | Support Jason on-device scan failures (`AI_PROVIDER_UNAVAILABLE` UX messaging) | FEAT-005 | **Must** | — |
| C-E6 | Verify prod provider switch (`NODE_ENV=production` + API keys) in staging | FEAT-005, FEAT-007 | Nice | Josh C-B7 |
| C-E7 | Optional: evaluate llava accuracy vs cloud gpt-4o-mini for demo reliability | FEAT-005 | Nice | — |

---

## API contract (integration reference)

| Method | Path | Auth | Owner |
|--------|------|------|-------|
| GET | `/health` | none | Josh |
| POST | `/api/auth/device` | body `{ deviceId }` | Josh |
| GET | `/api/users/me` | `X-Device-Id` | Josh |
| POST | `/api/streak/ping` | `X-Device-Id` | Josh |
| POST | `/api/quiz/submit` | `X-Device-Id`, `{ quizId, correct }` | Josh |
| POST | `/api/marketplace/redeem` | `X-Device-Id`, `{ rewardId, cost }` | Josh |
| POST | `/api/scans/analyze` | `X-Device-Id`, multipart `image`+lat/lng | Josh + Ernest |
| GET | `/api/v1/alerts/summary` | none | Josh |
| GET | `/api/clusters/:id/summary` | none, streams `text/plain` | Josh + Ernest |

Shared types: `shared/domain/index.ts` → `@asaase/shared`

---

## Suggested parallel sprint

### Sprint 1 — Research + unblock (Days 1–2)

| Dev | Focus |
|-----|-------|
| Josh | R-B1–R-B6, C-B1 runbook, docker + migrate |
| Ernest | R-E1–R-E5, C-E1 Ollama setup |
| Jason | R-M1–R-M5, env config |
| David | R-D1–R-D5, confirm API URL |

**Exit criteria:** All four can run `pnpm dev` stack locally; Ollama responds; health check green.

### Sprint 2 — Integration + demo (Days 3–5)

| Dev | Focus |
|-----|-------|
| Jason | C-M1–C-M5 device QA |
| David | C-D1–C-D4 live demo path |
| Josh | C-B2, C-B5, optional C-B3/C-B4 |
| Ernest | C-E2–C-E5 prompt tuning + support |

**Exit criteria:** E2E demo script passes once on physical device + dashboard.

---

## E2E demo script (team validation)

1. Start Postgres (`docker compose up -d`) and run migrations (`pnpm --filter backend db:migrate`)
2. Start Ollama; confirm `llava` and `llama3.2` models
3. `pnpm dev:backend` → `curl localhost:3001/health` → `{ status: "ok", db: "up" }`
4. `pnpm dev:dashboard` → map loads (empty state OK)
5. `pnpm dev:mobile` → open on device with `EXPO_PUBLIC_API_URL` pointing to host machine
6. Complete eco quiz → XP/tokens increase; streak updates (after C-M1)
7. Scan a drain photo → vision classifies → result screen shows blockage type
8. Refresh dashboard → new cluster pin with severity color
9. Click cluster → streaming LLM brief appears
10. Redeem marketplace item → confetti + token debit

---

## Open questions (needs team decision)

1. **Demo topology:** All-local vs deployed backend for judges?
2. **Streak auto-ping:** Client-side (Jason C-M1) vs server-side (Josh C-B4)?
3. **Marketplace catalog API:** Must for MVP or accept duplicated catalog for hackathon?
4. **Device matrix:** Who tests iOS vs Android?
