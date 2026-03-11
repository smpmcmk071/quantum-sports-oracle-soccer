import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, RefreshCw, TrendingUp, Star, CheckCircle, XCircle, Trash2 } from "lucide-react";

function ConfidenceBadge({ value }) {
  const color = value >= 80 ? "text-emerald-400 bg-emerald-400/10" : value >= 65 ? "text-amber-400 bg-amber-400/10" : "text-rose-400 bg-rose-400/10";
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${color}`}>{value}%</span>;
}

const BET_LABEL = { strong_bet: "Strong Bet ⚡", moderate_bet: "Moderate Bet", light_bet: "Light Bet", no_bet: "No Bet" };
const BET_COLOR = { strong_bet: "text-emerald-400 bg-emerald-400/10", moderate_bet: "text-cyan-400 bg-cyan-400/10", light_bet: "text-amber-400 bg-amber-400/10", no_bet: "text-white/30 bg-white/5" };

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(null);
  const [selectedGame, setSelectedGame] = useState("");

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  const gameMap = games.reduce((acc, g) => { acc[g.id] = g; return acc; }, {});

  useEffect(() => {
    Promise.all([
      base44.entities.Prediction.filter({ is_archived: false }, "-created_date", 50),
      base44.entities.Game.list("-game_date", 200),
      base44.entities.Team.list(),
    ]).then(([p, g, t]) => {
      setPredictions(p);
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  async function generatePrediction() {
    if (!selectedGame) return;
    setGenerating(selectedGame);
    const game = games.find(g => g.id === selectedGame);
    const home = teamMap[game?.home_team_id];
    const away = teamMap[game?.away_team_id];

    // Fetch team stats + top players for both teams in parallel
    const [homeStats, awayStats, homePlayers, awayPlayers] = await Promise.all([
      base44.entities.TeamStats.filter({ team_id: game.home_team_id, season: 2026 }),
      base44.entities.TeamStats.filter({ team_id: game.away_team_id, season: 2026 }),
      base44.entities.Player.filter({ team_id: game.home_team_id, is_starter: true }),
      base44.entities.Player.filter({ team_id: game.away_team_id, is_starter: true }),
    ]);
    const hs = homeStats[0] || {};
    const as_ = awayStats[0] || {};

    const formatTeamStats = (s) => s.games_played
      ? `W${s.wins}-D${s.draws}-L${s.losses}, ${s.points}pts, GF:${s.goals_for} GA:${s.goals_against} GD:${s.goal_differential}`
      : "No stats yet";

    const formatPlayers = (players) => players.slice(0, 8).map(p =>
      `${p.name} (${p.position}, ${p.goals || 0}G/${p.assists || 0}A, rating:${p.rating || "?"}, zodiac:${p.zodiac_sign || "?"})`
    ).join("; ") || "No player data";

    const prompt = `You are a Quantum Sports Oracle AI that predicts MLS soccer matches using astrology, numerology, statistics, and player data.

Analyze this MLS match:
- Home Team: ${home?.name} | City: ${home?.city} | Founded: ${home?.founded_date} | Zodiac: ${home?.zodiac_sign} | Life Path: ${home?.life_path_number} | Destiny: ${home?.destiny_number} | Chinese Zodiac: ${home?.chinese_zodiac}
- Home 2026 Stats: ${formatTeamStats(hs)}
- Home Key Players: ${formatPlayers(homePlayers)}

- Away Team: ${away?.name} | City: ${away?.city} | Founded: ${away?.founded_date} | Zodiac: ${away?.zodiac_sign} | Life Path: ${away?.life_path_number} | Destiny: ${away?.destiny_number} | Chinese Zodiac: ${away?.chinese_zodiac}
- Away 2026 Stats: ${formatTeamStats(as_)}
- Away Key Players: ${formatPlayers(awayPlayers)}

- Match Date: ${game?.game_date} | Venue: ${game?.venue || "Unknown"}

Use ALL available data — team form, goals scored/conceded, player zodiac signs, numerology compatibility, and cosmic alignment on the match date — to generate a thorough prediction.`;

    const result = await base44.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: {
        type: "object",
        properties: {
          predicted_winner: { type: "string", description: "Name of predicted winner or 'Draw'" },
          confidence_score: { type: "number", description: "0-100 confidence" },
          numerology_score: { type: "number", description: "0-100 numerology score for home team" },
          astrology_score: { type: "number", description: "0-100 astrology score for home team" },
          cosmic_energy_score: { type: "number", description: "0-100 cosmic energy alignment" },
          battle_stats_score: { type: "number", description: "0-100 score based on team/player stats comparison" },
          predicted_score_diff: { type: "number", description: "Predicted goal differential (positive = home wins)" },
          bet_recommendation: { type: "string", enum: ["strong_bet", "moderate_bet", "light_bet", "no_bet"] },
          prediction_notes: { type: "string", description: "2-3 sentence explanation" },
        }
      }
    });

    // Map predicted winner name to team ID
    const winnerName = result.predicted_winner || "";
    const isDraw = winnerName.toLowerCase().includes("draw");
    const predictedWinnerId = isDraw
      ? game.home_team_id
      : teams.find(t => t.name.toLowerCase().includes(winnerName.toLowerCase()))?.id || game.home_team_id;

    const newPred = await base44.entities.Prediction.create({
      game_id: selectedGame,
      predicted_winner_id: predictedWinnerId,
      confidence_score: result.confidence_score,
      numerology_score: result.numerology_score,
      astrology_score: result.astrology_score,
      cosmic_energy_score: result.cosmic_energy_score,
      battle_stats_score: result.battle_stats_score,
      predicted_score_diff: result.predicted_score_diff,
      bet_recommendation: result.bet_recommendation,
      prediction_notes: result.prediction_notes,
      is_archived: false,
    });

    setPredictions(prev => [newPred, ...prev]);
    setSelectedGame("");
    setGenerating(null);
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <TrendingUp className="w-5 h-5 text-violet-400" />
          <h1 className="text-xl font-bold">MLS Predictions</h1>
        </div>

        {/* Generate New Prediction */}
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-sm">Generate New Prediction</span>
          </div>
          <div className="flex gap-3">
            <select
              className="flex-1 bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
            >
              <option value="">Select upcoming match…</option>
              {games.map(g => {
                const home = teamMap[g.home_team_id];
                const away = teamMap[g.away_team_id];
                return <option key={g.id} value={g.id}>{home?.name || "?"} vs {away?.name || "?"} — {g.game_date}</option>;
              })}
            </select>
            <button
              onClick={generatePrediction}
              disabled={!selectedGame || generating}
              className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {generating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {generating ? "Generating…" : "Generate"}
            </button>
          </div>
          {games.length === 0 && !loading && (
            <p className="text-xs text-white/30 mt-2">No scheduled matches. Add matches in the Admin page first.</p>
          )}
        </div>

        {/* Predictions List */}
        {loading ? (
          <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-white/[0.03] rounded-2xl animate-pulse" />)}</div>
        ) : predictions.length === 0 ? (
          <div className="text-center py-16 text-white/30">
            <Star className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>No predictions yet. Generate one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {predictions.map(p => {
              const game = games.find(g => g.id === p.game_id);
              const winner = teamMap[p.predicted_winner_id];
              const home = game ? teamMap[game.home_team_id] : null;
              const away = game ? teamMap[game.away_team_id] : null;

              return (
                <div key={p.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {game?.game_date && (
                        <div className="text-xs text-cyan-400/70 font-semibold mb-0.5">📅 {game.game_date}</div>
                      )}
                      {home && away && (
                        <div className="text-xs text-white/30 mb-1">{home.name} vs {away.name}</div>
                      )}
                      <div className="font-bold text-violet-300 text-base">{winner?.name || "Unknown"} to win</div>
                      {p.prediction_notes && (
                        <p className="text-sm text-white/50 mt-2 leading-relaxed">{p.prediction_notes}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <ConfidenceBadge value={p.confidence_score || 0} />
                      {p.bet_recommendation && (
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${BET_COLOR[p.bet_recommendation]}`}>
                          {BET_LABEL[p.bet_recommendation]}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Score breakdown */}
                  <div className="mt-4 grid grid-cols-4 gap-2">
                    {[
                      ["Numerology", p.numerology_score],
                      ["Astrology", p.astrology_score],
                      ["Cosmic", p.cosmic_energy_score],
                      ["Battle Stats", p.battle_stats_score],
                    ].map(([label, val]) => (
                      <div key={label} className="bg-white/[0.03] rounded-xl p-2 text-center">
                        <div className="text-lg font-bold text-white">{val ?? "—"}</div>
                        <div className="text-[10px] text-white/30">{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Correctness */}
                  {p.was_correct !== undefined && p.was_correct !== null && (
                    <div className={`mt-3 flex items-center gap-2 text-xs font-medium ${p.was_correct ? "text-emerald-400" : "text-rose-400"}`}>
                      {p.was_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      {p.was_correct ? "Correct prediction" : "Incorrect prediction"}
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