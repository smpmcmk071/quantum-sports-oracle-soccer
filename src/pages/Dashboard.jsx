import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Trophy, TrendingUp, Zap, Target, Activity, ChevronRight, Star, BarChart2 } from "lucide-react";

const sports = ["NFL", "NBA", "MLB", "NHL", "Soccer"];

const samplePredictions = [
  { id: 1, sport: "NFL", home: "Chiefs", away: "Eagles", homeOdds: "-145", awayOdds: "+120", confidence: 87, prediction: "Chiefs", time: "Sun 4:25 PM" },
  { id: 2, sport: "NBA", home: "Lakers", away: "Celtics", homeOdds: "+110", awayOdds: "-130", confidence: 72, prediction: "Celtics", time: "Tonight 8:30 PM" },
  { id: 3, sport: "Soccer", home: "Man City", away: "Arsenal", homeOdds: "-160", awayOdds: "+190", confidence: 91, prediction: "Man City", time: "Sat 12:30 PM" },
  { id: 4, sport: "NHL", home: "Avalanche", away: "Rangers", homeOdds: "+105", awayOdds: "-125", confidence: 65, prediction: "Rangers", time: "Fri 9:00 PM" },
  { id: 5, sport: "MLB", home: "Dodgers", away: "Yankees", homeOdds: "-175", awayOdds: "+150", confidence: 79, prediction: "Dodgers", time: "Sat 7:10 PM" },
];

const stats = [
  { label: "Win Rate", value: "73.2%", icon: Trophy, color: "from-amber-400 to-orange-500" },
  { label: "Predictions", value: "2,847", icon: Target, color: "from-violet-500 to-purple-600" },
  { label: "Avg Confidence", value: "81.4%", icon: Zap, color: "from-cyan-400 to-blue-500" },
  { label: "Active Picks", value: "12", icon: Activity, color: "from-emerald-400 to-teal-500" },
];

function ConfidenceBadge({ value }) {
  const color = value >= 80 ? "text-emerald-400 bg-emerald-400/10" : value >= 65 ? "text-amber-400 bg-amber-400/10" : "text-rose-400 bg-rose-400/10";
  return (
    <span className={`text-xs font-bold px-2 py-1 rounded-full ${color}`}>
      {value}%
    </span>
  );
}

export default function Dashboard() {
  const [activeSport, setActiveSport] = useState("All");
  const [predictions, setPredictions] = useState(samplePredictions);
  const [loading, setLoading] = useState(false);

  const filtered = activeSport === "All" ? predictions : predictions.filter(p => p.sport === activeSport);

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      {/* Header */}
      <div className="border-b border-white/5 backdrop-blur-sm sticky top-0 z-10 bg-[#080b14]/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">Quantum</span>
              <span className="font-light text-white/50 ml-1">Oracle</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-white/40 font-medium">Live</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Hero */}
        <div className="text-center py-6">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-4 py-1.5 mb-5">
            <Star className="w-3.5 h-3.5 text-violet-400" />
            <span className="text-xs text-violet-300 font-medium">AI-Powered Sports Intelligence</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3">
            Predict the <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">Unpredictable</span>
          </h1>
          <p className="text-white/40 text-lg max-w-xl mx-auto">
            Quantum-enhanced machine learning delivers the sharpest sports predictions on the planet.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center mb-3 shadow-lg`}>
                <s.icon className="w-4.5 h-4.5 text-white w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-white">{s.value}</div>
              <div className="text-xs text-white/40 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Predictions */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-violet-400" />
              <h2 className="font-semibold text-white">Today's Picks</h2>
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {["All", ...sports].map(s => (
                <button
                  key={s}
                  onClick={() => setActiveSport(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                    activeSport === s
                      ? "bg-violet-500 text-white shadow-lg shadow-violet-500/30"
                      : "bg-white/[0.04] text-white/40 hover:text-white/70"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((p) => (
              <div
                key={p.id}
                className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] hover:border-white/10 transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="text-[10px] font-bold text-white/30 bg-white/5 rounded-lg px-2 py-1 uppercase tracking-wider shrink-0">
                      {p.sport}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-white text-sm truncate">
                        {p.home} <span className="text-white/30">vs</span> {p.away}
                      </div>
                      <div className="text-xs text-white/30 mt-0.5">{p.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <div className="text-right hidden sm:block">
                      <div className="text-xs text-white/30 mb-1">Prediction</div>
                      <div className="text-sm font-bold text-violet-300">{p.prediction}</div>
                    </div>
                    <ConfidenceBadge value={p.confidence} />
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                  </div>
                </div>

                <div className="mt-3 flex gap-3">
                  <div className="flex-1 bg-white/[0.04] rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-white/30 mb-0.5">{p.home}</div>
                    <div className="text-sm font-bold text-white">{p.homeOdds}</div>
                  </div>
                  <div className="flex-1 bg-white/[0.04] rounded-xl p-2.5 text-center">
                    <div className="text-[10px] text-white/30 mb-0.5">{p.away}</div>
                    <div className="text-sm font-bold text-white">{p.awayOdds}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="text-center text-white/20 text-xs pb-4">
          For entertainment purposes only. Quantum Oracle does not encourage gambling.
        </p>
      </div>
    </div>
  );
}