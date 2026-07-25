"use client";

import dynamic from "next/dynamic";
import Sidebar from "@/components/Sidebar";
import ReportsPanel from "@/components/ReportsPanel";

// Leaflet touches `window`, so the map must not render on the server.
const RiskMap = dynamic(() => import("@/components/RiskMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-surface-sub" />,
});

export default function Home() {
  return (
    <div className="grid h-screen grid-cols-[1fr_3fr] bg-canvas">
      <ReportsPanel />
      <RiskMap />
    </div>
  );
}
