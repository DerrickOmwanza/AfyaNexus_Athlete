"use client";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useSearchParams } from "next/navigation";

const ROLES = [
  { value: "athlete",      label: "Athlete",      emoji: "🏃", desc: "Log & track performance" },
  { value: "coach",        label: "Coach",        emoji: "🧑🏫", desc: "Monitor your athletes" },
  { value: "nutritionist", label: "Nutritionist", emoji: "🥗", desc: "Manage diet plans" },
];

const FEATURES = [
  "ML-powered injury risk prediction",
  "Role-based secure access",
  "T70 wearable integration",
  "30-day performance reports",
];

export default function LoginClient() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";
  const [form, setForm]       = useState({ email: "", password: "", role: "athlete" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password, form.role);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Login failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex bg-[#0A1628]">

      {/* ── Left panel ──────────────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: "linear-gradient(135deg, #0F2A5E 0%, #0A3D2E 50%, #0A1628 100%)" }}
      >
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10B981, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563EB, transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Brand */}
        <div className="relative z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <div>
              <h1 className="text-white font-heading font-bold text-lg tracking-wide leading-none">AfyaNexus</h1>
              <p className="text-brand-green text-xs font-semibold uppercase tracking-widest">v1.0</p>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white font-heading font-bold text-4xl leading-tight mb-4">
              Welcome back.<br />
              <span className="bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">
                Your data awaits.
              </span>
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed">
              Sign in to access your personalised dashboard — training logs, recovery data, injury risk scores, and more.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-3">
            {FEATURES.map((f) => (
              <div key={f} className="flex items-center gap-3">
                <CheckCircle size={14} className="text-brand-green shrink-0" />
                <span className="text-blue-200/80 text-sm">{f}</span>
              </div>
            ))}
          </div>

          {/* Role preview cards */}
          <div className="grid grid-cols-3 gap-3">
            {ROLES.map((r) => (
              <div key={r.value} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                <div className="text-2xl mb-1">{r.emoji}</div>
                <p className="text-white text-xs font-semibold">{r.label}</p>
                <p className="text-blue-300/60 text-xs mt-0.5">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-400/50 text-xs">AfyaNexus © 2026 · Capstone Project v1.0</p>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 relative"
        style={{ background: "linear-gradient(180deg, #0D1F3C 0%, #0A1628 100%)" }}
      >
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <motion.div
          className="w-full max-w-md relative z-10"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Mobile brand */}
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
                <span className="text-white font-bold text-sm">AN</span>
              </div>
              <h1 className="text-white font-heading font-bold text-xl">AfyaNexus</h1>
            </div>
            <p className="text-blue-300/70 text-sm">Sign in to your account</p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

            <div className="mb-7">
              <h2 className="text-white font-heading font-bold text-2xl">Sign In</h2>
              <p className="text-blue-300/70 text-sm mt-1">Select your role and enter your credentials</p>
            </div>

            {/* Registration success banner */}
            {justRegistered && (
              <motion.div
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 bg-brand-green/15 border border-brand-green/30 text-brand-green rounded-xl px-4 py-3 mb-5 text-sm"
              >
                <CheckCircle size={15} />
                <span>Account created successfully! Sign in to continue.</span>
              </motion.div>
            )}

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm"
              >
                <span className="mt-0.5">⚠</span>
                <span>{error}</span>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Role selector */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-3">I am a</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map((r) => {
                    const active = form.role === r.value;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border-2 transition-all ${
                          active
                            ? "border-brand-green bg-brand-green/15 text-white shadow-lg shadow-brand-green/20"
                            : "border-white/10 text-white/50 hover:border-white/25 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <span className="text-2xl">{r.emoji}</span>
                        <span className="text-xs font-semibold">{r.label}</span>
                        <span className={`text-xs ${active ? "text-brand-green/80" : "text-white/30"}`}>{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Email Address</label>
                <input
                  type="email" required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="dark-input"
                  placeholder="you@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-semibold text-white/80">Password</label>
                  <Link href="/forgot-password" className="text-xs text-brand-green hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"} required
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="dark-input pr-11"
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-green/30"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </span>
                ) : "Sign In →"}
              </button>

              <div className="text-xs text-white/40">
                Don’t have an account? <Link href="/register" className="text-brand-green hover:underline">Register here</Link>.
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
