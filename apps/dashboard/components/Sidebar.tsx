"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";

// Prior NAV_ITEMS (/dashboard/map, /clusters, /analytics, /rainfall, /leaderboard) and the
// settings/account footer links pointed at routes that don't exist — dashboard is single-page
// at `/` (map + reports). Trimmed per mission_profile.md resolved decision #5; sidebar stays
// visually intact (ripple motif, logo mark) but functional-only. Don't build the missing pages.
export default function Sidebar() {
  return (
    <aside className="relative flex h-screen w-16 flex-col items-center justify-between overflow-hidden bg-forest-ink py-4">
      {/* faint gold ripple motif — decorative only, never behind body text */}
      <svg
        className="pointer-events-none absolute -top-10 left-1/2 -translate-x-1/2 opacity-[0.08]"
        width="180"
        height="180"
        viewBox="0 0 180 180"
        fill="none"
      >
        <circle cx="90" cy="90" r="40" stroke="var(--gold)" strokeWidth="1.5" />
        <circle cx="90" cy="90" r="65" stroke="var(--gold)" strokeWidth="1.5" />
        <circle cx="90" cy="90" r="90" stroke="var(--gold)" strokeWidth="1.5" />
      </svg>

      <div className="relative flex flex-col items-center gap-8">
        <Link
          href="/"
          className="flex h-9 w-9 items-center justify-center rounded-control bg-forest text-text-on-dark"
          title="Asaase AI"
        >
          <Leaf size={18} strokeWidth={1.5} />
        </Link>
      </div>

      <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-semibold text-forest-ink">
        A
      </div>
    </aside>
  );
}