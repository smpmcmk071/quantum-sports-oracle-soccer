import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Calendar, Filter, CheckCircle, RefreshCw, Trash2 } from "lucide-react";

function StatusBadge({ status }) {
  const map = {
    scheduled: "bg-blue-400/10 text-blue-400",
    in_progress: "bg-amber-400/10 text-amber-400",
    completed: "bg-emerald-400/10 text-emerald-400",
    cancelled: "bg-rose-400/10 text-rose-400",
  };
  return (
    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${map[status] || "bg-white/10 text-white/40"}`}>
      {status?.replace("_", " ")}
    </span>
  );
}

// Extracted into its own component so hooks are valid
function MatchRow({ g, teamMap, updating, onMarkResult }) {
  const home = teamMap[g.home_team_id];
  const away = teamMap[g.away_team_id];
  const [hs, setHs] = useState(g.home_score ?? "");
  const [as_, setAs] = useState(g.away_score ?? "");

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 text-right">
          <div className="font-semibold text-sm text-white">{home?.name || "TBD"}</div>
          <div className="text-xs text-white/30">{home?.city}</div>
        </div>

        <div className="text-center shrink-0">
          {g.status === "completed" ? (
            <div className="text-2xl font-bold text-white">{g.home_score} – {g.away_score}</div>
          ) : (
            <div>
              <div className="text-xs font-bold text-white/60">{g.game_date}</div>
              <div className="text-xs text-white/30">{g.game_time || "TBD"}</div>
            </div>
          )}
          <div className="mt-1"><StatusBadge status={g.status} /></div>
        </div>

        <div className="flex-1 text-left">
          <div className="font-semibold text-sm text-white">{away?.name || "TBD"}</div>
          <div className="text-xs text-white/30">{away?.city}</div>
        </div>
      </div>

      {g.venue && (
        <div className="text-center text-xs text-white/20 mt-2">{g.venue}</div>
      )}

      {g.status !== "completed" && (
        <div className="mt-3 flex items-center gap-2 justify-center">
          <input
            type="number" min="0" max="20"
            className="w-16 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-violet-500/50"
            value={hs} onChange={e => setHs(e.target.value)}
            placeholder="0"
          />
          <span className="text-white/30 text-xs">–</span>
          <input
            type="number" min="0" max="20"
            className="w-16 bg-white/[0.05] border border-white/10 rounded-lg px-2 py-1 text-sm text-white text-center focus:outline-none focus:border-violet-500/50"
            value={as_} onChange={e => setAs(e.target.value)}
            placeholder="0"
          />
          <button
            onClick={() => onMarkResult(g, Number(hs), Number(as_))}
            disabled={hs === "" || as_ === "" || updating === g.id}
            className="flex items-center gap-1 px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium rounded-lg transition-colors disabled:opacity-40"
          >
            <CheckCircle className="w-3.5 h-3.5" />
            Save Result
          </button>
        </div>
      )}
    </div>
  );
}

export default function Matches() {
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filter, setFilter] = useState("scheduled");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");

  useEffect(() => {
    Promise.all([
      base44.entities.Game.list("-game_date", 100),
      base44.entities.Team.list(),
    ]).then(([g, t]) => {
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  const filtered = filter === "all" ? games : games.filter(g => g.status === filter);

  async function syncScores() {
    setSyncing(true);
    setSyncMsg("");
    const res = await base44.functions.invoke("fetchMLSData", { type: "scores", season: 2026 });
    const d = res?.data;
    setSyncMsg(`✓ Updated ${d?.games_updated || 0} results`);
    // Refresh games
    const updated = await base44.entities.Game.list("-game_date", 100);
    setGames(updated);
    setSyncing(false);
  }

  async function deleteGame(gameId) {
    if (!window.confirm("Delete this match?")) return;
    await base44.entities.Game.delete(gameId);
    setGames(prev => prev.filter(g => g.id !== gameId));
  }

  async function markResult(game, homeScore, awayScore) {
    setUpdating(game.id);
    const winner = homeScore > awayScore ? game.home_team_id : awayScore > homeScore ? game.away_team_id : "draw";
    await base44.entities.Game.update(game.id, { status: "completed", home_score: homeScore, away_score: awayScore, actual_winner: winner });
    setGames(prev => prev.map(g => g.id === game.id ? { ...g, status: "completed", home_score: homeScore, away_score: awayScore, actual_winner: winner } : g));
    setUpdating(null);
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Calendar className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold">MLS Matches</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={syncScores}
              disabled={syncing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 text-xs font-medium rounded-xl transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing…" : "Sync ESPN Scores"}
            </button>
            {syncMsg && <span className="text-xs text-emerald-400">{syncMsg}</span>}
            <Filter className="w-4 h-4 text-white/30" />
            {["all", "scheduled", "in_progress", "completed"].map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${filter === s ? "bg-violet-500 text-white" : "bg-white/[0.04] text-white/40 hover:text-white/70"}`}
              >
                {s === "in_progress" ? "Live" : s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white/[0.03] rounded-2xl animate-pulse" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No {filter} matches found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(g => (
              <MatchRow key={g.id} g={g} teamMap={teamMap} updating={updating} onMarkResult={markResult} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}