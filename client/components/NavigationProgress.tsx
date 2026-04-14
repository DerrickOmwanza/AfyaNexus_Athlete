"use client";
import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export default function NavigationProgress() {
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading]   = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setLoading(false);
    setProgress(100);
    const t = setTimeout(() => setProgress(0), 400);
    return () => clearTimeout(t);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!loading) return;
    setProgress(30);
    const t1 = setTimeout(() => setProgress(60),  200);
    const t2 = setTimeout(() => setProgress(80),  600);
    const t3 = setTimeout(() => setProgress(90), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [loading]);

  // Intercept link clicks to start progress immediately
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest("a");
      if (!target) return;
      const href = target.getAttribute("href");
      if (!href || href.startsWith("http") || href.startsWith("#") || href.startsWith("mailto")) return;
      setLoading(true);
      setProgress(15);
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  if (progress === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-0.5 transition-all duration-300 ease-out"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, #10B981, #2563EB)",
        boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
        opacity: progress === 100 ? 0 : 1,
      }}
    />
  );
}
