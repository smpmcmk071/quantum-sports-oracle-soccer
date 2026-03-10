import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Users, Calendar, BarChart2, RefreshCw, CheckCircle, AlertCircle, Database, Trash2, ChevronDown, ChevronUp } from "lucide-react";

// ─── MLS Seed Data ───────────────────────────────────────────────────────────

const MLS_TEAMS = [
  { name: "Inter Miami CF", abbreviation: "MIA", city: "Miami", conference: "Eastern", espn_id: "18484", primary_color: "#F7B5CD", founded_date: "2018-01-29", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/18484.png" },
  { name: "LAFC", abbreviation: "LAFC", city: "Los Angeles", conference: "Western", espn_id: "16629", primary_color: "#000000", founded_date: "2014-10-29", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/16629.png" },
  { name: "LA Galaxy", abbreviation: "LA", city: "Los Angeles", conference: "Western", espn_id: "189", primary_color: "#002F6C", founded_date: "1996-06-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/189.png" },
  { name: "Seattle Sounders FC", abbreviation: "SEA", city: "Seattle", conference: "Western", espn_id: "9726", primary_color: "#5D9741", founded_date: "2007-11-02", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/9726.png" },
  { name: "Atlanta United FC", abbreviation: "ATL", city: "Atlanta", conference: "Eastern", espn_id: "15292", primary_color: "#80000A", founded_date: "2014-04-22", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/15292.png" },
  { name: "New York Red Bulls", abbreviation: "NYRB", city: "New York", conference: "Eastern", espn_id: "197", primary_color: "#ED1E36", founded_date: "1996-06-16", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/197.png" },
  { name: "Portland Timbers", abbreviation: "POR", city: "Portland", conference: "Western", espn_id: "10252", primary_color: "#004812", founded_date: "2009-07-21", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/10252.png" },
  { name: "Austin FC", abbreviation: "ATX", city: "Austin", conference: "Western", espn_id: "21740", primary_color: "#00B140", founded_date: "2018-01-15", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/21740.png" },
  { name: "FC Dallas", abbreviation: "DAL", city: "Dallas", conference: "Western", espn_id: "196", primary_color: "#BF0D3E", founded_date: "1996-06-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/196.png" },
  { name: "Columbus Crew", abbreviation: "CLB", city: "Columbus", conference: "Eastern", espn_id: "193", primary_color: "#FEDD00", founded_date: "1996-06-15", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/193.png" },
  { name: "New England Revolution", abbreviation: "NE", city: "Boston", conference: "Eastern", espn_id: "202", primary_color: "#003087", founded_date: "1996-06-16", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/202.png" },
  { name: "Chicago Fire FC", abbreviation: "CHI", city: "Chicago", conference: "Eastern", espn_id: "194", primary_color: "#9A1B32", founded_date: "1997-10-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/194.png" },
  { name: "Minnesota United FC", abbreviation: "MIN", city: "Minneapolis", conference: "Western", espn_id: "15297", primary_color: "#8CD2F4", founded_date: "2015-03-25", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/15297.png" },
  { name: "Colorado Rapids", abbreviation: "COL", city: "Denver", conference: "Western", espn_id: "192", primary_color: "#862633", founded_date: "1996-06-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/192.png" },
  { name: "Real Salt Lake", abbreviation: "RSL", city: "Salt Lake City", conference: "Western", espn_id: "7006", primary_color: "#B30838", founded_date: "2004-08-26", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/7006.png" },
  { name: "Sporting Kansas City", abbreviation: "SKC", city: "Kansas City", conference: "Western", espn_id: "195", primary_color: "#002F6C", founded_date: "1996-06-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/195.png" },
  { name: "Vancouver Whitecaps FC", abbreviation: "VAN", city: "Vancouver", conference: "Western", espn_id: "10253", primary_color: "#00245D", founded_date: "2009-03-18", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/10253.png" },
  { name: "Toronto FC", abbreviation: "TOR", city: "Toronto", conference: "Eastern", espn_id: "9179", primary_color: "#B81137", founded_date: "2006-05-19", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/9179.png" },
  { name: "CF Montréal", abbreviation: "MTL", city: "Montréal", conference: "Eastern", espn_id: "1250", primary_color: "#003DA5", founded_date: "1993-05-16", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/1250.png" },
  { name: "Orlando City SC", abbreviation: "ORL", city: "Orlando", conference: "Eastern", espn_id: "14880", primary_color: "#633492", founded_date: "2011-11-19", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/14880.png" },
  { name: "Philadelphia Union", abbreviation: "PHI", city: "Philadelphia", conference: "Eastern", espn_id: "10254", primary_color: "#071B2C", founded_date: "2008-03-28", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/10254.png" },
  { name: "DC United", abbreviation: "DC", city: "Washington", conference: "Eastern", espn_id: "1326", primary_color: "#000000", founded_date: "1996-06-15", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/1326.png" },
  { name: "Houston Dynamo FC", abbreviation: "HOU", city: "Houston", conference: "Western", espn_id: "7084", primary_color: "#FF6B00", founded_date: "2005-11-03", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/7084.png" },
  { name: "FC Cincinnati", abbreviation: "CIN", city: "Cincinnati", conference: "Eastern", espn_id: "16827", primary_color: "#003087", founded_date: "2016-02-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/16827.png" },
  { name: "Nashville SC", abbreviation: "NSH", city: "Nashville", conference: "Eastern", espn_id: "20340", primary_color: "#ECE83A", founded_date: "2019-02-20", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/20340.png" },
  { name: "San Jose Earthquakes", abbreviation: "SJ", city: "San Jose", conference: "Western", espn_id: "191", primary_color: "#0D4C8B", founded_date: "1996-06-08", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/191.png" },
  { name: "New York City FC", abbreviation: "NYCFC", city: "New York", conference: "Eastern", espn_id: "14880", primary_color: "#6CACE4", founded_date: "2013-05-21", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/14880.png" },
  { name: "St. Louis City SC", abbreviation: "STL", city: "St. Louis", conference: "Western", espn_id: "23033", primary_color: "#C8102E", founded_date: "2019-08-20", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/23033.png" },
  { name: "Charlotte FC", abbreviation: "CLT", city: "Charlotte", conference: "Eastern", espn_id: "21694", primary_color: "#1A85C8", founded_date: "2019-12-17", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/21694.png" },
  { name: "San Diego FC", abbreviation: "SD", city: "San Diego", conference: "Western", espn_id: "23839", primary_color: "#CC0000", founded_date: "2023-09-01", logo_url: "https://a.espncdn.com/i/teamlogos/soccer/500/23839.png" },
];

// ─── Helper ──────────────────────────────────────────────────────────────────

function calcLifePath(dateStr) {
  if (!dateStr) return null;
  const digits = dateStr.replace(/-/g, "").split("").map(Number);
  let sum = digits.reduce((a, b) => a + b, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function calcDestiny(name) {
  const map = { a:1,b:2,c:3,d:4,e:5,f:6,g:7,h:8,i:9,j:1,k:2,l:3,m:4,n:5,o:6,p:7,q:8,r:9,s:1,t:2,u:3,v:4,w:5,x:6,y:7,z:8 };
  let sum = name.toLowerCase().split("").reduce((a, c) => a + (map[c] || 0), 0);
  while (sum > 9 && sum !== 11 && sum !== 22) {
    sum = sum.toString().split("").map(Number).reduce((a, b) => a + b, 0);
  }
  return sum;
}

function getZodiac(dateStr) {
  if (!dateStr) return null;
  const [, month, day] = dateStr.split("-").map(Number);
  const signs = [
    [1,20,"Capricorn"],[2,19,"Aquarius"],[3,20,"Pisces"],[4,20,"Aries"],
    [5,21,"Taurus"],[6,21,"Gemini"],[7,23,"Cancer"],[8,23,"Leo"],
    [9,23,"Virgo"],[10,23,"Libra"],[11,22,"Scorpio"],[12,22,"Sagittarius"],[12,31,"Capricorn"]
  ];
  for (const [m, d, sign] of signs) {
    if (month < m || (month === m && day < d)) return sign;
  }
  return "Capricorn";
}

function getChineseZodiac(dateStr) {
  if (!dateStr) return null;
  const year = parseInt(dateStr.split("-")[0]);
  const animals = ["Rat","Ox","Tiger","Rabbit","Dragon","Snake","Horse","Goat","Monkey","Rooster","Dog","Pig"];
  return animals[(year - 1900) % 12];
}

// ─── Section Component ────────────────────────────────────────────────────────

function Section({ title, icon: Icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/[0.02] transition-all"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-violet-400" />
          <span className="font-semibold text-white">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {open && <div className="px-6 pb-6 pt-2 border-t border-white/[0.04]">{children}</div>}
    </div>
  );
}

function StatusBadge({ status, message }) {
  if (!status) return null;
  const isOk = status === "success";
  return (
    <div className={`flex items-center gap-2 mt-3 px-3 py-2 rounded-xl text-sm ${isOk ? "bg-emerald-400/10 text-emerald-400" : "bg-rose-400/10 text-rose-400"}`}>
      {isOk ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
      {message}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Admin() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Teams
  const [teamsStatus, setTeamsStatus] = useState(null);
  const [teamsMsg, setTeamsMsg] = useState("");
  const [teamsLoading, setTeamsLoading] = useState(false);

  // Players (manual form)
  const [playerForm, setPlayerForm] = useState({ name: "", team_id: "", position: "ST", birth_date: "", nationality: "", jersey_number: "", is_starter: false });
  const [teams, setTeams] = useState([]);
  const [playerStatus, setPlayerStatus] = useState(null);
  const [playerMsg, setPlayerMsg] = useState("");

  // Games (manual form)
  const [gameForm, setGameForm] = useState({ home_team_id: "", away_team_id: "", game_date: "", game_time: "", venue: "", matchday: "", season: 2026 });
  const [gameStatus, setGameStatus] = useState(null);
  const [gameMsg, setGameMsg] = useState("");

  // Fetch from ESPN
  const [fetchStatus, setFetchStatus] = useState(null);
  const [fetchMsg, setFetchMsg] = useState("");
  const [fetchLoading, setFetchLoading] = useState(false);

  // Sync scores
  const [syncStatus, setSyncStatus] = useState(null);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);

  // Clear data
  const [clearStatus, setClearStatus] = useState(null);
  const [clearMsg, setClearMsg] = useState("");

  // Roster loader
  const [rosterTeamId, setRosterTeamId] = useState("");
  const [rosterStatus, setRosterStatus] = useState(null);
  const [rosterMsg, setRosterMsg] = useState("");
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterProgress, setRosterProgress] = useState("");

  // Player stats loader
  const [playerStatsTeamId, setPlayerStatsTeamId] = useState("");
  const [playerStatsStatus, setPlayerStatsStatus] = useState(null);
  const [playerStatsMsg, setPlayerStatsMsg] = useState("");
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [playerStatsProgress, setPlayerStatsProgress] = useState("");

  // Team stats
  const [statsTeamId, setStatsTeamId] = useState("");
  const [statsForm, setStatsForm] = useState({ wins: 0, losses: 0, draws: 0, goals_for: 0, goals_against: 0, goal_differential: 0 });
  const [statsStatus, setStatsStatus] = useState(null);
  const [statsMsg, setStatsMsg] = useState("");
  const [initStatsLoading, setInitStatsLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setAuthChecked(true);
      if (u) {
        base44.entities.Team.list().then(setTeams);
      }
    }).catch(() => setAuthChecked(true));
  }, []);

  if (!authChecked) return <div className="min-h-screen bg-[#080b14] flex items-center justify-center"><div className="w-6 h-6 border-2 border-violet-400 border-t-transparent rounded-full animate-spin" /></div>;
  if (!user || user.role !== "admin") return (
    <div className="min-h-screen bg-[#080b14] flex items-center justify-center text-white">
      <div className="text-center">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Admin Access Required</h2>
        <p className="text-white/40 text-sm">You need admin privileges to view this page.</p>
      </div>
    </div>
  );

  // ── Actions ────────────────────────────────────────────────────────────────

  async function loadAllMLSTeams() {
    setTeamsLoading(true);
    setTeamsStatus(null);
    try {
      const existing = await base44.entities.Team.list();
      const existingNames = new Set(existing.map(t => t.name));
      const toCreate = MLS_TEAMS.filter(t => !existingNames.has(t.name)).map(t => ({
        ...t,
        league: "MLS",
        life_path_number: calcLifePath(t.founded_date),
        destiny_number: calcDestiny(t.name),
        zodiac_sign: getZodiac(t.founded_date),
        chinese_zodiac: getChineseZodiac(t.founded_date),
        city_numerology: calcDestiny(t.city),
      }));

      if (toCreate.length === 0) {
        setTeamsStatus("success");
        setTeamsMsg(`All ${MLS_TEAMS.length} MLS teams already loaded.`);
      } else {
        await base44.entities.Team.bulkCreate(toCreate);
        setTeamsStatus("success");
        setTeamsMsg(`✓ Loaded ${toCreate.length} MLS teams (${existing.length} already existed).`);
      }
      base44.entities.Team.list().then(setTeams);
    } catch (e) {
      setTeamsStatus("error");
      setTeamsMsg("Failed to load teams: " + e.message);
    }
    setTeamsLoading(false);
  }

  async function addPlayer() {
    if (!playerForm.name || !playerForm.birth_date || !playerForm.team_id) {
      setPlayerStatus("error");
      setPlayerMsg("Name, Birth Date and Team are required.");
      return;
    }
    const payload = {
      ...playerForm,
      jersey_number: playerForm.jersey_number ? Number(playerForm.jersey_number) : undefined,
      league: "MLS",
      life_path_number: calcLifePath(playerForm.birth_date),
      destiny_number: calcDestiny(playerForm.name),
      zodiac_sign: getZodiac(playerForm.birth_date),
      chinese_zodiac: getChineseZodiac(playerForm.birth_date),
    };
    await base44.entities.Player.create(payload);
    setPlayerStatus("success");
    setPlayerMsg(`✓ Player "${playerForm.name}" added.`);
    setPlayerForm({ name: "", team_id: "", position: "ST", birth_date: "", nationality: "", jersey_number: "", is_starter: false });
  }

  async function addGame() {
    if (!gameForm.home_team_id || !gameForm.away_team_id || !gameForm.game_date) {
      setGameStatus("error");
      setGameMsg("Home team, Away team, and Date are required.");
      return;
    }
    await base44.entities.Game.create({ ...gameForm, league: "MLS", status: "scheduled", season: Number(gameForm.season) || 2026, matchday: Number(gameForm.matchday) || undefined });
    setGameStatus("success");
    setGameMsg("✓ Match added.");
    setGameForm({ home_team_id: "", away_team_id: "", game_date: "", game_time: "", venue: "", matchday: "", season: 2026 });
  }

  async function syncScoresFromESPN() {
    setSyncLoading(true);
    setSyncStatus(null);
    try {
      const res = await base44.functions.invoke("fetchMLSData", { type: "scores", season: 2026 });
      const d = res?.data;
      setSyncStatus("success");
      setSyncMsg(`✓ Games updated: ${d?.games_updated || 0}, new: ${d?.games_created || 0}. Team standings recalculated for ${d?.team_stats_updated || 0} teams.`);
    } catch (e) {
      setSyncStatus("error");
      setSyncMsg("Sync failed: " + (e?.response?.data?.error || e.message));
    }
    setSyncLoading(false);
  }

  async function fetchMLSSchedule() {
    setFetchLoading(true);
    setFetchStatus(null);
    try {
      const res = await base44.functions.invoke("fetchMLSData", { type: "schedule", season: 2026 });
      const count = res?.data?.created || 0;
      setFetchStatus("success");
      setFetchMsg(`✓ Fetched & saved ${count} upcoming MLS matches from ESPN.`);
    } catch (e) {
      setFetchStatus("error");
      setFetchMsg("ESPN fetch failed: " + (e?.response?.data?.error || e.message));
    }
    setFetchLoading(false);
  }

  async function loadFullRoster() {
    setRosterLoading(true);
    setRosterStatus(null);
    setRosterProgress("Asking AI…");
    const team = teams.find(t => t.id === rosterTeamId);
    if (!team) return;
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `Generate the current 2026 MLS season roster for ${team.name} (MLS team from ${team.city}). 
Include 22-25 players with realistic names, positions, birth dates, nationalities, and jersey numbers.
Include a mix of GK (2), CB (3-4), LB (2), RB (2), CDM (2), CM (2-3), CAM (1-2), LW (1-2), RW (1-2), ST (2-3), CF (1).
Mark the top 11 starters as is_starter: true.`,
        response_json_schema: {
          type: "object",
          properties: {
            players: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  position: { type: "string" },
                  birth_date: { type: "string", description: "YYYY-MM-DD" },
                  nationality: { type: "string" },
                  jersey_number: { type: "number" },
                  is_starter: { type: "boolean" },
                }
              }
            }
          }
        }
      });

      const players = result.players || [];
      setRosterProgress(`Saving ${players.length} players…`);

      const toCreate = players.map(p => ({
        name: p.name,
        team_id: rosterTeamId,
        position: p.position,
        birth_date: p.birth_date,
        nationality: p.nationality,
        jersey_number: p.jersey_number,
        is_starter: p.is_starter || false,
        league: "MLS",
        life_path_number: calcLifePath(p.birth_date),
        destiny_number: calcDestiny(p.name),
        zodiac_sign: getZodiac(p.birth_date),
        chinese_zodiac: getChineseZodiac(p.birth_date),
      }));

      await base44.entities.Player.bulkCreate(toCreate);
      setRosterStatus("success");
      setRosterMsg(`✓ Loaded ${toCreate.length} players for ${team.name}.`);
      setRosterTeamId("");
    } catch (e) {
      setRosterStatus("error");
      setRosterMsg("Failed: " + e.message);
    }
    setRosterLoading(false);
    setRosterProgress("");
  }

  async function loadPlayerStats() {
    setPlayerStatsLoading(true);
    setPlayerStatsStatus(null);
    setPlayerStatsProgress("");
    
    try {
      const teamsToProcess = playerStatsTeamId === "all" ? teams : [teams.find(t => t.id === playerStatsTeamId)];
      const validTeams = teamsToProcess.filter(Boolean);
      
      if (validTeams.length === 0) {
        setPlayerStatsStatus("error");
        setPlayerStatsMsg("No teams selected.");
        setPlayerStatsLoading(false);
        return;
      }

      let totalStatsCreated = 0;
      const BATCH_SIZE = 5; // Players per LLM request
      const DELAY_BETWEEN_TEAMS = 3000; // 3 second delay between teams
      const DELAY_BETWEEN_BATCHES = 1500; // 1.5 second delay between batches

      for (let i = 0; i < validTeams.length; i++) {
        const team = validTeams[i];
        
        // Delay before next team (except first)
        if (i > 0) {
          setPlayerStatsProgress(`Team ${i}/${validTeams.length}: Waiting before ${team.name}…`);
          await new Promise(r => setTimeout(r, DELAY_BETWEEN_TEAMS));
        }

        setPlayerStatsProgress(`Team ${i + 1}/${validTeams.length}: Loading ${team.name}…`);
        const players = await base44.entities.Player.filter({ team_id: team.id });
        
        if (players.length === 0) {
          setPlayerStatsProgress(`Team ${i + 1}/${validTeams.length}: ${team.name} has no players, skipping…`);
          continue;
        }

        // Process players in batches
        for (let j = 0; j < players.length; j += BATCH_SIZE) {
          const batch = players.slice(j, j + BATCH_SIZE);
          const batchNum = Math.floor(j / BATCH_SIZE) + 1;
          const totalBatches = Math.ceil(players.length / BATCH_SIZE);
          
          setPlayerStatsProgress(`Team ${i + 1}/${validTeams.length}: ${team.name} - Batch ${batchNum}/${totalBatches}…`);
          
          const playerList = batch.map(p => ({ id: p.id, name: p.name, position: p.position }));
          const playerNameMap = batch.reduce((acc, p) => { acc[p.name.toLowerCase()] = p.id; return acc; }, {});

          const result = await base44.integrations.Core.InvokeLLM({
            prompt: `Generate realistic 2026 MLS season stats (through ~matchday 5) for these ${team.name} players:
${playerList.map(p => `${p.name} (${p.position})`).join(", ")}

For each player provide: name, goals, assists, appearances (0-5), starts, minutes_played, shots_per_game, pass_accuracy (0-100), tackles_per_game, yellow_cards (0-2), rating (6.0-8.5).
For GK only: clean_sheets, saves_per_game.
Keep realistic for early season.`,
            response_json_schema: {
              type: "object",
              properties: {
                stats: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      goals: { type: "number" },
                      assists: { type: "number" },
                      appearances: { type: "number" },
                      starts: { type: "number" },
                      minutes_played: { type: "number" },
                      shots_per_game: { type: "number" },
                      pass_accuracy: { type: "number" },
                      tackles_per_game: { type: "number" },
                      yellow_cards: { type: "number" },
                      clean_sheets: { type: "number" },
                      saves_per_game: { type: "number" },
                      rating: { type: "number" },
                    }
                  }
                }
              }
            }
          });

          const statsToCreate = (result.stats || []).map(s => {
            const playerId = playerNameMap[s.name.toLowerCase()];
            return {
              player_id: playerId,
              team_id: team.id,
              season: 2026,
              league: "MLS",
              goals: s.goals || 0,
              assists: s.assists || 0,
              appearances: s.appearances || 0,
              starts: s.starts || 0,
              minutes_played: s.minutes_played || 0,
              shots_per_game: s.shots_per_game || 0,
              pass_accuracy: s.pass_accuracy || 0,
              tackles_per_game: s.tackles_per_game || 0,
              yellow_cards: s.yellow_cards || 0,
              clean_sheets: s.clean_sheets || 0,
              saves_per_game: s.saves_per_game || 0,
              rating: s.rating || 7.0,
            };
          }).filter(s => s.player_id); // Only keep stats with valid player IDs

          if (statsToCreate.length > 0) {
            await base44.entities.PlayerStats.bulkCreate(statsToCreate);
            await Promise.all(statsToCreate.map(s =>
              base44.entities.Player.update(s.player_id, {
                goals: s.goals || 0,
                assists: s.assists || 0,
                appearances: s.appearances || 0,
                minutes_played: s.minutes_played || 0,
                shots_per_game: s.shots_per_game || 0,
                pass_accuracy: s.pass_accuracy || 0,
                tackles_per_game: s.tackles_per_game || 0,
                yellow_cards: s.yellow_cards || 0,
                clean_sheets: s.clean_sheets || 0,
                saves_per_game: s.saves_per_game || 0,
              })
            ));
            totalStatsCreated += statsToCreate.length;
          }

          // Delay before next batch
          if (j + BATCH_SIZE < players.length) {
            await new Promise(r => setTimeout(r, DELAY_BETWEEN_BATCHES));
          }
        }
      }

      setPlayerStatsStatus("success");
      setPlayerStatsMsg(`✓ Loaded stats for ${totalStatsCreated} players across ${validTeams.length} team${validTeams.length > 1 ? 's' : ''}.`);
      setPlayerStatsTeamId("");
    } catch (e) {
      setPlayerStatsStatus("error");
      setPlayerStatsMsg("Failed: " + e.message);
    }
    setPlayerStatsLoading(false);
    setPlayerStatsProgress("");
  }

  async function initializeAllTeamStats() {
    setInitStatsLoading(true);
    setStatsStatus(null);
    try {
      const existing = await base44.entities.TeamStats.filter({ season: 2026 });
      const existingTeamIds = new Set(existing.map(ts => ts.team_id));
      
      const toCreate = teams
        .filter(t => !existingTeamIds.has(t.id))
        .map(t => ({
          team_id: t.id,
          season: 2026,
          league: "MLS",
          wins: 0,
          losses: 0,
          draws: 0,
          goals_for: 0,
          goals_against: 0,
          goal_differential: 0,
          points: 0,
          games_played: 0,
        }));

      if (toCreate.length === 0) {
        setStatsStatus("success");
        setStatsMsg(`All ${teams.length} teams already have standings initialized.`);
      } else {
        await base44.entities.TeamStats.bulkCreate(toCreate);
        setStatsStatus("success");
        setStatsMsg(`✓ Created standings for ${toCreate.length} teams (${existing.length} already existed).`);
      }
    } catch (e) {
      setStatsStatus("error");
      setStatsMsg("Failed: " + e.message);
    }
    setInitStatsLoading(false);
  }

  async function saveTeamStats() {
    if (!statsTeamId) {
      setStatsStatus("error");
      setStatsMsg("Please select a team.");
      return;
    }
    const gd = Number(statsForm.goals_for) - Number(statsForm.goals_against);
    const pts = Number(statsForm.wins) * 3 + Number(statsForm.draws);
    await base44.entities.TeamStats.create({
      team_id: statsTeamId,
      season: 2026,
      league: "MLS",
      wins: Number(statsForm.wins),
      losses: Number(statsForm.losses),
      draws: Number(statsForm.draws),
      goals_for: Number(statsForm.goals_for),
      goals_against: Number(statsForm.goals_against),
      goal_differential: gd,
      points: pts,
      games_played: Number(statsForm.wins) + Number(statsForm.losses) + Number(statsForm.draws),
    });
    setStatsStatus("success");
    setStatsMsg("✓ Team stats saved.");
    setStatsTeamId("");
    setStatsForm({ wins: 0, losses: 0, draws: 0, goals_for: 0, goals_against: 0, goal_differential: 0 });
  }

  async function clearAllData() {
    if (!window.confirm("Delete ALL games, predictions, team stats, and players? This cannot be undone.")) return;
    setClearStatus(null);
    try {
      await Promise.all([
        base44.entities.Game.filter({}).then(items => Promise.all(items.map(i => base44.entities.Game.delete(i.id)))),
        base44.entities.Prediction.filter({}).then(items => Promise.all(items.map(i => base44.entities.Prediction.delete(i.id)))),
        base44.entities.TeamStats.filter({}).then(items => Promise.all(items.map(i => base44.entities.TeamStats.delete(i.id)))),
        base44.entities.Player.filter({}).then(items => Promise.all(items.map(i => base44.entities.Player.delete(i.id)))),
      ]);
      setClearStatus("success");
      setClearMsg("✓ All match, prediction, stats, and player data cleared.");
    } catch (e) {
      setClearStatus("error");
      setClearMsg("Clear failed: " + e.message);
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  const inputCls = "w-full bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500/50 transition-colors";
  const selectCls = "w-full bg-[#12172a] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500/50 transition-colors";
  const labelCls = "block text-xs text-white/40 mb-1";
  const btnPrimary = "px-4 py-2 bg-violet-500 hover:bg-violet-600 text-white text-sm font-medium rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50";
  const btnDanger = "px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-sm font-medium rounded-xl transition-colors flex items-center gap-2";

  return (
    <div className="min-h-screen bg-[#080b14] text-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-cyan-400 flex items-center justify-center">
            <Database className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">MLS Data Admin</h1>
            <p className="text-xs text-white/30">Load & manage all MLS data</p>
          </div>
        </div>

        {/* 1. Load All MLS Teams */}
        <Section title="1. Load All 30 MLS Teams" icon={Users} defaultOpen={true}>
          <p className="text-sm text-white/40 mb-4">
            Bulk-loads all 30 MLS teams with full numerology & astrology profiles calculated automatically.
            Safe to re-run — skips existing teams.
          </p>
          <div className="flex items-center gap-3">
            <button onClick={loadAllMLSTeams} disabled={teamsLoading} className={btnPrimary}>
              {teamsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {teamsLoading ? "Loading..." : "Load All MLS Teams"}
            </button>
            <span className="text-xs text-white/30">{teams.length} teams in database</span>
          </div>
          <StatusBadge status={teamsStatus} message={teamsMsg} />
        </Section>

        {/* 2. Sync Scores from ESPN */}
        <Section title="2. Sync Scores & Standings from ESPN" icon={RefreshCw} defaultOpen={true}>
          <p className="text-sm text-white/40 mb-4">
            Fetches all completed 2026 MLS results from ESPN, updates game scores, and automatically recalculates every team's W/L/D record and standings points.
          </p>
          <button onClick={syncScoresFromESPN} disabled={syncLoading} className={btnPrimary}>
            {syncLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {syncLoading ? "Syncing…" : "Sync Scores & Recalculate Standings"}
          </button>
          <StatusBadge status={syncStatus} message={syncMsg} />
        </Section>

        {/* 3. Fetch Schedule from ESPN */}
        <Section title="3. Fetch MLS Schedule from ESPN" icon={Calendar}>
          <p className="text-sm text-white/40 mb-4">
            Fetches upcoming 2026 MLS matches automatically via the ESPN API backend function.
            Requires the <code className="text-violet-400 text-xs bg-violet-400/10 px-1 rounded">fetchMLSData</code> backend function to be deployed.
          </p>
          <button onClick={fetchMLSSchedule} disabled={fetchLoading} className={btnPrimary}>
            {fetchLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {fetchLoading ? "Fetching..." : "Fetch 2026 MLS Schedule"}
          </button>
          <StatusBadge status={fetchStatus} message={fetchMsg} />
        </Section>

        {/* 3. Add Match Manually */}
        <Section title="3. Add MLS Match Manually" icon={Calendar}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className={labelCls}>Home Team *</label>
              <select className={selectCls} value={gameForm.home_team_id} onChange={e => setGameForm(f => ({...f, home_team_id: e.target.value}))}>
                <option value="">Select team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Away Team *</label>
              <select className={selectCls} value={gameForm.away_team_id} onChange={e => setGameForm(f => ({...f, away_team_id: e.target.value}))}>
                <option value="">Select team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Match Date *</label>
              <input type="date" className={inputCls} value={gameForm.game_date} onChange={e => setGameForm(f => ({...f, game_date: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Kickoff Time</label>
              <input type="time" className={inputCls} value={gameForm.game_time} onChange={e => setGameForm(f => ({...f, game_time: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Venue / Stadium</label>
              <input type="text" className={inputCls} placeholder="e.g. Chase Stadium" value={gameForm.venue} onChange={e => setGameForm(f => ({...f, venue: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Matchday #</label>
              <input type="number" className={inputCls} placeholder="e.g. 1" value={gameForm.matchday} onChange={e => setGameForm(f => ({...f, matchday: e.target.value}))} />
            </div>
          </div>
          <button onClick={addGame} className={btnPrimary}>
            <Calendar className="w-4 h-4" /> Add Match
          </button>
          <StatusBadge status={gameStatus} message={gameMsg} />
        </Section>

        {/* 4. Load Full Team Roster via AI */}
        <Section title="4. Load Full Team Roster (AI)" icon={Users}>
          <p className="text-sm text-white/40 mb-4">
            Select a team and let AI generate the full 25-player roster with birth dates and positions automatically.
          </p>
          <div className="mb-4">
            <label className={labelCls}>Team *</label>
            <select className={selectCls} value={rosterTeamId} onChange={e => setRosterTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={loadFullRoster} disabled={rosterLoading || !rosterTeamId} className={btnPrimary}>
            {rosterLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Users className="w-4 h-4" />}
            {rosterLoading ? `Loading roster… (${rosterProgress})` : "Generate & Load Full Roster"}
          </button>
          <StatusBadge status={rosterStatus} message={rosterMsg} />
        </Section>

        {/* 5. Load Player Stats via AI */}
        <Section title="5. Load Player Stats (AI)" icon={BarChart2}>
          <p className="text-sm text-white/40 mb-4">
            Generates realistic 2026 season stats for all loaded players. Processes one team at a time with rate limiting to avoid backend overload.
          </p>
          
          {/* Quick All Teams Button */}
          <button 
            onClick={() => {
              setPlayerStatsTeamId("all");
              setTimeout(() => loadPlayerStats(), 0);
            }}
            disabled={playerStatsLoading} 
            className={btnPrimary + " mb-4 w-full"}
          >
            {playerStatsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
            {playerStatsLoading ? `Loading… ${playerStatsProgress}` : "🚀 Load All Teams (Sequential)"}
          </button>

          {/* Or Select Individual Team */}
          <div className="mb-4">
            <label className={labelCls}>Or Select Single Team</label>
            <select className={selectCls} value={playerStatsTeamId === "all" ? "" : playerStatsTeamId} onChange={e => setPlayerStatsTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <button onClick={loadPlayerStats} disabled={playerStatsLoading || !playerStatsTeamId || playerStatsTeamId === "all"} className={btnPrimary}>
            {playerStatsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
            {playerStatsLoading ? "Loading…" : "Load Single Team"}
          </button>
          <StatusBadge status={playerStatsStatus} message={playerStatsMsg} />
        </Section>

        {/* 6. Add Single Player */}
        <Section title="6. Add MLS Player Manually" icon={Users}>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="col-span-2">
              <label className={labelCls}>Full Name *</label>
              <input type="text" className={inputCls} placeholder="e.g. Lionel Messi" value={playerForm.name} onChange={e => setPlayerForm(f => ({...f, name: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Team *</label>
              <select className={selectCls} value={playerForm.team_id} onChange={e => setPlayerForm(f => ({...f, team_id: e.target.value}))}>
                <option value="">Select team…</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Position</label>
              <select className={selectCls} value={playerForm.position} onChange={e => setPlayerForm(f => ({...f, position: e.target.value}))}>
                {["GK","CB","LB","RB","CDM","CM","CAM","LW","RW","ST","CF"].map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Birth Date *</label>
              <input type="date" className={inputCls} value={playerForm.birth_date} onChange={e => setPlayerForm(f => ({...f, birth_date: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Nationality</label>
              <input type="text" className={inputCls} placeholder="e.g. Argentina" value={playerForm.nationality} onChange={e => setPlayerForm(f => ({...f, nationality: e.target.value}))} />
            </div>
            <div>
              <label className={labelCls}>Jersey #</label>
              <input type="number" className={inputCls} placeholder="e.g. 10" value={playerForm.jersey_number} onChange={e => setPlayerForm(f => ({...f, jersey_number: e.target.value}))} />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <input type="checkbox" id="is_starter" checked={playerForm.is_starter} onChange={e => setPlayerForm(f => ({...f, is_starter: e.target.checked}))} className="accent-violet-500" />
              <label htmlFor="is_starter" className="text-sm text-white/50">Starting XI player</label>
            </div>
          </div>
          <button onClick={addPlayer} className={btnPrimary}>
            <Users className="w-4 h-4" /> Add Player
          </button>
          <StatusBadge status={playerStatus} message={playerMsg} />
        </Section>

        {/* 7. Initialize All Team Standings */}
        <Section title="7. Initialize All Team Standings" icon={BarChart2}>
          <p className="text-sm text-white/40 mb-4">
            Create empty standings (0-0-0 record) for all 30 MLS teams at once. Safe to re-run — skips teams that already have standings.
          </p>
          <button onClick={initializeAllTeamStats} disabled={initStatsLoading} className={btnPrimary}>
            {initStatsLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <BarChart2 className="w-4 h-4" />}
            {initStatsLoading ? "Initializing…" : "Initialize All Team Standings"}
          </button>
          <StatusBadge status={statsStatus} message={statsMsg} />
        </Section>

        {/* 8. Update Team Stats */}
        <Section title="8. Update Team Season Stats" icon={BarChart2}>
          <div className="mb-4">
            <label className={labelCls}>Team *</label>
            <select className={selectCls} value={statsTeamId} onChange={e => setStatsTeamId(e.target.value)}>
              <option value="">Select team…</option>
              {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {[["wins","W"],["draws","D"],["losses","L"],["goals_for","GF"],["goals_against","GA"]].map(([key, label]) => (
              <div key={key}>
                <label className={labelCls}>{label}</label>
                <input type="number" min="0" className={inputCls} value={statsForm[key]} onChange={e => setStatsForm(f => ({...f, [key]: e.target.value}))} />
              </div>
            ))}
            <div className="flex items-end pb-1">
              <span className="text-xs text-white/30">
                Pts: {Number(statsForm.wins)*3 + Number(statsForm.draws)} · GD: {Number(statsForm.goals_for) - Number(statsForm.goals_against)}
              </span>
            </div>
          </div>
          <button onClick={saveTeamStats} className={btnPrimary}>
            <BarChart2 className="w-4 h-4" /> Save Stats
          </button>
          <StatusBadge status={statsStatus} message={statsMsg} />
        </Section>

        {/* 6. Danger Zone */}
        <Section title="Danger Zone — Clear Data" icon={Trash2}>
          <p className="text-sm text-white/40 mb-4">
            Permanently deletes all games, predictions, player records, and team stats. Teams are preserved.
          </p>
          <button onClick={clearAllData} className={btnDanger}>
            <Trash2 className="w-4 h-4" /> Clear All Match & Player Data
          </button>
          <StatusBadge status={clearStatus} message={clearMsg} />
        </Section>

      </div>
    </div>
  );
}