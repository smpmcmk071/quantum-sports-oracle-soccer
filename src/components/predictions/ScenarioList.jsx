import { OUTCOME_LABEL } from "@/lib/predictionDisplay";

export default function ScenarioList({ scenarios }) {
  if (!scenarios?.length) {
    return (
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 text-xs text-white/30">
        No scenarios stored for this reading.
      </div>
    );
  }

  return (
    <div className="grid gap-2 sm:grid-cols-3">
      {scenarios.map((s, i) => {
        const primary = i === 0;
        return (
          <div
            key={`${s.home_score}-${s.away_score}-${i}`}
            className={`rounded-xl p-3 border transition-colors ${
              primary
                ? "bg-violet-500/10 border-violet-400/30"
                : "bg-white/[0.02] border-white/[0.06]"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className={`text-lg font-bold tabular-nums ${primary ? "text-white" : "text-white/70"}`}>
                {s.home_score}–{s.away_score}
              </span>
              <span className={`text-[11px] font-semibold tabular-nums ${primary ? "text-violet-300" : "text-white/40"}`}>
                {Math.round(s.likelihood)}%
              </span>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-white/35 mt-0.5">
              {OUTCOME_LABEL[s.outcome] || s.outcome}
            </div>
            <div className="mt-2 h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className={`h-full rounded-full ${primary ? "bg-gradient-to-r from-violet-400 to-cyan-400" : "bg-white/25"}`}
                style={{ width: `${Math.min(100, Math.round(s.likelihood))}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}