"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { Users, Utensils, ArrowRight, CheckCircle, ClipboardList } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface Athlete {
  id: number;
  name: string;
  email: string;
  specialization: string;
  latest_prediction: { risk_score: number; risk_level: string } | null;
  diet_plan_count: number;
}

const riskBadge = (level: string | undefined) =>
  level === "High"   ? "bg-red-100 text-red-600 border border-red-200" :
  level === "Medium" ? "bg-orange-100 text-orange-600 border border-orange-200" :
  level === "Low"    ? "bg-green-100 text-green-600 border border-green-200" :
                       "bg-gray-100 text-gray-500 border border-gray-200";

export default function NutritionistDashboard() {
  const { user } = useAuth();
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");

  useEffect(() => {
    api.get("/nutritionist/athletes")
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

  return (
    <div className="space-y-5 animate-fade-in-up">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-heading font-bold text-brand-dark">
            {`${new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 17 ? "Good afternoon" : "Good evening"}, ${user?.name?.split(" ")[0] ?? ""}!`}
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">Manage nutrition plans for your registered athletes.</p>
        </div>
        <Link
          href="/dashboard/nutritionist/diet-plans"
          className="flex items-center gap-1.5 px-4 py-2 bg-brand-green text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition-all hover:shadow-md"
        >
          <Utensils size={13} /> New Diet Plan
        </Link>
      </div>

      {/* ── Workflow banner ──────────────────────────────── */}
      {athletes.length === 0 ? (
        <div className="alert-banner bg-brand-blue-light border border-blue-200 text-blue-800">
          <Users size={16} className="text-brand-blue shrink-0" />
          <span>No athletes registered under you yet. Athletes can link to you during registration.</span>
        </div>
      ) : (
        <div className="alert-banner bg-brand-green-light border border-green-200 text-green-800">
          <CheckCircle size={16} className="text-brand-green shrink-0" />
          <span>
            <span className="font-semibold">{athletes.length} athlete{athletes.length > 1 ? "s" : ""}</span> registered under you.
            Review their nutrition logs and update diet plans as needed.
          </span>
          <Link href="/dashboard/nutritionist/diet-plans" className="flex items-center gap-1 text-xs font-semibold text-brand-green hover:underline shrink-0">
            Manage Plans <ArrowRight size={12} />
          </Link>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Registered Athletes", value: athletes.length,                                          icon: Users,         color: "text-brand-green  bg-brand-green-light",  desc: "Under your care" },
          { label: "Active Plans",         value: athletes.filter(a => a.diet_plan_count > 0).length,      icon: Utensils,      color: "text-brand-blue   bg-brand-blue-light",   desc: "Athletes with diet plans" },
          { label: "Needs Review",         value: athletes.filter(a => a.diet_plan_count === 0).length,    icon: ClipboardList, color: "text-brand-orange bg-brand-orange-light", desc: "No diet plan yet" },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 card-hover">
            <div className="flex items-start justify-between mb-3">
              <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">{c.label}</p>
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${c.color.split(" ")[1]}`}>
                <c.icon size={14} className={c.color.split(" ")[0]} />
              </div>
            </div>
            <p className={`text-3xl font-heading font-bold ${c.color.split(" ")[0]}`}>{c.value}</p>
            <p className="text-xs text-brand-muted mt-1">{c.desc}</p>
          </div>
        ))}
      </div>

      {/* ── Athletes list ────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
          <p className="text-sm font-heading font-semibold text-brand-dark">My Athletes</p>
          <Link href="/dashboard/nutritionist/diet-plans" className="flex items-center gap-1 text-xs text-brand-green font-semibold hover:underline">
            Manage diet plans <ArrowRight size={11} />
          </Link>
        </div>

        {athletes.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Users size={32} className="text-gray-200 mx-auto mb-3" />
            <p className="text-sm text-brand-muted">No athletes registered under you yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-brand-muted border-b border-gray-50">
                  <th className="px-5 py-3 font-semibold">Athlete</th>
                  <th className="px-5 py-3 font-semibold">Specialization</th>
                  <th className="px-5 py-3 font-semibold">Risk Level</th>
                  <th className="px-5 py-3 font-semibold">Diet Plans</th>
                  <th className="px-5 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {athletes.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-brand-green-light flex items-center justify-center text-brand-green text-xs font-bold">
                          {a.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                        </div>
                        <span className="font-semibold text-brand-dark text-xs">{a.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-xs text-brand-muted">{a.specialization || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${riskBadge(a.latest_prediction?.risk_level)}`}>
                        {a.latest_prediction?.risk_level ?? "No data"}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-semibold ${ a.diet_plan_count === 0 ? "text-brand-orange" : "text-brand-green" }`}>
                        {a.diet_plan_count === 0 ? "None" : `${a.diet_plan_count} plan${a.diet_plan_count > 1 ? "s" : ""}`}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <Link href={`/dashboard/nutritionist/athletes/${a.id}`} className="flex items-center gap-1 text-xs text-brand-blue font-semibold hover:underline">
                        View dashboard <ArrowRight size={11} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick actions ────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/dashboard/nutritionist/athletes" className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 card-hover flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-blue-light flex items-center justify-center">
            <Users size={20} className="text-brand-blue" />
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-brand-dark">View All Athletes</p>
            <p className="text-xs text-brand-muted mt-0.5">Browse athlete profiles and nutrition logs</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 ml-auto" />
        </Link>
        <Link href="/dashboard/nutritionist/diet-plans" className="bg-white rounded-2xl p-5 shadow-card border border-gray-100 card-hover flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-green-light flex items-center justify-center">
            <Utensils size={20} className="text-brand-green" />
          </div>
          <div>
            <p className="text-sm font-heading font-semibold text-brand-dark">Manage Diet Plans</p>
            <p className="text-xs text-brand-muted mt-0.5">Create and update personalised nutrition plans</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 ml-auto" />
        </Link>
      </div>
    </div>
  );
}
