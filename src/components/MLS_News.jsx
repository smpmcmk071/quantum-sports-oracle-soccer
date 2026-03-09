import { Newspaper, TrendingUp, AlertCircle } from "lucide-react";

const MOCK_NEWS = [
  {
    id: 1,
    title: "Inter Miami Extends Unbeaten Streak",
    summary: "Inter Miami CF maintained their impressive form with another commanding victory, extending their unbeaten run to 5 matches.",
    category: "Performance",
    time: "2 hours ago",
    team: "Inter Miami"
  },
  {
    id: 2,
    title: "Injury Updates Across the League",
    summary: "Several key players sidelined with injuries this week. Check which teams are affected heading into matchday 6.",
    category: "Injury Report",
    time: "4 hours ago",
    team: null
  },
  {
    id: 3,
    title: "LAFC's Defensive Resilience Impresses",
    summary: "LAFC has conceded just 4 goals in their last 5 matches, establishing themselves as the league's toughest defense.",
    category: "Analysis",
    time: "6 hours ago",
    team: "LAFC"
  },
  {
    id: 4,
    title: "Rookie Sensation Makes Impact",
    summary: "A breakout young star has already accumulated 3 goals and 2 assists in their debut season, drawing attention from national coaches.",
    category: "Players",
    time: "8 hours ago",
    team: null
  },
  {
    id: 5,
    title: "Playoff Race Heats Up",
    summary: "With 5 matchdays completed, the Eastern Conference race is tighter than ever. Four teams remain within 2 points.",
    category: "Standings",
    time: "10 hours ago",
    team: null
  }
];

const categoryColors = {
  "Performance": "text-emerald-400 bg-emerald-400/10",
  "Injury Report": "text-rose-400 bg-rose-400/10",
  "Analysis": "text-cyan-400 bg-cyan-400/10",
  "Players": "text-violet-400 bg-violet-400/10",
  "Standings": "text-amber-400 bg-amber-400/10"
};

export default function MLSNews() {
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Newspaper className="w-5 h-5 text-violet-400" />
        <h2 className="font-semibold text-white">MLS News & Updates</h2>
      </div>
      <div className="space-y-2">
        {MOCK_NEWS.map(article => (
          <div key={article.id} className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 hover:bg-white/[0.05] transition-all cursor-pointer">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white text-sm leading-tight">{article.title}</h3>
                <p className="text-xs text-white/50 mt-1 line-clamp-2">{article.summary}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  <span className={`text-[10px] font-medium px-2 py-1 rounded-full ${categoryColors[article.category] || "text-white/30 bg-white/5"}`}>
                    {article.category}
                  </span>
                  {article.team && (
                    <span className="text-[10px] text-white/30 bg-white/5 px-2 py-1 rounded-full">
                      {article.team}
                    </span>
                  )}
                  <span className="text-[10px] text-white/20 ml-auto">{article.time}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}