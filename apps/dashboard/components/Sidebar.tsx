"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Leaf,
  MapPin,
  Layers,
  BarChart3,
  CloudRain,
  Trophy,
  Settings,
} from "lucide-react";

// Single source of truth for nav — add/reorder items here only.
// `href` drives both the Link and the active-state match, so routing
// and highlighting can never drift out of sync with each other.
const NAV_ITEMS = [
  { href: "/dashboard/map", label: "Live map", icon: MapPin },
  { href: "/dashboard/clusters", label: "Clusters / reports", icon: Layers },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/rainfall", label: "Rainfall & alerts", icon: CloudRain },
  { href: "/dashboard/leaderboard", label: "Leaderboard", icon: Trophy },
] as const;

export default function Sidebar() {
  const pathname = usePathname();

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
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-control bg-forest text-text-on-dark"
          title="Asaase AI"
        >
          <Leaf size={18} strokeWidth={1.5} />
        </Link>

        <nav className="flex flex-col items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            // startsWith so a sub-route like /dashboard/clusters/CL-402
            // still highlights the "Clusters" icon, not just an exact match.
            const isActive =
              pathname === href || pathname?.startsWith(`${href}/`);

            return (
              <Link
                key={href}
                href={href}
                title={label}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-control transition-colors ${
                  isActive
                    ? "text-gold"
                    : "text-text-on-dark-muted hover:text-text-on-dark"
                }`}
              >
                {isActive && (
                  <span className="absolute left-[-12px] h-5 w-[3px] rounded-none bg-gold" />
                )}
                <Icon size={20} strokeWidth={1.5} />
                <span className="pointer-events-none absolute left-full ml-3 whitespace-nowrap rounded-control bg-forest px-2.5 py-1.5 text-xs font-medium text-text-on-dark opacity-0 shadow-float transition-opacity group-hover:opacity-100 z-20">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="relative flex flex-col items-center gap-5">
        <Link
          href="/dashboard/settings"
          title="Settings"
          aria-label="Settings"
          className={`transition-colors ${
            pathname?.startsWith("/dashboard/settings")
              ? "text-gold"
              : "text-text-on-dark-muted hover:text-text-on-dark"
          }`}
        >
          <Settings size={20} strokeWidth={1.5} />
        </Link>
        <Link
          href="/dashboard/account"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-gold text-xs font-semibold text-forest-ink"
        >
          A
        </Link>
      </div>
    </aside>
  );
}