"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import api from "@/lib/api";
import InjuryRiskGauge from "@/components/ui/InjuryRiskGauge";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import Link from "next/link";
import CommentsPanel from "@/components/CommentsPanel";
import ReportAssistant, { AssistantContext } from "@/components/ReportAssistant";
import { useAuth } from "@/context/AuthContext";

interface AthleteData {
  athlete: { name: string; email: string; specialization: string };
  trainingLogs: Array<{ date: string; workout_type: string; intensity: number; duration_min: number; source_label?: string }>;
  recoveryLogs: Array<{ date: string; sleep_hours: number; soreness_level: number; mood: string; numbness: boolean; source_label?: string }>;
  predictions: Array<{ date: string; risk_score: number; risk_level: string }>;
  wearable: Array<{ date: string; heart_rate_avg: number; sleep_duration: number; steps: number }>;
}

type VoiceGender = "female" | "male";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const riskColor = (level: string) => level === "High" ? "#EF4444" : level === "Medium" ? "#F97316" : "#10B981";
const riskIcon  = (level: string) => level === "High" ? "🔴" : level === "Medium" ? "⚠️" : "✅";

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
    if (speechSynthesis.getVoices().length) {
      doSpeak();
    } else {
      speechSynthesis.onvoiceschanged = () => {
        doSpeak();
        speechSynthesis.onvoiceschanged = null;
      };
    }
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

function DayDots({ predictions }: { predictions: Array<{ date: string; risk_score: number; risk_level: string }> }) {
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

function buildNarratives(data: AthleteData, lang: string) {
  const latest       = data.predictions?.[0] ?? null;
  const highCount    = data.predictions.filter((p) => p.risk_level === "High").length;
  const avgIntensity = data.trainingLogs.length ? (data.trainingLogs.reduce((s, t) => s + t.intensity, 0) / data.trainingLogs.length).toFixed(1) : null;
  const latestRec    = data.recoveryLogs?.[0] ?? null;
  const name         = data.athlete.name.split(" ")[0];

  if (lang === "sw-KE") return {
    risk:     latest ? `Alama ya hatari ya majeraha ya ${name} sasa hivi ni ${latest.risk_score?.toFixed(0)} — kiwango cha ${latest.risk_level === "High" ? "Juu" : latest.risk_level === "Medium" ? "Kati" : "Chini"}. ${highCount > 0 ? `Amekuwa na siku ${highCount} za hatari kubwa.` : "Hakuna siku za hatari kubwa — hali nzuri!"}` : `Bado hakuna data ya hatari ya majeraha kwa ${name}.`,
    training: avgIntensity ? `Wastani wa nguvu ya mafunzo ya ${name} ni ${avgIntensity} kati ya 10. Amefanya mafunzo ${data.trainingLogs.length} mara.` : `${name} bado hajaweka kumbukumbu za mafunzo.`,
    recovery: latestRec ? `Usingizi wa mwisho wa ${name} ulikuwa masaa ${latestRec.sleep_hours}. Maumivu ya misuli: ${latestRec.soreness_level}/10. Hisia: ${latestRec.mood}.${latestRec.numbness ? " Alitaja ganzi — angalia hili." : ""}` : `${name} bado hajaweka kumbukumbu za kupumzika.`,
    full:     `Ripoti ya ${name}: ${latest ? `Hatari ya majeraha ni ${latest.risk_score?.toFixed(0)}, kiwango cha ${latest.risk_level === "High" ? "Juu" : latest.risk_level === "Medium" ? "Kati" : "Chini"}.` : ""} ${highCount > 0 ? `Siku ${highCount} za hatari kubwa.` : "Hakuna siku za hatari kubwa."} ${avgIntensity ? `Wastani wa nguvu ya mafunzo ni ${avgIntensity} kati ya 10.` : ""} ${latestRec ? `Usingizi wa mwisho: masaa ${latestRec.sleep_hours}.` : ""}`,
  };

  return {
    risk:     latest ? `${name}'s current injury risk score is ${latest.risk_score?.toFixed(0)} — rated ${latest.risk_level}. ${highCount > 0 ? `${highCount} high-risk day${highCount > 1 ? "s" : ""} recorded.` : "No high-risk days — athlete is in good shape!"}` : `No injury risk data yet for ${name}.`,
    training: avgIntensity ? `${name}'s average training intensity is ${avgIntensity} out of 10 across ${data.trainingLogs.length} session${data.trainingLogs.length !== 1 ? "s" : ""}.` : `${name} has no training logs yet.`,
    recovery: latestRec ? `${name}'s latest recovery: ${latestRec.sleep_hours}h sleep, soreness ${latestRec.soreness_level}/10, mood ${latestRec.mood}.${latestRec.numbness ? " Numbness reported — monitor closely." : ""}` : `${name} has no recovery logs yet.`,
    full:     `Report for ${name}: ${latest ? `Injury risk is ${latest.risk_score?.toFixed(0)}, rated ${latest.risk_level}.` : ""} ${highCount > 0 ? `${highCount} high-risk day${highCount > 1 ? "s" : ""}.` : "No high-risk days."} ${avgIntensity ? `Average training intensity is ${avgIntensity} out of 10.` : ""} ${latestRec ? `Latest sleep: ${latestRec.sleep_hours} hours.` : ""}`,
  };
}

export default function CoachAthletePage() {
  const { athlete_id } = useParams();
  const { user } = useAuth();
  const [data, setData]           = useState<AthleteData | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [lang, setLang]           = useState("en-US");
  const [voiceGender, setVoiceGender] = useState<VoiceGender>("female");
  const { speaking, speak, stop } = useSpeech(lang, voiceGender);

  useEffect(() => {
    api.get(`/coach/athletes/${athlete_id}/dashboard`)
      .then((res) => setData(res.data))
      .catch((err) => setError(err?.response?.data?.error || "Failed to load athlete data."))
      .finally(() => setLoading(false));
  }, [athlete_id]);

  if (loading) return <div className="text-sm text-gray-500 animate-pulse">Loading athlete data...</div>;
  if (error)   return <div className="text-sm text-red-500">{error}</div>;
  if (!data)   return null;

  const narratives       = buildNarratives(data, lang);
  const latestPrediction = data.predictions?.[0] ?? null;

  const chartData = [...(data.trainingLogs ?? [])].reverse().map((t) => ({ date: fmt(t.date), intensity: t.intensity }));
  const riskChartData = [...(data.predictions ?? [])].reverse().map((p) => ({ date: fmt(p.date), score: p.risk_score, level: p.risk_level }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/coach" className="text-sm text-brand-blue hover:underline">← Back to Dashboard</Link>
      </div>

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

      {/* Risk gauge + latest recovery */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <InjuryRiskGauge score={latestPrediction?.risk_score ?? null} level={latestPrediction?.risk_level ?? null} />
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Latest Recovery</p>
            <ListenButton text={narratives.recovery} speaking={speaking} speak={speak} stop={stop} />
          </div>
          <p className="text-xs text-gray-500 mb-3 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">😴 {narratives.recovery}</p>
          {data.recoveryLogs?.[0] ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Sleep</span><span className="font-semibold">{data.recoveryLogs[0].sleep_hours}h</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Soreness</span><span className="font-semibold">{data.recoveryLogs[0].soreness_level}/10</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Mood</span><span className="font-semibold">{data.recoveryLogs[0].mood}</span></div>
              <div className="flex justify-between">
                <span className="text-gray-500">Numbness</span>
                <span className={`font-semibold ${data.recoveryLogs[0].numbness ? "text-red-500" : "text-green-600"}`}>
                  {data.recoveryLogs[0].numbness ? "Yes ⚠️" : "No ✅"}
                </span>
              </div>
            </div>
          ) : <p className="text-sm text-gray-400">No recovery data yet.</p>}
        </div>
      </div>

      {/* Training intensity chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
            <p className="text-sm font-semibold text-brand-dark">Training Intensity Trend</p>
            <ListenButton text={narratives.training} speaking={speaking} speak={speak} stop={stop} />
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">🏋️ {narratives.training}</p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
              <Tooltip content={<PlainTooltip />} />
              <Line type="monotone" dataKey="intensity" stroke="#1E3A8A" strokeWidth={2} dot={{ fill: "#1E3A8A", r: 3 }} name="Intensity (/10)" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Risk score trend */}
      {riskChartData.length > 0 && (
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
            <p className="text-sm font-semibold text-brand-dark">Injury Risk Score Trend</p>
            <ListenButton text={narratives.risk} speaking={speaking} speak={speak} stop={stop} />
          </div>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed bg-gray-50 rounded-lg px-3 py-2 border border-gray-100">
            {riskIcon(latestPrediction?.risk_level ?? "Low")} {narratives.risk}
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={riskChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip content={<RiskTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2}
                dot={(props) => { const { cx, cy, payload } = props; return <circle key={payload.date} cx={cx} cy={cy} r={5} fill={riskColor(payload.level)} stroke="white" strokeWidth={1.5} />; }}
                name="Risk Score" />
            </LineChart>
          </ResponsiveContainer>
          <DayDots predictions={[...data.predictions].reverse()} />
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
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${t.intensity >= 8 ? "bg-red-100 text-red-600" : t.intensity >= 5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                        {t.intensity}/10
                      </span>
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

      {/* Coach feedback panel */}
      <CommentsPanel athleteId={Number(athlete_id)} role="coach" />

      {/* Report Assistant */}
      <ReportAssistant
        role="coach"
        lang={lang}
        voiceGender={voiceGender}
        userName={user?.name ?? ""}
        context={{
          athleteName: data.athlete.name,
          riskScore: latestPrediction?.risk_score ?? null,
          riskLevel: latestPrediction?.risk_level ?? null,
          highRiskDays: data.predictions.filter((p) => p.risk_level === "High").length,
          avgSleep: data.recoveryLogs.length ? parseFloat((data.recoveryLogs.reduce((s, r) => s + r.sleep_hours, 0) / data.recoveryLogs.length).toFixed(1)) : null,
          avgIntensity: data.trainingLogs.length ? parseFloat((data.trainingLogs.reduce((s, t) => s + t.intensity, 0) / data.trainingLogs.length).toFixed(1)) : null,
          latestSoreness: data.recoveryLogs[0]?.soreness_level ?? null,
          latestMood: data.recoveryLogs[0]?.mood ?? null,
          latestNumbness: data.recoveryLogs[0]?.numbness ?? false,
          trainingCount: data.trainingLogs.length,
        } satisfies AssistantContext}
      />
    </div>
  );
}
