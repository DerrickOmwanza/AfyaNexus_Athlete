"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Users, AlertTriangle, TrendingUp, Shield, ArrowRight, Activity } from "lucide-react";

interface AthleteWithPrediction {
  id: number;
  name: string;
  email: string;
  specialization: string;
  latest_prediction: { risk_score: number; risk_level: string; date: string } | null;
}

const riskBadge = (level: string | undefined) =>
  level === "High"   ? "bg-red-100 text-red-600 border border-red-200" :
  level === "Medium" ? "bg-orange-100 text-orange-600 border border-orange-200" :
  level === "Low"    ? "bg-green-100 text-green-600 border border-green-200" :
                       "bg-gray-100 text-brand-muted border border-gray-200";

export default function CoachDashboard() {
  const [athletes, setAthletes] = useState<AthleteWithPrediction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("/coach/athletes")
      .then((res) => setAthletes(res.data.athletes))
      .catch(() => setError("Failed to load athletes."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );
  if (error) return <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>;

  const high   = athletes.filter((a) => a.latest_prediction?.risk_level === "High");
  const medium = athletes.filter((a) => a.latest_prediction?.risk_level === "Medium");
  const low    = athletes.filter((a) => a.latest_prediction?.risk_level === "Low");

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Header ──────────────────────────────────────── */}
      <div>
        <h2 className="text-xl font-heading font-bold text-brand-dark">Coach Dashboard</h2>
        <p className="text-sm text-brand-muted mt-0.5">Monitor your athletes&apos; performance and injury risk.</p>
      </div>

      {/* ── Alert banner ────────────────────────────────── */}
      {high.length > 0 && (
        <div className="alert-banner bg-red-50 border border-red-200 text-red-800">
          <AlertTriangle size={16} className="text-red-500 shrink-0" />
          <div className="flex-1">
            <span className="font-semibold">{high.length} athlete{high.length > 1 ? "s" : ""} at High Risk</span>
            <span className="text-red-600"> — immediate attention required.</span>
          </div>
          <Link href="/dashboard/coach/athletes" className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline shrink-0">
            View All <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {athletes.length === 0 && (
        <div className="alert-banner bg-brand-blue-light border border-blue-200 text-blue-800">
          <Users size={16} className="text-brand-blue shrink-0" />
          <span>No athletes assigned yet. Athletes can link to you during registration.</span>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Athletes", value: athletes.length, accent: "border-brand-blue",   text: "text-brand-blue",   icon: Users,        bg: "bg-brand-blue-light" },
          { label: "High Risk",      value: high.length,     accent: "border-red-500",       text: "text-red-500",      icon: AlertTriangle, bg: "bg-red-50" },
          { label: "Medium Risk",    value: medium.length,   accent: "border-brand-orange",  text: "text-brand-orange", icon: TrendingUp,    bg: "bg-brand-orange-light" },
          { label: "Low Risk",       value: low.length,      accent: "border-brand-green",   text: "text-brand-green",  icon: Shield,        bg: "bg-brand-green-light" },
        ].map((c) => (
          <div key={c.label} className={`bg-white rounded-2xl p-5 border-l-4 shadow-card card-hover ${c.accent}`}>
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">{c.label}</p>
              <div className={`w-8 h-8 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon size={14} className={c.text} />
              </div>
            </div>
            <p className={`text-3xl font-heading font-bold ${c.text}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* ── High risk panel ─────────────────────────────── */}
      {high.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="text-sm font-heading font-semibold text-brand-dark">High Risk Alerts</p>
            </div>
            <span className="badge bg-red-100 text-red-600">{high.length} urgent</span>
          </div>
          <div className="divide-y divide-gray-50">
            {high.map((a) => (
              <div key={a.id} className="flex items-center justify-between px-5 py-4 hover:bg-red-50/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center text-red-600 text-xs font-bold">
                    {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-dark">{a.name}</p>
                    <p className="text-xs text-brand-muted">{a.specialization || "No specialization"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-lg font-heading font-bold text-red-500">{a.latest_prediction?.risk_score?.toFixed(0)}</p>
                    <p className="text-xs text-brand-muted">risk score</p>
                  </div>
                  <Link href={`/dashboard/coach/athletes/${a.id}`} className="flex items-center gap-1 px-3 py-1.5 bg-brand-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-900 transition-colors">
                    View <ArrowRight size={11} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── All athletes table ───────────────────────────── */}
      {athletes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-heading font-semibold text-brand-dark">All Athletes</p>
            <Link href="/dashboard/coach/athletes" className="flex items-center gap-1 text-xs text-brand-blue font-semibold hover:underline">
              View all <ArrowRight size={11} />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-muted border-b border-gray-50">
                  <th className="px-5 py-3 font-semibold">Athlete</th>
                  <th className="px-5 py-3 font-semibold">Specialization</th>
                  <th className="px-5 py-3 font-semibold">Risk Score</th>
                  <th className="px-5 py-3 font-semibold">Risk Level</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-blue-light flex items-center justify-center text-brand-blue text-xs font-bold">
                          {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-semibold text-brand-dark text-xs">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-brand-muted">{a.specialization || "—"}</td>
                    <td className="px-5 py-3 font-heading font-bold text-brand-dark">{a.latest_prediction?.risk_score?.toFixed(0) ?? "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${riskBadge(a.latest_prediction?.risk_level)}`}>
                        {a.latest_prediction?.risk_level ?? "No data"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/coach/athletes/${a.id}`} className="flex items-center gap-1 text-xs text-brand-blue font-semibold hover:underline">
                        View <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Workflow panel ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Athletes",  value: athletes.length, icon: Users,        color: "text-brand-blue  bg-brand-blue-light",   desc: "Under your sponsorship" },
          { label: "Need Attention",  value: high.length + medium.length, icon: Activity, color: "text-brand-orange bg-brand-orange-light", desc: "Medium + High risk" },
          { label: "Performing Well", value: low.length,      icon: Shield,       color: "text-brand-green bg-brand-green-light",  desc: "Low risk athletes" },
        ].map((w) => (
          <div key={w.label} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 card-hover">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${w.color.split(" ")[1]}`}>
              <w.icon size={18} className={w.color.split(" ")[0]} />
            </div>
            <p className="text-2xl font-heading font-bold text-brand-dark">{w.value}</p>
            <p className="text-sm font-semibold text-brand-dark mt-0.5">{w.label}</p>
            <p className="text-xs text-brand-muted mt-0.5">{w.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
