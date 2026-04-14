"use client";
import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import ReportAssistant, { AssistantContext } from "@/components/ReportAssistant";
import { useAuth } from "@/context/AuthContext";

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

type VoiceGender = "female" | "male";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const riskColor = (level: string) => level === "High" ? "#EF4444" : level === "Medium" ? "#F97316" : "#10B981";
const riskIcon  = (level: string) => level === "High" ? "🔴" : level === "Medium" ? "⚠️" : "✅";
const riskBg    = (level: string) => level === "High" ? "bg-red-50 border-red-200" : level === "Medium" ? "bg-orange-50 border-orange-200" : "bg-emerald-50 border-emerald-200";

// ── Voice ────────────────────────────────────────────────────────────────────
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}
function pickVoice(lang: string, gender: VoiceGender): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const hints = gender === "female"
    ? ["female", "woman", "zuri", "aria", "jenny", "natasha", "google uk english female"]
    : ["male", "man", "david", "mark", "google uk english male"];
  const base = lang.split("-")[0].toLowerCase();
  return voices.find((v) => v.lang.toLowerCase().startsWith(base) && hints.some((h) => v.name.toLowerCase().includes(h)))
    ?? voices.find((v) => v.lang.toLowerCase().startsWith(base))
    ?? voices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h)))
    ?? voices[0] ?? null;
}

function useSpeech(lang: string, gender: VoiceGender) {
  const [speaking, setSpeaking] = useState(false);
  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(stripEmojis(text));
      u.lang = lang; u.rate = 0.95;
      const v = pickVoice(lang, gender);
      if (v) u.voice = v;
      u.onstart = () => setSpeaking(true);
      u.onend   = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      speechSynthesis.speak(u);
    };
    speechSynthesis.getVoices().length ? doSpeak() : (speechSynthesis.onvoiceschanged = () => { doSpeak(); speechSynthesis.onvoiceschanged = null; });
  }, [lang, gender]);
  const stop = useCallback(() => { speechSynthesis.cancel(); setSpeaking(false); }, []);
  return { speaking, speak, stop };
}

function ListenButton({ text, speaking, speak, stop }: { text: string; speaking: boolean; speak: (t: string) => void; stop: () => void }) {
  return (
    <button
      onClick={() => speaking ? stop() : speak(text)}
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${speaking ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
    >
      {speaking ? "🔊 Speaking..." : "🔊 Listen"}
    </button>
  );
}

function PlainTooltip({ active, payload, label }: { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs max-w-[180px]">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p, i) => <p key={i} style={{ color: p.color }} className="leading-5">{p.name}: <span className="font-bold">{Number(p.value).toFixed(1)}</span></p>)}
    </div>
  );
}

function RiskTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; payload: { level: string } }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  const { value, payload: { level } } = payload[0];
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 text-xs">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      <p style={{ color: riskColor(level) }} className="font-bold">{riskIcon(level)} Risk Score: {Number(value).toFixed(0)}</p>
      <p className="text-gray-500 mt-0.5">Level: {level}</p>
    </div>
  );
}

function DayDots({ predictions }: { predictions: Prediction[] }) {
  if (!predictions.length) return null;
  return (
    <div className="mt-3">
      <p className="text-xs text-gray-400 mb-2">Day-by-day risk: <span className="text-emerald-600">✅ Low</span> · <span className="text-orange-500">⚠️ Medium</span> · <span className="text-red-500">🔴 High</span></p>
      <div className="flex flex-wrap gap-1.5">
        {predictions.map((p, i) => (
          <div key={i} title={`${fmt(p.date)}: Score ${p.risk_score?.toFixed(0)} (${p.risk_level})`}
            className="w-4 h-4 rounded-full cursor-pointer hover:scale-125 transition-transform"
            style={{ backgroundColor: riskColor(p.risk_level) }} />
        ))}
      </div>
    </div>
  );
}

function buildNarratives(data: ReportsData, lang: string) {
  const latest      = data.predictions[data.predictions.length - 1] ?? null;
  const avgRisk     = data.predictions.length ? (data.predictions.reduce((s, p) => s + p.risk_score, 0) / data.predictions.length).toFixed(1) : null;
  const highCount   = data.predictions.filter((p) => p.risk_level === "High").length;
  const avgCalories = data.nutritionLogs.length ? (data.nutritionLogs.reduce((s, n) => s + (n.calories || 0), 0) / data.nutritionLogs.length).toFixed(0) : null;
  const avgSleep    = data.recoveryLogs.length  ? (data.recoveryLogs.reduce((s, r) => s + r.sleep_hours, 0) / data.recoveryLogs.length).toFixed(1) : null;
  const avgIntensity = data.trainingLogs.length ? (data.trainingLogs.reduce((s, t) => s + t.intensity, 0) / data.trainingLogs.length).toFixed(1) : null;

  if (lang === "sw-KE") return {
    risk:      latest ? `Alama yako ya hatari ya majeraha sasa hivi ni ${latest.risk_score?.toFixed(0)} — kiwango cha ${latest.risk_level === "High" ? "Juu" : latest.risk_level === "Medium" ? "Kati" : "Chini"}. ${highCount > 0 ? `Ulikuwa na siku ${highCount} za hatari kubwa mwezi huu.` : "Hakuna siku za hatari kubwa mwezi huu — hongera!"}` : "Bado hakuna data ya hatari ya majeraha. Wasilisha kumbukumbu ya mafunzo au kupumzika.",
    training:  avgIntensity ? `Wastani wa nguvu ya mafunzo yako ni ${avgIntensity} kati ya 10. Umefanya mafunzo ${data.trainingLogs.length} mara mwezi huu.` : "Bado hakuna kumbukumbu za mafunzo.",
    recovery:  avgSleep ? `Wastani wa usingizi wako ni masaa ${avgSleep} kwa usiku. ${parseFloat(avgSleep) < 7 ? "Usingizi mdogo unaweza kuongeza hatari ya majeraha." : "Usingizi wako ni mzuri — endelea hivyo!"}` : "Bado hakuna kumbukumbu za kupumzika.",
    nutrition: avgCalories ? `Wastani wa kalori zako za kila siku ni ${avgCalories} kcal. Umeweka kumbukumbu ${data.nutritionLogs.length} za lishe mwezi huu.` : "Bado hakuna kumbukumbu za lishe.",
    full:      `Ripoti yako ya mwezi huu: ${latest ? `Alama ya hatari ni ${latest.risk_score?.toFixed(0)}, kiwango cha ${latest.risk_level === "High" ? "Juu" : latest.risk_level === "Medium" ? "Kati" : "Chini"}.` : ""} ${avgRisk ? `Wastani wa alama ni ${avgRisk}.` : ""} ${highCount > 0 ? `Siku ${highCount} za hatari kubwa.` : "Hakuna siku za hatari kubwa."} ${avgSleep ? `Wastani wa usingizi ni masaa ${avgSleep}.` : ""} ${avgCalories ? `Wastani wa kalori ni ${avgCalories} kcal.` : ""}`,
  };

  return {
    risk:      latest ? `Your current injury risk score is ${latest.risk_score?.toFixed(0)} — rated ${latest.risk_level}. ${highCount > 0 ? `You had ${highCount} high-risk day${highCount > 1 ? "s" : ""} this month.` : "No high-risk days this month — great work!"}` : "No injury risk data yet. Submit a recovery or training log to generate a score.",
    training:  avgIntensity ? `Your average training intensity is ${avgIntensity} out of 10. You logged ${data.trainingLogs.length} training session${data.trainingLogs.length !== 1 ? "s" : ""} this month.` : "No training logs yet.",
    recovery:  avgSleep ? `Your average sleep is ${avgSleep} hours per night. ${parseFloat(avgSleep) < 7 ? "Low sleep can increase your injury risk — try to rest more." : "Your sleep is in a healthy range — keep it up!"}` : "No recovery logs yet.",
    nutrition: avgCalories ? `Your average daily intake is ${avgCalories} calories. You have ${data.nutritionLogs.length} nutrition log${data.nutritionLogs.length !== 1 ? "s" : ""} this month.` : "No nutrition logs yet.",
    full:      `Your monthly report: ${latest ? `Current injury risk is ${latest.risk_score?.toFixed(0)}, rated ${latest.risk_level}.` : ""} ${avgRisk ? `Average risk score is ${avgRisk}.` : ""} ${highCount > 0 ? `${highCount} high-risk day${highCount > 1 ? "s" : ""} recorded.` : "No high-risk days."} ${avgSleep ? `Average sleep is ${avgSleep} hours.` : ""} ${avgCalories ? `Average daily calories is ${avgCalories}.` : ""}`,
  };
}

// ── Main page ────────────────────────────────────────────────────────────────
export default function ReportsPage() {
  const { user } = useAuth();
  const [data, setData]           = useState<ReportsData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [lang, setLang]           = useState("en-US");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const { speaking, speak, stop } = useSpeech(lang, voiceGender);

  useEffect(() => {
    api.get("/athlete/reports")
      .then((res) => setData(res.data))
      .catch(() => setError("Failed to load reports."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading reports...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  const narratives = buildNarratives(data, lang);
  const latest     = data.predictions[data.predictions.length - 1] ?? null;
  const avgRisk    = data.predictions.length ? (data.predictions.reduce((s, p) => s + p.risk_score, 0) / data.predictions.length).toFixed(1) : null;
  const highCount  = data.predictions.filter((p) => p.risk_level === "High").length;
  const avgCalories = data.nutritionLogs.length ? (data.nutritionLogs.reduce((s, n) => s + (n.calories || 0), 0) / data.nutritionLogs.length).toFixed(0) : null;

  const riskChartData      = data.predictions.map((p) => ({ date: fmt(p.date), score: p.risk_score, level: p.risk_level }));
  const trainingChartData  = data.trainingLogs.map((t) => ({ date: fmt(t.date), intensity: t.intensity, duration: t.duration_min }));
  const recoveryChartData  = data.recoveryLogs.map((r) => ({ date: fmt(r.date), sleep: r.sleep_hours, soreness: r.soreness_level }));
  const nutritionWithMacros = data.nutritionLogs.filter((n) => n.protein_g !== null || n.carbs_g !== null || n.fats_g !== null);
  const empty = (arr: unknown[]) => arr.length === 0;

  return (
    <div className="space-y-6">

      {/* Header + voice controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">My Reports</h2>
          <p className="text-sm text-gray-500 mt-0.5">Performance and health trends — last 30 days</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={lang} onChange={(e) => { stop(); setLang(e.target.value); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
            <option value="en-US">🇬🇧 English</option>
            <option value="sw-KE">🇰🇪 Swahili</option>
          </select>
          <select value={voiceGender} onChange={(e) => { stop(); setVoiceGender(e.target.value as VoiceGender); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue/30">
            <option value="female">👩 Female Voice</option>
            <option value="male">👨 Male Voice</option>
          </select>
          <button onClick={() => speaking ? stop() : speak(narratives.full)}
            className={`inline-flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-full font-semibold transition-all shadow-sm ${speaking ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-500 text-white hover:bg-emerald-600"}`}>
            {speaking ? "⏹ Stop" : "▶ Play Full Report"}
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`rounded-xl p-4 shadow-sm border ${latest ? riskBg(latest.risk_level) : "bg-white border-gray-100"}`}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Current Risk</p>
          <p className="text-2xl font-bold" style={{ color: latest ? riskColor(latest.risk_level) : "#9CA3AF" }}>
            {latest ? `${riskIcon(latest.risk_level)} ${latest.risk_level}` : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">{latest ? `Score: ${latest.risk_score?.toFixed(0)}` : "No predictions yet"}</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">Avg Risk Score</p>
          <p className="text-2xl font-bold text-brand-blue">{avgRisk ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">Over {data.predictions.length} predictions</p>
        </div>
        <div className={`rounded-xl p-4 shadow-sm border ${highCount > 0 ? "bg-red-50 border-red-200" : "bg-white border-gray-100"}`}>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-1">High Risk Days</p>
          <p className={`text-2xl font-bold ${highCount > 0 ? "text-red-500" : "text-emerald-500"}`}>{highCount > 0 ? `🔴 ${highCount}` : "✅ 0"}</p>
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
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <p className="text-sm font-semibold text-brand-dark">Injury Risk Score — Trend</p>
          <ListenButton text={narratives.risk} speaking={speaking} speak={speak} stop={stop} />
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
          {riskIcon(latest?.risk_level ?? "Low")} {narratives.risk}
        </p>
        {empty(riskChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">No predictions yet. Submit a recovery or training log to generate one.</p>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={riskChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip content={<RiskTooltip />} />
                <Line type="monotone" dataKey="score" strokeWidth={2} stroke="#1E3A8A"
                  dot={(props) => { const { cx, cy, payload } = props; return <circle key={payload.date} cx={cx} cy={cy} r={5} fill={riskColor(payload.level)} stroke="white" strokeWidth={1.5} />; }} />
              </LineChart>
            </ResponsiveContainer>
            <DayDots predictions={data.predictions} />
          </>
        )}
      </div>

      {/* Training load */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <p className="text-sm font-semibold text-brand-dark">Training Load — Intensity &amp; Duration</p>
          <ListenButton text={narratives.training} speaking={speaking} speak={speak} stop={stop} />
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">🏋️ {narratives.training}</p>
        {empty(trainingChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">No training logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trainingChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="left" domain={[0, 10]} tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip content={<PlainTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar yAxisId="left" dataKey="intensity" fill="#1E3A8A" name="Intensity (/10)" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="right" dataKey="duration" fill="#10B981" name="Duration (min)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Sleep & Soreness */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
          <p className="text-sm font-semibold text-brand-dark">Recovery — Sleep &amp; Soreness</p>
          <ListenButton text={narratives.recovery} speaking={speaking} speak={speak} stop={stop} />
        </div>
        <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">😴 {narratives.recovery}</p>
        {empty(recoveryChartData) ? (
          <p className="text-sm text-gray-400 text-center py-6">No recovery logs yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={recoveryChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip content={<PlainTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="sleep" stroke="#1E3A8A" strokeWidth={2} dot={{ r: 3 }} name="Sleep (hrs)" />
              <Line type="monotone" dataKey="soreness" stroke="#F97316" strokeWidth={2} dot={{ r: 3 }} name="Soreness (/10)" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Nutrition */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-wrap gap-2">
          <p className="text-sm font-semibold text-brand-dark">Nutrition Log — Last 14 Entries</p>
          <ListenButton text={narratives.nutrition} speaking={speaking} speak={speak} stop={stop} />
        </div>
        <p className="text-xs text-gray-500 mx-5 mt-3 mb-2 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">🥗 {narratives.nutrition}</p>
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
                    <td className="px-5 py-2">{(nutritionWithMacros.reduce((s, n) => s + (n.protein_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2">{(nutritionWithMacros.reduce((s, n) => s + (n.carbs_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2">{(nutritionWithMacros.reduce((s, n) => s + (n.fats_g ?? 0), 0) / nutritionWithMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2">Mixed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Assistant */}
      <ReportAssistant
        role="athlete"
        lang={lang}
        voiceGender={voiceGender}
        userName={user?.name ?? ""}
        context={{
          riskScore: latest?.risk_score ?? null,
          riskLevel: latest?.risk_level ?? null,
          highRiskDays: highCount,
          avgSleep: data.recoveryLogs.length ? parseFloat((data.recoveryLogs.reduce((s, r) => s + r.sleep_hours, 0) / data.recoveryLogs.length).toFixed(1)) : null,
          avgIntensity: data.trainingLogs.length ? parseFloat((data.trainingLogs.reduce((s, t) => s + t.intensity, 0) / data.trainingLogs.length).toFixed(1)) : null,
          avgCalories: avgCalories ? parseFloat(avgCalories) : null,
          latestSoreness: data.recoveryLogs[0]?.soreness_level ?? null,
          latestMood: data.recoveryLogs[0]?.mood ?? null,
          trainingCount: data.trainingLogs.length,
          nutritionCount: data.nutritionLogs.length,
        } satisfies AssistantContext}
      />
    </div>
  );
}
