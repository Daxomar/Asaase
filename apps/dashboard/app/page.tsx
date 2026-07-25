"use client";

import dynamic from "next/dynamic";
import ReportsPanel from "@/components/ReportsPanel";
import { useAlerts } from "@/lib/api";

// Leaflet touches `window`, so the map must not render on the server.
const RiskMap = dynamic(() => import("@/components/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-sub" />,
});

export default function Home() {
  // Single live fetch (A-13) shared by both panels — no offline mock fallback.
  const { alerts, loading, error } = useAlerts();

  return (
    <div className="grid h-screen grid-cols-[1fr_3fr] bg-canvas">
      <ReportsPanel alerts={alerts} loading={loading} error={error} />
      <RiskMap alerts={alerts} loading={loading} error={error} />
    </div>
  );
}
