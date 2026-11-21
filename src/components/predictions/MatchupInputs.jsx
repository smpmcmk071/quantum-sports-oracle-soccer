import CosmicProfile from "@/components/predictions/CosmicProfile";

export default function MatchupInputs({ snapshot }) {
  if (!snapshot) {
    return (
      <p className="text-xs text-white/30">
        This reading was generated before input snapshots were recorded, so its original inputs are not stored.
      </p>
    );
  }

  const { home, away, game } = snapshot;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          ["Universal day", game?.universal_day],
          ["Moon", game?.moon_phase],
          ["Illumination", game?.moon_illumination != null ? `${game.moon_illumination}%` : null],
          ["Home edge", game?.home_advantage],
          ["Harmony", game?.harmony],
          ["Element relation", game?.element_relation],
          ["Expected goals", game?.expected_goals],
        ].map(([label, value]) => (
          <span
            key={label}
            className="text-[10px] bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-white/50"
          >
            {label}: <span className="text-white/80 font-semibold">{value ?? "—"}</span>
          </span>
        ))}
      </div>
      {game?.outcome_odds && (
        <p className="text-[11px] text-white/35">
          Outcome odds: <span className="text-white/70">{game.outcome_odds}</span>
        </p>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <CosmicProfile team={home} side="Home" />
        <CosmicProfile team={away} side="Away" />
      </div>
    </div>
  );
}