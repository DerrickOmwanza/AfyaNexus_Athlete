"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { Activity, Users, Utensils, Shield, Zap, BarChart2, Watch, ArrowRight, ChevronDown } from "lucide-react";

const ROLES = [
  {
    icon: "🏃",
    title: "Athletes",
    desc: "Log training sessions, track daily recovery, sync your T70 wearable and monitor your ML-powered injury risk score in real time.",
    color: "from-blue-500/20 to-blue-600/10 border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-300",
  },
  {
    icon: "🧑‍🏫",
    title: "Coaches",
    desc: "Monitor all your athletes from one dashboard. Get instant injury risk alerts, performance trends, and training load analysis.",
    color: "from-emerald-500/20 to-emerald-600/10 border-emerald-500/30",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  {
    icon: "🥗",
    title: "Nutritionists",
    desc: "Create personalised diet plans, track caloric and macro intake, and align nutrition strategies with each athlete's training load.",
    color: "from-orange-500/20 to-orange-600/10 border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-300",
  },
];

const FEATURES = [
  { icon: Activity,  title: "ML Injury Prediction",  desc: "Scores injury risk 0–100 after every training and recovery log using a rule-based engine designed for scikit-learn upgrade." },
  { icon: Shield,    title: "Role-Based Access",      desc: "Coaches and nutritionists only see athletes assigned to them. Zero data leakage across roles." },
  { icon: Watch,     title: "Wearable Integration",   desc: "Sync your T70 smartwatch — heart rate, sleep duration, and step count — directly to your athlete profile." },
  { icon: BarChart2, title: "Performance Reports",    desc: "30-day trend charts for injury risk score, training load, sleep quality, soreness, and nutrition." },
  { icon: Users,     title: "Team Management",        desc: "Coaches manage full athlete rosters with search, filter, and individual performance dashboards." },
  { icon: Utensils,  title: "Nutrition Tracking",     desc: "Log daily macros and calories. Nutritionists create and manage personalised diet plans per athlete." },
  { icon: Zap,       title: "Instant Alerts",         desc: "High-risk athletes surface immediately on the coach dashboard with color-coded urgency banners." },
  { icon: Shield,    title: "JWT Security",           desc: "All endpoints secured with JWT authentication. Passwords hashed with bcrypt. Data encrypted at rest." },
];

const STATS = [
  { value: "3",    label: "User Roles",              sub: "Athlete · Coach · Nutritionist" },
  { value: "11",   label: "Functional Requirements", sub: "FR-01 to FR-11 implemented" },
  { value: "25",   label: "Tests Passed",            sub: "100% system test pass rate" },
  { value: "ML",   label: "Powered Predictions",     sub: "Rule-based injury risk engine" },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.1 } },
};

export default function HomePage() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 180]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const onScroll = () => {
      const total = document.body.scrollHeight - window.innerHeight;
      setScrollProgress(total > 0 ? (window.scrollY / total) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <main className="bg-[#0A1628] text-white overflow-x-hidden">

      {/* ── Scroll progress bar ─────────────────────────── */}
      <div
        className="fixed top-0 left-0 h-0.5 bg-gradient-to-r from-brand-green to-blue-400 z-50 transition-all duration-100"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 md:px-12 py-4 bg-[#0A1628]/80 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-brand-green flex items-center justify-center">
            <span className="text-white font-bold text-xs">AN</span>
          </div>
          <span className="text-white font-heading font-bold text-lg tracking-wide">AfyaNexus</span>
          <span className="hidden sm:inline ml-1 text-brand-green text-xs font-semibold uppercase tracking-widest">v1.0</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-300 hover:text-white border border-white/20 rounded-lg hover:bg-white/8 transition-all">
            Sign In
          </Link>
          <Link href="/register" className="px-4 py-2 text-sm font-semibold bg-brand-green text-white rounded-lg hover:bg-emerald-400 transition-all hover:shadow-lg hover:shadow-emerald-500/25">
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── Hero section ────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-20 overflow-hidden">

        {/* Hero background image with parallax */}
        <motion.div className="absolute inset-0 z-0" style={{ y: heroY }}>
          <Image
            src="/hero.png"
            alt="AfyaNexus hero"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A1628]/60 via-[#0A1628]/40 to-[#0A1628]" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1628]/50 via-transparent to-[#0A1628]/50" />
        </motion.div>

        {/* Hero content */}
        <motion.div
          className="relative z-10 max-w-4xl mx-auto"
          style={{ opacity: heroOpacity }}
          initial="hidden"
          animate="visible"
          variants={stagger}
        >
          <motion.div variants={fadeUp} className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Capstone Project · Centralized Athlete Management System</span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight mb-6">
            Smarter Athlete<br />
            Monitoring,{" "}
            <span className="bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">
              Powered by AI
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-gray-300 text-base sm:text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            AfyaNexus centralises training, recovery, nutrition and wearable data for athletes, coaches and nutritionists — with machine learning injury risk prediction built in.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-emerald-400 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105"
            >
              Create Free Account <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm"
            >
              Sign In →
            </Link>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-white/40"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-xs">Scroll to explore</span>
          <ChevronDown size={16} />
        </motion.div>
      </section>

      {/* ── Stats bar ───────────────────────────────────── */}
      <section className="relative z-10 bg-white/5 border-y border-white/8 py-10 px-6">
        <motion.div
          className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={fadeUp} className="text-center">
              <p className="text-3xl md:text-4xl font-heading font-bold bg-gradient-to-r from-brand-green to-blue-400 bg-clip-text text-transparent">{s.value}</p>
              <p className="text-white font-semibold text-sm mt-1">{s.label}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.sub}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Role cards ──────────────────────────────────── */}
      <section className="px-6 py-24 max-w-6xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        >
          <span className="text-brand-green text-xs font-semibold uppercase tracking-widest">Who It's For</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mt-2 mb-3">Built for Every Role</h2>
          <p className="text-gray-400 text-sm max-w-xl mx-auto">Three dedicated portals — each tailored to the specific needs of athletes, coaches, and nutritionists.</p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        >
          {ROLES.map((r) => (
            <motion.div
              key={r.title}
              variants={fadeUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className={`bg-gradient-to-br ${r.color} border rounded-2xl p-7 backdrop-blur-sm`}
            >
              <div className="text-4xl mb-4">{r.icon}</div>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.badge} mb-3 inline-block`}>{r.title}</span>
              <h3 className="text-white font-heading font-bold text-lg mb-2">{r.title}</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{r.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── Features grid ───────────────────────────────── */}
      <section className="bg-white/3 border-t border-white/8 px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-14"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
          >
            <span className="text-brand-green text-xs font-semibold uppercase tracking-widest">Platform Features</span>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mt-2 mb-3">Everything You Need</h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">A complete athlete management platform — from daily logs to ML-powered injury prediction.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
          >
            {FEATURES.map((f) => (
              <motion.div
                key={f.title}
                variants={fadeUp}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="bg-white/5 border border-white/8 rounded-xl p-5 hover:bg-white/10 hover:border-brand-green/30 transition-all group"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-green/15 flex items-center justify-center mb-4 group-hover:bg-brand-green/25 transition-colors">
                  <f.icon size={18} className="text-brand-green" />
                </div>
                <h4 className="text-white font-semibold text-sm mb-2">{f.title}</h4>
                <p className="text-gray-400 text-xs leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section className="px-6 py-24 max-w-5xl mx-auto">
        <motion.div
          className="text-center mb-14"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
        >
          <span className="text-brand-green text-xs font-semibold uppercase tracking-widest">How It Works</span>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mt-2 mb-3">From Log to Insight in Seconds</h2>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-6"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        >
          {[
            { step: "01", title: "Log Data",        desc: "Athletes log training, recovery, and nutrition daily.",          icon: Activity },
            { step: "02", title: "Sync Wearable",   desc: "T70 smartwatch syncs heart rate, sleep, and steps.",            icon: Watch },
            { step: "03", title: "ML Prediction",   desc: "Engine scores injury risk 0–100 after every submission.",       icon: Zap },
            { step: "04", title: "Coach Reviews",   desc: "Coaches and nutritionists act on real-time insights.",          icon: Users },
          ].map((s, i) => (
            <motion.div key={s.step} variants={fadeUp} className="relative text-center">
              {i < 3 && (
                <div className="hidden md:block absolute top-6 left-[60%] w-[80%] h-px bg-gradient-to-r from-brand-green/40 to-transparent" />
              )}
              <div className="w-12 h-12 rounded-2xl bg-brand-green/15 border border-brand-green/30 flex items-center justify-center mx-auto mb-4">
                <s.icon size={20} className="text-brand-green" />
              </div>
              <span className="text-brand-green text-xs font-bold">{s.step}</span>
              <h4 className="text-white font-heading font-semibold text-sm mt-1 mb-2">{s.title}</h4>
              <p className="text-gray-400 text-xs leading-relaxed">{s.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── CTA section ─────────────────────────────────── */}
      <section className="px-6 py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-green/10 via-blue-500/10 to-brand-green/10" />
        <div className="absolute inset-0 border-y border-white/8" />
        <motion.div
          className="relative z-10 max-w-3xl mx-auto text-center"
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={stagger}
        >
          <motion.span variants={fadeUp} className="text-brand-green text-xs font-semibold uppercase tracking-widest">Get Started Today</motion.span>
          <motion.h2 variants={fadeUp} className="text-3xl md:text-5xl font-heading font-bold text-white mt-3 mb-5">
            Ready to Transform<br />Athlete Performance?
          </motion.h2>
          <motion.p variants={fadeUp} className="text-gray-400 text-sm md:text-base mb-10 leading-relaxed">
            Join AfyaNexus today. Register as an athlete, coach, or nutritionist and start tracking performance in minutes. No setup required.
          </motion.p>
          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-brand-green text-white font-semibold rounded-xl hover:bg-emerald-400 transition-all hover:shadow-xl hover:shadow-emerald-500/30 hover:scale-105 text-sm"
            >
              Create Your Account <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-10 py-4 bg-white/8 border border-white/15 text-white font-semibold rounded-xl hover:bg-white/15 transition-all text-sm"
            >
              Sign In to Dashboard
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="border-t border-white/8 px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-brand-green flex items-center justify-center">
              <span className="text-white font-bold text-xs">AN</span>
            </div>
            <span className="text-white font-heading font-bold text-sm">AfyaNexus</span>
          </div>
          <p className="text-gray-500 text-xs text-center">
            AfyaNexus © 2026 · Centralized Athlete Training & Nutrition Tracking System · Capstone Project v1.0
          </p>
          <div className="flex items-center gap-4">
            <Link href="/login"    className="text-gray-500 hover:text-white text-xs transition-colors">Sign In</Link>
            <Link href="/register" className="text-gray-500 hover:text-white text-xs transition-colors">Register</Link>
          </div>
        </div>
      </footer>

    </main>
  );
}
