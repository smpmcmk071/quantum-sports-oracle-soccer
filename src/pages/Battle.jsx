import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Star, ChevronRight, RefreshCw, Shield } from "lucide-react";

// Position-based matchup priority
const POSITION_OPPONENTS = {
  ST: ["CB", "GK"], CF: ["CB", "GK"], LW: ["RB", "CB"], RW: ["LB", "CB"],
  CAM: ["CDM", "CM"], CM: ["CM", "CDM"], CDM: ["CAM", "CM"],
  LB: ["RW", "LW"], RB: ["LW", "RW"], CB: ["ST", "CF", "LW", "RW"], GK: ["ST", "CF"],
};

function calcBattleStats(player) {
  const lp = player.life_path_number || 5;
  const dest = player.destiny_number || 5;
  const base = 60;
  return {
    attack:  Math.min(99, base + (player.goals || 0) * 3 + (player.assists || 0) * 2 + (lp % 4) * 2),
    defense: Math.min(99, base + (player.tackles_per_game || 0) * 8 + (dest % 4) * 2),
    speed:   Math.min(99, base + (player.dribbles_per_game || 0) * 6 + (lp % 5) * 2),
    stamina: Math.min(99, base + Math.floor((player.minutes_played || 0) / 10) + (dest % 3) * 3),
    magic:   Math.min(99, base + lp * 3 + dest * 2),
  };
}

function zodiacCompatibility(z1, z2) {
  const groups = [
    ["Aries","Leo","Sagittarius"],
    ["Taurus","Virgo","Capricorn"],
    ["Gemini","Libra","Aquarius"],
    ["Cancer","Scorpio","Pisces"],
  ];
  const g1 = groups.findIndex(g => g.includes(z1));
  const g2 = groups.findIndex(g => g.includes(z2));
  if (g1 === -1 || g2 === -1) return 1.0;
  if (g1 === g2) return 1.15;
  if (Math.abs(g1 - g2) === 2 || (g1 === 0 && g2 === 2) || (g1 === 2 && g2 === 0)) return 0.9;
  return 1.0;
}

function simulateDuel(p1, p2) {
  const s1 = calcBattleStats(p1);
  const s2 = calcBattleStats(p2);
  const compat = zodiacCompatibility(p1.zodiac_sign, p2.zodiac_sign);
  let hp1 = 100, hp2 = 100;
  let turns = 0;
  while (hp1 > 0 && hp2 > 0 && turns < 15) {
    turns++;
    const dmg1 = Math.max(1, Math.round(((s1.attack / 100) * (0.8 + Math.random() * 0.4) * compat - (s2.defense / 100) * 0.5) * 15));
    hp2 = Math.max(0, hp2 - dmg1);
    if (hp2 <= 0) break;
    const dmg2 = Math.max(1, Math.round(((s2.attack / 100) * (0.8 + Math.random() * 0.4) / compat - (s1.defense / 100) * 0.5) * 15));
    hp1 = Math.max(0, hp1 - dmg2);
  }
  return { winner: hp1 >= hp2 ? p1 : p2, loser: hp1 >= hp2 ? p2 : p1, remainingHp: Math.max(hp1, hp2), turns };
}

function simulateTeamBattle(team1Players, team2Players) {
  const log = [];
  let score1 = 0, score2 = 0;

  // Match players by position
  const used2 = new Set();
  const matchups = [];

  for (const p1 of team1Players) {
    const preferred = POSITION_OPPONENTS[p1.position] || [];
    let opponent = team2Players.find(p => preferred.includes(p.position) && !used2.has(p.id));
    if (!opponent) opponent = team2Players.find(p => !used2.has(p.id));
    if (!opponent) continue;
    used2.add(opponent.id);
    matchups.push([p1, opponent]);
  }

  for (const [p1, p2] of matchups) {
    const duel = simulateDuel(p1, p2);
    const team1Won = duel.winner.id === p1.id || duel.winner.name === p1.name;
    if (team1Won) score1++; else score2++;
    log.push({ p1: p1.name, p2: p2.name, pos1: p1.position, pos2: p2.position, winner: duel.winner.name, turns: duel.turns, remainingHp: duel.remainingHp, team1Won });
  }

  return { log, score1, score2, winner: score1 >= score2 ? "team1" : "team2" };
}

function StatBar({ label, val1, val2 }) {
  const max = Math.max(val1, val2, 1);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="font-bold text-white/70">{val1}</span>
        <span className="text-white/30">{label}</span>
        <span className="font-bold text-white/70">{val2}</span>
      </div>
      <div className="flex gap-0.5 h-1.5">
        <div className="flex-1 bg-white/5 rounded-l-full overflow-hidden flex justify-end">
          <div className="h-full bg-violet-500 rounded-l-full" style={{ width: `${(val1/max)*100}%` }} />
        </div>
        <div className="flex-1 bg-white/5 rounded-r-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-r-full" style={{ width: `${(val2/max)*100}%` }} />
        </div>
      </div>
    </div>
  );
}

export default function Battle() {
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [team1Players, setTeam1Players] = useState([]);
  const [team2Players, setTeam2Players] = useState([]);
  const [result, setResult] = useState(null);
  const [animStep, setAnimStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    base44.entities.Team.list().then(setTeams);
  }, []);

  async function onTeamChange(teamNum, id) {
    setResult(null);
    if (teamNum === 1) { setTeam1Id(id); setTeam1Players([]); }
    else { setTeam2Id(id); setTeam2Players([]); }
    if (!id) return;
    setLoadingPlayers(true);
    const players = await base44.entities.Player.filter({ team_id: id, is_starter: true });
    // Fall back to all players if no starters flagged
    const list = players.length > 0 ? players : await base44.entities.Player.filter({ team_id: id });
    if (teamNum === 1) setTeam1Players(list.slice(0, 11));
    else setTeam2Players(list.slice(0, 11));
    setLoadingPlayers(false);
  }

  function startBattle() {
    if (!team1Players.length || !team2Players.length) return;
    setLoading(true);
    setResult(null);
    setAnimStep(0);
    const res = simulateTeamBattle(team1Players, team2Players);
    setResult(res);
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimStep(step);
      if (step >= res.log.length) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 400);
  }

  const team1 = teams.find(t => t.id === team1Id);
  const team2 = teams.find(t => t.id === team2Id);
  const selectCls = "w-full bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors";
  const currentLog = result ? result.log.slice(0, animStep) : [];
  const battleDone = result && animStep >= result.log.length;

  // Team aggregate stats
  const teamAggStats = (players) => {
    if (!players.length) return null;
    const stats = players.map(calcBattleStats);
    return {
      attack: Math.round(stats.reduce((a, s) => a + s.attack, 0) / stats.length),
      defense: Math.round(stats.reduce((a, s) => a + s.defense, 0) / stats.length),
      speed: Math.round(stats.reduce((a, s) => a + s.speed, 0) / stats.length),
      stamina: Math.round(stats.reduce((a, s) => a + s.stamina, 0) / stats.length),
      magic: Math.round(stats.reduce((a, s) => a + s.magic, 0) / stats.length),
    };
  };
  const agg1 = teamAggStats(team1Players);
  const agg2 = teamAggStats(team2Players);

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Team Battle Arena</h1>
            <p className="text-xs text-white/30">Starting XI vs Starting XI — numerology & stats-powered matchups</p>
          </div>
        </div>

        {/* Team Selection */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm font-semibold text-violet-300">Home Team</span>
            </div>
            <select className={selectCls} value={team1Id} onChange={e => onTeamChange(1, e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {team1Players.length > 0 && (
              <div className="mt-3 text-xs text-white/30">{team1Players.length} players loaded</div>
            )}
          </div>

          <div className="bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">Away Team</span>
            </div>
            <select className={selectCls} value={team2Id} onChange={e => onTeamChange(2, e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {team2Players.length > 0 && (
              <div className="mt-3 text-xs text-white/30">{team2Players.length} players loaded</div>
            )}
          </div>
        </div>

        {/* Team Aggregate Stats */}
        {agg1 && agg2 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
            <div className="flex justify-between text-xs font-bold mb-3">
              <span className="text-violet-300">{team1?.name}</span>
              <span className="text-white/30 uppercase tracking-wider">Team Stats</span>
              <span className="text-cyan-300">{team2?.name}</span>
            </div>
            <StatBar label="⚔ Avg Attack" val1={agg1.attack} val2={agg2.attack} />
            <StatBar label="🛡 Avg Defense" val1={agg1.defense} val2={agg2.defense} />
            <StatBar label="⚡ Avg Speed" val1={agg1.speed} val2={agg2.speed} />
            <StatBar label="💪 Avg Stamina" val1={agg1.stamina} val2={agg2.stamina} />
            <StatBar label="✨ Avg Magic" val1={agg1.magic} val2={agg2.magic} />
          </div>
        )}

        {/* Battle Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={startBattle}
            disabled={!team1Players.length || !team2Players.length || loading || loadingPlayers}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold rounded-2xl text-sm flex items-center gap-3 disabled:opacity-40 hover:from-violet-600 hover:to-cyan-600 transition-all shadow-lg shadow-violet-500/20"
          >
            {loading || loadingPlayers ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
            {loadingPlayers ? "Loading players…" : loading ? "Battle in progress…" : "⚡ Start Team Battle"}
          </button>
        </div>

        {/* Live Score */}
        {result && (
          <div className="flex justify-center gap-8 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-violet-400">{result.score1}</div>
              <div className="text-xs text-white/30">{team1?.name}</div>
            </div>
            <div className="text-2xl font-bold text-white/20 self-center">–</div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cyan-400">{result.score2}</div>
              <div className="text-xs text-white/30">{team2?.name}</div>
            </div>
          </div>
        )}

        {/* Battle Log */}
        {currentLog.length > 0 && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">⚔ Matchup Results</div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto">
              {currentLog.map((entry, i) => (
                <div key={i} className={`text-xs flex items-center gap-2 py-1.5 px-3 rounded-xl ${entry.team1Won ? "bg-violet-500/10" : "bg-cyan-500/10"}`}>
                  <span className="text-white/30 w-12 shrink-0">{entry.pos1} vs {entry.pos2}</span>
                  <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                  <span className={`font-bold ${entry.team1Won ? "text-violet-300" : "text-cyan-300"}`}>{entry.winner}</span>
                  <span className="text-white/20 ml-auto">{entry.turns} turns · {entry.remainingHp} HP left</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Winner Banner */}
        {battleDone && (
          <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-6 text-center">
            <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              🏆 {result.winner === "team1" ? team1?.name : team2?.name} Wins!
            </div>
            <div className="text-sm text-white/40 mb-4">
              Final Score: <span className="text-violet-300 font-bold">{result.score1}</span> – <span className="text-cyan-300 font-bold">{result.score2}</span> matchups won
            </div>
            <button
              onClick={() => { setResult(null); setAnimStep(0); }}
              className="text-xs text-white/30 hover:text-white/60 underline"
            >
              Reset
            </button>
          </div>
        )}

      </div>
    </div>
  );
}