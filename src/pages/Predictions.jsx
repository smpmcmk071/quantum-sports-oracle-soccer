import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { TrendingUp, Star, Sparkles, BarChart2 } from "lucide-react";
import PredictionCard from "@/components/predictions/PredictionCard";
import GeneratePanel from "@/components/predictions/GeneratePanel";
import PerformancePanel from "@/components/predictions/PerformancePanel";
import MethodologyNote from "@/components/predictions/MethodologyNote";
import {
  SAMPLE_PREDICTION,
  SAMPLE_GAME,
  SAMPLE_HOME,
  SAMPLE_AWAY,
} from "@/components/predictions/sampleReading";

const TABS = [
  { key: "readings", label: "Readings", icon: Sparkles },
  { key: "performance", label: "Performance", icon: BarChart2 },
];

export default function Predictions() {
  const [predictions, setPredictions] = useState([]);
  const [games, setGames] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [tab, setTab] = useState("readings");

  useEffect(() => {
    Promise.all([
      base44.entities.Prediction.filter({ is_archived: false }, "-created_date", 50),
      base44.entities.Game.list("-game_date", 300),
      base44.entities.Team.list(),
    ]).then(([p, g, t]) => {
      setPredictions(p);
      setGames(g);
      setTeams(t);
      setLoading(false);
    });
  }, []);

  const teamMap = teams.reduce((acc, t) => { acc[t.id] = t; return acc; }, {});
  const gameMap = games.reduce((acc, g) => { acc[g.id] = g; return acc; }, {});

  const openGames = games
    .filter(g => g.status !== "completed" && g.status !== "cancelled")
    .sort((a, b) => (a.game_date < b.game_date ? 1 : -1))
    .slice(0, 60);

  function handleGenerated(prediction) {
    setPredictions(prev => (
      prev.some(p => p.id === prediction.id)
        ? prev.map(p => (p.id === prediction.id ? prediction : p))
        : [prediction, ...prev]
    ));
  }

  async function deletePrediction(id) {
    setDeleting(id);
    await base44.entities.Prediction.delete(id);
    setPredictions(prev => prev.filter(p => p.id !== id));
    setDeleting(null);
  }

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <TrendingUp className="w-5 h-5 text-violet-400" />
            <h1 className="text-xl font-bold tracking-tight">MLS Predictions</h1>
          </div>
          <p className="text-sm text-white/35">
            Every reading shows its scorelines, the numbers behind them, and how likely each outcome really is.
          </p>
        </div>

        <div className="flex gap-2 border-b border-white/[0.06]">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 transition-all -mb-px ${
                tab === key
                  ? "border-violet-500 text-violet-300 bg-violet-500/10"
                  : "border-transparent text-white/40 hover:text-white/70"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {tab === "performance" ? (
          <PerformancePanel />
        ) : (
          <>
            <GeneratePanel games={openGames} teamMap={teamMap} onGenerated={handleGenerated} />

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-44 bg-white/[0.03] rounded-2xl animate-pulse" />)}
              </div>
            ) : predictions.length === 0 ? (
              <div className="space-y-3">
                <div className="text-center pt-2 pb-1">
                  <Star className="w-8 h-8 mx-auto mb-2 text-white/20" />
                  <p className="text-sm text-white/40">No readings yet. Pick a match above to generate one.</p>
                  <p className="text-xs text-white/25 mt-1">Here is what a reading looks like:</p>
                </div>
                <PredictionCard
                  prediction={SAMPLE_PREDICTION}
                  game={SAMPLE_GAME}
                  homeTeam={SAMPLE_HOME}
                  awayTeam={SAMPLE_AWAY}
                  winner={SAMPLE_HOME}
                  sample
                />
              </div>
            ) : (
              <div className="space-y-3">
                {predictions.map(p => {
                  const game = gameMap[p.game_id];
                  return (
                    <PredictionCard
                      key={p.id}
                      prediction={p}
                      game={game}
                      homeTeam={game ? teamMap[game.home_team_id] : null}
                      awayTeam={game ? teamMap[game.away_team_id] : null}
                      winner={teamMap[p.predicted_winner_id]}
                      onDelete={deletePrediction}
                      deleting={deleting}
                    />
                  );
                })}
              </div>
            )}

            <MethodologyNote />
          </>
        )}

        <p className="text-center text-white/20 text-xs pb-2">
          For entertainment purposes only. Quantum Oracle does not encourage gambling.
        </p>
      </div>
    </div>
  );
}