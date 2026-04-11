"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import StatCard from "@/components/ui/StatCard";
import InjuryRiskGauge from "@/components/ui/InjuryRiskGauge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import { Moon, Activity, Apple, Watch, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";

interface DashboardData {
  athlete: { name: string; specialization: string };
  recentRecovery: Array<{ date: string; sleep_hours: number; soreness_level: number; mood: string }>;
  recentTraining: Array<{ date: string; workout_type: string; intensity: number; duration_min: number }>;
  latestPrediction: { risk_score: number; risk_level: string } | null;
  wearable: { heart_rate_avg: number; sleep_duration: number; steps: number; synced_at: string } | null;
}

function NextActionBanner({ recovery, training }: { recovery: boolean; training: boolean }) {
  if (!recovery) return (
    <div className="alert-banner bg-brand-orange-light border border-orange-200 text-orange-800">
      <AlertTriangle size={16} className="text-brand-orange shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">Next Action: </span>
        Log today&apos;s morning check-in to update your injury risk score.
      </div>
      <Link href="/dashboard/athlete/recovery-log" className="flex items-center gap-1 text-xs font-semibold text-brand-orange hover:underline shrink-0">
        Log Now <ArrowRight size={12} />
      </Link>
    </div>
  );
  if (!training) return (
    <div className="alert-banner bg-brand-blue-light border border-blue-200 text-blue-800">
      <Activity size={16} className="text-brand-blue shrink-0" />
      <div className="flex-1">
        <span className="font-semibold">Next Action: </span>
        Log your training session to keep your performance data up to date.
      </div>
      <Link href="/dashboard/athlete/training-log" className="flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline shrink-0">
        Log Now <ArrowRight size={12} />
      </Link>
    </div>
  );
  return (
    <div className="alert-banner bg-brand-green-light border border-green-200 text-green-800">
      <CheckCircle size={16} className="text-brand-green shrink-0" />
      <span>All logs up to date. Keep up the great work!</span>
    </div>
  );
}

export default function AthleteDashboard() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState("");

  useEffect(() => {
    api.get("/athlete/dashboard")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load dashboard data."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
    </div>
  );
  if (error) return <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl p-4">{error}</div>;
  if (!data) return null;

  const latestRecovery = data.recentRecovery?.[0];
  const latestTraining = data.recentTraining?.[0];
  const today = new Date().toISOString().split("T")[0];
  const hasRecoveryToday = latestRecovery?.date === today;
  const hasTrainingToday = latestTraining?.date === today;

  const chartData = [...(data.recentTraining ?? [])].reverse().map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    intensity: t.intensity,
    duration: t.duration_min,
  }));

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-heading font-bold text-brand-dark">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {data.athlete.name.split(" ")[0]} 👋
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            {data.athlete.specialization ? `${data.athlete.specialization} · ` : ""}
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/dashboard/athlete/recovery-log" className="flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white text-xs font-semibold rounded-xl hover:bg-blue-900 transition-all hover:shadow-md">
            <Moon size={13} /> Morning Check-In
          </Link>
          <Link href="/dashboard/athlete/training-log" className="flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition-all hover:shadow-md">
            <Activity size={13} /> Training Log
          </Link>
        </div>
      </div>

      {/* ── Next action banner ───────────────────────────── */}
      <NextActionBanner recovery={hasRecoveryToday} training={hasTrainingToday} />

      {/* ── Stat cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Sleep Last Night"
          value={latestRecovery?.sleep_hours ? `${latestRecovery.sleep_hours}h` : "—"}
          sub={data.wearable?.sleep_duration ? `T70: ${data.wearable.sleep_duration}h` : "No wearable data"}
          accent="blue" icon={Moon}
          trend={latestRecovery?.sleep_hours ? (latestRecovery.sleep_hours >= 7 ? "up" : "down") : undefined}
        />
        <StatCard
          label="Soreness Level"
          value={latestRecovery?.soreness_level ? `${latestRecovery.soreness_level}/10` : "—"}
          sub="This morning"
          accent={(latestRecovery?.soreness_level ?? 0) >= 7 ? "red" : (latestRecovery?.soreness_level ?? 0) >= 4 ? "orange" : "green"}
          icon={Activity}
        />
        <StatCard
          label="Today's Mood"
          value={latestRecovery?.mood ?? "—"}
          sub="Morning check-in"
          accent="green"
        />
        <StatCard
          label="Last Workout"
          value={latestTraining?.workout_type ?? "—"}
          sub={latestTraining ? `Intensity: ${latestTraining.intensity}/10 · ${latestTraining.duration_min}min` : "No training logged"}
          accent="orange" icon={Activity}
        />
      </div>

      {/* ── Wearable + Risk gauge ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Wearable card */}
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 card-hover">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">T70 Wearable</p>
            <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${data.wearable ? "bg-brand-green-light text-brand-green" : "bg-gray-100 text-brand-muted"}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${data.wearable ? "bg-brand-green" : "bg-gray-400"}`} />
              {data.wearable ? "Synced" : "Not synced"}
            </div>
          </div>
          {data.wearable ? (
            <div className="space-y-3">
              {[
                { label: "Heart Rate Avg", value: `${data.wearable.heart_rate_avg} bpm` },
                { label: "Sleep Duration", value: `${data.wearable.sleep_duration}h` },
                { label: "Steps",          value: data.wearable.steps?.toLocaleString() },
              ].map((row) => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-xs text-brand-muted">{row.label}</span>
                  <span className="text-sm font-semibold text-brand-dark">{row.value}</span>
                </div>
              ))}
              <p className="text-xs text-gray-300 pt-1 border-t border-gray-50">
                Last synced: {new Date(data.wearable.synced_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="text-center py-4">
              <Watch size={28} className="text-gray-200 mx-auto mb-2" />
              <p className="text-xs text-brand-muted mb-3">No wearable data yet</p>
              <Link href="/dashboard/athlete/wearable" className="inline-flex items-center gap-1 text-xs text-brand-blue font-semibold hover:underline">
                Sync T70 device <ArrowRight size={11} />
              </Link>
            </div>
          )}
        </div>

        {/* Injury risk gauge — spans 2 cols */}
        <div className="lg:col-span-2">
          <InjuryRiskGauge
            score={data.latestPrediction?.risk_score ?? null}
            level={data.latestPrediction?.risk_level ?? null}
          />
        </div>
      </div>

      {/* ── Training chart ───────────────────────────────── */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-card border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-heading font-semibold text-brand-dark">Training Intensity — Last 7 Sessions</p>
            <Link href="/dashboard/athlete/reports" className="text-xs text-brand-blue font-semibold hover:underline flex items-center gap-1">
              Full Report <ArrowRight size={11} />
            </Link>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: "10px", border: "1px solid #E5E7EB", fontSize: "12px" }} />
              <Line type="monotone" dataKey="intensity" stroke="#1E3A8A" strokeWidth={2.5} dot={{ fill: "#1E3A8A", r: 4, strokeWidth: 2, stroke: "white" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ── Quick links row ──────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { href: "/dashboard/athlete/nutrition-log", icon: Apple,    label: "Log Nutrition",  color: "text-brand-green  bg-brand-green-light" },
          { href: "/dashboard/athlete/wearable",      icon: Watch,    label: "Wearable Sync",  color: "text-brand-blue   bg-brand-blue-light" },
          { href: "/dashboard/athlete/reports",       icon: Activity, label: "View Reports",   color: "text-brand-orange bg-brand-orange-light" },
          { href: "/dashboard/athlete/recovery-log",  icon: Moon,     label: "Recovery Log",   color: "text-brand-blue   bg-brand-blue-light" },
        ].map((q) => (
          <Link key={q.href} href={q.href} className="bg-white rounded-2xl p-4 shadow-card border border-gray-100 card-hover flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${q.color.split(" ")[1]}`}>
              <q.icon size={16} className={q.color.split(" ")[0]} />
            </div>
            <span className="text-xs font-semibold text-brand-dark">{q.label}</span>
          </Link>
        ))}
      </div>

      {/* ── Recent recovery logs ─────────────────────────── */}
      {data.recentRecovery?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <p className="text-sm font-heading font-semibold text-brand-dark">Recent Recovery Logs</p>
            <span className="text-xs text-brand-muted">{data.recentRecovery.length} entries</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-muted border-b border-gray-50">
                  <th className="px-5 py-3 font-semibold">Date</th>
                  <th className="px-5 py-3 font-semibold">Sleep</th>
                  <th className="px-5 py-3 font-semibold">Soreness</th>
                  <th className="px-5 py-3 font-semibold">Mood</th>
                </tr>
              </thead>
              <tbody>
                {data.recentRecovery.map((r, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3 text-brand-muted text-xs">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</td>
                    <td className="px-5 py-3 font-semibold text-brand-dark">{r.sleep_hours}h</td>
                    <td className="px-5 py-3">
                      <span className={`badge ${r.soreness_level >= 7 ? "bg-red-100 text-red-600" : r.soreness_level >= 4 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                        {r.soreness_level}/10
                      </span>
                    </td>
                    <td className="px-5 py-3 text-brand-muted text-xs">{r.mood}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
