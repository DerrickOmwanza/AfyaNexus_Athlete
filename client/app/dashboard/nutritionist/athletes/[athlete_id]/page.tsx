"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";

interface NutritionData {
  athlete: { name: string; email: string; specialization: string };
  nutritionLogs: Array<{ date: string; calories: number; protein_g: number | null; carbs_g: number | null; fats_g: number | null; meal_notes: string | null; source_label?: string }>;
  dietPlans: Array<{ id: number; plan_name: string; recommendations: string; created_at: string }>;
  trainingLogs: Array<{ date: string; workout_type: string; intensity: number; source_label?: string }>;
  latestPrediction: { risk_score: number; risk_level: string } | null;
}

export default function NutritionistAthletePage() {
  const { athlete_id } = useParams();
  const [data, setData] = useState<NutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [plan, setPlan] = useState({ plan_name: "", recommendations: "" });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchData = () => {
    api.get(`/nutritionist/athletes/${athlete_id}/dashboard`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load athlete data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [athlete_id]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await api.post("/nutritionist/diet-plan", {
        athlete_id: Number(athlete_id),
        plan_name: plan.plan_name,
        recommendations: plan.recommendations,
      });
      setSaveMsg("Diet plan saved successfully.");
      setPlan({ plan_name: "", recommendations: "" });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setSaveMsg(msg || "Failed to save diet plan.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading athlete data...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/nutritionist" className="text-sm text-brand-blue hover:underline">
        ← Back to Dashboard
      </Link>

      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">{data.athlete.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {data.athlete.specialization || "No specialization"} · {data.athlete.email}
          </p>
        </div>
        {data.latestPrediction && (
          <div className={`px-3 py-2 rounded-lg text-xs font-semibold border ${
            data.latestPrediction.risk_level === "High"   ? "bg-red-50 text-red-600 border-red-200" :
            data.latestPrediction.risk_level === "Medium" ? "bg-orange-50 text-orange-600 border-orange-200" :
                                                             "bg-green-50 text-green-600 border-green-200"
          }`}>
            Injury Risk: {data.latestPrediction.risk_level} ({data.latestPrediction.risk_score?.toFixed(0)})
          </div>
        )}
      </div>

      {saveMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${
          saveMsg.includes("success") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
        }`}>{saveMsg}</div>
      )}

      {/* Diet plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <p className="text-sm font-semibold text-brand-dark">Diet Plans</p>
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors"
          >
            {showForm ? "Cancel" : "+ New Plan"}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSavePlan} className="px-5 py-4 border-b border-gray-100 space-y-4 bg-brand-green-light">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input
                type="text" required
                value={plan.plan_name}
                onChange={(e) => setPlan({ ...plan, plan_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="e.g. Pre-Competition Nutrition Plan"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
              <textarea
                rows={4} required
                value={plan.recommendations}
                onChange={(e) => setPlan({ ...plan, recommendations: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                placeholder="Detailed nutrition recommendations, meal timing, macros..."
              />
            </div>
            <button
              type="submit" disabled={saving}
              className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Diet Plan"}
            </button>
          </form>
        )}

        {data.dietPlans?.length === 0 ? (
          <div className="px-5 py-6 text-center text-sm text-gray-400">No diet plans yet. Create one above.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {data.dietPlans.map((p) => (
              <div key={p.id} className="px-5 py-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-brand-dark">{p.plan_name}</p>
                  <p className="text-xs text-gray-400">{new Date(p.created_at).toLocaleDateString()}</p>
                </div>
                <p className="text-sm text-gray-600 whitespace-pre-line">{p.recommendations}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Nutrition logs */}
      {data.nutritionLogs?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-brand-dark px-5 py-4 border-b border-gray-100">Nutrition Logs</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Calories</th>
                  <th className="px-5 py-3 font-medium">Protein</th>
                  <th className="px-5 py-3 font-medium">Carbs</th>
                  <th className="px-5 py-3 font-medium">Fats</th>
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.nutritionLogs.map((n, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-600">{new Date(n.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-semibold text-brand-blue">{n.calories} kcal</td>
                    <td className="px-5 py-3 text-gray-600">{n.protein_g != null ? `${n.protein_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.carbs_g != null ? `${n.carbs_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.fats_g != null ? `${n.fats_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{n.meal_notes || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{n.source_label ?? "Manual Entry"}</td>
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
