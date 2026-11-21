import { useState } from "react";
import { ChevronDown, CheckCircle, XCircle, RefreshCw, Trash2, Sparkles } from "lucide-react";
import ScenarioList from "@/components/predictions/ScenarioList";
import MatchupInputs from "@/components/predictions/MatchupInputs";
import RationalePanel from "@/components/predictions/RationalePanel";
import {
  parseJson,
  confidenceTone,
  qualityLabel,
  BET_LABEL,
  BET_TONE,
} from "@/lib/predictionDisplay";

function ScoreTile({ label, value }) {
  return (
    <div className="bg-white/[0.03] rounded-xl p-2 text-center">
      <div className="text-base font-bold text-white tabular-nums">{value ?? "—"}</div>
      <div className="text-[10px] text-white/30">{label}</div>
    </div>
  );
}

export default function PredictionCard({ prediction, game, homeTeam, awayTeam, winner, onDelete, deleting, sample }) {
  const [showInputs, setShowInputs] = useState(false);
  const scenarios = parseJson(prediction.scenarios, []);
  const rationale = parseJson(prediction.rationale, null);
  const snapshot = parseJson(prediction.input_snapshot, null);
  const settled = prediction.was_correct !== undefined && prediction.was_correct !== null;

  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.04] transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            {game?.game_date && (
              <span className="text-xs text-cyan-400/70 font-semibold">{game.game_date}</span>
            )}
            {sample && (
              <span className="text-[10px] uppercase tracking-wider bg-amber-400/15 text-amber-300 rounded-full px-2 py-0.5 font-semibold">
                Sample
              </span>
            )}
            {prediction.data_quality && (
              <span className="text-[10px] text-white/30 border border-white/10 rounded-full px-2 py-0.5">
                {qualityLabel(prediction.data_quality)}
              </span>
            )}
          </div>
          <div className="text-xs text-white/30">
            {homeTeam?.name || "TBD"} vs {awayTeam?.name || "TBD"}
          </div>
          <div className="font-bold text-violet-300 text-base mt-1">
            {winner?.name || "Draw"} <span className="text-white/40 font-normal text-sm">called</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`text-xs font-bold px-2 py-1 rounded-full ${confidenceTone(prediction.confidence_score || 0)}`}>
            {prediction.confidence_score || 0}% confidence
          </span>
          {prediction.bet_recommendation && (
            <span className={`text-xs font-medium px-2 py-1 rounded-full ${BET_TONE[prediction.bet_recommendation]}`}>
              {BET_LABEL[prediction.bet_recommendation]}
            </span>
          )}
          {!sample && onDelete && (
            <button
              onClick={() => onDelete(prediction.id)}
              disabled={deleting === prediction.id}
              className="text-white/20 hover:text-rose-400 transition-colors"
              title="Delete prediction"
            >
              {deleting === prediction.id ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-violet-400" />
          <span className="text-[10px] uppercase tracking-wider text-white/40 font-semibold">Most likely scorelines</span>
        </div>
        <ScenarioList scenarios={scenarios} />
      </div>

      <div className="mt-4">
        <RationalePanel rationale={rationale} notes={prediction.prediction_notes} />
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2">
        <ScoreTile label="Numerology" value={prediction.numerology_score} />
        <ScoreTile label="Astrology" value={prediction.astrology_score} />
        <ScoreTile label="Cosmic" value={prediction.cosmic_energy_score} />
        <ScoreTile label="Stats" value={prediction.battle_stats_score} />
      </div>

      <button
        onClick={() => setShowInputs(v => !v)}
        className="mt-3 flex items-center gap-1 text-[11px] text-white/35 hover:text-white/60 transition-colors"
      >
        <ChevronDown className={`w-3 h-3 transition-transform ${showInputs ? "rotate-180" : ""}`} />
        {showInputs ? "Hide" : "Show"} the numbers behind this reading
      </button>
      {showInputs && (
        <div className="mt-3">
          <MatchupInputs snapshot={snapshot} />
        </div>
      )}

      {settled && (
        <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div className={`flex items-center gap-1.5 text-xs font-medium ${prediction.was_correct ? "text-emerald-400" : "text-rose-400"}`}>
            {prediction.was_correct ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
            {prediction.was_correct ? "Called it" : "Missed this one"}
          </div>
          {prediction.actual_home_score != null && prediction.actual_away_score != null && (
            <span className="text-xs text-white/40 tabular-nums">
              Final {prediction.actual_home_score}–{prediction.actual_away_score}
            </span>
          )}
        </div>
      )}
    </div>
  );
}