"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

const WORKOUT_TYPES = [
  "Sprint", "Endurance Run", "Interval Training", "Long Run",
  "Strength Training", "Plyometrics", "Recovery Run", "Cross Training",
  "Hurdles", "Jumps", "Throws", "Other",
];

export default function TrainingLogPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    workout_type: "Sprint", intensity: "5", duration_min: "", notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await api.post("/athlete/training-log", {
        workout_type: form.workout_type,
        intensity: parseInt(form.intensity),
        duration_min: parseInt(form.duration_min),
        notes: form.notes,
      });
      setSuccess(true);
      setSuccessMsg(
        res.data?.prediction?.triggered
          ? "Training log saved and injury risk was recalculated."
          : "Training log saved successfully."
      );
      setTimeout(() => router.push("/dashboard/athlete"), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to save training log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-brand-dark mb-1">Post-Training Log</h2>
      <p className="text-sm text-gray-500 mb-6">Log your training session after you come off the track.</p>

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg px-4 py-3 mb-5 text-sm">
          ✅ {successMsg}
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-3 mb-5 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Workout Type</label>
          <select
            value={form.workout_type}
            onChange={(e) => setForm({ ...form, workout_type: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            {WORKOUT_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Training Intensity: <span className="text-brand-orange font-bold">{form.intensity}/10</span>
          </label>
          <input
            type="range" min="1" max="10"
            value={form.intensity}
            onChange={(e) => setForm({ ...form, intensity: e.target.value })}
            className="w-full accent-brand-blue"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Very easy</span><span>Maximum effort</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
          <input
            type="number" min="1" max="600" required
            value={form.duration_min}
            onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="e.g. 90"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            placeholder="How did the session go? Any pain or discomfort?"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-green text-white py-3 rounded-lg font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Training Log"}
        </button>
      </form>
    </div>
  );
}
