import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: "blue" | "green" | "orange" | "red";
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
}

const accentMap = {
  blue:   { border: "border-brand-blue",   text: "text-brand-blue",   bg: "bg-brand-blue-light",   dot: "bg-brand-blue" },
  green:  { border: "border-brand-green",  text: "text-brand-green",  bg: "bg-brand-green-light",  dot: "bg-brand-green" },
  orange: { border: "border-brand-orange", text: "text-brand-orange", bg: "bg-brand-orange-light", dot: "bg-brand-orange" },
  red:    { border: "border-brand-red",    text: "text-brand-red",    bg: "bg-brand-red-light",    dot: "bg-brand-red" },
};

const trendMap = {
  up:      { symbol: "↑", color: "text-brand-green" },
  down:    { symbol: "↓", color: "text-red-500" },
  neutral: { symbol: "→", color: "text-brand-muted" },
};

export default function StatCard({ label, value, sub, accent = "blue", icon: Icon, trend }: StatCardProps) {
  const a = accentMap[accent];
  return (
    <div className={`bg-white rounded-2xl p-5 border-l-4 shadow-card card-hover ${a.border}`}>
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">{label}</p>
        {Icon && (
          <div className={`w-8 h-8 rounded-lg ${a.bg} flex items-center justify-center`}>
            <Icon size={14} className={a.text} />
          </div>
        )}
      </div>
      <p className={`text-2xl font-heading font-bold ${a.text}`}>{value}</p>
      {(sub || trend) && (
        <div className="flex items-center gap-1.5 mt-1.5">
          {trend && (
            <span className={`text-xs font-semibold ${trendMap[trend].color}`}>
              {trendMap[trend].symbol}
            </span>
          )}
          {sub && <p className="text-xs text-brand-muted">{sub}</p>}
        </div>
      )}
    </div>
  );
}
