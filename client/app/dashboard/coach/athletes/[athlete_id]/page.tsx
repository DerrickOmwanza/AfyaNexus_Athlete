"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import InjuryRiskGauge from "@/components/ui/InjuryRiskGauge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";

interface AthleteData {
  athlete: { name: string; email: string; specialization: string };
  trainingLogs: Array<{ date: string; workout_type: string; intensity: number; duration_min: number; source_label?: string }>;
  recoveryLogs: Array<{ date: string; sleep_hours: number; soreness_level: number; mood: string; numbness: boolean; source_label?: string }>;
  predictions: Array<{ date: string; risk_score: number; risk_level: string }>;
  wearable: Array<{ date: string; heart_rate_avg: number; sleep_duration: number; steps: number }>;
}

export default function CoachAthletePage() {
  const { athlete_id } = useParams();
  const [data, setData] = useState<AthleteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/coach/athletes/${athlete_id}/dashboard`)
      .then((res) => setData(res.data))
      .catch((err) => {
        const msg = err?.response?.data?.error;
        setError(msg || "Failed to load athlete data.");
      })
      .finally(() => setLoading(false));
  }, [athlete_id]);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading athlete data...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  const latestPrediction = data.predictions?.[0] ?? null;

  const chartData = [...(data.trainingLogs ?? [])].reverse().map((t) => ({
    date: new Date(t.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    intensity: t.intensity,
  }));

  const riskChartData = [...(data.predictions ?? [])].reverse().map((p) => ({
    date: new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    score: p.risk_score,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach" className="text-sm text-brand-blue hover:underline">
          ← Back to Dashboard
        </Link>
      </div>
      <div>
        <h2 className="text-xl font-bold text-brand-dark">{data.athlete.name}</h2>
        <p className="text-sm text-gray-500 mt-0.5">
          {data.athlete.specialization || "No specialization"} · {data.athlete.email}
        </p>
      </div>

      {/* Risk gauge + latest recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InjuryRiskGauge
          score={latestPrediction?.risk_score ?? null}
          level={latestPrediction?.risk_level ?? null}
        />
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Latest Recovery</p>
          {data.recoveryLogs?.[0] ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sleep</span>
                <span className="font-semibold">{data.recoveryLogs[0].sleep_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Soreness</span>
                <span className="font-semibold">{data.recoveryLogs[0].soreness_level}/10</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Mood</span>
                <span className="font-semibold">{data.recoveryLogs[0].mood}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Numbness</span>
                <span className={`font-semibold ${data.recoveryLogs[0].numbness ? "text-red-500" : "text-green-600"}`}>
                  {data.recoveryLogs[0].numbness ? "Yes ⚠️" : "No"}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">No recovery data yet.</p>
          )}
        </div>
      </div>

      {/* Training intensity chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-brand-dark mb-4">Training Intensity Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="intensity" stroke="#1E3A8A" strokeWidth={2} dot={{ fill: "#1E3A8A", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk score trend */}
      {riskChartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-brand-dark mb-4">Injury Risk Score Trend</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2} dot={{ fill: "#F97316", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Training logs table */}
      {data.trainingLogs?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <p className="text-sm font-semibold text-brand-dark px-5 py-4 border-b border-gray-100">Training Logs</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Workout</th>
                  <th className="px-5 py-3 font-medium">Intensity</th>
                  <th className="px-5 py-3 font-medium">Duration</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.trainingLogs.map((t, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="px-5 py-3 text-gray-600">{new Date(t.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-medium">{t.workout_type}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        t.intensity >= 8 ? "bg-red-100 text-red-600" :
                        t.intensity >= 5 ? "bg-orange-100 text-orange-600" :
                                           "bg-green-100 text-green-600"
                      }`}>{t.intensity}/10</span>
                    </td>
                    <td className="px-5 py-3 text-gray-600">{t.duration_min} min</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{t.source_label ?? "Manual Entry"}</td>
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
