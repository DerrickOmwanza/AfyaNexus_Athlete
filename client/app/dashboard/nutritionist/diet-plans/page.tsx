"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

interface Athlete {
  id: number;
  name: string;
  specialization: string;
}

interface DietPlan {
  id: number;
  athlete_id: number;
  plan_name: string;
  recommendations: string;
  created_at: string;
}

export default function DietPlansPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [dietPlans, setDietPlans] = useState<DietPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ athlete_id: "", plan_name: "", recommendations: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const [filterAthlete, setFilterAthlete] = useState("all");

  const fetchData = () => {
    api.get("/nutritionist/diet-plans")
      .then((res) => {
        setAthletes(res.data.athletes);
        setDietPlans(res.data.dietPlans);
      })
      .catch(() => setError("Failed to load diet plans."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await api.post("/nutritionist/diet-plan", {
        athlete_id: Number(form.athlete_id),
        plan_name: form.plan_name,
        recommendations: form.recommendations,
      });
      setSaveMsg("Diet plan created successfully.");
      setForm({ athlete_id: "", plan_name: "", recommendations: "" });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSaveMsg(msg || "Failed to create diet plan.");
    } finally {
      setSaving(false);
    }
  };

  const athleteMap = Object.fromEntries(athletes.map((a) => [a.id, a]));

  const filtered = filterAthlete === "all"
    ? dietPlans
    : dietPlans.filter((p) => String(p.athlete_id) === filterAthlete);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading diet plans...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">Diet Plans</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {dietPlans.length} plan{dietPlans.length !== 1 ? "s" : ""} across {athletes.length} athlete{athletes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setSaveMsg(""); }}
          className="px-4 py-2 bg-brand-green text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
        >
          {showForm ? "Cancel" : "+ New Plan"}
        </button>
      </div>

      {/* Save message */}
      {saveMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          saveMsg.includes("success")
            ? "bg-green-50 border-green-200 text-green-700"
            : "bg-red-50 border-red-200 text-red-700"
        }`}>
          {saveMsg}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-4">
          <p className="text-sm font-semibold text-brand-dark">Create New Diet Plan</p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Athlete <span className="text-red-400">*</span>
            </label>
            {athletes.length === 0 ? (
              <p className="text-sm text-gray-400">No athletes registered under you yet.</p>
            ) : (
              <select
                required
                value={form.athlete_id}
                onChange={(e) => setForm({ ...form, athlete_id: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              >
                <option value="">Select athlete...</option>
                {athletes.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}{a.specialization ? ` — ${a.specialization}` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Plan Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text" required
              value={form.plan_name}
              onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              placeholder="e.g. Pre-Competition Nutrition Plan"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recommendations <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={5} required
              value={form.recommendations}
              onChange={(e) => setForm({ ...form, recommendations: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
              placeholder="Detailed nutrition recommendations, meal timing, macros, hydration..."
            />
          </div>

          <button
            type="submit" disabled={saving || athletes.length === 0}
            className="bg-brand-green text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Diet Plan"}
          </button>
        </form>
      )}

      {/* Filter bar */}
      {athletes.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 font-medium">Filter:</span>
          <button
            onClick={() => setFilterAthlete("all")}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              filterAthlete === "all"
                ? "bg-brand-blue text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All Athletes
          </button>
          {athletes.map((a) => (
            <button
              key={a.id}
              onClick={() => setFilterAthlete(String(a.id))}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                filterAthlete === String(a.id)
                  ? "bg-brand-blue text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {a.name}
            </button>
          ))}
        </div>
      )}

      {/* Plans list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center shadow-sm border border-gray-100">
          <p className="text-sm text-gray-400">
            {dietPlans.length === 0
              ? "No diet plans yet. Create one above."
              : "No plans for this athlete yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((plan) => {
            const athlete = athleteMap[plan.athlete_id];
            return (
              <div key={plan.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-brand-dark">{plan.plan_name}</p>
                      {athlete && (
                        <span className="px-2 py-0.5 bg-blue-50 text-brand-blue text-xs rounded-full font-medium">
                          {athlete.name}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 whitespace-pre-line">{plan.recommendations}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-gray-400">{new Date(plan.created_at).toLocaleDateString()}</p>
                    {athlete && (
                      <Link
                        href={`/dashboard/nutritionist/athletes/${plan.athlete_id}`}
                        className="text-xs text-brand-blue hover:underline mt-1 inline-block"
                      >
                        View athlete →
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
