import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { AlertTriangle, Activity } from "lucide-react";

function BaselineRow({ label, value, note }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-white/[0.05] last:border-0">
      <div className="min-w-0">
        <div className="text-xs text-white/70">{label}</div>
        {note && <div className="text-[10px] text-white/25">{note}</div>}
      </div>
      <span className="text-sm font-semibold tabular-nums text-white/80">{value ?? "—"}</span>
    </div>
  );
}

export default function PerformancePanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.functions
      .invoke("predictionPerformance", {})
      .then(response => setData(response?.data || null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="h-40 bg-white/[0.03] rounded-2xl animate-pulse" />;
  }

  if (!data) {
    return (
      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-8 text-center text-sm text-white/35">
        Performance figures are unavailable right now.
      </div>
    );
  }

  const tiles = [
    { label: "Settled readings", value: data.settled },
    { label: "Called correctly", value: data.correct },
    { label: "Accuracy", value: data.accuracy != null ? `${data.accuracy}%` : "—" },
    { label: "Still open", value: data.pending },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {tiles.map(tile => (
          <div key={tile.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
            <div className="text-2xl font-bold text-white tabular-nums">{tile.value}</div>
            <div className="text-[11px] text-white/35 mt-0.5">{tile.label}</div>
          </div>
        ))}
      </div>

      {data.low_sample && (
        <div className="flex items-start gap-2 bg-amber-400/[0.07] border border-amber-400/20 rounded-2xl p-4">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200/80 leading-relaxed">
            {data.settled} settled readings is a small sample. Numbers below this line swing wildly until
            there are at least 30, so read them as a trend rather than a track record.
          </p>
        </div>
      )}

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-semibold text-sm">Against the baselines</span>
        </div>
        <BaselineRow
          label="This engine"
          value={data.accuracy != null ? `${data.accuracy}%` : "—"}
          note={`${data.settled} settled readings`}
        />
        <BaselineRow
          label="Always pick the home team"
          value={data.home_baseline != null ? `${data.home_baseline}%` : "—"}
          note="Would have been right this often on the same matches"
        />
        <BaselineRow
          label="Coin flip"
          value={`${data.chance_baseline}%`}
          note="Three-way chance baseline"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-white/50">
            vs home baseline:{" "}
            <span className={`font-semibold ${(data.edge_vs_home ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {data.edge_vs_home != null ? `${data.edge_vs_home > 0 ? "+" : ""}${data.edge_vs_home} pts` : "—"}
            </span>
          </span>
          <span className="text-[10px] bg-white/[0.04] border border-white/[0.06] rounded-full px-2.5 py-1 text-white/50">
            vs coin flip:{" "}
            <span className={`font-semibold ${(data.edge_vs_chance ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {data.edge_vs_chance != null ? `${data.edge_vs_chance > 0 ? "+" : ""}${data.edge_vs_chance} pts` : "—"}
            </span>
          </span>
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
        <div className="font-semibold text-sm mb-3">Accuracy by confidence</div>
        {data.bands?.map(band => (
          <BaselineRow
            key={band.label}
            label={band.label}
            value={band.accuracy != null ? `${band.accuracy}%` : "—"}
            note={`${band.settled} settled${band.settled ? `, ${band.correct} correct` : ""}`}
          />
        ))}
      </div>
    </div>
  );
}