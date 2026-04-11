"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";

interface Prediction  { risk_score: number; risk_level: string; date: string }
interface TrainingLog { date: string; workout_type: string; intensity: number; duration_min: number; source_label?: string }
interface RecoveryLog { date: string; sleep_hours: number; soreness_level: number; mood: string; source_label?: string }
interface NutritionLog { date: string; calories: number; protein_g: number | null; carbs_g: number | null; fats_g: number | null; source_label?: string }

interface ReportsData {
  predictions: Prediction[];
  trainingLogs: TrainingLog[];
  recoveryLogs: RecoveryLog[];
  nutritionLogs: NutritionLog[];
}

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

const riskColor = (level: string) =>
  level === "High" ? "#EF4444" : level === "Medium" ? "#F97316" : "#10B981";

export default function ReportsPage() {
  const [data, setData] = useState<ReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get("/athlete/reports")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading reports...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  const riskChartData = data.predictions.map((p) => ({
    date: fmt(p.date), score: p.risk_score, level: p.risk_level,
  }));

  const latest   = data.predictions[data.predictions.length - 1] ?? null;
  const avgRisk  = data.predictions.length
    ? (data.predictions.reduce((s, p) => s + p.risk_score, 0) / data.predictions.length).toFixed(1)
    : null;
  const highCount = data.predictions.filter((p) => p.risk_level === "High").length;

  const trainingChartData = data.trainingLogs.map((t) => ({
    date: fmt(t.date), intensity: t.intensity, duration: t.duration_min,
  }));

  const recoveryChartData = data.recoveryLogs.map((r) => ({
    date: fmt(r.date), sleep: r.sleep_hours, soreness: r.soreness_level,
  }));

  const nutritionWithMacros = data.nutritionLogs.filter(
    (n) => n.protein_g !== null || n.carbs_g !== null || n.fats_g !== null
  );
  const avgCalories = data.nutritionLogs.length
    ? (data.nutritionLogs.reduce((s, n) => s + (n.calories || 0), 0) / data.nutritionLogs.length).toFixed(0)
    : null;

  const empty = (arr: unknown[]) => arr.length === 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-brand-dark">My Reports</h2>
        <p className="text-sm text-gray-500 mt-0.5">Performance and health trends — last 30 days</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Current Risk</p>
          <p className="text-2xl font-bold" style={{ color: latest ? riskColor(latest.level) : "#9CA3AF" }}>
            {latest ? latest.level : "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {latest ? `Score: ${latest.risk_score?.toFixed(0)}` : "No predictions yet"}
          </p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Avg Risk Score</p>
          <p className="text-2xl font-bold text-brand-blue">{avgRisk ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">Over {data.predictions.length} predictions</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">High Risk Days</p>
          <p className="text-2xl font-bold text-red-500">{highCount}</p>
          <p className="text-xs text-gray-400 mt-0.5">In last 30 days</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Avg Daily Calories</p>
          <p className="text-2xl font-bold text-brand-green">{avgCalories ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">kcal · {data.nutritionLogs.length} logs</p>
        </div>
      </div>

      {/* Injury risk trend */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-brand-dark mb-4">Injury Risk Score — Trend</p>
        {empty(riskChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">
            No predictions yet. Submit a recovery or training log to generate one.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(value: number, _: string, entry) => [
                  `${Number(value).toFixed(0)} (${entry.payload.level})`, "Risk Score",
                ]}
              />
              <Line
                type="monotone" dataKey="score" strokeWidth={2} stroke="#1E3A8A"
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return <circle key={payload.date} cx={cx} cy={cy} r={4} fill={riskColor(payload.level)} stroke="white" strokeWidth={1.5} />;
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Training load */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-brand-dark mb-4">Training Load — Intensity & Duration</p>
        {empty(trainingChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">No training logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trainingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="intensity" fill="#1E3A8A" name="Intensity (/10)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="duration" fill="#10B981" name="Duration (min)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sleep & Soreness */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-brand-dark mb-4">Recovery — Sleep & Soreness</p>
        {empty(recoveryChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">No recovery logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recoveryChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sleep" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 3 }} name="Sleep (hrs)" />
              <Line type="monotone" dataKey="soreness" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} name="Soreness (/10)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Nutrition table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <p className="text-sm font-semibold text-brand-dark px-5 py-4 border-b border-gray-100">
          Nutrition Log — Last 14 Entries
        </p>
        {empty(data.nutritionLogs) ? (
          <p className="text-sm text-gray-400 text-center py-6">No nutrition logs yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Calories</th>
                  <th className="px-5 py-3 font-medium">Protein</th>
                  <th className="px-5 py-3 font-medium">Carbs</th>
                  <th className="px-5 py-3 font-medium">Fats</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.nutritionLogs.map((n, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{fmt(n.date)}</td>
                    <td className="px-5 py-3 font-semibold text-brand-blue">{n.calories} kcal</td>
                    <td className="px-5 py-3 text-gray-600">{n.protein_g != null ? `${n.protein_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.carbs_g != null ? `${n.carbs_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.fats_g != null ? `${n.fats_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{n.source_label ?? "Manual Entry"}</td>
                  </tr>
                ))}
                {nutritionWithMacros.length > 0 && (
                  <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <td className="px-5 py-2">Avg ({data.nutritionLogs.length} days)</td>
                    <td className="px-5 py-2 text-brand-blue">{avgCalories} kcal</td>
                    <td className="px-5 py-2">
                      {(nutritionWithMacros.reduce((s, n) => s + (n.protein_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g
                    </td>
                    <td className="px-5 py-2">
                      {(nutritionWithMacros.reduce((s, n) => s + (n.carbs_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g
                    </td>
                    <td className="px-5 py-2">
                      {(nutritionWithMacros.reduce((s, n) => s + (n.fats_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g
                    </td>
                    <td className="px-5 py-2">Mixed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
