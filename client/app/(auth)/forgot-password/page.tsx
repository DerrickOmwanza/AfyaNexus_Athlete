"use client";
import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

const ROLES = [
  { value: "athlete",      label: "Athlete",      emoji: "🏃" },
  { value: "coach",        label: "Coach",        emoji: "🧑🏫" },
  { value: "nutritionist", label: "Nutritionist", emoji: "🥗" },
];

export default function ForgotPasswordPage() {
  const [form, setForm]       = useState({ email: "", role: "athlete" });
  const [loading, setLoading] = useState(false);
  const [sent, setSent]       = useState(false);
  const [error, setError]     = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/forgot-password", { email: form.email, role: form.role });
      setSent(true);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0A1628] px-6 py-12"
      style={{ background: "linear-gradient(180deg, #0D1F3C 0%, #0A1628 100%)" }}
    >
      {/* Dot grid */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

      <motion.div
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <h1 className="text-white font-heading font-bold text-xl">AfyaNexus</h1>
          </div>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {sent ? (
            /* ── Success state ── */
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-brand-green/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-brand-green" />
              </div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">Check your email</h2>
              <p className="text-blue-300/70 text-sm leading-relaxed mb-2">
                We sent a password reset link to
              </p>
              <p className="text-white font-semibold text-sm mb-6">{form.email}</p>
              <p className="text-blue-300/50 text-xs leading-relaxed mb-8">
                The link expires in 1 hour. Check your spam folder if you don&apos;t see it.
              </p>
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/8 hover:text-white transition-all"
              >
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </motion.div>
          ) : (
            /* ── Form state ── */
            <>
              <div className="mb-7">
                <div className="w-12 h-12 rounded-xl bg-brand-green/15 flex items-center justify-center mb-4">
                  <Mail size={22} className="text-brand-green" />
                </div>
                <h2 className="text-white font-heading font-bold text-2xl">Forgot Password?</h2>
                <p className="text-blue-300/70 text-sm mt-1">
                  Enter your email and we&apos;ll send you a reset link.
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm"
                >
                  <span>⚠</span><span>{error}</span>
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
                          key={r.value} type="button"
                          onClick={() => setForm({ ...form, role: r.value })}
                          className={`flex flex-col items-center gap-1.5 py-3 px-2 rounded-xl border-2 text-xs font-semibold transition-all ${
                            active
                              ? "border-brand-green bg-brand-green/15 text-white shadow-lg shadow-brand-green/20"
                              : "border-white/10 text-white/50 hover:border-white/25 hover:bg-white/5 hover:text-white/80"
                          }`}
                        >
                          <span className="text-xl">{r.emoji}</span>
                          <span>{r.label}</span>
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

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-green/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Sending reset link...
                    </span>
                  ) : "Send Reset Link →"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="flex items-center justify-center gap-1.5 text-sm text-white/40 hover:text-white/70 transition-colors">
                  <ArrowLeft size={13} /> Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
