interface InjuryRiskGaugeProps {
  score: number | null;
  level: string | null;
  confidence?: { low: number; medium: number; high: number } | null;
}

const LEVEL_CONFIG = {
  High:   { color: "#EF4444", bg: "bg-red-50",    border: "border-red-200",    label: "High Risk",   tip: "Elevated injury probability — reduce training intensity immediately." },
  Medium: { color: "#F97316", bg: "bg-orange-50", border: "border-orange-200", label: "Medium Risk", tip: "Monitor closely — consider a rest day or reduced load." },
  Low:    { color: "#10B981", bg: "bg-green-50",  border: "border-green-200",  label: "Low Risk",    tip: "You are in good shape. Maintain current training load." },
};

export default function InjuryRiskGauge({ score, level, confidence }: InjuryRiskGaugeProps) {
  const safeScore = score ?? 0;
  const cfg = level ? LEVEL_CONFIG[level as keyof typeof LEVEL_CONFIG] : null;
  const color = cfg?.color ?? "#9CA3AF";

  // SVG arc calculation
  const radius = 54;
  const cx = 70;
  const cy = 70;
  const startAngle = -210;
  const endAngle   = 30;
  const totalArc   = endAngle - startAngle;
  const scoreArc   = (safeScore / 100) * totalArc;

  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (start: number, end: number) => {
    const s = { x: cx + radius * Math.cos(toRad(start)), y: cy + radius * Math.sin(toRad(start)) };
    const e = { x: cx + radius * Math.cos(toRad(end)),   y: cy + radius * Math.sin(toRad(end)) };
    const large = end - start > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${radius} ${radius} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  return (
    <div className={`bg-white rounded-2xl p-5 shadow-card border ${cfg?.border ?? "border-gray-100"} card-hover`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-brand-muted font-semibold uppercase tracking-wider">Injury Risk Score</p>
        {cfg && (
          <span
            className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: `${color}18`, color }}
          >
            {cfg.label}
          </span>
        )}
      </div>

      <div className="flex items-center gap-5">
        {/* SVG gauge */}
        <div className="relative shrink-0">
          <svg width="140" height="90" viewBox="0 0 140 90">
            {/* Track */}
            <path
              d={arcPath(startAngle, endAngle)}
              fill="none" stroke="#F3F4F6" strokeWidth="10" strokeLinecap="round"
            />
            {/* Score arc */}
            {score !== null && (
              <path
                d={arcPath(startAngle, startAngle + scoreArc)}
                fill="none" stroke={color} strokeWidth="10" strokeLinecap="round"
                style={{ transition: "all 0.8s ease" }}
              />
            )}
            {/* Score text */}
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="22" fontWeight="700" fill={color} fontFamily="Poppins, Inter, sans-serif">
              {score !== null ? safeScore.toFixed(0) : "—"}
            </text>
            <text x={cx} y={cy + 22} textAnchor="middle" fontSize="9" fill="#9CA3AF" fontFamily="Inter, sans-serif">
              out of 100
            </text>
          </svg>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {cfg ? (
            <>
              <p className="text-sm font-semibold text-brand-dark mb-1">{cfg.label}</p>
              <p className="text-xs text-brand-muted leading-relaxed">{cfg.tip}</p>
              {/* Mini progress bar */}
              <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${safeScore}%`, backgroundColor: color }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-300 mt-1">
                <span>0</span><span>50</span><span>100</span>
              </div>
              {confidence && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-brand-muted font-semibold mb-1.5">ML Confidence</p>
                  <div className="flex gap-2">
                    {([
                      { label: "Low",    val: confidence.low,    color: "bg-emerald-100 text-emerald-700" },
                      { label: "Medium", val: confidence.medium, color: "bg-orange-100 text-orange-700" },
                      { label: "High",   val: confidence.high,   color: "bg-red-100 text-red-700" },
                    ] as const).map((c) => (
                      <span key={c.label} className={`text-xs px-2 py-0.5 rounded-full font-semibold ${c.color}`}>
                        {c.label} {c.val.toFixed(0)}%
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs text-brand-muted leading-relaxed">
              Log training and recovery data to generate your first injury risk score.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
