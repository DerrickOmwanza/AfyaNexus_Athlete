"use client";
import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RecoveryLogPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    sleep_hours: "", soreness_level: "3", mood: "Good", numbness: false, notes: "",
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
      const res = await api.post("/athlete/recovery-log", {
        sleep_hours: parseFloat(form.sleep_hours),
        soreness_level: parseInt(form.soreness_level),
        mood: form.mood,
        numbness: form.numbness,
        notes: form.notes,
      });
      setSuccess(true);
      setSuccessMsg(
        res.data?.prediction?.triggered
          ? "Recovery log saved and injury risk was recalculated."
          : "Recovery log saved successfully."
      );
      setTimeout(() => router.push("/dashboard/athlete"), 1500);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      setError(msg || "Failed to save recovery log.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold text-brand-dark mb-1">Morning Check-In</h2>
      <p className="text-sm text-gray-500 mb-6">Log how you feel this morning before training.</p>

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
          <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Hours Last Night</label>
          <input
            type="number" step="0.5" min="0" max="24" required
            value={form.sleep_hours}
            onChange={(e) => setForm({ ...form, sleep_hours: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="e.g. 7.5"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Soreness Level: <span className="text-brand-orange font-bold">{form.soreness_level}/10</span>
          </label>
          <input
            type="range" min="1" max="10"
            value={form.soreness_level}
            onChange={(e) => setForm({ ...form, soreness_level: e.target.value })}
            className="w-full accent-brand-blue"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>No soreness</span><span>Extreme soreness</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">How do you feel this morning?</label>
          <select
            value={form.mood}
            onChange={(e) => setForm({ ...form, mood: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
          >
            {["Excellent", "Good", "Neutral", "Tired", "Anxious", "Poor"].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="numbness"
            checked={form.numbness}
            onChange={(e) => setForm({ ...form, numbness: e.target.checked })}
            className="w-4 h-4 accent-brand-blue"
          />
          <label htmlFor="numbness" className="text-sm text-gray-700">
            I am experiencing numbness or tingling
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes <span className="text-gray-400">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue resize-none"
            placeholder="Any other symptoms or observations..."
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className="w-full bg-brand-blue text-white py-3 rounded-lg font-semibold hover:bg-blue-900 transition-colors disabled:opacity-60"
        >
          {loading ? "Saving..." : "Save Morning Check-In"}
        </button>
      </form>
    </div>
  );
}
