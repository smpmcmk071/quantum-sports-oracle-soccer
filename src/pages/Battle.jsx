import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Swords, Shield, Zap, Star, ChevronRight, RefreshCw } from "lucide-react";

const POSITION_MATCHUPS = {
  ST: ["CB", "GK"], CF: ["CB", "GK"], LW: ["RB", "CB"], RW: ["LB", "CB"],
  CAM: ["CDM", "CM"], CM: ["CM", "CDM"], CDM: ["CAM", "CM"],
  LB: ["RW", "LW"], RB: ["LW", "RW"], CB: ["ST", "CF"], GK: ["ST", "CF"],
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
  const fire = ["Aries","Leo","Sagittarius"];
  const earth = ["Taurus","Virgo","Capricorn"];
  const air = ["Gemini","Libra","Aquarius"];
  const water = ["Cancer","Scorpio","Pisces"];
  const groups = [fire, earth, air, water];
  const g1 = groups.findIndex(g => g.includes(z1));
  const g2 = groups.findIndex(g => g.includes(z2));
  if (g1 === g2) return 1.15;
  if ((g1 === 0 && g2 === 2) || (g1 === 2 && g2 === 0)) return 0.9;
  if ((g1 === 1 && g2 === 3) || (g1 === 3 && g2 === 1)) return 0.9;
  return 1.0;
}

function simulateBattle(p1, p2) {
  const s1 = calcBattleStats(p1);
  const s2 = calcBattleStats(p2);
  const compat = zodiacCompatibility(p1.zodiac_sign, p2.zodiac_sign);

  let hp1 = 100, hp2 = 100;
  const log = [];
  let turn = 0;

  while (hp1 > 0 && hp2 > 0 && turn < 20) {
    turn++;
    // P1 attacks P2
    const atk1 = (s1.attack / 100) * (0.8 + Math.random() * 0.4) * compat;
    const def2 = (s2.defense / 100) * (0.7 + Math.random() * 0.3);
    const dmg1 = Math.max(1, Math.round((atk1 - def2 * 0.5) * 15));
    hp2 = Math.max(0, hp2 - dmg1);
    log.push({ turn, attacker: p1.name, defender: p2.name, damage: dmg1, hp1: Math.round(hp1), hp2: Math.round(hp2) });
    if (hp2 <= 0) break;

    // P2 attacks P1
    const atk2 = (s2.attack / 100) * (0.8 + Math.random() * 0.4) / compat;
    const def1 = (s1.defense / 100) * (0.7 + Math.random() * 0.3);
    const dmg2 = Math.max(1, Math.round((atk2 - def1 * 0.5) * 15));
    hp1 = Math.max(0, hp1 - dmg2);
    log.push({ turn, attacker: p2.name, defender: p1.name, damage: dmg2, hp1: Math.round(hp1), hp2: Math.round(hp2) });
  }

  const winner = hp1 > hp2 ? p1 : p2;
  return { log, winner, finalHp1: Math.round(hp1), finalHp2: Math.round(hp2), stats1: s1, stats2: s2 };
}

function StatBar({ label, val1, val2, name1, name2 }) {
  const max = Math.max(val1, val2, 1);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-white/40 mb-1">
        <span className="font-bold text-white/70">{val1}</span>
        <span className="text-white/40">{label}</span>
        <span className="font-bold text-white/70">{val2}</span>
      </div>
      <div className="flex gap-1 h-2">
        <div className="flex-1 bg-white/5 rounded-l-full overflow-hidden flex justify-end">
          <div className="h-full bg-violet-500 rounded-l-full transition-all" style={{ width: `${(val1/max)*100}%` }} />
        </div>
        <div className="flex-1 bg-white/5 rounded-r-full overflow-hidden">
          <div className="h-full bg-cyan-500 rounded-r-full transition-all" style={{ width: `${(val2/max)*100}%` }} />
        </div>
      </div>
    </div>
  );
}

function PlayerCard({ player, color, hp, maxHp = 100 }) {
  const hpPct = Math.round((hp / maxHp) * 100);
  const hpColor = hpPct > 60 ? "bg-emerald-400" : hpPct > 30 ? "bg-amber-400" : "bg-rose-400";
  return (
    <div className={`bg-white/[0.03] border rounded-2xl p-4 ${color === "violet" ? "border-violet-500/30" : "border-cyan-500/30"}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold bg-gradient-to-br ${color === "violet" ? "from-violet-500 to-purple-700" : "from-cyan-500 to-blue-700"}`}>
          {player.position?.slice(0,2) || "?"}
        </div>
        <div>
          <div className="font-bold text-white text-sm">{player.name}</div>
          <div className="text-xs text-white/40">{player.position} · {player.zodiac_sign || "?"}</div>
        </div>
      </div>
      <div className="mb-1 flex justify-between text-xs">
        <span className="text-white/40">HP</span>
        <span className={`font-bold ${hpPct > 60 ? "text-emerald-400" : hpPct > 30 ? "text-amber-400" : "text-rose-400"}`}>{hp}</span>
      </div>
      <div className="w-full bg-white/10 rounded-full h-2 mb-2">
        <div className={`h-2 rounded-full transition-all duration-500 ${hpColor}`} style={{ width: `${hpPct}%` }} />
      </div>
      <div className="text-xs text-white/30">LP: {player.life_path_number || "?"} · Dest: {player.destiny_number || "?"}</div>
    </div>
  );
}

export default function Battle() {
  const [teams, setTeams] = useState([]);
  const [team1Id, setTeam1Id] = useState("");
  const [team2Id, setTeam2Id] = useState("");
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [player1Id, setPlayer1Id] = useState("");
  const [player2Id, setPlayer2Id] = useState("");
  const [result, setResult] = useState(null);
  const [animStep, setAnimStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  useState(() => {
    base44.entities.Team.list().then(t => { setTeams(t); setTeamsLoaded(true); });
  }, []);

  async function onTeam1Change(id) {
    setTeam1Id(id);
    setPlayer1Id("");
    setResult(null);
    if (id) {
      const p = await base44.entities.Player.filter({ team_id: id });
      setPlayers1(p);
    }
  }

  async function onTeam2Change(id) {
    setTeam2Id(id);
    setPlayer2Id("");
    setResult(null);
    if (id) {
      const p = await base44.entities.Player.filter({ team_id: id });
      setPlayers2(p);
    }
  }

  function startBattle() {
    const p1 = players1.find(p => p.id === player1Id);
    const p2 = players2.find(p => p.id === player2Id);
    if (!p1 || !p2) return;
    setLoading(true);
    setResult(null);
    setAnimStep(0);
    const res = simulateBattle(p1, p2);
    setResult(res);
    // Animate log steps
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setAnimStep(step);
      if (step >= res.log.length) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 300);
  }

  const p1 = players1.find(p => p.id === player1Id);
  const p2 = players2.find(p => p.id === player2Id);
  const selectCls = "w-full bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors";

  // Get current HP from animated log
  const currentLog = result ? result.log.slice(0, animStep) : [];
  const lastEntry = currentLog[currentLog.length - 1];
  const currentHp1 = lastEntry ? lastEntry.hp1 : 100;
  const currentHp2 = lastEntry ? lastEntry.hp2 : 100;
  const battleDone = result && animStep >= result.log.length;

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Player Battle Arena</h1>
            <p className="text-xs text-white/30">Numerology & stats-powered 1v1 player battles</p>
          </div>
        </div>

        {/* Team & Player Selection */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {/* Team 1 */}
          <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-violet-400" />
              <span className="text-sm font-semibold text-violet-300">Player 1</span>
            </div>
            <select className={selectCls + " mb-3"} value={team1Id} onChange={e => onTeam1Change(e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className={selectCls} value={player1Id} onChange={e => { setPlayer1Id(e.target.value); setResult(null); }} disabled={!team1Id}>
              <option value="">Select player…</option>
              {players1.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
            </select>
          </div>

          {/* VS */}
          <div className="bg-white/[0.03] border border-cyan-500/20 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-sm font-semibold text-cyan-300">Player 2</span>
            </div>
            <select className={selectCls + " mb-3"} value={team2Id} onChange={e => onTeam2Change(e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            <select className={selectCls} value={player2Id} onChange={e => { setPlayer2Id(e.target.value); setResult(null); }} disabled={!team2Id}>
              <option value="">Select player…</option>
              {players2.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
            </select>
          </div>
        </div>

        {/* Battle Button */}
        <div className="flex justify-center mb-8">
          <button
            onClick={startBattle}
            disabled={!player1Id || !player2Id || loading}
            className="px-8 py-3 bg-gradient-to-r from-violet-500 to-cyan-500 text-white font-bold rounded-2xl text-sm flex items-center gap-3 disabled:opacity-40 hover:from-violet-600 hover:to-cyan-600 transition-all shadow-lg shadow-violet-500/20"
          >
            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Swords className="w-5 h-5" />}
            {loading ? "Battle in progress…" : "⚡ Start Battle"}
          </button>
        </div>

        {/* Player Cards + Stats Comparison */}
        {p1 && p2 && (
          <div className="mb-6">
            <div className="grid sm:grid-cols-2 gap-4 mb-4">
              <PlayerCard player={p1} color="violet" hp={result ? currentHp1 : 100} />
              <PlayerCard player={p2} color="cyan" hp={result ? currentHp2 : 100} />
            </div>

            {/* Stats bars */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
              <div className="text-xs text-white/30 text-center mb-3 font-semibold uppercase tracking-wider">Battle Stats Comparison</div>
              {result ? (
                <>
                  <StatBar label="⚔ Attack" val1={result.stats1.attack} val2={result.stats2.attack} />
                  <StatBar label="🛡 Defense" val1={result.stats1.defense} val2={result.stats2.defense} />
                  <StatBar label="⚡ Speed" val1={result.stats1.speed} val2={result.stats2.speed} />
                  <StatBar label="💪 Stamina" val1={result.stats1.stamina} val2={result.stats2.stamina} />
                  <StatBar label="✨ Magic" val1={result.stats1.magic} val2={result.stats2.magic} />
                </>
              ) : (
                <p className="text-center text-white/20 text-sm py-4">Start a battle to see stats</p>
              )}
            </div>
          </div>
        )}

        {/* Battle Log */}
        {result && (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-6">
            <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">⚔ Battle Log</div>
            <div className="space-y-1 max-h-64 overflow-y-auto">
              {currentLog.map((entry, i) => {
                const isP1 = entry.attacker === p1.name;
                return (
                  <div key={i} className={`text-xs flex items-center gap-2 py-1 px-2 rounded-lg ${isP1 ? "bg-violet-500/5" : "bg-cyan-500/5"}`}>
                    <span className={`font-bold ${isP1 ? "text-violet-400" : "text-cyan-400"}`}>{entry.attacker}</span>
                    <ChevronRight className="w-3 h-3 text-white/20" />
                    <span className="text-white/50">deals</span>
                    <span className="font-bold text-amber-400">{entry.damage} dmg</span>
                    <span className="text-white/30">to {entry.defender}</span>
                    <span className="ml-auto text-white/20">HP: {isP1 ? entry.hp2 : entry.hp1}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Winner Banner */}
        {battleDone && (
          <div className="bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-violet-500/30 rounded-2xl p-6 text-center">
            <Star className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">
              🏆 {result.winner.name} Wins!
            </div>
            <div className="text-sm text-white/40 mb-3">
              {result.winner.zodiac_sign} · Life Path {result.winner.life_path_number} · {result.log.length} turns
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div>
                <span className="text-violet-400 font-bold">{result.finalHp1}</span>
                <span className="text-white/30 ml-1">HP left ({p1.name})</span>
              </div>
              <div>
                <span className="text-cyan-400 font-bold">{result.finalHp2}</span>
                <span className="text-white/30 ml-1">HP left ({p2.name})</span>
              </div>
            </div>
            <button onClick={() => { setResult(null); setAnimStep(0); }} className="mt-4 text-xs text-white/30 hover:text-white/60 underline">
              Reset
            </button>
          </div>
        )}

      </div>
    </div>
  );
}