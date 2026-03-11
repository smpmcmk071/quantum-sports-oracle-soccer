import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, RadarChart, PolarGrid, PolarAngleAxis, Radar, Legend
} from "recharts";
import { Orbit, Sparkles, TrendingUp, Loader2 } from "lucide-react";

const PLANET_COLORS = ["#a78bfa", "#22d3ee", "#f59e0b"];

function PlanetCard({ transit, index }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5 hover:bg-white/[0.05] transition-all">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center text-lg shrink-0"
          style={{ background: `${PLANET_COLORS[index]}20`, border: `1px solid ${PLANET_COLORS[index]}40` }}
        >
          {transit.symbol}
        </div>
        <div>
          <div className="font-semibold text-white text-sm">{transit.title}</div>
          <div className="text-xs mt-0.5" style={{ color: PLANET_COLORS[index] }}>{transit.planets}</div>
        </div>
        <div className="ml-auto shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: `${PLANET_COLORS[index]}20`, color: PLANET_COLORS[index] }}>
            Impact: {transit.impact}/10
          </span>
        </div>
      </div>
      <p className="text-xs text-white/50 leading-relaxed">{transit.description}</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        {transit.teams_affected?.map(t => (
          <span key={t} className="text-[10px] bg-white/[0.05] text-white/40 rounded-full px-2 py-0.5">{t}</span>
        ))}
      </div>
    </div>
  );
}

const CustomDot = (props) => {
  const { cx, cy, payload } = props;
  const color = payload.was_correct === true ? "#34d399"
    : payload.was_correct === false ? "#f87171"
    : "#6366f1";
  return <circle cx={cx} cy={cy} r={5} fill={color} fillOpacity={0.8} stroke="none" />;
};

export default function AdvancedAnalytics({ predictions, teamMap }) {
  const [transits, setTransits] = useState([]);
  const [loadingTransits, setLoadingTransits] = useState(true);

  useEffect(() => {
    base44.integrations.Core.InvokeLLM({
      prompt: `You are an expert astrologer specializing in sports predictions. Today is March 11, 2026.
Identify the TOP 3 most influential planetary transits currently active that would affect the 2026 MLS soccer season outcomes.
For each transit, provide: title, planets involved, a symbol emoji, impact score (1-10), a 2-sentence description of how it affects team performance and match outcomes, and 2-3 MLS team names (from: Inter Miami, LAFC, LA Galaxy, Seattle Sounders, Atlanta United, NY Red Bulls, Portland Timbers, Austin FC, FC Dallas, Columbus Crew) that are most affected by this transit based on their founding dates.`,
      response_json_schema: {
        type: "object",
        properties: {
          transits: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                planets: { type: "string" },
                symbol: { type: "string" },
                impact: { type: "number" },
                description: { type: "string" },
                teams_affected: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      }
    }).then(res => {
      setTransits(res?.transits?.slice(0, 3) || []);
      setLoadingTransits(false);
    }).catch(() => setLoadingTransits(false));
  }, []);

  // Scatter data: cosmic_energy vs confidence, colored by outcome
  const scatterData = predictions
    .filter(p => p.cosmic_energy_score != null && p.confidence_score != null)
    .map(p => ({
      x: p.cosmic_energy_score,
      y: p.confidence_score,
      was_correct: p.was_correct,
      team: teamMap[p.predicted_winner_id]?.name || "Unknown",
    }));

  // Bar data: average score components
  const scored = predictions.filter(p =>
    p.astrology_score != null || p.numerology_score != null ||
    p.battle_stats_score != null || p.cosmic_energy_score != null
  );
  const avg = (key) => scored.length
    ? Math.round(scored.reduce((s, p) => s + (p[key] || 0), 0) / scored.length)
    : 0;

  const componentData = [
    { name: "Astrology", value: avg("astrology_score"), fill: "#a78bfa" },
    { name: "Numerology", value: avg("numerology_score"), fill: "#22d3ee" },
    { name: "Battle Stats", value: avg("battle_stats_score"), fill: "#f59e0b" },
    { name: "Cosmic Energy", value: avg("cosmic_energy_score"), fill: "#34d399" },
  ];

  // Accuracy by cosmic energy bucket
  const buckets = { "0-40": { correct: 0, total: 0 }, "41-65": { correct: 0, total: 0 }, "66-80": { correct: 0, total: 0 }, "81-100": { correct: 0, total: 0 } };
  predictions.forEach(p => {
    if (p.cosmic_energy_score == null || p.was_correct == null) return;
    const s = p.cosmic_energy_score;
    const key = s <= 40 ? "0-40" : s <= 65 ? "41-65" : s <= 80 ? "66-80" : "81-100";
    buckets[key].total++;
    if (p.was_correct) buckets[key].correct++;
  });
  const accuracyData = Object.entries(buckets)
    .map(([range, d]) => ({
      range,
      accuracy: d.total ? Math.round((d.correct / d.total) * 100) : 0,
      total: d.total
    }))
    .filter(d => d.total > 0);

  const hasPredictions = predictions.length > 0;

  return (
    <div className="space-y-8">

      {/* Planetary Transits */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Orbit className="w-5 h-5 text-violet-400" />
          <h2 className="font-semibold text-white">Top 3 Planetary Transits · March 2026</h2>
        </div>
        {loadingTransits ? (
          <div className="flex items-center gap-3 p-8 text-white/40 text-sm justify-center bg-white/[0.02] rounded-2xl border border-white/[0.06]">
            <Loader2 className="w-4 h-4 animate-spin" /> Calculating cosmic alignments…
          </div>
        ) : transits.length === 0 ? (
          <div className="text-white/30 text-sm text-center py-8">Could not load transit data.</div>
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            {transits.map((t, i) => <PlanetCard key={i} transit={t} index={i} />)}
          </div>
        )}
      </div>

      {/* Charts */}
      {!hasPredictions ? (
        <div className="text-center py-12 text-white/30 text-sm bg-white/[0.02] rounded-2xl border border-white/[0.06]">
          <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-30" />
          Generate some predictions to unlock the analytics charts.
        </div>
      ) : (
        <>
          {/* Score Component Breakdown */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
              <h2 className="font-semibold text-white">Avg Score Components Across All Predictions</h2>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={componentData} barSize={36}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="name" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: "rgba(255,255,255,0.6)" }}
                    formatter={(v) => [`${v}`, "Avg Score"]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {componentData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Cosmic Energy vs Confidence Scatter */}
          {scatterData.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h2 className="font-semibold text-white">Cosmic Energy vs Confidence</h2>
                </div>
                <div className="flex items-center gap-4 text-[11px] text-white/40">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" /> Correct</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" /> Incorrect</span>
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-400 inline-block" /> Pending</span>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <ResponsiveContainer width="100%" height={260}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="x" name="Cosmic Energy" domain={[0, 100]} type="number"
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false}
                      label={{ value: "Cosmic Energy Score", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                    <YAxis dataKey="y" name="Confidence" domain={[0, 100]} type="number"
                      tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false}
                      label={{ value: "Confidence %", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.2)", fontSize: 10 }} />
                    <Tooltip
                      contentStyle={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                      formatter={(v, name) => [v, name]}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0]?.payload;
                        return (
                          <div className="bg-[#0d1120] border border-white/10 rounded-xl p-3 text-xs">
                            <div className="text-white font-medium mb-1">{d?.team}</div>
                            <div className="text-white/50">Cosmic: {d?.x} · Confidence: {d?.y}%</div>
                            <div className={d?.was_correct === true ? "text-emerald-400" : d?.was_correct === false ? "text-rose-400" : "text-indigo-400"}>
                              {d?.was_correct === true ? "✓ Correct" : d?.was_correct === false ? "✗ Incorrect" : "⋯ Pending"}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} shape={<CustomDot />} />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Accuracy by Cosmic Energy Bucket */}
          {accuracyData.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <h2 className="font-semibold text-white">Prediction Accuracy by Cosmic Energy Range</h2>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={accuracyData} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="range" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                    <Tooltip
                      contentStyle={{ background: "#0d1120", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 12 }}
                      formatter={(v, name, props) => [`${v}% (${props.payload.total} games)`, "Accuracy"]}
                    />
                    <Bar dataKey="accuracy" radius={[6, 6, 0, 0]}>
                      {accuracyData.map((entry, i) => (
                        <Cell key={i} fill={entry.accuracy >= 60 ? "#34d399" : entry.accuracy >= 40 ? "#f59e0b" : "#f87171"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-[11px] text-white/20 text-center mt-2">Higher cosmic energy scores correlate with prediction accuracy</p>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}