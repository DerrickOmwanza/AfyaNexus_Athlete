"use client";
import { useState, useCallback, useEffect, useRef } from "react";

// ── Types ────────────────────────────────────────────────────────────────────
type Role = "athlete" | "coach" | "nutritionist";
type VoiceGender = "female" | "male";

export interface AssistantContext {
  // Athlete / viewed athlete
  athleteName?: string;
  riskScore?: number | null;
  riskLevel?: string | null;
  highRiskDays?: number;
  avgSleep?: number | null;
  avgIntensity?: number | null;
  avgCalories?: number | null;
  latestSoreness?: number | null;
  latestMood?: string | null;
  latestNumbness?: boolean;
  trainingCount?: number;
  nutritionCount?: number;
  dietPlanCount?: number;
}

interface Message {
  role: "user" | "assistant";
  text: string;
  action?: { label: string; href: string };
}

// ── Strip emojis before TTS ─────────────────────────────────────────────────
function stripEmojis(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FEFF}]/gu, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

// ── Voice selection ──────────────────────────────────────────────────────────
function pickVoice(lang: string, gender: VoiceGender): SpeechSynthesisVoice | null {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return null;
  const hints = gender === "female"
    ? ["female", "woman", "zuri", "aria", "jenny", "natasha", "google uk english female"]
    : ["male", "man", "david", "mark", "google uk english male"];
  const base = lang.split("-")[0].toLowerCase();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith(base) && hints.some((h) => v.name.toLowerCase().includes(h))) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base)) ??
    voices.find((v) => hints.some((h) => v.name.toLowerCase().includes(h))) ??
    voices[0] ?? null
  );
}

// ── Answer variation helper ──────────────────────────────────────────────────
// Rotates through variants so the same question never repeats verbatim
const variantCounters: Record<string, number> = {};
function pick(key: string, variants: string[]): string {
  const i = (variantCounters[key] ?? 0) % variants.length;
  variantCounters[key] = i + 1;
  return variants[i];
}

// ── Motivational phrases ─────────────────────────────────────────────────────
const MOTIVATIONS_EN = [
  "Keep pushing — consistency is the key to progress! 💪",
  "Great athletes are built on smart recovery, not just hard training.",
  "Every log you submit helps protect you from injury. Keep it up!",
  "Small daily improvements lead to big results over time.",
  "You're doing great — stay consistent and the results will follow!",
];
const MOTIVATIONS_SW = [
  "Endelea kujitahidi — uthabiti ndio ufunguo wa maendeleo! 💪",
  "Wanariadha wakuu wanajengwa kwa kupumzika vizuri, si mafunzo magumu tu.",
  "Kila kumbukumbu unayowasilisha inakusaidia kujikinga na majeraha.",
  "Maboresho madogo ya kila siku yanaongoza matokeo makubwa.",
  "Unafanya vizuri — endelea na uthabiti na matokeo yatafuata!",
];
let motivIdx = 0;
function motivation(lang: string): string {
  const arr = lang === "sw-KE" ? MOTIVATIONS_SW : MOTIVATIONS_EN;
  return arr[motivIdx++ % arr.length];
}

// ── Response engine ──────────────────────────────────────────────────────────
function getResponse(
  question: string,
  role: Role,
  ctx: AssistantContext,
  lang: string
): { answer: string; action?: { label: string; href: string } } {
  const q   = question.toLowerCase();
  const sw  = lang === "sw-KE";
  const name = ctx.athleteName?.split(" ")[0] ?? (role === "athlete" ? "you" : "this athlete");

  // ── ATHLETE ──────────────────────────────────────────────────────────────
  if (role === "athlete") {
    // Risk / injury
    if (/risk|injury|score|hatari|majeraha/.test(q)) {
      const hasData = ctx.riskScore != null && ctx.riskLevel;
      const answer = hasData
        ? pick("athlete-risk", [
            `Your current injury risk score is ${ctx.riskScore?.toFixed(0)}, rated ${ctx.riskLevel}. ${ctx.highRiskDays ? `You've had ${ctx.highRiskDays} high-risk day${ctx.highRiskDays > 1 ? "s" : ""} this month.` : "No high-risk days this month — great work!"} ${ctx.riskLevel === "High" ? "Try to prioritize sleep and reduce training intensity to bring it down." : ctx.riskLevel === "Medium" ? "You're in the caution zone — monitor your recovery closely." : "You're in a safe zone — keep maintaining your routine!"} ${motivation(lang)}`,
            `Risk score: ${ctx.riskScore?.toFixed(0)} (${ctx.riskLevel}). ${ctx.avgSleep != null ? `Your average sleep is ${ctx.avgSleep}h — ${ctx.avgSleep < 7 ? "below the recommended 7 hours, which is raising your risk." : "which is healthy."}` : ""} ${motivation(lang)}`,
          ])
        : sw
        ? "Bado hakuna alama ya hatari. Wasilisha kumbukumbu ya mafunzo au kupumzika ili kupata alama yako."
        : "No risk score yet. Submit a training or recovery log to generate your first score.";
      return { answer, action: { label: "Log Recovery", href: "/dashboard/athlete/recovery" } };
    }

    // Training
    if (/training|workout|intensity|mafunzo|nguvu/.test(q)) {
      const answer = ctx.avgIntensity != null
        ? pick("athlete-training", [
            `Your average training intensity is ${ctx.avgIntensity}/10 across ${ctx.trainingCount ?? 0} session${ctx.trainingCount !== 1 ? "s" : ""} this month. ${ctx.avgIntensity >= 8 ? "That's high load — make sure you're balancing it with proper recovery." : ctx.avgIntensity >= 5 ? "That's a moderate load — good balance." : "That's a light load — consider gradually increasing intensity."} ${motivation(lang)}`,
            `You've logged ${ctx.trainingCount ?? 0} training session${ctx.trainingCount !== 1 ? "s" : ""} this month with an average intensity of ${ctx.avgIntensity}/10. High intensity with low recovery increases injury risk. ${motivation(lang)}`,
          ])
        : sw
        ? "Bado hakuna kumbukumbu za mafunzo. Anza kurekodi mafunzo yako ili kufuatilia mzigo wako."
        : "No training logs yet. Start logging your sessions to track your training load.";
      return { answer, action: { label: "Log Training", href: "/dashboard/athlete/training" } };
    }

    // Recovery / sleep / soreness
    if (/sleep|recovery|soreness|rest|usingizi|kupumzika|maumivu/.test(q)) {
      const answer = ctx.avgSleep != null
        ? pick("athlete-recovery", [
            `Your average sleep is ${ctx.avgSleep}h per night. ${ctx.avgSleep < 7 ? "That's below the recommended 7 hours — low sleep is one of the biggest drivers of injury risk. Try to rest more tonight." : "That's a healthy sleep level — keep it up!"} ${ctx.latestSoreness != null ? `Your latest soreness is ${ctx.latestSoreness}/10.` : ""} ${motivation(lang)}`,
            `Recovery tracks sleep, soreness, mood, and numbness. ${ctx.latestNumbness ? "⚠️ Your last log reported numbness — please monitor this closely and consult your coach." : ""} Average sleep: ${ctx.avgSleep}h. ${ctx.latestMood ? `Latest mood: ${ctx.latestMood}.` : ""} ${motivation(lang)}`,
          ])
        : sw
        ? "Bado hakuna kumbukumbu za kupumzika. Wasilisha kumbukumbu ya asubuhi ili kufuatilia usingizi na maumivu yako."
        : "No recovery logs yet. Submit a morning check-in to track your sleep and soreness.";
      return { answer, action: { label: "Log Recovery", href: "/dashboard/athlete/recovery" } };
    }

    // Nutrition
    if (/nutrition|calories|food|eat|protein|carbs|lishe|kalori|chakula/.test(q)) {
      const answer = ctx.avgCalories != null
        ? pick("athlete-nutrition", [
            `Your average daily intake is ${ctx.avgCalories} kcal across ${ctx.nutritionCount ?? 0} log${ctx.nutritionCount !== 1 ? "s" : ""}. Balanced nutrition supports recovery and reduces injury risk. ${motivation(lang)}`,
            `You've logged ${ctx.nutritionCount ?? 0} nutrition entr${ctx.nutritionCount !== 1 ? "ies" : "y"} this month averaging ${ctx.avgCalories} kcal per day. Make sure your protein intake supports muscle repair, especially after high-intensity sessions. ${motivation(lang)}`,
          ])
        : sw
        ? "Bado hakuna kumbukumbu za lishe. Anza kurekodi milo yako ili kufuatilia ulaji wako wa kila siku."
        : "No nutrition logs yet. Start logging your meals to track your daily intake.";
      return { answer, action: { label: "Log Nutrition", href: "/dashboard/athlete/nutrition" } };
    }

    // Wearable
    if (/wearable|watch|device|t70|sync|saa/.test(q)) {
      return {
        answer: sw
          ? "Saa yako ya T70 inasawazisha kiwango cha moyo, muda wa usingizi, na hatua. Data hii inaboresha usahihi wa alama yako ya hatari ya majeraha."
          : "Your T70 smartwatch syncs heart rate, sleep duration, and steps. This wearable data is combined with your manual logs to improve the accuracy of your injury risk score.",
        action: { label: "Sync Wearable", href: "/dashboard/athlete/wearable" },
      };
    }

    // Reports / charts
    if (/report|trend|chart|graph|dot|ripoti|mwenendo/.test(q)) {
      return {
        answer: sw
          ? "Ripoti zako zinaonyesha mwenendo wa siku 30 kwa hatari ya majeraha, mzigo wa mafunzo, usingizi, maumivu, na lishe. Nukta za rangi chini ya chati ya hatari zinaonyesha kila siku — kijani ni salama, machungwa ni tahadhari, nyekundu ni hatari."
          : `Your reports show 30-day trends for injury risk, training load, sleep, soreness, and nutrition. The colored dots below the risk chart show each day — green is safe, orange is caution, red is danger. ${ctx.highRiskDays ? `You had ${ctx.highRiskDays} red day${ctx.highRiskDays > 1 ? "s" : ""} this month.` : "No red days this month — excellent!"}`,
      };
    }
  }

  // ── COACH ────────────────────────────────────────────────────────────────
  if (role === "coach") {
    const aName = ctx.athleteName?.split(" ")[0] ?? "This athlete";

    if (/risk|injury|score|hatari|majeraha/.test(q)) {
      const answer = ctx.riskScore != null
        ? pick("coach-risk", [
            `${aName}'s current injury risk score is ${ctx.riskScore?.toFixed(0)}, rated ${ctx.riskLevel}. ${ctx.highRiskDays ? `${ctx.highRiskDays} high-risk day${ctx.highRiskDays > 1 ? "s" : ""} recorded this month.` : "No high-risk days this month."} ${ctx.riskLevel === "High" ? "Recommend reducing training load and prioritizing recovery immediately." : ctx.riskLevel === "Medium" ? "Monitor closely — a few more hard sessions could push this into High." : "Athlete is in a safe zone — maintain current program."}`,
            `Risk score for ${aName}: ${ctx.riskScore?.toFixed(0)} (${ctx.riskLevel}). ${ctx.avgSleep != null ? `Average sleep: ${ctx.avgSleep}h.` : ""} ${ctx.avgIntensity != null ? `Average training intensity: ${ctx.avgIntensity}/10.` : ""} Scores above 65 require immediate attention.`,
          ])
        : `No risk data yet for ${aName}. They need to submit a training or recovery log first.`;
      return { answer, action: { label: "View Athletes", href: "/dashboard/coach" } };
    }

    if (/training|intensity|load|mafunzo|nguvu/.test(q)) {
      const answer = ctx.avgIntensity != null
        ? pick("coach-training", [
            `${aName}'s average training intensity is ${ctx.avgIntensity}/10 across ${ctx.trainingCount ?? 0} session${ctx.trainingCount !== 1 ? "s" : ""}. ${ctx.avgIntensity >= 8 ? "That's high load — recommend a recovery day soon." : "Load is manageable — continue monitoring."}`,
            `Training intensity for ${aName}: ${ctx.avgIntensity}/10 average. High intensity without adequate recovery raises injury risk. Check the trend chart for patterns.`,
          ])
        : `${aName} has no training logs yet.`;
      return { answer };
    }

    if (/recovery|sleep|soreness|numbness|kupumzika|usingizi/.test(q)) {
      const answer = ctx.avgSleep != null
        ? pick("coach-recovery", [
            `${aName}'s latest recovery: ${ctx.avgSleep}h average sleep, soreness ${ctx.latestSoreness ?? "—"}/10, mood ${ctx.latestMood ?? "—"}. ${ctx.latestNumbness ? "⚠️ Numbness reported — follow up immediately." : "No numbness reported."}`,
            `Recovery data for ${aName}: average sleep ${ctx.avgSleep}h. ${ctx.avgSleep < 7 ? "Below recommended 7 hours — this is likely contributing to elevated risk." : "Sleep is in a healthy range."} ${ctx.latestNumbness ? "⚠️ Numbness flagged in latest log." : ""}`,
          ])
        : `${aName} has no recovery logs yet.`;
      return { answer };
    }

    if (/athlete|team|mchezaji|timu/.test(q)) {
      return {
        answer: "Your athlete list shows all assigned athletes with their latest risk levels. Click any athlete to view their full dashboard, charts, and logs. Athletes with red badges need immediate attention.",
        action: { label: "View Athletes", href: "/dashboard/coach" },
      };
    }

    if (/alert|high|danger|tahadhari/.test(q)) {
      return {
        answer: ctx.riskLevel === "High"
          ? `${aName} is currently High risk (score: ${ctx.riskScore?.toFixed(0)}). Review their recent training and recovery logs to identify the cause and adjust their program.`
          : "Athletes with scores above 65 are flagged in red. Review their training and recovery logs to identify the cause.",
      };
    }

    if (/chart|graph|dot|trend|ripoti/.test(q)) {
      return {
        answer: `The risk trend chart shows ${aName}'s injury risk score over time. Colored dots represent each day — green is Low, orange is Medium, red is High. ${ctx.highRiskDays ? `${aName} had ${ctx.highRiskDays} red day${ctx.highRiskDays > 1 ? "s" : ""} this month.` : "No red days this month."}`,
      };
    }
  }

  // ── NUTRITIONIST ─────────────────────────────────────────────────────────
  if (role === "nutritionist") {
    const aName = ctx.athleteName?.split(" ")[0] ?? "This athlete";

    if (/calories|intake|food|kalori|chakula/.test(q)) {
      const answer = ctx.avgCalories != null
        ? pick("nutri-calories", [
            `${aName}'s average daily intake is ${ctx.avgCalories} kcal based on ${ctx.nutritionCount ?? 0} log${ctx.nutritionCount !== 1 ? "s" : ""}. ${ctx.riskLevel === "High" ? "With a High injury risk, consider increasing anti-inflammatory foods and protein for muscle repair." : "Intake looks balanced — continue monitoring."}`,
            `Nutrition summary for ${aName}: ${ctx.avgCalories} kcal/day average. ${ctx.nutritionCount ?? 0} log${ctx.nutritionCount !== 1 ? "s" : ""} recorded. Use this to tailor their diet plan.`,
          ])
        : `${aName} has no nutrition logs yet. Encourage them to log their meals daily.`;
      return { answer };
    }

    if (/diet|plan|mpango/.test(q)) {
      const answer = ctx.dietPlanCount != null
        ? pick("nutri-plan", [
            `${aName} has ${ctx.dietPlanCount} diet plan${ctx.dietPlanCount !== 1 ? "s" : ""} on record. ${ctx.dietPlanCount === 0 ? "Create a new plan using the form above." : "You can add another plan or update the existing one."}`,
            `Diet plans for ${aName}: ${ctx.dietPlanCount ?? 0} created. Each plan includes a name and detailed recommendations visible to the athlete in their dashboard.`,
          ])
        : "Diet plans are created per athlete. Each plan includes a name and detailed recommendations.";
      return { answer, action: { label: "Create Diet Plan", href: "#diet-plans" } };
    }

    if (/protein|carbs|fats|macros|protini|wanga|mafuta/.test(q)) {
      return {
        answer: `Macros (protein, carbs, fats) are optional in nutrition logs. When available, the average row in the table shows ${aName}'s typical macro split — use this to tailor their diet plan for their training load.`,
      };
    }

    if (/risk|injury|hatari|majeraha/.test(q)) {
      const answer = ctx.riskScore != null
        ? `${aName}'s injury risk is ${ctx.riskScore?.toFixed(0)} (${ctx.riskLevel}). ${ctx.riskLevel === "High" ? "High risk athletes benefit from increased protein for muscle repair, anti-inflammatory foods, and adequate hydration." : ctx.riskLevel === "Medium" ? "Consider reviewing their macro balance and ensuring adequate calorie intake for their training load." : "Athlete is in good shape — maintain current nutrition plan."}`
        : `No injury risk data yet for ${aName}.`;
      return { answer };
    }

    if (/athlete|mchezaji/.test(q)) {
      return {
        answer: `Each athlete's page shows their nutrition logs, diet plans, training context, and injury risk. Use this data to create targeted, evidence-based diet plans tailored to their training load and recovery needs.`,
        action: { label: "Back to Athletes", href: "/dashboard/nutritionist" },
      };
    }
  }

  // ── Fallback ─────────────────────────────────────────────────────────────
  const fallbacks: Record<Role, string> = {
    athlete:      "I can help with your injury risk score, training load, recovery, nutrition, or wearable sync. Which one would you like to explore?",
    coach:        "I can help with athlete risk scores, training intensity trends, recovery data, or team overview. Which one would you like to explore?",
    nutritionist: "I can help with nutrition logs, diet plans, macros, or athlete injury risk. Which one would you like to explore?",
  };
  return { answer: fallbacks[role] };
}

// ── Greeting ─────────────────────────────────────────────────────────────────
function getGreeting(userName: string, role: Role, lang: string, ctx: AssistantContext): string {
  const sw   = lang === "sw-KE";
  const hour = new Date().getHours();
  const timeEn = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const timeSw = hour < 12 ? "Habari za asubuhi" : hour < 18 ? "Habari za mchana" : "Habari za jioni";
  const first  = userName.split(" ")[0];

  if (role === "athlete") {
    const riskPart = ctx.riskScore != null
      ? (sw ? ` Alama yako ya hatari ni ${ctx.riskScore?.toFixed(0)} (${ctx.riskLevel === "High" ? "Juu" : ctx.riskLevel === "Medium" ? "Kati" : "Chini"}).` : ` Your current risk score is ${ctx.riskScore?.toFixed(0)} (${ctx.riskLevel}).`)
      : "";
    return sw
      ? `${timeSw}, ${first}! Mimi ni Msaidizi wako wa AfyaNexus.${riskPart} Niulize kuhusu alama yako ya hatari, mafunzo, kupumzika, au lishe.`
      : `${timeEn}, ${first}! I'm your AfyaNexus Assistant.${riskPart} Ask me about your risk score, training, recovery, or nutrition.`;
  }
  if (role === "coach") {
    const ath = ctx.athleteName?.split(" ")[0];
    return sw
      ? `${timeSw}, Kocha ${first}! ${ath ? `Unaangalia dashibodi ya ${ath}.` : ""} Niulize kuhusu alama za hatari, mzigo wa mafunzo, au data ya kupumzika.`
      : `${timeEn}, Coach ${first}! ${ath ? `You're viewing ${ath}'s dashboard.` : ""} Ask me about risk scores, training trends, or recovery data.`;
  }
  // nutritionist
  const ath = ctx.athleteName?.split(" ")[0];
  return sw
    ? `${timeSw}, ${first}! ${ath ? `Unaangalia wasifu wa lishe wa ${ath}.` : ""} Niulize kuhusu kumbukumbu za lishe, mipango ya lishe, au hatari ya majeraha.`
    : `${timeEn}, ${first}! ${ath ? `You're viewing ${ath}'s nutrition profile.` : ""} Ask me about nutrition logs, diet plans, or injury risk.`;
}

// ── Main component ───────────────────────────────────────────────────────────
export default function ReportAssistant({
  role,
  lang,
  voiceGender,
  context = {},
  userName = "",
}: {
  role: Role;
  lang: string;
  voiceGender: VoiceGender;
  context?: AssistantContext;
  userName?: string;
}) {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Message[]>([{
    role: "assistant",
    text: getGreeting(userName || "there", role, lang, context),
  }]);
  const [input, setInput]       = useState("");
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [hasSR, setHasSR]         = useState(false);
  const bottomRef                 = useRef<HTMLDivElement>(null);
  const recognitionRef            = useRef<SpeechRecognition | null>(null);
  const lastTranscriptRef         = useRef<{ text: string; time: number }>({ text: "", time: 0 });
  const silenceTimerRef            = useRef<ReturnType<typeof setTimeout> | null>(null);

  // SSR-safe speech recognition check
  useEffect(() => {
    setHasSR("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);

  // Re-generate greeting when lang or userName changes
  useEffect(() => {
    setMessages([{ role: "assistant", text: getGreeting(userName || "there", role, lang, context) }]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang, userName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    const doSpeak = () => {
      const u = new SpeechSynthesisUtterance(stripEmojis(text));
      u.lang = lang; u.rate = 0.95;
      const v = pickVoice(lang, voiceGender);
      if (v) u.voice = v;
      u.onstart = () => setSpeaking(true);
      u.onend   = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      speechSynthesis.speak(u);
    };
    speechSynthesis.getVoices().length
      ? doSpeak()
      : (speechSynthesis.onvoiceschanged = () => { doSpeak(); speechSynthesis.onvoiceschanged = null; });
  }, [lang, voiceGender]);

  const stopSpeaking = useCallback(() => { speechSynthesis.cancel(); setSpeaking(false); }, []);

  const handleAsk = useCallback((question: string, skipUserBubble = false) => {
    if (!question.trim()) return;
    const { answer, action } = getResponse(question, role, context, lang);
    setMessages((prev) => [
      ...prev,
      ...(skipUserBubble ? [] : [{ role: "user" as const, text: question }]),
      { role: "assistant" as const, text: answer, action },
    ]);
    setInput("");
    speak(answer);
  }, [role, context, lang, speak]);

  const startListening = useCallback(() => {
    const SR = (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      || (window as Window & { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = lang;
    rec.interimResults = true;  // receive partials so we can reset the silence timer
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend   = () => {
      setListening(false);
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    };
    rec.onerror = () => {
      setListening(false);
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }
    };
    rec.onresult = (e: SpeechRecognitionEvent) => {
      // Cancel any pending answer — user is still speaking
      if (silenceTimerRef.current) { clearTimeout(silenceTimerRef.current); silenceTimerRef.current = null; }

      // Only act on the final result for this utterance
      const result = e.results[e.results.length - 1];
      if (!result.isFinal) return;

      const t = result[0].transcript.trim();
      if (!t) return;

      // Deduplicate: ignore exact same phrase within 2 seconds
      const now = Date.now();
      if (t === lastTranscriptRef.current.text && now - lastTranscriptRef.current.time < 2000) return;
      lastTranscriptRef.current = { text: t, time: now };

      // Show confirmation bubble immediately
      setMessages((prev) => [...prev, { role: "user" as const, text: `🎤 You said: "${t}"` }]);

      // Wait 1.5 s of silence before answering — any new speech above cancels this
      silenceTimerRef.current = setTimeout(() => {
        silenceTimerRef.current = null;
        handleAsk(t, true);
      }, 1500);
    };
    recognitionRef.current = rec;
    rec.start();
  }, [lang, handleAsk]);

  const stopListening = useCallback(() => { recognitionRef.current?.stop(); setListening(false); }, []);

  const chips = role === "athlete"
    ? ["Explain my risk score", "How is my sleep?", "What does intensity mean?", "How are my calories?"]
    : role === "coach"
    ? ["What is this athlete's risk?", "How is their training load?", "Explain their recovery data", "What does numbness mean?"]
    : ["Explain their calorie intake", "How do I create a diet plan?", "What macros should I track?", "How does risk affect nutrition?"];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <button onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <div>
            <p className="text-sm font-semibold text-brand-dark">AfyaNexus Assistant</p>
            <p className="text-xs text-gray-400">
              {role === "athlete" ? "Ask about your reports & workflows" : `Ask about ${context.athleteName?.split(" ")[0] ?? "this athlete"}'s data & workflows`}
            </p>
          </div>
        </div>
        <span className="text-gray-400 text-sm">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="border-t border-gray-100">
          {/* Messages */}
          <div className="px-4 py-3 space-y-3 max-h-72 overflow-y-auto">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className="max-w-[85%] space-y-1.5">
                  <div className={`px-3 py-2 rounded-2xl text-xs leading-relaxed ${
                    m.role === "user"
                      ? m.text.startsWith("🎤 You said:")
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-br-sm italic"
                        : "bg-brand-blue text-white rounded-br-sm"
                      : "bg-gray-100 text-gray-700 rounded-bl-sm"
                  }`}>
                    {m.role === "assistant" && <span className="mr-1">🤖</span>}
                    {m.text}
                  </div>
                  {m.action && m.role === "assistant" && (
                    <a href={m.action.href} className="inline-flex items-center gap-1 text-xs text-brand-blue hover:underline font-medium ml-1">
                      → {m.action.label}
                    </a>
                  )}
                  {m.role === "assistant" && (
                    <button
                      onClick={() => speaking ? stopSpeaking() : speak(m.text)}
                      className={`ml-1 text-xs px-2 py-0.5 rounded-full transition-all ${speaking ? "bg-emerald-600 text-white animate-pulse" : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"}`}
                    >
                      {speaking ? "⏹" : "🔊"}
                    </button>
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-3 flex items-center gap-2">
            <input
              type="text" value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleAsk(input); }}
              placeholder="Ask a question..."
              className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-blue/30 bg-gray-50"
            />
            {hasSR && (
              <button onClick={listening ? stopListening : startListening}
                title={listening ? "Stop listening" : "Speak your question"}
                className={`p-2 rounded-lg text-sm transition-all ${listening ? "bg-red-500 text-white animate-pulse" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                {listening ? "⏹" : "🎤"}
              </button>
            )}
            <button onClick={() => handleAsk(input)}
              className="px-3 py-2 bg-brand-blue text-white text-xs rounded-lg hover:bg-blue-800 transition-colors font-medium">
              Ask
            </button>
          </div>

          {/* Suggestion chips */}
          <div className="px-4 pb-4 flex flex-wrap gap-1.5">
            {chips.map((q) => (
              <button key={q} onClick={() => handleAsk(q)}
                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full hover:bg-brand-blue hover:text-white transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
