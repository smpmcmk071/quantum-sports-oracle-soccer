import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Zap, RefreshCw } from "lucide-react";

const TONE = {
  ok: "text-emerald-400",
  warn: "text-amber-400",
  bad: "text-rose-400",
};

export default function GeneratePanel({ games, teamMap, onGenerated }) {
  const [selectedGame, setSelectedGame] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  async function generate() {
    if (!selectedGame || busy) return;
    setBusy(true);
    setMessage(null);
    try {
      const response = await base44.functions.invoke("generateCosmicPrediction", { game_id: selectedGame });
      const data = response?.data || {};
      if (data.error) {
        setMessage({ tone: "bad", text: data.error });
      } else if (data.prediction) {
        onGenerated(data.prediction);
        setMessage(
          data.duplicate
            ? { tone: "warn", text: "A reading already exists for that match." }
            : { tone: "ok", text: "New reading generated." },
        );
        if (!data.duplicate) setSelectedGame("");
      }
    } catch (error) {
      setMessage({ tone: "bad", text: "Could not generate a reading. Try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <Zap className="w-4 h-4 text-cyan-400" />
        <span className="font-semibold text-sm">Generate a reading</span>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <select
          className="flex-1 bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors"
          value={selectedGame}
          onChange={e => setSelectedGame(e.target.value)}
        >
          <option value="">Select a match…</option>
          {games.map(g => {
            const home = teamMap[g.home_team_id];
            const away = teamMap[g.away_team_id];
            return (
              <option key={g.id} value={g.id}>
                {home?.name || "?"} vs {away?.name || "?"} — {g.game_date}
              </option>
            );
          })}
        </select>
        <button
          onClick={generate}
          disabled={!selectedGame || busy}
          className="px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {busy ? "Reading…" : "Generate"}
        </button>
      </div>

      {message && <p className={`text-xs mt-2 ${TONE[message.tone]}`}>{message.text}</p>}
      {!games.length && (
        <p className="text-xs text-white/30 mt-2">
          No matches are awaiting a result. Sync the schedule from the Admin page first.
        </p>
      )}
    </div>
  );
}