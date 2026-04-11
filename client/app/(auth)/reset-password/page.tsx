"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, CheckCircle, Circle, KeyRound, AlertTriangle } from "lucide-react";

function PasswordStrength({ password }: { password: string }) {
  const checks = [
    { label: "At least 6 characters", pass: password.length >= 6 },
    { label: "Contains a number",     pass: /\d/.test(password) },
    { label: "Contains a letter",     pass: /[a-zA-Z]/.test(password) },
  ];
  const score = checks.filter((c) => c.pass).length;
  const bar   = score === 3 ? "bg-brand-green w-full" : score === 2 ? "bg-yellow-400 w-2/3" : score === 1 ? "bg-red-400 w-1/3" : "w-0";
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1.5">
      <div className="h-1 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${bar}`} />
      </div>
      <div className="flex gap-3 flex-wrap">
        {checks.map((c) => (
          <div key={c.label} className={`flex items-center gap-1 text-xs ${c.pass ? "text-brand-green" : "text-white/30"}`}>
            {c.pass ? <CheckCircle size={10} /> : <Circle size={10} />}
            {c.label}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const token = searchParams.get("token") ?? "";
  const role  = searchParams.get("role")  ?? "";

  const [form, setForm]       = useState({ new_password: "", confirm_password: "" });
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError]     = useState("");

  useEffect(() => {
    if (!token || !role) setError("Invalid reset link. Please request a new one.");
  }, [token, role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.new_password !== form.confirm_password) {
      setError("Passwords do not match.");
      return;
    }
    if (form.new_password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/auth/reset-password", { token, new_password: form.new_password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "dark-input";

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-12 relative"
      style={{ background: "linear-gradient(180deg, #0D1F3C 0%, #0A1628 100%)" }}
    >
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
          <div className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-sm">AN</span>
            </div>
            <h1 className="text-white font-heading font-bold text-xl">AfyaNexus</h1>
          </div>
        </div>

        <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-16 h-16 rounded-full bg-brand-green/15 flex items-center justify-center mx-auto mb-5">
                <CheckCircle size={32} className="text-brand-green" />
              </div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">Password Reset!</h2>
              <p className="text-blue-300/70 text-sm leading-relaxed mb-6">
                Your password has been updated successfully. Redirecting you to sign in...
              </p>
              <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-brand-green rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 3 }}
                />
              </div>
            </motion.div>
          ) : !token || !role ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-5">
                <AlertTriangle size={32} className="text-red-400" />
              </div>
              <h2 className="text-white font-heading font-bold text-xl mb-3">Invalid Reset Link</h2>
              <p className="text-blue-300/70 text-sm mb-6">This link is invalid or has expired.</p>
              <Link href="/forgot-password"
                className="block w-full text-center py-3 rounded-xl bg-brand-green text-white text-sm font-semibold hover:bg-emerald-400 transition-all">
                Request New Link
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-7">
                <div className="w-12 h-12 rounded-xl bg-brand-green/15 flex items-center justify-center mb-4">
                  <KeyRound size={22} className="text-brand-green" />
                </div>
                <h2 className="text-white font-heading font-bold text-2xl">Set New Password</h2>
                <p className="text-blue-300/70 text-sm mt-1 capitalize">
                  Resetting password for your <span className="text-brand-green font-semibold">{role}</span> account.
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
                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"} required
                      value={form.new_password}
                      onChange={(e) => setForm({ ...form, new_password: e.target.value })}
                      className="dark-input pr-11"
                      placeholder="Min. 6 characters"
                    />
                    <button type="button" onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition-colors">
                      {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <PasswordStrength password={form.new_password} />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-white/80 mb-1.5">Confirm New Password</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"} required
                      value={form.confirm_password}
                      onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
                      className={`dark-input pr-11 ${
                        form.confirm_password && form.new_password !== form.confirm_password
                          ? "border-red-500/50" : ""
                      }`}
                      placeholder="••••••••"
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition-colors">
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.confirm_password && form.new_password !== form.confirm_password && (
                    <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit" disabled={loading}
                  className="w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-green/30"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Resetting password...
                    </span>
                  ) : "Reset Password →"}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link href="/login" className="text-sm text-white/40 hover:text-white/70 transition-colors">
                  Back to Sign In
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </main>
  );
}
