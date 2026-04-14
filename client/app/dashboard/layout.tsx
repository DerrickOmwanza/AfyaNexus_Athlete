"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import api from "@/lib/api";
import { SidebarProvider } from "@/context/SidebarContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUserProfile } = useAuth();
  const router   = useRouter();
  const pathname = usePathname();
  const [pageLoading, setPageLoading] = useState(false);
  const [prevPath, setPrevPath]       = useState("");

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Show instant loading state on navigation
  useEffect(() => {
    if (prevPath && prevPath !== pathname) setPageLoading(false);
    setPrevPath(pathname);
  }, [pathname]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (href && href.startsWith("/dashboard")) setPageLoading(true);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // Sync latest profile (including avatar_url) from DB on every dashboard load
  useEffect(() => {
    if (!user) return;
    api.get("/auth/profile").then((res) => {
      const fresh  = res.data.user;
      const stored = localStorage.getItem("afyanexus_user");
      const parsed = stored ? JSON.parse(stored) : {};
      if (parsed.avatar_url !== fresh.avatar_url) {
        setUserProfile({ ...parsed, avatar_url: fresh.avatar_url ?? null });
      }
    }).catch(() => {});
  }, []);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-gray">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-blue flex items-center justify-center">
            <span className="text-white font-bold text-sm">AN</span>
          </div>
          <div className="text-brand-blue font-semibold text-sm animate-pulse">Loading AfyaNexus...</div>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen overflow-hidden bg-brand-gray">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <TopBar />
          <main className="flex-1 overflow-y-auto relative">
            {pageLoading && (
              <div className="absolute inset-0 z-10 flex items-start justify-center pt-20 bg-brand-gray/60 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-8 h-8 border-2 border-brand-blue/20 border-t-brand-blue rounded-full animate-spin" />
                  <p className="text-xs text-brand-muted font-medium">Loading...</p>
                </div>
              </div>
            )}
            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
