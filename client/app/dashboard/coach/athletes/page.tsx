"use client";
import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

interface AthleteWithPrediction {
  id: number;
  name: string;
  email: string;
  specialization: string;
  latest_prediction: { risk_score: number; risk_level: string; date: string } | null;
}

const riskColor = (level: string | undefined) =>
  level === "High"   ? "bg-red-100 text-red-600 border-red-200" :
  level === "Medium" ? "bg-orange-100 text-orange-600 border-orange-200" :
  level === "Low"    ? "bg-green-100 text-green-600 border-green-200" :
                       "bg-gray-100 text-gray-500 border-gray-200";

export default function CoachAthletesPage() {
  const [athletes, setAthletes] = useState<AthleteWithPrediction[]>([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [search, setSearch]     = useState("");

  useEffect(() => {
    api.get("/coach/athletes")
      .then((res) => setAthletes(res.data.athletes))
      .catch(() => setError("Failed to load athletes."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading athletes...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;

  const filtered = athletes.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    (a.specialization ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">My Athletes</h2>
          <p className="text-sm text-gray-500 mt-0.5">{athletes.length} athlete{athletes.length !== 1 ? "s" : ""} under your sponsorship</p>
        </div>
        <Link href="/dashboard/coach" className="text-sm text-brand-blue hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Search */}
      {athletes.length > 0 && (
        <input
          type="text"
          placeholder="Search by name or specialization..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
        />
      )}

      {/* Athletes table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">
            {athletes.length === 0
              ? "No athletes assigned to you yet. Ask athletes to register with your coach ID."
              : "No athletes match your search."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="px-5 py-3 font-medium">Athlete</th>
                  <th className="px-5 py-3 font-medium">Specialization</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Risk Level</th>
                  <th className="px-5 py-3 font-medium">Risk Score</th>
                  <th className="px-5 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-brand-dark">{a.name}</td>
                    <td className="px-5 py-3 text-gray-500">{a.specialization || "—"}</td>
                    <td className="px-5 py-3 text-gray-500">{a.email}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${riskColor(a.latest_prediction?.risk_level)}`}>
                        {a.latest_prediction?.risk_level ?? "No data"}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-semibold text-brand-blue">
                      {a.latest_prediction?.risk_score?.toFixed(0) ?? "—"}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/dashboard/coach/athletes/${a.id}`}
                        className="text-xs text-brand-blue font-medium hover:underline"
                      >
                        View dashboard →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
