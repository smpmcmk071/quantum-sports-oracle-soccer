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

// ── Cosmic Harmony Calculators ────────────────────────────────────────────
function calcVenueNumerology(venue) {
  if (!venue) return null;
  const map = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8 };
  let sum = venue.toLowerCase().split("").reduce((a,c) => a + (map[c] || 0), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = sum.toString().split("").map(Number).reduce((a,b) => a+b, 0);
  return sum;
}

function getDateZodiac(dateStr) {
  if (!dateStr) return null;
  const [,month,day] = dateStr.split("-").map(Number);
  const signs = [[1,20,"Capricorn"],[2,19,"Aquarius"],[3,20,"Pisces"],[4,20,"Aries"],[5,21,"Taurus"],[6,21,"Gemini"],[7,23,"Cancer"],[8,23,"Leo"],[9,23,"Virgo"],[10,23,"Libra"],[11,22,"Scorpio"],[12,22,"Sagittarius"],[12,31,"Capricorn"]];
  for (const [m,d,sign] of signs) { if (month < m || (month===m && day<d)) return sign; }
  return "Capricorn";
}

function getDateUniversalNumber(dateStr) {
  if (!dateStr) return null;
  const digits = dateStr.replace(/-/g,"").split("").map(Number);
  let sum = digits.reduce((a,b) => a+b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = sum.toString().split("").map(Number).reduce((a,b)=>a+b,0);
  return sum;
}

function calcJerseyHarmony(players) {
  if (!players.length) return null;
  const nums = players.map(p => p.jersey_number).filter(Boolean);
  if (!nums.length) return null;
  let sum = nums.reduce((a,b)=>a+b,0);
  while (sum > 9 && sum !== 11 && sum !== 22) sum = sum.toString().split("").map(Number).reduce((a,b)=>a+b,0);
  return sum;
}

function calcCosmicHarmony(team1Players, team2Players, venue, gameDate, homeCity) {
  const venueNum = calcVenueNumerology(venue);
  const cityNum = calcVenueNumerology(homeCity);
  const dateNum = getDateUniversalNumber(gameDate);
  const dateZodiac = getDateZodiac(gameDate);
  const jersey1 = calcJerseyHarmony(team1Players);
  const jersey2 = calcJerseyHarmony(team2Players);

  // Zodiac fire/earth/air/water groups
  const elements = { fire:["Aries","Leo","Sagittarius"], earth:["Taurus","Virgo","Capricorn"], air:["Gemini","Libra","Aquarius"], water:["Cancer","Scorpio","Pisces"] };
  const getElement = z => Object.entries(elements).find(([,signs]) => signs.includes(z))?.[0] || "unknown";
  const dateElement = getElement(dateZodiac);

  const allPlayers = [...team1Players, ...team2Players];
  const zodiacCounts = {};
  allPlayers.forEach(p => { if (p.zodiac_sign) { zodiacCounts[p.zodiac_sign] = (zodiacCounts[p.zodiac_sign]||0)+1; } });
  const dominantZodiac = Object.entries(zodiacCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
  const dominantElement = getElement(dominantZodiac);
  const elementHarmony = dominantElement === dateElement ? "Perfect" : ["fire","air"].includes(dominantElement) && ["fire","air"].includes(dateElement) ? "High" : ["earth","water"].includes(dominantElement) && ["earth","water"].includes(dateElement) ? "High" : "Neutral";

  // Numerology harmony: city (primary) + venue + date alignment
  const primaryNum = cityNum || venueNum;
  const numHarmony = primaryNum && dateNum ? (primaryNum === dateNum ? "Perfect" : Math.abs(primaryNum - dateNum) <= 2 ? "Strong" : "Moderate") : "Unknown";

  // Jersey harmony: if jersey sum matches date number
  const jerseyAlignment1 = jersey1 && dateNum ? jersey1 === dateNum ? "Aligned" : Math.abs(jersey1 - dateNum) <= 1 ? "Close" : "Off" : null;
  const jerseyAlignment2 = jersey2 && dateNum ? jersey2 === dateNum ? "Aligned" : Math.abs(jersey2 - dateNum) <= 1 ? "Close" : "Off" : null;

  // Overall score 0–100
  const score = Math.round(
    (elementHarmony === "Perfect" ? 35 : elementHarmony === "High" ? 25 : 15) +
    (numHarmony === "Perfect" ? 35 : numHarmony === "Strong" ? 25 : 15) +
    ((jerseyAlignment1 === "Aligned" ? 15 : jerseyAlignment1 === "Close" ? 10 : 5) +
     (jerseyAlignment2 === "Aligned" ? 15 : jerseyAlignment2 === "Close" ? 10 : 5)) / 2
  );

  return { venueNum, cityNum, dateNum, dateZodiac, dateElement, dominantZodiac, dominantElement, elementHarmony, numHarmony, jerseyAlignment1, jerseyAlignment2, jersey1, jersey2, score };
}

function CosmicHarmonyPanel({ team1Players, team2Players, venue, gameDate, team1, team2 }) {
  if (!team1Players.length || !team2Players.length || !gameDate) return null;
  const homeCity = team1?.city || "";
  const h = calcCosmicHarmony(team1Players, team2Players, venue, gameDate, homeCity);
  const scoreColor = h.score >= 70 ? "text-emerald-400" : h.score >= 50 ? "text-amber-400" : "text-rose-400";
  const scoreBg = h.score >= 70 ? "from-emerald-500/10 to-teal-500/10 border-emerald-500/20" : h.score >= 50 ? "from-amber-500/10 to-orange-500/10 border-amber-500/20" : "from-rose-500/10 to-pink-500/10 border-rose-500/20";
  return (
    <div className={`bg-gradient-to-r ${scoreBg} border rounded-2xl p-4 mb-6`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-bold text-white">Cosmic Harmony</span>
          {venue && <span className="text-xs text-white/30">· {venue}</span>}
        </div>
        <div className={`text-2xl font-bold ${scoreColor}`}>{h.score}<span className="text-sm text-white/30">/100</span></div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-white/[0.04] rounded-xl p-2.5">
          <div className="text-white/30 mb-1">Match Date</div>
          <div className="text-white font-semibold">{h.dateZodiac}</div>
          <div className="text-white/40">{h.dateElement} · #{h.dateNum}</div>
        </div>
        <div className="bg-white/[0.04] rounded-xl p-2.5">
          <div className="text-white/30 mb-1">City / Venue</div>
          {h.cityNum && <div className="text-white font-semibold">City #{h.cityNum} {h.venueNum ? <span className="text-white/40 text-[10px]">· Venue #{h.venueNum}</span> : null}</div>}
          {!h.cityNum && h.venueNum && <div className="text-white font-semibold">Venue #{h.venueNum}</div>}
          <div className={`${h.numHarmony === "Perfect" ? "text-emerald-400" : h.numHarmony === "Strong" ? "text-amber-400" : "text-white/40"}`}>{h.numHarmony} alignment</div>
        </div>
        <div className="bg-white/[0.04] rounded-xl p-2.5">
          <div className="text-white/30 mb-1">Element Harmony</div>
          <div className="text-white font-semibold">{h.dominantElement} field</div>
          <div className={`${h.elementHarmony === "Perfect" ? "text-emerald-400" : h.elementHarmony === "High" ? "text-amber-400" : "text-white/40"}`}>{h.elementHarmony}</div>
        </div>
        <div className="bg-white/[0.04] rounded-xl p-2.5">
          <div className="text-white/30 mb-1">Jersey Sums</div>
          <div className="text-white font-semibold">#{h.jersey1} · #{h.jersey2}</div>
          <div className="text-white/40">{h.jerseyAlignment1} / {h.jerseyAlignment2}</div>
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
  const [matchVenue, setMatchVenue] = useState("");
  const [matchDate, setMatchDate] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const homeId = params.get("homeTeamId");
    const awayId = params.get("awayTeamId");
    const venue = params.get("venue") || "";
    const date = params.get("gameDate") || "";
    setMatchVenue(venue);
    setMatchDate(date);
    base44.entities.Team.list().then(t => {
      setTeams(t);
      if (homeId) loadTeamPlayers(1, homeId, setTeam1Players, setTeam1Id);
      if (awayId) loadTeamPlayers(2, awayId, setTeam2Players, setTeam2Id);
    });
  }, []);

  async function loadTeamPlayers(num, id, setPlayers, setId) {
    setId(id);
    setLoadingPlayers(true);
    const players = await base44.entities.Player.filter({ team_id: id, is_starter: true });
    const list = players.length > 0 ? players : await base44.entities.Player.filter({ team_id: id });
    setPlayers(list.slice(0, 11));
    setLoadingPlayers(false);
  }

  async function onTeamChange(teamNum, id) {
    setResult(null);
    if (teamNum === 1) { setTeam1Id(id); setTeam1Players([]); }
    else { setTeam2Id(id); setTeam2Players([]); }
    if (!id) return;
    setLoadingPlayers(true);
    const players = await base44.entities.Player.filter({ team_id: id, is_starter: true });
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
        <div className="flex items-center gap-3 mb-4">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Swords className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Team Battle Arena</h1>
            <p className="text-xs text-white/30">Starting XI vs Starting XI — numerology & stats-powered matchups</p>
          </div>
        </div>

        {/* Match Context Banner */}
        {(matchVenue || matchDate) && (
          <div className="bg-white/[0.03] border border-violet-500/20 rounded-2xl px-4 py-3 mb-6 flex flex-wrap items-center gap-4">
            {matchDate && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/30">📅 Date:</span>
                <span className="text-white font-semibold">{matchDate}</span>
                <span className="text-violet-300 text-xs">({getDateZodiac(matchDate)} · Universal #{getDateUniversalNumber(matchDate)})</span>
              </div>
            )}
            {matchVenue && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/30">🏟 Venue:</span>
                <span className="text-white font-semibold">{matchVenue}</span>
                <span className="text-cyan-300 text-xs">(Numerology #{calcVenueNumerology(matchVenue)})</span>
              </div>
            )}
          </div>
        )}

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

        {/* Cosmic Harmony */}
        <CosmicHarmonyPanel
          team1Players={team1Players}
          team2Players={team2Players}
          venue={matchVenue}
          gameDate={matchDate}
          team1={team1}
          team2={team2}
        />

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
          <div className="flex flex-col items-center mb-6">
            <div className="text-[10px] uppercase tracking-widest text-white/25 mb-2">Player Matchups Won</div>
            <div className="flex justify-center gap-8">
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
            <div className="text-[10px] text-white/20 mt-1">out of {result.log.length} player duels · not a goal score</div>
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

        {/* ── Player Prop Duel ── */}
        <PropDuel team1Id={team1Id} team2Id={team2Id} team1={team1} team2={team2} />

      </div>
    </div>
  );
}

// ── Player Prop Duel Component ─────────────────────────────────────────────
function PropDuel({ team1Id, team2Id, team1, team2 }) {
  const [players1, setPlayers1] = useState([]);
  const [players2, setPlayers2] = useState([]);
  const [p1Id, setP1Id] = useState("");
  const [p2Id, setP2Id] = useState("");
  const [duelResult, setDuelResult] = useState(null);
  const [duelAnimStep, setDuelAnimStep] = useState(0);
  const [duelRunning, setDuelRunning] = useState(false);
  const [duelLog, setDuelLog] = useState([]);

  useEffect(() => {
    setP1Id(""); setDuelResult(null); setDuelLog([]);
    if (team1Id) base44.entities.Player.filter({ team_id: team1Id }).then(setPlayers1);
    else setPlayers1([]);
  }, [team1Id]);

  useEffect(() => {
    setP2Id(""); setDuelResult(null); setDuelLog([]);
    if (team2Id) base44.entities.Player.filter({ team_id: team2Id }).then(setPlayers2);
    else setPlayers2([]);
  }, [team2Id]);

  function runPropDuel() {
    const p1 = players1.find(p => p.id === p1Id);
    const p2 = players2.find(p => p.id === p2Id);
    if (!p1 || !p2) return;
    setDuelRunning(true);
    setDuelResult(null);
    setDuelAnimStep(0);

    const s1 = calcBattleStats(p1);
    const s2 = calcBattleStats(p2);
    const compat = zodiacCompatibility(p1.zodiac_sign, p2.zodiac_sign);
    let hp1 = 100, hp2 = 100;
    const log = [];
    let turn = 0;
    while (hp1 > 0 && hp2 > 0 && turn < 20) {
      turn++;
      const dmg1 = Math.max(1, Math.round(((s1.attack / 100) * (0.8 + Math.random() * 0.4) * compat - (s2.defense / 100) * 0.5) * 15));
      hp2 = Math.max(0, hp2 - dmg1);
      log.push({ turn, attacker: p1.name, defender: p2.name, damage: dmg1, hp1: Math.round(hp1), hp2: Math.round(hp2), side: "p1" });
      if (hp2 <= 0) break;
      const dmg2 = Math.max(1, Math.round(((s2.attack / 100) * (0.8 + Math.random() * 0.4) / compat - (s1.defense / 100) * 0.5) * 15));
      hp1 = Math.max(0, hp1 - dmg2);
      log.push({ turn, attacker: p2.name, defender: p1.name, damage: dmg2, hp1: Math.round(hp1), hp2: Math.round(hp2), side: "p2" });
    }
    const winner = hp1 >= hp2 ? p1 : p2;
    const res = { winner, stats1: s1, stats2: s2, finalHp1: Math.round(hp1), finalHp2: Math.round(hp2), log, p1, p2 };
    setDuelLog(log);
    setDuelResult(res);
    let step = 0;
    const iv = setInterval(() => {
      step++;
      setDuelAnimStep(step);
      if (step >= log.length) { clearInterval(iv); setDuelRunning(false); }
    }, 280);
  }

  const p1 = players1.find(p => p.id === p1Id);
  const p2 = players2.find(p => p.id === p2Id);
  const selectCls = "w-full bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-colors";
  const visibleLog = duelLog.slice(0, duelAnimStep);
  const duelDone = duelResult && duelAnimStep >= duelLog.length;
  const lastEntry = visibleLog[visibleLog.length - 1];
  const curHp1 = lastEntry ? lastEntry.hp1 : 100;
  const curHp2 = lastEntry ? lastEntry.hp2 : 100;

  return (
    <div className="mt-10 border-t border-white/[0.06] pt-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
          <Star className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-base font-bold">Player Prop Duel</h2>
          <p className="text-xs text-white/30">1v1 — GK saves, top scorers, key matchups for prop bets</p>
        </div>
      </div>

      {(!team1Id || !team2Id) && (
        <p className="text-xs text-white/30 italic mb-4">Select both teams above to enable player prop duels.</p>
      )}

      {/* Player Selectors */}
      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div className="bg-white/[0.03] border border-amber-500/20 rounded-2xl p-4">
          <div className="text-xs text-amber-300 font-semibold mb-2">{team1?.name || "Team 1"} Player</div>
          <select className={selectCls} value={p1Id} onChange={e => { setP1Id(e.target.value); setDuelResult(null); setDuelLog([]); }} disabled={!team1Id}>
            <option value="">Select player…</option>
            {players1.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
          </select>
          {p1 && (
            <div className="mt-3 text-xs text-white/40 space-y-0.5">
              <div>Zodiac: <span className="text-white/60">{p1.zodiac_sign || "?"}</span> · LP: <span className="text-white/60">{p1.life_path_number || "?"}</span></div>
              <div>Goals: <span className="text-amber-400 font-bold">{p1.goals || 0}</span> · Assists: <span className="text-amber-400 font-bold">{p1.assists || 0}</span></div>
              {p1.position === "GK" && <div>Saves/g: <span className="text-cyan-400 font-bold">{p1.saves_per_game || 0}</span></div>}
              <div className="mt-2 flex justify-between">
                {Object.entries(calcBattleStats(p1)).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="text-white font-bold">{v}</div>
                    <div className="text-white/20 capitalize">{k.slice(0,3)}</div>
                  </div>
                ))}
              </div>
              {/* HP bar */}
              {duelResult && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1"><span className="text-white/30">HP</span><span className="font-bold text-amber-400">{curHp1}</span></div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${curHp1 > 60 ? "bg-emerald-400" : curHp1 > 30 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${curHp1}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="bg-white/[0.03] border border-orange-500/20 rounded-2xl p-4">
          <div className="text-xs text-orange-300 font-semibold mb-2">{team2?.name || "Team 2"} Player</div>
          <select className={selectCls} value={p2Id} onChange={e => { setP2Id(e.target.value); setDuelResult(null); setDuelLog([]); }} disabled={!team2Id}>
            <option value="">Select player…</option>
            {players2.map(p => <option key={p.id} value={p.id}>{p.name} ({p.position})</option>)}
          </select>
          {p2 && (
            <div className="mt-3 text-xs text-white/40 space-y-0.5">
              <div>Zodiac: <span className="text-white/60">{p2.zodiac_sign || "?"}</span> · LP: <span className="text-white/60">{p2.life_path_number || "?"}</span></div>
              <div>Goals: <span className="text-orange-400 font-bold">{p2.goals || 0}</span> · Assists: <span className="text-orange-400 font-bold">{p2.assists || 0}</span></div>
              {p2.position === "GK" && <div>Saves/g: <span className="text-cyan-400 font-bold">{p2.saves_per_game || 0}</span></div>}
              <div className="mt-2 flex justify-between">
                {Object.entries(calcBattleStats(p2)).map(([k, v]) => (
                  <div key={k} className="text-center">
                    <div className="text-white font-bold">{v}</div>
                    <div className="text-white/20 capitalize">{k.slice(0,3)}</div>
                  </div>
                ))}
              </div>
              {duelResult && (
                <div className="mt-2">
                  <div className="flex justify-between text-xs mb-1"><span className="text-white/30">HP</span><span className="font-bold text-orange-400">{curHp2}</span></div>
                  <div className="w-full bg-white/10 rounded-full h-1.5">
                    <div className={`h-1.5 rounded-full transition-all duration-500 ${curHp2 > 60 ? "bg-emerald-400" : curHp2 > 30 ? "bg-amber-400" : "bg-rose-400"}`} style={{ width: `${curHp2}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Duel Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={runPropDuel}
          disabled={!p1Id || !p2Id || duelRunning}
          className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold rounded-2xl text-sm flex items-center gap-2 disabled:opacity-40 hover:from-amber-600 hover:to-orange-600 transition-all shadow-lg shadow-amber-500/20"
        >
          {duelRunning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Swords className="w-4 h-4" />}
          {duelRunning ? "Dueling…" : "⚡ Start Prop Duel"}
        </button>
      </div>

      {/* Duel Log */}
      {visibleLog.length > 0 && (
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 mb-5">
          <div className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">⚔ Duel Log</div>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {visibleLog.map((entry, i) => (
              <div key={i} className={`text-xs flex items-center gap-2 py-1 px-2 rounded-lg ${entry.side === "p1" ? "bg-amber-500/5" : "bg-orange-500/5"}`}>
                <span className={`font-bold ${entry.side === "p1" ? "text-amber-400" : "text-orange-400"}`}>{entry.attacker}</span>
                <ChevronRight className="w-3 h-3 text-white/20" />
                <span className="text-white/40">deals</span>
                <span className="font-bold text-white">{entry.damage} dmg</span>
                <span className="text-white/30 ml-auto">HP left: {entry.side === "p1" ? entry.hp2 : entry.hp1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Duel Winner */}
      {duelDone && (
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 text-center">
          <Star className="w-7 h-7 text-amber-400 mx-auto mb-2" />
          <div className="text-xl font-bold text-white mb-1">🏆 {duelResult.winner.name} Wins!</div>
          <div className="text-xs text-white/40 mb-2">
            {duelResult.winner.zodiac_sign} · Life Path {duelResult.winner.life_path_number} · {duelLog.length} turns
          </div>
          <div className="flex justify-center gap-6 text-sm mb-3">
            <div><span className="text-amber-400 font-bold">{duelResult.finalHp1}</span><span className="text-white/30 ml-1">HP ({p1?.name})</span></div>
            <div><span className="text-orange-400 font-bold">{duelResult.finalHp2}</span><span className="text-white/30 ml-1">HP ({p2?.name})</span></div>
          </div>
          <div className="text-xs text-white/30 bg-white/5 rounded-xl px-4 py-2 inline-block">
            💡 Prop insight: <span className="text-white/60">{duelResult.winner.name} numerologically favored — consider betting on their performance props</span>
          </div>
          <div className="mt-3">
            <button onClick={() => { setDuelResult(null); setDuelLog([]); setDuelAnimStep(0); }} className="text-xs text-white/30 hover:text-white/60 underline">Reset Duel</button>
          </div>
        </div>
      )}
    </div>
  );
}