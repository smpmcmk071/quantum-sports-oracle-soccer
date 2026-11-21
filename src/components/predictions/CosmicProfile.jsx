function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-white/30">{label}</div>
      <div className="text-sm font-semibold text-white/80 tabular-nums">{value ?? "—"}</div>
    </div>
  );
}

export default function CosmicProfile({ team, side }) {
  if (!team) return null;
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-semibold text-white truncate">{team.name}</span>
        <span className="text-[9px] uppercase tracking-wider text-white/25 shrink-0">{side}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat label="Life path" value={team.life_path_number} />
        <Stat label="Destiny" value={team.destiny_number} />
        <Stat label="City" value={team.city_numerology} />
        <Stat label="Zodiac" value={team.zodiac_sign} />
        <Stat label="Element" value={team.element} />
        <Stat label="Day no." value={team.personal_day} />
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <Stat label="Goals for /g" value={team.goals_for_pg} />
        <Stat label="Goals ag. /g" value={team.goals_against_pg} />
      </div>
    </div>
  );
}