"use client";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { Eye, EyeOff, CheckCircle, Circle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AssignmentOption { id: number; name: string; }

const ROLES = [
  { value: "athlete",      label: "Athlete",      emoji: "🏃", desc: "Log training & recovery" },
  { value: "coach",        label: "Coach",        emoji: "🧑🏫", desc: "Monitor your athletes" },
  { value: "nutritionist", label: "Nutritionist", emoji: "🥗", desc: "Manage diet plans" },
];

const EVENTS = ["100m","200m","400m","800m","1500m","5000m","10000m","Marathon","Hurdles","Long Jump","High Jump","Shot Put","Javelin","Discus","Triathlon","Other"];

const STEPS = [
  { key: "account",  label: "Account",  desc: "Basic info" },
  { key: "details",  label: "Details",  desc: "Role setup" },
  { key: "security", label: "Security", desc: "Password" },
];

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

export default function RegisterPage() {
  const { register } = useAuth();
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "athlete", specialization: "", coach_id: "", nutritionist_id: "",
  });
  const [coaches, setCoaches]             = useState<AssignmentOption[]>([]);
  const [nutritionists, setNutritionists] = useState<AssignmentOption[]>([]);
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [step] = useState(0);

  useEffect(() => {
    api.get("/auth/onboarding-options")
      .then((res) => {
        setCoaches(res.data.coaches ?? []);
        setNutritionists(res.data.nutritionists ?? []);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    try {
      await register({
        name: form.name, email: form.email, password: form.password, role: form.role,
        specialization: form.role === "athlete" ? form.specialization : undefined,
        coach_id: form.role === "athlete" && form.coach_id ? Number(form.coach_id) : null,
        nutritionist_id: form.role === "athlete" && form.nutritionist_id ? Number(form.nutritionist_id) : null,
      } as Parameters<typeof register>[0]);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "dark-input pr-4";
  const selectClass = "dark-input appearance-none";

  return (
    <main className="min-h-screen flex bg-[#0A1628]">

      {/* ── Left panel ──────────────────────────────────── */}
      <div
        className="hidden lg:flex flex-col justify-between w-[45%] relative overflow-hidden p-12"
        style={{ background: "linear-gradient(135deg, #0F2A5E 0%, #0A3D2E 50%, #0A1628 100%)" }}
      >
        {/* Decorations */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #10B981, transparent)", transform: "translate(30%, -30%)" }} />
        <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #2563EB, transparent)", transform: "translate(-30%, 30%)" }} />

        {/* Brand */}
        <div className="relative z-10 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-brand-green flex items-center justify-center">
            <span className="text-white font-bold text-sm">AN</span>
          </div>
          <div>
            <h1 className="text-white font-heading font-bold text-lg tracking-wide leading-none">AfyaNexus</h1>
            <p className="text-brand-green text-xs font-semibold uppercase tracking-widest">v1.0</p>
          </div>
        </div>

        {/* Main content */}
        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="text-white font-heading font-bold text-4xl leading-tight mb-4">
              Join AfyaNexus.<br />
              <span className="bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">
                Start tracking today.
              </span>
            </h2>
            <p className="text-blue-200/70 text-sm leading-relaxed">
              Create your account in under a minute. Choose your role, set up your profile, and start logging data immediately.
            </p>
          </div>

          {/* Role cards */}
          <div className="space-y-3">
            {ROLES.map((r) => (
              <motion.div
                key={r.value}
                whileHover={{ x: 4 }}
                onClick={() => setForm({ ...form, role: r.value })}
                className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                  form.role === r.value
                    ? "border-brand-green/50 bg-brand-green/10"
                    : "border-white/8 bg-white/4 hover:border-white/20"
                }`}
              >
                <span className="text-3xl">{r.emoji}</span>
                <div>
                  <p className={`text-sm font-semibold ${form.role === r.value ? "text-brand-green" : "text-white"}`}>{r.label}</p>
                  <p className="text-blue-300/60 text-xs">{r.desc}</p>
                </div>
                {form.role === r.value && (
                  <CheckCircle size={16} className="text-brand-green ml-auto" />
                )}
              </motion.div>
            ))}
          </div>

          {/* Progress steps */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => (
              <div key={s.key} className="flex items-center gap-2">
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  i === step ? "bg-brand-green text-white" :
                  i < step   ? "bg-brand-green/20 text-brand-green" :
                               "bg-white/8 text-white/30"
                }`}>
                  <span>{i + 1}</span>
                  <span>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && <div className={`w-4 h-px ${i < step ? "bg-brand-green/50" : "bg-white/10"}`} />}
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-blue-400/50 text-xs">AfyaNexus © 2026 · Capstone Project v1.0</p>
      </div>

      {/* ── Right panel ─────────────────────────────────── */}
      <div
        className="flex-1 flex items-start justify-center px-6 py-12 overflow-y-auto relative"
        style={{ background: "linear-gradient(180deg, #0D1F3C 0%, #0A1628 100%)" }}
      >
        {/* Dot grid */}
        <div className="absolute inset-0 opacity-5"
          style={{ backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)", backgroundSize: "32px 32px" }} />

        <motion.div
          className="w-full max-w-md relative z-10 my-auto"
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
            <p className="text-blue-300/70 text-sm">Create your account</p>
          </div>

          {/* Form card */}
          <div className="bg-white/[0.06] backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">

            <div className="mb-6">
              <h2 className="text-white font-heading font-bold text-2xl">Create Account</h2>
              <p className="text-blue-300/70 text-sm mt-1">Select your role to get started</p>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl px-4 py-3 mb-5 text-sm"
                >
                  <span className="mt-0.5">⚠</span>
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Role selector */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-3">I am a</label>
                <div className="grid grid-cols-3 gap-3">
                  {ROLES.map((r) => {
                    const active = form.role === r.value;
                    return (
                      <motion.button
                        key={r.value} type="button"
                        whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                        onClick={() => setForm({ ...form, role: r.value })}
                        className={`flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl border-2 transition-all ${
                          active
                            ? "border-brand-green bg-brand-green/15 text-white shadow-lg shadow-brand-green/20"
                            : "border-white/10 text-white/50 hover:border-white/25 hover:bg-white/5 hover:text-white/80"
                        }`}
                      >
                        <motion.span
                          className="text-2xl"
                          animate={active ? { y: -3 } : { y: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {r.emoji}
                        </motion.span>
                        <span className="text-xs font-semibold">{r.label}</span>
                        <span className={`text-xs ${active ? "text-brand-green/80" : "text-white/25"}`}>{r.desc}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Full Name</label>
                <input type="text" required value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inputClass} placeholder="Your full name" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Email Address</label>
                <input type="email" required value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inputClass} placeholder="you@example.com" />
              </div>

              {/* Athlete-only fields */}
              <AnimatePresence>
                {form.role === "athlete" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t border-white/8 pt-4 space-y-3">
                      <p className="text-xs font-semibold text-white/40 uppercase tracking-widest">Athlete Details</p>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">
                          Specialization <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <select value={form.specialization}
                          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                          className={selectClass}>
                          <option value="" className="bg-[#0D1F3C]">Select your event</option>
                          {EVENTS.map((s) => <option key={s} value={s} className="bg-[#0D1F3C]">{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">
                          Coach <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <select value={form.coach_id}
                          onChange={(e) => setForm({ ...form, coach_id: e.target.value })}
                          className={selectClass}>
                          <option value="" className="bg-[#0D1F3C]">Select a coach</option>
                          {coaches.map((c) => <option key={c.id} value={c.id} className="bg-[#0D1F3C]">{c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-white/80 mb-1.5">
                          Nutritionist <span className="text-white/30 font-normal">(optional)</span>
                        </label>
                        <select value={form.nutritionist_id}
                          onChange={(e) => setForm({ ...form, nutritionist_id: e.target.value })}
                          className={selectClass}>
                          <option value="" className="bg-[#0D1F3C]">Select a nutritionist</option>
                          {nutritionists.map((n) => <option key={n.id} value={n.id} className="bg-[#0D1F3C]">{n.name}</option>)}
                        </select>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Password */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? "text" : "password"} required value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    className="dark-input pr-11" placeholder="Min. 6 characters" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition-colors">
                    {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-semibold text-white/80 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirm ? "text" : "password"} required value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    className={`dark-input pr-11 ${
                      form.confirmPassword && form.password !== form.confirmPassword
                        ? "border-red-500/50" : ""
                    }`}
                    placeholder="••••••••" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3.5 text-white/30 hover:text-white/70 transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
              </div>

              {/* Submit */}
              <motion.button
                type="submit" disabled={loading}
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                className="w-full bg-brand-green text-white py-3.5 rounded-xl font-semibold hover:bg-emerald-400 transition-all disabled:opacity-50 hover:shadow-lg hover:shadow-brand-green/30 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : "Create Account →"}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-white/30 text-xs">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <Link href="/login"
              className="block w-full text-center py-3 rounded-xl border border-white/15 text-white/70 text-sm font-semibold hover:bg-white/8 hover:text-white transition-all">
              Already have an account? Sign in
            </Link>

            <p className="text-center text-xs text-white/25 mt-5">
              AfyaNexus © 2026 · Capstone Project v1.0
            </p>
          </div>
        </motion.div>
      </div>
    </main>
  );
}
