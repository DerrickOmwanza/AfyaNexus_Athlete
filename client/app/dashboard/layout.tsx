"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Sidebar from "@/components/Sidebar";
import TopBar from "@/components/TopBar";
import api from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, setUserProfile } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  // Sync latest profile (including avatar_url) from DB on every dashboard load
  useEffect(() => {
    if (!user) return;
    api.get("/auth/profile").then((res) => {
      const fresh = res.data.user;
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
        <div className="text-brand-blue font-semibold text-sm animate-pulse">Loading AfyaNexus...</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-brand-gray">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
