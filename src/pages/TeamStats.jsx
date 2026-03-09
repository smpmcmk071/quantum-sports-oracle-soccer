import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ChevronDown, ChevronUp, Users, BarChart2 } from "lucide-react";

export default function TeamStats() {
  const [teams, setTeams] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [players, setPlayers] = useState([]);
  const [playerStats, setPlayerStats] = useState([]);
  const [expandedTeams, setExpandedTeams] = useState(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Team.list(),
      base44.entities.TeamStats.filter({ season: 2026 }),
      base44.entities.Player.list(),
      base44.entities.PlayerStats.filter({ season: 2026 }),
    ]).then(([t, ts, p, ps]) => {
      setTeams(t);
      setTeamStats(ts);
      setPlayers(p);
      setPlayerStats(ps);
      setLoading(false);
    });
  }, []);

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  const statsMap = teamStats.reduce((acc, ts) => { acc[ts.team_id] = ts; return acc; }, {});
  const playerStatsMap = playerStats.reduce((acc, ps) => { acc[ps.player_id] = ps; return acc; }, {});

  const toggleTeam = (teamId) => {
    const newSet = new Set(expandedTeams);
    if (newSet.has(teamId)) newSet.delete(teamId);
    else newSet.add(teamId);
    setExpandedTeams(newSet);
  };

  const teamsSorted = teams.sort((a, b) => {
    const aStats = statsMap[a.id];
    const bStats = statsMap[b.id];
    const aPts = aStats?.points || 0;
    const bPts = bStats?.points || 0;
    if (bPts !== aPts) return bPts - aPts;
    return (bStats?.goal_differential || 0) - (aStats?.goal_differential || 0);
  });

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <BarChart2 className="w-5 h-5 text-violet-400" />
          <h1 className="text-2xl font-bold">Team & Player Stats Grid</h1>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-16 bg-white/[0.03] rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {teamsSorted.map((team) => {
              const ts = statsMap[team.id];
              const teamPlayers = players.filter(p => p.team_id === team.id).sort((a, b) => {
                const aPts = playerStatsMap[a.id]?.rating || 0;
                const bPts = playerStatsMap[b.id]?.rating || 0;
                return bPts - aPts;
              });
              const isExpanded = expandedTeams.has(team.id);

              return (
                <div key={team.id}>
                  {/* Team Row */}
                  <button
                    onClick={() => toggleTeam(team.id)}
                    className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:bg-white/[0.05] transition-all text-left"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        {team.logo_url && (
                          <img src={team.logo_url} alt="" className="w-8 h-8 object-contain opacity-80" />
                        )}
                        <div className="flex-1">
                          <div className="font-semibold text-white">{team.name}</div>
                          <div className="text-xs text-white/30">{team.conference} Conference</div>
                        </div>
                      </div>

                      {/* Team Stats */}
                      <div className="flex items-center gap-6 mr-4">
                        <div className="text-center">
                          <div className="text-sm font-bold text-white">{ts?.points || 0}</div>
                          <div className="text-[10px] text-white/30">Pts</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-emerald-400">{ts?.wins || 0}</div>
                          <div className="text-[10px] text-white/30">W</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white/50">{ts?.draws || 0}</div>
                          <div className="text-[10px] text-white/30">D</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-rose-400">{ts?.losses || 0}</div>
                          <div className="text-[10px] text-white/30">L</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white/50">{ts?.goals_for || 0}</div>
                          <div className="text-[10px] text-white/30">GF</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-semibold text-white/50">{ts?.goals_against || 0}</div>
                          <div className="text-[10px] text-white/30">GA</div>
                        </div>
                        <div className="text-center min-w-12">
                          <div className={`text-sm font-semibold ${
                            (ts?.goal_differential || 0) > 0 ? "text-emerald-400" : 
                            (ts?.goal_differential || 0) < 0 ? "text-rose-400" : 
                            "text-white/50"
                          }`}>
                            {(ts?.goal_differential || 0) > 0 ? `+${ts?.goal_differential}` : ts?.goal_differential}
                          </div>
                          <div className="text-[10px] text-white/30">GD</div>
                        </div>
                        <div className="text-xs text-white/30">{teamPlayers.length} players</div>
                      </div>

                      {/* Toggle Icon */}
                      <div className="text-white/30">
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </div>
                    </div>
                  </button>

                  {/* Players Grid */}
                  {isExpanded && (
                    <div className="bg-white/[0.02] border border-white/[0.04] border-t-0 rounded-b-xl p-4 space-y-2">
                      {teamPlayers.length === 0 ? (
                        <div className="text-center text-white/30 text-sm py-4">No players loaded yet</div>
                      ) : (
                        <div className="grid gap-2">
                          <div className="grid grid-cols-12 gap-2 text-[10px] text-white/30 font-medium mb-2 px-2">
                            <div className="col-span-4">Player</div>
                            <div className="col-span-1 text-center">Pos</div>
                            <div className="col-span-1 text-center">App</div>
                            <div className="col-span-1 text-center">Goals</div>
                            <div className="col-span-1 text-center">Assists</div>
                            <div className="col-span-1 text-center">Rating</div>
                            <div className="col-span-2 text-center">Pass Acc</div>
                          </div>
                          {teamPlayers.map((player) => {
                            const ps = playerStatsMap[player.id];
                            return (
                              <div key={player.id} className="grid grid-cols-12 gap-2 bg-white/[0.03] rounded-lg p-2 text-xs items-center hover:bg-white/[0.05] transition-all">
                                <div className="col-span-4">
                                  <div className="font-medium text-white">{player.name}</div>
                                  <div className="text-white/30">#{player.jersey_number}</div>
                                </div>
                                <div className="col-span-1 text-center">
                                  <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/70">{player.position}</span>
                                </div>
                                <div className="col-span-1 text-center text-white/50">{ps?.appearances || 0}</div>
                                <div className="col-span-1 text-center text-emerald-400 font-semibold">{ps?.goals || 0}</div>
                                <div className="col-span-1 text-center text-cyan-400 font-semibold">{ps?.assists || 0}</div>
                                <div className="col-span-1 text-center text-violet-400 font-semibold">{ps?.rating?.toFixed(1) || "—"}</div>
                                <div className="col-span-2 text-center text-white/50">{ps?.pass_accuracy?.toFixed(0) || 0}%</div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}