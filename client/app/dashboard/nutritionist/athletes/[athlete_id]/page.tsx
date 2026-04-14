"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import Link from "next/link";
import CommentsPanel from "@/components/CommentsPanel";
import ReportAssistant, { AssistantContext } from "@/components/ReportAssistant";
import { useAuth } from "@/context/AuthContext";

interface NutritionData {
  athlete: { name: string; email: string; specialization: string };
  nutritionLogs: Array<{ date: string; calories: number; protein_g: number | null; carbs_g: number | null; fats_g: number | null; meal_notes: string | null; source_label?: string }>;
  dietPlans: Array<{ id: number; plan_name: string; recommendations: string; created_at: string }>;
  trainingLogs: Array<{ date: string; workout_type: string; intensity: number; source_label?: string }>;
  latestPrediction: { risk_score: number; risk_level: string } | null;
}

type VoiceGender = "female" | "male";

const riskColor = (level: string) => level === "High" ? "#EF4444" : level === "Medium" ? "#F97316" : "#10B981";
const riskIcon  = (level: string) => level === "High" ? "🔴" : level === "Medium" ? "⚠️" : "✅";
const riskBg    = (level: string) =>
  level === "High"   ? "bg-red-50 text-red-600 border-red-200" :
  level === "Medium" ? "bg-orange-50 text-orange-600 border-orange-200" :
                       "bg-green-50 text-green-600 border-green-200";

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
    <button onClick={() => speaking ? stop() : speak(text)}
      className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium transition-all ${speaking ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}>
      {speaking ? "🔊 Speaking..." : "🔊 Listen"}
    </button>
  );
}

function buildNarratives(data: NutritionData, lang: string) {
  const name        = data.athlete.name.split(" ")[0];
  const avgCalories = data.nutritionLogs.length ? (data.nutritionLogs.reduce((s, n) => s + (n.calories || 0), 0) / data.nutritionLogs.length).toFixed(0) : null;
  const withMacros  = data.nutritionLogs.filter((n) => n.protein_g !== null || n.carbs_g !== null || n.fats_g !== null);
  const avgProtein  = withMacros.length ? (withMacros.reduce((s, n) => s + (n.protein_g ?? 0), 0) / withMacros.length).toFixed(1) : null;
  const risk        = data.latestPrediction;

  if (lang === "sw-KE") return {
    risk:      risk ? `Hatari ya majeraha ya ${name} sasa hivi ni ${risk.risk_score?.toFixed(0)} — kiwango cha ${risk.risk_level === "High" ? "Juu" : risk.risk_level === "Medium" ? "Kati" : "Chini"}.` : `Bado hakuna data ya hatari ya majeraha kwa ${name}.`,
    nutrition: avgCalories ? `Wastani wa kalori za kila siku za ${name} ni ${avgCalories} kcal. ${avgProtein ? `Wastani wa protini ni ${avgProtein}g.` : ""} Kumbukumbu ${data.nutritionLogs.length} za lishe zimewekwa.` : `${name} bado hajaweka kumbukumbu za lishe.`,
    dietPlans: data.dietPlans.length ? `Kuna mipango ${data.dietPlans.length} ya lishe iliyoundwa kwa ${name}. Mpango wa hivi karibuni: ${data.dietPlans[0].plan_name}.` : `Bado hakuna mpango wa lishe kwa ${name}. Unda mpango mpya hapo juu.`,
    full:      `Ripoti ya lishe ya ${name}: ${risk ? `Hatari ya majeraha ni ${risk.risk_score?.toFixed(0)}, kiwango cha ${risk.risk_level === "High" ? "Juu" : risk.risk_level === "Medium" ? "Kati" : "Chini"}.` : ""} ${avgCalories ? `Wastani wa kalori ni ${avgCalories} kcal.` : ""} ${avgProtein ? `Wastani wa protini ni ${avgProtein}g.` : ""} ${data.dietPlans.length ? `Mipango ${data.dietPlans.length} ya lishe.` : "Hakuna mpango wa lishe."}`,
  };

  return {
    risk:      risk ? `${name}'s current injury risk score is ${risk.risk_score?.toFixed(0)} — rated ${risk.risk_level}. ${risk.risk_level === "High" ? "Consider adjusting nutrition to support recovery." : risk.risk_level === "Medium" ? "Monitor nutrition and recovery closely." : "Athlete is in good shape nutritionally."}` : `No injury risk data yet for ${name}.`,
    nutrition: avgCalories ? `${name}'s average daily intake is ${avgCalories} calories. ${avgProtein ? `Average protein is ${avgProtein}g per day.` : ""} ${data.nutritionLogs.length} nutrition log${data.nutritionLogs.length !== 1 ? "s" : ""} recorded.` : `${name} has no nutrition logs yet.`,
    dietPlans: data.dietPlans.length ? `${data.dietPlans.length} diet plan${data.dietPlans.length !== 1 ? "s" : ""} created for ${name}. Latest plan: ${data.dietPlans[0].plan_name}.` : `No diet plans yet for ${name}. Create one using the form above.`,
    full:      `Nutrition report for ${name}: ${risk ? `Injury risk is ${risk.risk_score?.toFixed(0)}, rated ${risk.risk_level}.` : ""} ${avgCalories ? `Average daily calories is ${avgCalories}.` : ""} ${avgProtein ? `Average protein is ${avgProtein}g.` : ""} ${data.dietPlans.length ? `${data.dietPlans.length} diet plan${data.dietPlans.length !== 1 ? "s" : ""} on record.` : "No diet plans yet."}`,
  };
}

export default function NutritionistAthletePage() {
  const { athlete_id } = useParams();
  const { user } = useAuth();
  const [data, setData]           = useState<NutritionData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [plan, setPlan]           = useState({ plan_name: "", recommendations: "" });
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [lang, setLang]           = useState("en-US");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const { speaking, speak, stop } = useSpeech(lang, voiceGender);

  const fetchData = () => {
    api.get(`/nutritionist/athletes/${athlete_id}/dashboard`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load athlete data."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [athlete_id]);

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setSaveMsg("");
    try {
      await api.post("/nutritionist/diet-plan", { athlete_id: Number(athlete_id), plan_name: plan.plan_name, recommendations: plan.recommendations });
      setSaveMsg("Diet plan saved successfully.");
      setPlan({ plan_name: "", recommendations: "" });
      setShowForm(false);
      fetchData();
    } catch (err: unknown) {
      setSaveMsg((err as { response?: { data?: { error?: string } } })?.response?.data?.error || "Failed to save diet plan.");
    } finally { setSaving(false); }
  };

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading athlete data...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  const narratives  = buildNarratives(data, lang);
  const withMacros  = data.nutritionLogs.filter((n) => n.protein_g !== null || n.carbs_g !== null || n.fats_g !== null);
  const avgCalories = data.nutritionLogs.length ? (data.nutritionLogs.reduce((s, n) => s + (n.calories || 0), 0) / data.nutritionLogs.length).toFixed(0) : null;

  return (
    <div className="space-y-6">
      <Link href="/dashboard/nutritionist" className="text-sm text-brand-blue hover:underline">← Back to Dashboard</Link>

      {/* Header + voice controls */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-brand-dark">{data.athlete.name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">{data.athlete.specialization || "No specialization"} · {data.athlete.email}</p>
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

      {/* Injury risk banner */}
      {data.latestPrediction && (
        <div className={`rounded-xl p-4 border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 ${riskBg(data.latestPrediction.risk_level)}`}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">{riskIcon(data.latestPrediction.risk_level)}</span>
            <div>
              <p className="text-sm font-bold" style={{ color: riskColor(data.latestPrediction.risk_level) }}>
                Injury Risk: {data.latestPrediction.risk_level} ({data.latestPrediction.risk_score?.toFixed(0)})
              </p>
              <p className="text-xs mt-0.5 text-gray-600">{narratives.risk}</p>
            </div>
          </div>
          <ListenButton text={narratives.risk} speaking={speaking} speak={speak} stop={stop} />
        </div>
      )}

      {saveMsg && (
        <div className={`rounded-lg px-4 py-3 text-sm border ${saveMsg.includes("success") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {saveMsg}
        </div>
      )}

      {/* Diet plans */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-brand-dark">Diet Plans</p>
            <ListenButton text={narratives.dietPlans} speaking={speaking} speak={speak} stop={stop} />
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="text-xs bg-brand-green text-white px-3 py-1.5 rounded-lg hover:bg-emerald-600 transition-colors">
            {showForm ? "Cancel" : "+ New Plan"}
          </button>
        </div>
        <p className="text-xs text-gray-500 mx-5 mt-3 mb-1 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">📋 {narratives.dietPlans}</p>

        {showForm && (
          <form onSubmit={handleSavePlan} className="px-5 py-4 border-b border-gray-100 space-y-4 bg-brand-green-light">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Plan Name</label>
              <input type="text" required value={plan.plan_name} onChange={(e) => setPlan({ ...plan, plan_name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="e.g. Pre-Competition Nutrition Plan" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recommendations</label>
              <textarea rows={4} required value={plan.recommendations} onChange={(e) => setPlan({ ...plan, recommendations: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green resize-none"
                placeholder="Detailed nutrition recommendations, meal timing, macros..." />
            </div>
            <button type="submit" disabled={saving}
              className="bg-brand-green text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-600 transition-colors disabled:opacity-60">
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-2 flex-wrap">
          <p className="text-sm font-semibold text-brand-dark">Nutrition Logs</p>
          <ListenButton text={narratives.nutrition} speaking={speaking} speak={speak} stop={stop} />
        </div>
        <p className="text-xs text-gray-500 mx-5 mt-3 mb-2 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">🥗 {narratives.nutrition}</p>
        {data.nutritionLogs?.length === 0 ? (
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
                  <th className="px-5 py-3 font-medium">Notes</th>
                  <th className="px-5 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {data.nutritionLogs.map((n, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-gray-50">
                    <td className="px-5 py-3 text-gray-600">{new Date(n.date).toLocaleDateString()}</td>
                    <td className="px-5 py-3 font-semibold text-brand-blue">{n.calories} kcal</td>
                    <td className="px-5 py-3 text-gray-600">{n.protein_g != null ? `${n.protein_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.carbs_g != null ? `${n.carbs_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-600">{n.fats_g != null ? `${n.fats_g}g` : "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{n.meal_notes || "—"}</td>
                    <td className="px-5 py-3 text-gray-500 text-xs">{n.source_label ?? "Manual Entry"}</td>
                  </tr>
                ))}
                {withMacros.length > 0 && (
                  <tr className="bg-gray-50 text-xs text-gray-500 font-medium">
                    <td className="px-5 py-2">Avg ({data.nutritionLogs.length} days)</td>
                    <td className="px-5 py-2 text-brand-blue">{avgCalories} kcal</td>
                    <td className="px-5 py-2">{(withMacros.reduce((s, n) => s + (n.protein_g ?? 0), 0) / withMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2">{(withMacros.reduce((s, n) => s + (n.carbs_g ?? 0), 0) / withMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2">{(withMacros.reduce((s, n) => s + (n.fats_g ?? 0), 0) / withMacros.length).toFixed(1)}g</td>
                    <td className="px-5 py-2" colSpan={2}>Mixed</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Nutritionist feedback panel */}
      <CommentsPanel athleteId={Number(athlete_id)} role="nutritionist" />

      {/* Report Assistant */}
      <ReportAssistant
        role="nutritionist"
        lang={lang}
        voiceGender={voiceGender}
        userName={user?.name ?? ""}
        context={{
          athleteName: data.athlete.name,
          riskScore: data.latestPrediction?.risk_score ?? null,
          riskLevel: data.latestPrediction?.risk_level ?? null,
          avgCalories: avgCalories ? parseFloat(avgCalories) : null,
          nutritionCount: data.nutritionLogs.length,
          dietPlanCount: data.dietPlans.length,
        } satisfies AssistantContext}
      />
    </div>
  );
}
