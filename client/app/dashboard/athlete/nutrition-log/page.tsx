"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function NutritionLogPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    calories: "", protein_g: "", carbs_g: "", fats_g: "", meal_notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/athlete/nutrition-log", {
        calories: parseFloat(form.calories),
        protein_g: form.protein_g ? parseFloat(form.protein_g) : null,
        carbs_g: form.carbs_g ? parseFloat(form.carbs_g) : null,
        fats_g: form.fats_g ? parseFloat(form.fats_g) : null,
        meal_notes: form.meal_notes || null,
      });
      setSuccess(true);
      setWarnings(res.data?.warnings ?? []);
      setSuccessMsg("Nutrition log saved successfully.");
      setTimeout(() => router.push("/dashboard/athlete"), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to save nutrition log.");
    } finally {
      setLoading(false);
    }
  };

  const macroTotal =
    (parseFloat(form.protein_g) || 0) * 4 +
    (parseFloat(form.carbs_g) || 0) * 4 +
    (parseFloat(form.fats_g) || 0) * 9;

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-brand-dark mb-1">Nutrition Log</h2>
      <p className="text-sm text-gray-500 mb-6">Record your daily food intake and macronutrients.</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-sm">
          ✅ {successMsg}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">

        {/* Calories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Total Calories <span className="text-red-400">*</span>
          </label>
          <input
            type="number" min="0" step="1" required
            value={form.calories}
            onChange={(e) => setForm({ ...form, calories: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="e.g. 2400"
          />
        </div>

        {/* Macros row */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Macronutrients <span className="text-gray-400">(optional)</span>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Protein (g)</label>
              <input
                type="number" min="0" step="0.1"
                value={form.protein_g}
                onChange={(e) => setForm({ ...form, protein_g: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Carbs (g)</label>
              <input
                type="number" min="0" step="0.1"
                value={form.carbs_g}
                onChange={(e) => setForm({ ...form, carbs_g: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fats (g)</label>
              <input
                type="number" min="0" step="0.1"
                value={form.fats_g}
                onChange={(e) => setForm({ ...form, fats_g: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                placeholder="0"
              />
            </div>
          </div>

          {/* Live macro calorie estimate */}
          {macroTotal > 0 && (
            <p className="text-xs text-gray-400 mt-2">
              Estimated from macros:{" "}
              <span className="font-semibold text-brand-blue">{macroTotal} kcal</span>
              {parseFloat(form.calories) > 0 && Math.abs(macroTotal - parseFloat(form.calories)) > 100 && (
                <span className="text-brand-orange ml-2">
                  ⚠ Differs from total by {Math.abs(macroTotal - parseFloat(form.calories)).toFixed(0)} kcal
                </span>
              )}
            </p>
          )}
        </div>

        {/* Meal notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Meal Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.meal_notes}
            onChange={(e) => setForm({ ...form, meal_notes: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            placeholder="e.g. Breakfast: oats + eggs. Lunch: rice + chicken..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Nutrition Log"}
        </button>
      </form>
    </div>
  );
}
