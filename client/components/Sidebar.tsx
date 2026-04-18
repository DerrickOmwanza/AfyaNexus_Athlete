"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSidebar } from "@/context/SidebarContext";
import { useEffect, useMemo } from "react";
import {
  LayoutDashboard, Activity, Moon, BarChart2,
  Users, Settings, LogOut, Utensils, Apple, Watch, X,
} from "lucide-react";

const NAV = {
  athlete: [
    { href: "/dashboard/athlete",               icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/athlete/training-log",  icon: Activity,        label: "Training Log" },
    { href: "/dashboard/athlete/recovery-log",  icon: Moon,            label: "Recovery Log" },
    { href: "/dashboard/athlete/nutrition-log", icon: Apple,           label: "Nutrition Log" },
    { href: "/dashboard/athlete/wearable",      icon: Watch,           label: "Wearable Sync" },
    { href: "/dashboard/athlete/reports",       icon: BarChart2,       label: "Reports" },
  ],
  coach: [
    { href: "/dashboard/coach",          icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/coach/athletes", icon: Users,           label: "My Athletes" },
  ],
  nutritionist: [
    { href: "/dashboard/nutritionist",            icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/nutritionist/athletes",   icon: Users,           label: "My Athletes" },
    { href: "/dashboard/nutritionist/diet-plans", icon: Utensils,        label: "Diet Plans" },
  ],
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const { open, close }  = useSidebar();
  const pathname = usePathname();
  const router   = useRouter();

  const links = useMemo(
    () => (user ? (NAV[user.role as keyof typeof NAV] ?? []) : []),
    [user]
  );
  const initials = user ? user.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) : "";

  // Prefetch all nav routes on mount
  useEffect(() => {
    if (user) {
      links.forEach(({ href }) => router.prefetch(href));
      router.prefetch(`/dashboard/${user.role}/settings`);
    }
  }, [user, links, router]);

// Close drawer on route change removed - causes mobile flash (toggle + instant close)
// Keep Escape/backdrop


  // Close drawer on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [close]);

  if (!user) return null;

  const sidebarContent = (
    <aside className="w-60 h-full bg-brand-dark flex flex-col border-r border-white/5 overflow-y-auto">

      {/* ── Brand ─────────────────────────────────────── */}
      <div className="px-5 py-6 border-b border-white/8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-brand-blue flex items-center justify-center shrink-0">
            <span className="text-white font-heading font-bold text-sm">AN</span>
          </div>
          <div>
            <h1 className="text-white font-heading font-bold text-base tracking-wide leading-none">AfyaNexus</h1>
            <p className="text-gray-400 text-xs mt-0.5 capitalize">{user.role} Portal</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        <button onClick={close} className="lg:hidden text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* ── User card ─────────────────────────────────── */}
      <div className="px-4 py-4 border-b border-white/8">
        <div className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
          <div className="relative !w-8 !h-8 flex-shrink-0 rounded-full overflow-hidden border border-white/20">
            {user.avatar_url ? (
              <Image 
                src={user.avatar_url} 
                alt={user.name} 
                fill 
                sizes="32px"
                className="object-cover w-full h-full"
              />
            ) : (
              <div className="w-full h-full bg-brand-blue flex items-center justify-center text-white text-xs font-bold">
                {initials}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user.name}</p>
            <p className="text-gray-400 text-xs truncate">{user.email}</p>
          </div>
        </div>
      </div>

      {/* ── Nav links ─────────────────────────────────── */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest px-3 mb-2">Menu</p>
        {links.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || (href !== `/dashboard/${user.role}` && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                active
                  ? "bg-brand-blue text-white shadow-sm"
                  : "text-gray-400 hover:bg-white/8 hover:text-white"
              }`}
            >
              <Icon size={15} className={active ? "text-white" : "text-gray-500 group-hover:text-white transition-colors"} />
              {label}
              {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-green" />}
            </Link>
          );
        })}
      </nav>

      {/* ── Bottom ────────────────────────────────────── */}
      <div className="px-3 py-4 border-t border-white/8 space-y-0.5">
        <Link
          href={`/dashboard/${user.role}/settings`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
            pathname.includes("/settings")
              ? "bg-brand-blue text-white"
              : "text-gray-400 hover:bg-white/8 hover:text-white"
          }`}
        >
          <Settings size={15} className="text-gray-500 group-hover:text-white transition-colors" />
          Settings
        </Link>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-500/15 hover:text-red-400 transition-all group"
        >
          <LogOut size={15} className="group-hover:text-red-400 transition-colors" />
          Sign Out
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop: always visible */}
      <div className="hidden lg:flex h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: drawer overlay */}
      {open && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={close}
          />
          {/* Drawer panel */}
          <div className="relative z-10 h-full animate-slide-in-left">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
