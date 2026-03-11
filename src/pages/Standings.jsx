import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function Standings() {
  const [teamStats, setTeamStats] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConference, setActiveConference] = useState("All");

  useEffect(() => {
    Promise.all([
      base44.entities.TeamStats.filter({ season: 2026, league: "MLS" }, "-points", 50),
      base44.entities.Team.list(),
    ]).then(([ts, t]) => {
      setTeamStats(ts);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

  const conferences = ["All", "Eastern", "Western"];

  const filtered = teamStats
    .filter(ts => {
      // Only show teams with at least 1 game played
      if ((ts.games_played ?? 0) === 0) return false;
      if (activeConference === "All") return true;
      return teamMap[ts.team_id]?.conference === activeConference;
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goal_differential !== a.goal_differential) return b.goal_differential - a.goal_differential;
      return b.goals_for - a.goals_for;
    });

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Trophy className="w-5 h-5 text-amber-400" />
          <h1 className="text-xl font-bold">MLS Standings 2026</h1>
        </div>

        {/* Conference tabs */}
        <div className="flex gap-2 mb-6">
          {conferences.map(c => (
            <button
              key={c}
              onClick={() => setActiveConference(c)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeConference === c
                  ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                  : "text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Table */}
        {loading ? (
          <div className="space-y-2">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-12 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-white/30">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No standings data yet. Enter team stats in the Admin page.</p>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-xs text-white/30 font-medium w-8">#</th>
                  <th className="text-left px-4 py-3 text-xs text-white/30 font-medium">Team</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">GP</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">W</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">D</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">L</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">GF</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">GA</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">GD</th>
                  <th className="text-center px-3 py-3 text-xs text-white/30 font-medium font-bold">PTS</th>
                  <th className="hidden sm:table-cell text-left px-3 py-3 text-xs text-white/30 font-medium">Form</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((ts, i) => {
                  const team = teamMap[ts.team_id];
                  const gd = ts.goal_differential ?? (ts.goals_for - ts.goals_against);
                  const isTop = i < 7; // playoff spots
                  const isPromo = i < 1; // top spot

                  return (
                    <tr key={ts.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-all">
                      <td className="px-4 py-3">
                        <span className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${
                          isPromo ? "bg-amber-400/20 text-amber-400" :
                          isTop ? "bg-violet-400/10 text-violet-400" :
                          "text-white/20"
                        }`}>
                          {i + 1}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {team?.logo_url && (
                            <img src={team.logo_url} alt={team.name} className="w-6 h-6 object-contain flex-shrink-0" />
                          )}
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm">{team?.name || "—"}</div>
                            {team?.conference && (
                              <div className="text-[10px] text-white/30">{team.conference}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="text-center px-3 py-3 text-white/50 text-xs">{ts.games_played ?? 0}</td>
                      <td className="text-center px-3 py-3 text-emerald-400 font-medium text-xs">{ts.wins ?? 0}</td>
                      <td className="text-center px-3 py-3 text-white/40 text-xs">{ts.draws ?? 0}</td>
                      <td className="text-center px-3 py-3 text-rose-400 text-xs">{ts.losses ?? 0}</td>
                      <td className="text-center px-3 py-3 text-white/50 text-xs">{ts.goals_for ?? 0}</td>
                      <td className="text-center px-3 py-3 text-white/50 text-xs">{ts.goals_against ?? 0}</td>
                      <td className="text-center px-3 py-3 text-xs">
                        <span className={gd > 0 ? "text-emerald-400" : gd < 0 ? "text-rose-400" : "text-white/40"}>
                          {gd > 0 ? `+${gd}` : gd}
                        </span>
                      </td>
                      <td className="text-center px-3 py-3 font-bold text-white text-sm">{ts.points ?? 0}</td>
                      <td className="hidden sm:table-cell px-3 py-3">
                        <div className="flex gap-0.5">
                          {ts.wins > 0 && [...Array(Math.min(ts.wins, 3))].map((_, j) => (
                            <span key={`w${j}`} className="w-4 h-4 rounded-sm bg-emerald-400/20 flex items-center justify-center">
                              <TrendingUp className="w-2.5 h-2.5 text-emerald-400" />
                            </span>
                          ))}
                          {ts.draws > 0 && [...Array(Math.min(ts.draws, 2))].map((_, j) => (
                            <span key={`d${j}`} className="w-4 h-4 rounded-sm bg-white/10 flex items-center justify-center">
                              <Minus className="w-2.5 h-2.5 text-white/40" />
                            </span>
                          ))}
                          {ts.losses > 0 && [...Array(Math.min(ts.losses, 2))].map((_, j) => (
                            <span key={`l${j}`} className="w-4 h-4 rounded-sm bg-rose-400/20 flex items-center justify-center">
                              <TrendingDown className="w-2.5 h-2.5 text-rose-400" />
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Legend */}
            <div className="px-4 py-3 border-t border-white/[0.04] flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-400/20 inline-block" />
                <span className="text-[10px] text-white/30">1st Place</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-violet-400/10 inline-block" />
                <span className="text-[10px] text-white/30">Playoff Spots</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}