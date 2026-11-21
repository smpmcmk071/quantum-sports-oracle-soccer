import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";

export default function MethodologyNote() {
  const [open, setOpen] = useState(false);

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-4">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="flex items-center gap-2 text-xs font-semibold text-white/60">
          <Info className="w-3.5 h-3.5 text-cyan-400/70" />
          How a reading is built
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-white/30 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="mt-3 space-y-2 text-xs text-white/45 leading-relaxed">
          <p>
            <span className="text-cyan-400/80 font-semibold">Scorelines come from the stats.</span>{" "}
            Each team's goals for and against per game set an expected-goals figure, with a home bump
            added. Every scoreline from 0–0 to 4–4 is weighted by how likely that many goals is, then
            the top three are kept.
          </p>
          <p>
            <span className="text-violet-400/80 font-semibold">The cosmos tilts those weights.</span>{" "}
            A universal day number is taken from the match date and compared with each team's life
            path and destiny numbers, plus the zodiac element pairing and moon phase. That shifts the
            scoreline weights slightly rather than setting the score.
          </p>
          <p>
            <span className="text-white/60 font-semibold">Confidence</span> is the gap between the
            most likely outcome and the next most likely, scaled down when the teams have few games
            played. A close number means the reading genuinely could go several ways.
          </p>
          <p>
            Predictions are stored with the inputs used at the time, so later edits to a team's
            profile never rewrite a past reading. Once a game finishes, the result is recorded next to
            the original call and counted in the performance figures.
          </p>
          <p className="text-white/30">
            Numerology and astrology are interpretive traditions, not evidence-based forecasting. Treat
            every reading as entertainment.
          </p>
        </div>
      )}
    </div>
  );
}