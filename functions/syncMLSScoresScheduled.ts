import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1";
const SEASON = 2026;
const COMPLETED_STATUSES = ["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Get teams for ID mapping
    const teams = await base44.asServiceRole.entities.Team.list();
    const espnToId = teams.reduce((acc, t) => { if (t.espn_id) acc[t.espn_id] = t.id; return acc; }, {});
    const nameToId = teams.reduce((acc, t) => { acc[t.name.toLowerCase()] = t.id; return acc; }, {});

    // Fetch recent scoreboard from ESPN (last 30 days window)
    const today = new Date();
    const past = new Date(today);
    past.setDate(past.getDate() - 30);
    const fmt = d => d.toISOString().slice(0,10).replace(/-/g,"");
    const url = `${ESPN_BASE}/scoreboard?limit=200&dates=${fmt(past)}-${fmt(today)}`;

    const res = await fetch(url);
    const data = await res.json();
    const events = (data.events || []).filter(e => COMPLETED_STATUSES.includes(e.status?.type?.name));

    const dbGames = await base44.asServiceRole.entities.Game.list();
    const gameKey = (h, a, d) => `${h}_${a}_${d}`;
    const dbGameMap = dbGames.reduce((acc, g) => {
      acc[gameKey(g.home_team_id, g.away_team_id, g.game_date)] = g;
      return acc;
    }, {});

    let updated = 0, created = 0;

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeComp = competition.competitors?.find(c => c.homeAway === "home");
      const awayComp = competition.competitors?.find(c => c.homeAway === "away");
      if (!homeComp || !awayComp) continue;

      const homeId = espnToId[homeComp.team?.id] || nameToId[homeComp.team?.displayName?.toLowerCase()];
      const awayId = espnToId[awayComp.team?.id] || nameToId[awayComp.team?.displayName?.toLowerCase()];
      if (!homeId || !awayId) continue;

      const homeScore = parseInt(homeComp.score || "0", 10);
      const awayScore = parseInt(awayComp.score || "0", 10);
      const gameDate = event.date?.split("T")[0];
      const gameTime = event.date?.split("T")[1]?.substring(0, 5);
      const venue = competition.venue?.fullName || "";
      const actualWinner = homeScore > awayScore ? homeId : awayScore > homeScore ? awayId : "draw";

      const existing = dbGameMap[gameKey(homeId, awayId, gameDate)];
      if (existing) {
        if (existing.status !== "completed" || existing.home_score == null) {
          await base44.asServiceRole.entities.Game.update(existing.id, {
            status: "completed", home_score: homeScore, away_score: awayScore, actual_winner: actualWinner,
          });
          updated++;
        }
      } else {
        await base44.asServiceRole.entities.Game.create({
          home_team_id: homeId, away_team_id: awayId, game_date: gameDate, game_time: gameTime,
          venue, league: "MLS", season: SEASON, status: "completed",
          home_score: homeScore, away_score: awayScore, actual_winner: actualWinner,
        });
        created++;
      }
    }

    // Recalculate TeamStats
    const allCompleted = await base44.asServiceRole.entities.Game.filter({ status: "completed", season: SEASON });
    const statsMap = {};
    const ensure = (id) => { if (!statsMap[id]) statsMap[id] = { wins:0, losses:0, draws:0, goals_for:0, goals_against:0 }; };

    for (const g of allCompleted) {
      if (!g.home_team_id || !g.away_team_id) continue;
      ensure(g.home_team_id); ensure(g.away_team_id);
      statsMap[g.home_team_id].goals_for     += g.home_score ?? 0;
      statsMap[g.home_team_id].goals_against += g.away_score ?? 0;
      statsMap[g.away_team_id].goals_for     += g.away_score ?? 0;
      statsMap[g.away_team_id].goals_against += g.home_score ?? 0;
      if (g.actual_winner === g.home_team_id)      { statsMap[g.home_team_id].wins++;   statsMap[g.away_team_id].losses++; }
      else if (g.actual_winner === g.away_team_id) { statsMap[g.away_team_id].wins++;   statsMap[g.home_team_id].losses++; }
      else                                         { statsMap[g.home_team_id].draws++;  statsMap[g.away_team_id].draws++; }
    }

    const existingStats = await base44.asServiceRole.entities.TeamStats.filter({ season: SEASON });
    const existingStatsMap = existingStats.reduce((acc, ts) => { acc[ts.team_id] = ts; return acc; }, {});

    for (const [teamId, s] of Object.entries(statsMap)) {
      const payload = {
        wins: s.wins, losses: s.losses, draws: s.draws,
        games_played: s.wins + s.losses + s.draws,
        points: s.wins * 3 + s.draws,
        goals_for: s.goals_for, goals_against: s.goals_against,
        goal_differential: s.goals_for - s.goals_against,
      };
      if (existingStatsMap[teamId]) {
        await base44.asServiceRole.entities.TeamStats.update(existingStatsMap[teamId].id, payload);
      } else {
        await base44.asServiceRole.entities.TeamStats.create({ team_id: teamId, season: SEASON, league: "MLS", ...payload });
      }
    }

    return Response.json({ success: true, games_updated: updated, games_created: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});