import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, Zap, Target, Activity, Star, BarChart2, Swords, FlaskConical } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Link } from "react-router-dom";
import MLSNews from "../components/MLS_News";
import AdvancedAnalytics from "../components/dashboard/AdvancedAnalytics";

const MLS_TEAMS = [
  "Inter Miami", "LAFC", "LA Galaxy", "Seattle Sounders", "Atlanta United",
  "NY Red Bulls", "Portland Timbers", "Austin FC", "FC Dallas", "Columbus Crew"
];

function ConfidenceBadge({ value }) {
  const color = value >= 80
    ? "text-emerald-400 bg-emerald-400/10"
    : value >= 65
    ? "text-amber-400 bg-amber-400/10"
    : "text-rose-400 bg-rose-400/10";
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${color}`}>{value}%</span>;
}

export default function Dashboard() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [teamStats, setTeamStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    Promise.all([
      base44.entities.Game.filter({ status: "scheduled" }, "-game_date", 10),
      base44.entities.Team.list(),
      base44.entities.Prediction.filter({ is_archived: false }, "-created_date", 50),
      base44.entities.TeamStats.filter({ season: 2026 }, "-points", 5),
    ]).then(([g, t, p, ts]) => {
      setGames(g);
      setTeams(t);
      setPredictions(p);
      setTeamStats(ts);
      setLoading(false);
    });
  }, []);

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});

  const statsCards = [
    { label: "MLS Teams", value: teams.length || "—", icon: Trophy, color: "from-amber-400 to-orange-500" },
    { label: "Predictions", value: predictions.length || "—", icon: Target, color: "from-violet-500 to-purple-600" },
    { label: "Upcoming Matches", value: games.length || "—", icon: Zap, color: "from-cyan-400 to-blue-500" },
    { label: "Season", value: "2026", icon: Activity, color: "from-emerald-400 to-teal-500" },
  ];

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Hero */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
            <Star className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">MLS · AI-Powered Sports Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Predict the <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Beautiful Game</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Quantum-enhanced predictions for every MLS match — powered by astrology, numerology & AI.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {statsCards.map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-5 h-5 text-white" />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming Matches & Predictions */}
        <div className="grid sm:grid-cols-2 gap-6">

          {/* Upcoming Matches */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-violet-400" />
              <h2 className="font-semibold text-white">Upcoming MLS Matches</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />)}
              </div>
            ) : games.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
                <p className="text-white/30 text-sm">No scheduled matches.</p>
                <Link to={createPageUrl("Admin")} className="text-violet-400 text-xs mt-2 inline-block hover:text-violet-300">Load match data →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {games.map(g => {
                  const home = teamMap[g.home_team_id];
                  const away = teamMap[g.away_team_id];
                  return (
                    <div key={g.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm text-white">
                            {home?.name || "TBD"} <span className="text-white/30">vs</span> {away?.name || "TBD"}
                          </div>
                          <div className="text-xs text-white/30 mt-0.5">{g.game_date} · {g.game_time || "TBD"}</div>
                          {g.venue && <div className="text-xs text-white/20 mt-0.5">{g.venue}</div>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] bg-emerald-400/10 text-emerald-400 rounded-full px-2 py-0.5 font-medium">MLS</span>
                          {home && away && (
                            <Link
                              to={createPageUrl(`Battle?homeTeamId=${g.home_team_id}&awayTeamId=${g.away_team_id}&venue=${encodeURIComponent(g.venue||"")}&gameDate=${g.game_date}`)}
                              className="flex items-center gap-1 px-2.5 py-1 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 rounded-full text-[10px] font-semibold transition-colors"
                            >
                              <Swords className="w-3 h-3" />
                              Battle
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Predictions */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Recent Predictions</h2>
            </div>
            {loading ? (
              <div className="space-y-2">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-white/[0.03] rounded-2xl animate-pulse" />)}
              </div>
            ) : predictions.length === 0 ? (
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center">
                <p className="text-white/30 text-sm">No predictions yet.</p>
                <Link to={createPageUrl("Matches")} className="text-violet-400 text-xs mt-2 inline-block hover:text-violet-300">Generate predictions →</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {predictions.map(p => {
                  const winner = teamMap[p.predicted_winner_id];
                  return (
                    <div key={p.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-sm text-violet-300">{winner?.name || "Unknown"}</div>
                          <div className="text-xs text-white/30 mt-0.5 capitalize">{p.bet_recommendation?.replace(/_/g, " ")}</div>
                        </div>
                        <ConfidenceBadge value={p.confidence_score || 0} />
                      </div>
                      {p.prediction_notes && (
                        <p className="text-xs text-white/30 mt-2 line-clamp-2">{p.prediction_notes}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* MLS News */}
        <MLSNews />

        {/* Top Teams Leaderboard */}
        {teamStats.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-400" />
              <h2 className="font-semibold text-white">MLS Standings (Top 5)</h2>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs text-white/30 font-medium">Team</th>
                    <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">W</th>
                    <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">D</th>
                    <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">L</th>
                    <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">GD</th>
                    <th className="text-center px-3 py-3 text-xs text-white/30 font-medium">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {teamStats.map((ts, i) => {
                    const team = teamMap[ts.team_id];
                    return (
                      <tr key={ts.id} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white font-medium">
                          <span className="text-white/30 mr-2">{i + 1}.</span>
                          {team?.name || "—"}
                        </td>
                        <td className="text-center px-3 py-3 text-emerald-400">{ts.wins}</td>
                        <td className="text-center px-3 py-3 text-white/50">{ts.draws}</td>
                        <td className="text-center px-3 py-3 text-rose-400">{ts.losses}</td>
                        <td className="text-center px-3 py-3 text-white/50">{ts.goal_differential > 0 ? `+${ts.goal_differential}` : ts.goal_differential}</td>
                        <td className="text-center px-3 py-3 text-white font-bold">{ts.points}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <p className="text-center text-white/20 text-xs pb-4">
          For entertainment purposes only. Quantum Oracle does not encourage gambling.
        </p>
      </div>
    </div>
  );
}