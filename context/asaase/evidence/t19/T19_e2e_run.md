# T19 — Full-chain E2E live run (A-17)

Real services only. No mocks. Executed against the running dev stack:
- Postgres+PostGIS: `asaase-postgres-1` (docker, healthy, already up)
- Ollama: already running, `llava` (vision) + `llama3.2`/`qwen2.5` (text) present
- Backend: `localhost:3001` (already running)
- Dashboard: `localhost:3000` (already running)

Fresh device: `e2e-t19-1784957635-a1b2c3` (bootstrapped via real `POST /api/auth/device`).

## Hop 1+2 — Mobile-shaped scan POST → real Ollama vision classify → real PostGIS cluster attach/create (A-09, A-10)

Used the same technique T8/T13 validated: a `curl` multipart POST that exactly replicates `apps/mobile/src/lib/api.ts`'s `analyzeScan()` request shape (image file field + `latitude`/`longitude` fields + `X-Device-Id` header, no camera hardware in this sandbox — same honest gap T13 flagged).

**Scan 1** — new location, far from all 3 pre-existing clusters:
```
POST /api/scans/analyze  lat=5.750000 lon=-0.350000
→ 201 {blockageType:"silt_sand", confidence:1, severity:2, clusterId:"f04748c8...", cluster.created:true}
```

**Scan 2** — ~5.5m from scan 1 (real `ST_Distance` geography computed = 5.53247106m, confirmed via psql, not assumed):
```
POST /api/scans/analyze  lat=5.750040 lon=-0.350030
→ 201 {blockageType:"pet_bottles", confidence:1, severity:3, clusterId:"f04748c8..." (SAME), cluster.created:false}
```
Same cluster id both times. Severity escalated 2→3. This is the 20m-attach + severity-raise behavior (A-10), proven via live HTTP against real Ollama + real PostGIS, not a direct-function test.

**DB proof (psql, not API-trust):**
```
SELECT id,severity,scan_count FROM chokepoint_clusters WHERE id='f04748c8-2415-4bdf-a202-1f51e9e3feeb';
→ severity=3, scan_count=2
SELECT id,blockage_type,cluster_id FROM scans WHERE cluster_id='f04748c8...';
→ 2 rows, both attached, matching blockage types from the API responses
```

**Scan 3** — brand-new location (east Accra, 5.630000/-0.050000), used to drive the live dashboard-update demo below:
```
→ 201 {blockageType:"silt_sand", confidence:0.2, severity:3, clusterId:"0cc4eec6...", cluster.created:true}
```

## Hop 3 — Dashboard live map/reports update (A-13, A-14)

- Screenshot BEFORE scan 3: `01_dashboard_before.png` — Total clusters **4**, Total scans **9**.
- Fired scan 3 (above).
- Refreshed dashboard (real refetch of `GET /api/v1/alerts/summary`, no mock fallback).
- Screenshot AFTER: `02_dashboard_after.png` — Total clusters **5**, Total scans **10**, new amber "3 · Moderate" marker visible near Sakumono (matches scan 3's coords), severity breakdown recomputed live (3 Moderate scans now, was 2).

Numbers match the DB exactly (5 clusters, 10 scans confirmed via psql — see main handoff).

## Hop 4 — Cluster-click streams a real LLM brief (A-11, A-15)

Clicked the new marker (cluster `0cc4eec6-7681-47ad-af13-b0aca5df5e86`) on the live map.
- `03_cluster_popup_generating.png` — mid-stream, "Generating live brief…" → tokens arriving.
- `04_cluster_popup_complete.png` — finished stream, plain prose, no markdown leakage (T18's fix held).

Full extracted brief text (via CDP `Runtime.evaluate` on the live DOM, not inferred):

> For Chokepoint cluster 0cc4eec6-7681-47ad-af13-b0aca5df5e86 at (5.63, -0.05), we recommend the following actions: A crew of 8 personnel is sufficient for this clearance operation, considering the medium severity and blockage composition. The equipment required includes a medium-duty vacuum pump capable of handling silt-sand mixtures, an 18-inch diameter pipe to clear the choked area, and additional suction hoses to manage debris outside the work zone. Additionally, gloves and face masks should be provided for personnel handling the blockage to minimize health risks. Due to the severity rating of 3/5, we assign a Medium-Urgency designation to this clearance operation...

Composition panel shows "Silt & sand · 100%" and the brief explicitly says "vacuum pump capable of handling silt-sand mixtures" — directly ties the streamed brief to scan 3's real classified blockage type (`silt_sand`). This is a real `streamText` call against real Ollama, not templated text (contrast the specific crew size "8", pipe diameter "18-inch" — model-generated specifics, not a canned string).

## Hop 5 — Gamification loop (mission success-definition tie-in)

Fresh device, starting state `{streak:0, xp:0, tokens:0}`.

- 20× real `POST /api/quiz/submit {correct:true}` → `xp` climbed 0→100, `tokens` 0→20 (server-computed +5xp/+1token per call, verified incrementally, last 3 calls shown: 90/18 → 95/19 → 100/20).
- 1× `POST /api/quiz/submit {correct:false}` → `{xp:100, tokens:20, awarded:false}` — no-op path confirmed, no free reward.
- `POST /api/streak/ping` → `{streak:1}` (first-ever activity). Pinged again same call-session → stayed at `1` (no double-count same GMT day, A-05 day-boundary logic proven live).
- `POST /api/marketplace/redeem {rewardId:"mtn-data-1gb", cost:20}` with balance=20 → **success**, `{tokens:0, redeemed:true}`.
- Same redeem again with balance=0 → **blocked**, `{error:{code:"INSUFFICIENT_BALANCE"}}`, no deduction (already 0, stayed 0).
- DB persistence proof (psql, independent of the API's own claim):
  ```
  SELECT streak,xp,tokens,last_activity_at FROM users WHERE device_id='e2e-t19-1784957635-a1b2c3';
  → streak=1, xp=100, tokens=0, last_activity_at=2026-07-25 05:36:56.214+00
  ```

## Regression + cleanup

- `GET /health` before and after the whole run: `{"status":"ok","db":"up"}` / HTTP 200 both times — no regression since T18.
- `docker ps` after the run: only `asaase-postgres-1`, still healthy, no stray containers left running.
- `git status --porcelain` at end of task: clean (zero code diff) — this task captured evidence only, no code touched, per bound-no.

## Screenshots

1. `01_dashboard_before.png` — dashboard before scan 3 (4 clusters / 9 scans)
2. `02_dashboard_after.png` — dashboard after scan 3, live-refetched (5 clusters / 10 scans, new marker)
3. `03_cluster_popup_generating.png` — mid-stream LLM brief
4. `04_cluster_popup_complete.png` — completed streamed brief, clean prose
