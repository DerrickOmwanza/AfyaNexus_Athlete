"use client";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Bell, Watch, Plus, ChevronRight, Menu } from "lucide-react";

const BREADCRUMBS: Record<string, string> = {
  "/dashboard/athlete":               "Dashboard",
  "/dashboard/athlete/training-log":  "Training Log",
  "/dashboard/athlete/recovery-log":  "Recovery Log",
  "/dashboard/athlete/nutrition-log": "Nutrition Log",
  "/dashboard/athlete/wearable":      "Wearable Sync",
  "/dashboard/athlete/reports":       "Reports",
  "/dashboard/athlete/settings":      "Settings",
  "/dashboard/coach":                 "Dashboard",
  "/dashboard/coach/athletes":        "My Athletes",
  "/dashboard/coach/settings":        "Settings",
  "/dashboard/nutritionist":          "Dashboard",
  "/dashboard/nutritionist/athletes": "My Athletes",
  "/dashboard/nutritionist/diet-plans": "Diet Plans",
  "/dashboard/nutritionist/settings": "Settings",
};

const QUICK_ACTIONS: Record<string, { label: string; href: string }[]> = {
  athlete: [
    { label: "Log Recovery",  href: "/dashboard/athlete/recovery-log" },
    { label: "Log Training",  href: "/dashboard/athlete/training-log" },
  ],
  coach: [],
  nutritionist: [
    { label: "New Diet Plan", href: "/dashboard/nutritionist/diet-plans" },
  ],
};

export default function TopBar() {
  const { user } = useAuth();
  const pathname = usePathname();

  const { toggle } = useSidebar();

  if (!user) return null;

  const initials    = user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
  const currentPage = BREADCRUMBS[pathname] ?? "Dashboard";
  const portalLabel = `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} Portal`;
  const quickActions = QUICK_ACTIONS[user.role as keyof typeof QUICK_ACTIONS] ?? [];

  return (
    <header className="h-14 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-6 shrink-0">

      {/* ── Left: hamburger (mobile) + breadcrumb ─────── */}
      <div className="flex items-center gap-3">
        {/* Hamburger — mobile only */}
        <button
          onClick={toggle}
          className="lg:hidden p-2 rounded-lg text-brand-muted hover:bg-gray-100 hover:text-brand-blue transition-all"
          aria-label="Open menu"
        >
          <Menu size={18} />
        </button>

        <div className="flex items-center gap-1.5 text-sm">
          <span className="hidden sm:inline text-brand-muted">{portalLabel}</span>
          <ChevronRight size={13} className="hidden sm:inline text-gray-300" />
          <span className="font-semibold text-brand-dark">{currentPage}</span>
        </div>
      </div>

      {/* ── Right actions ───────────────────────────────── */}
      <div className="flex items-center gap-3">

        {/* Quick action buttons */}
        {quickActions.map((a) => (
          <Link
            key={a.href}
            href={a.href}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue-light text-brand-blue text-xs font-semibold rounded-lg hover:bg-brand-blue hover:text-white transition-all"
          >
            <Plus size={12} />
            {a.label}
          </Link>
        ))}

        {/* T70 sync badge — athlete only */}
        {user.role === "athlete" && (
          <Link
            href="/dashboard/athlete/wearable"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-100 text-brand-muted hover:bg-brand-blue-light hover:text-brand-blue transition-all"
          >
            <Watch size={12} />
            T70 Sync
          </Link>
        )}

        {/* Notification bell */}
        <button className="relative w-8 h-8 flex items-center justify-center rounded-lg text-brand-muted hover:bg-gray-100 hover:text-brand-blue transition-all">
          <Bell size={16} />
        </button>

        {/* Avatar */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-white/20 shrink-0">
            {user.avatar_url ? (
              <Image src={user.avatar_url} alt={user.name} width={32} height={32} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden md:block">
            <p className="text-xs font-semibold text-brand-dark leading-none">{user.name}</p>
            <p className="text-xs text-brand-muted capitalize">{user.role}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
