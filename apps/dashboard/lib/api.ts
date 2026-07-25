// Thin fetch client for ORCHESTRATOR_CONTRACT.md §3/§8 dashboard routes. No mocks (A-13): every
// call hits the real backend; callers surface loading/error state instead of falling back to
// static data. Mirrors apps/mobile/src/lib/api.ts's API_URL convention.
import { useEffect, useState } from "react";
import type { Alert } from "@asaase/shared";

// ponytail: NEXT_PUBLIC_ prefix is Next.js's documented way to expose an env var to client code.
// Falls back to localhost:3001 (backend's default port, apps/backend/src/index.ts).
export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function fetchAlertsSummary(): Promise<Alert[]> {
  const res = await fetch(`${API_URL}/api/v1/alerts/summary`);
  if (!res.ok) throw new Error(`alerts/summary failed (${res.status})`);
  const body = (await res.json()) as { alerts: Alert[] };
  return body.alerts;
}

// T17 wires this into ClusterPopup's live brief render — exported now so the call site exists,
// not left as a TODO comment (ORCHESTRATOR_CONTRACT.md §8).
export async function streamClusterSummary(
  clusterId: string,
  onChunk: (text: string) => void,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/clusters/${clusterId}/summary`);
  if (!res.ok || !res.body) throw new Error(`clusters/${clusterId}/summary failed (${res.status})`);
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}

// Single fetch-on-mount hook shared by RiskMap + ReportsPanel so the dashboard's one live
// data source is only ever requested once per page load, not duplicated per component.
export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    // ponytail: no setLoading(true) here — initial state is already `true`, and this effect
    // only runs once on mount (empty deps), so there's no later "reset to loading" case to cover.
    fetchAlertsSummary()
      .then((data) => {
        if (!cancelled) {
          setAlerts(data);
          setError(null);
        }
      })
      .catch((err: Error) => {
        if (!cancelled) {
          setAlerts([]);
          setError(err.message);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { alerts, loading, error };
}
