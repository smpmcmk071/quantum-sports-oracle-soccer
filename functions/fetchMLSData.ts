import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1";

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ error: "Admin access required" }, { status: 403 });
    }

    const { type = "schedule", season = 2026 } = await req.json().catch(() => ({}));

    // ── Get teams once for both flows ──────────────────────────────────────
    const teams = await base44.asServiceRole.entities.Team.list();
    const espnToId = teams.reduce((acc, t) => { if (t.espn_id) acc[t.espn_id] = t.id; return acc; }, {});
    const nameToId = teams.reduce((acc, t) => { acc[t.name.toLowerCase()] = t.id; return acc; }, {});

    // ── SCHEDULE: fetch upcoming games ─────────────────────────────────────
    if (type === "schedule") {
      const url = `${ESPN_BASE}/scoreboard?limit=50&dates=${season}`;
      const res = await fetch(url);
      const data = await res.json();
      const events = data.events || [];

      let created = 0;
      for (const event of events) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        const homeComp = competition.competitors?.find(c => c.homeAway === "home");
        const awayComp = competition.competitors?.find(c => c.homeAway === "away");
        if (!homeComp || !awayComp) continue;

        const homeId = espnToId[homeComp.team?.id] || nameToId[homeComp.team?.displayName?.toLowerCase()];
        const awayId = espnToId[awayComp.team?.id] || nameToId[awayComp.team?.displayName?.toLowerCase()];
        if (!homeId || !awayId) continue;

        const gameDate = event.date?.split("T")[0];
        const gameTime = event.date?.split("T")[1]?.substring(0, 5);
        const venue = competition.venue?.fullName || "";
        const statusType = event.status?.type?.name || "STATUS_SCHEDULED";
        const status = ["STATUS_FINAL","STATUS_FULL_TIME","STATUS_FT"].includes(statusType) ? "completed"
          : statusType === "STATUS_IN_PROGRESS" ? "in_progress"
          : "scheduled";

        await base44.asServiceRole.entities.Game.create({
          home_team_id: homeId,
          away_team_id: awayId,
          game_date: gameDate,
          game_time: gameTime,
          venue,
          league: "MLS",
          season: Number(season),
          status,
        });
        created++;
      }

      return Response.json({ success: true, created, total_fetched: events.length });
    }

    // ── SCORES: fetch completed results & update TeamStats ─────────────────
    if (type === "scores") {
      // Fetch full season range from ESPN (early Feb through Dec)
      const startDate = `${season}0201`;
      const endDate   = `${season}1231`;
      const url = `${ESPN_BASE}/scoreboard?limit=200&dates=${startDate}-${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      const events = data.events || [];

      // Only care about completed games
      const COMPLETED_STATUSES = ["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"];
      const completedEvents = events.filter(e => COMPLETED_STATUSES.includes(e.status?.type?.name));

      // Load existing games from DB
      const dbGames = await base44.asServiceRole.entities.Game.list();

      // Build a lookup: "homeId_awayId_date" → game record
      const gameKey = (homeId, awayId, date) => `${homeId}_${awayId}_${date}`;
      const dbGameMap = dbGames.reduce((acc, g) => {
        acc[gameKey(g.home_team_id, g.away_team_id, g.game_date)] = g;
        return acc;
      }, {});

      let updated = 0;
      let created = 0;

      for (const event of completedEvents) {
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
        const gameDate  = event.date?.split("T")[0];
        const gameTime  = event.date?.split("T")[1]?.substring(0, 5);
        const venue     = competition.venue?.fullName || "";

        const actualWinner = homeScore > awayScore ? homeId
          : awayScore > homeScore ? awayId
          : "draw";

        const existingGame = dbGameMap[gameKey(homeId, awayId, gameDate)];

        if (existingGame) {
          // Always update scores for completed games
          await base44.asServiceRole.entities.Game.update(existingGame.id, {
            status: "completed",
            home_score: homeScore,
            away_score: awayScore,
            actual_winner: actualWinner,
          });
          updated++;
        } else {
          // Create missing game record
          await base44.asServiceRole.entities.Game.create({
            home_team_id: homeId,
            away_team_id: awayId,
            game_date: gameDate,
            game_time: gameTime,
            venue,
            league: "MLS",
            season: Number(season),
            status: "completed",
            home_score: homeScore,
            away_score: awayScore,
            actual_winner: actualWinner,
          });
          created++;
        }
      }

      // ── Recalculate TeamStats from all completed games ──────────────────
      const allCompleted = await base44.asServiceRole.entities.Game.filter({ status: "completed", season: Number(season) });

      // Aggregate per team
      const statsMap = {};
      const ensure = (id) => {
        if (!statsMap[id]) statsMap[id] = { wins: 0, losses: 0, draws: 0, goals_for: 0, goals_against: 0 };
      };

      for (const g of allCompleted) {
        const h = g.home_team_id;
        const a = g.away_team_id;
        if (!h || !a) continue;
        ensure(h); ensure(a);

        const hs = g.home_score ?? 0;
        const as_ = g.away_score ?? 0;

        statsMap[h].goals_for      += hs;
        statsMap[h].goals_against  += as_;
        statsMap[a].goals_for      += as_;
        statsMap[a].goals_against  += hs;

        if (g.actual_winner === h) {
          statsMap[h].wins++;
          statsMap[a].losses++;
        } else if (g.actual_winner === a) {
          statsMap[a].wins++;
          statsMap[h].losses++;
        } else {
          statsMap[h].draws++;
          statsMap[a].draws++;
        }
      }

      // Load existing TeamStats for this season
      const existingStats = await base44.asServiceRole.entities.TeamStats.filter({ season: Number(season) });
      const existingStatsMap = existingStats.reduce((acc, ts) => { acc[ts.team_id] = ts; return acc; }, {});

      let statsUpdated = 0;
      let statsCreated = 0;

      for (const [teamId, s] of Object.entries(statsMap)) {
        const gp = s.wins + s.losses + s.draws;
        const pts = s.wins * 3 + s.draws;
        const gd = s.goals_for - s.goals_against;

        const payload = {
          wins: s.wins,
          losses: s.losses,
          draws: s.draws,
          games_played: gp,
          points: pts,
          goals_for: s.goals_for,
          goals_against: s.goals_against,
          goal_differential: gd,
        };

        if (existingStatsMap[teamId]) {
          await base44.asServiceRole.entities.TeamStats.update(existingStatsMap[teamId].id, payload);
          statsUpdated++;
        } else {
          await base44.asServiceRole.entities.TeamStats.create({
            team_id: teamId,
            season: Number(season),
            league: "MLS",
            ...payload,
          });
          statsCreated++;
        }
      }

      return Response.json({
        success: true,
        games_updated: updated,
        games_created: created,
        completed_total: completedEvents.length,
        team_stats_updated: statsUpdated,
        team_stats_created: statsCreated,
      });
    }

    // ── JERSEY NUMBERS: fetch rosters from ESPN and update players ──────────
    if (type === "jerseys") {
      let updated = 0;
      let skipped = 0;

      for (const team of teams) {
        if (!team.espn_id) { skipped++; continue; }

        const rosterUrl = `${ESPN_BASE}/teams/${team.espn_id}/roster`;
        const rRes = await fetch(rosterUrl);
        if (!rRes.ok) { skipped++; continue; }
        const rData = await rRes.json();

        const athletes = rData.athletes || [];
        // ESPN may nest by position group: [{items: [...]}] or flat array
        const flatAthletes = athletes.length && athletes[0]?.items
          ? athletes.flatMap(g => g.items || [])
          : athletes;

        // Load players for this team from DB
        const dbPlayers = await base44.asServiceRole.entities.Player.filter({ team_id: team.id });
        const nameMap = dbPlayers.reduce((acc, p) => { acc[p.name.toLowerCase()] = p; return acc; }, {});

        for (const athlete of flatAthletes) {
          const jerseyNum = athlete.jersey ? parseInt(athlete.jersey, 10) : null;
          const espnId = athlete.id ? String(athlete.id) : null;
          const fullName = athlete.fullName || athlete.displayName || "";
          if (!jerseyNum && !espnId) continue;

          // Try to match by espn_id first, then by name
          let dbPlayer = dbPlayers.find(p => p.espn_id && p.espn_id === espnId);
          if (!dbPlayer) dbPlayer = nameMap[fullName.toLowerCase()];
          if (!dbPlayer) continue;

          const updatePayload = {};
          if (jerseyNum && dbPlayer.jersey_number !== jerseyNum) updatePayload.jersey_number = jerseyNum;
          if (espnId && dbPlayer.espn_id !== espnId) updatePayload.espn_id = espnId;
          if (Object.keys(updatePayload).length > 0) {
            await base44.asServiceRole.entities.Player.update(dbPlayer.id, updatePayload);
            updated++;
          }
        }
      }

      return Response.json({ success: true, players_updated: updated, teams_skipped: skipped });
    }

    // ── DEBUG: inspect raw ESPN event data ────────────────────────────────
    if (type === "debug_scores") {
      const startDate = `${season}0201`;
      const endDate   = `${season}1231`;
      const url = `${ESPN_BASE}/scoreboard?limit=200&dates=${startDate}-${endDate}`;
      const res = await fetch(url);
      const data = await res.json();
      const completed = (data.events || []).filter(e =>
        ["STATUS_FINAL","STATUS_FULL_TIME","STATUS_FT"].includes(e.status?.type?.name)
      );
      const sample = completed.slice(0, 2).map(e => {
        const c = e.competitions?.[0];
        const home = c?.competitors?.find(x => x.homeAway === "home");
        const away = c?.competitors?.find(x => x.homeAway === "away");
        return {
          date: e.date,
          status: e.status?.type?.name,
          home_team: home?.team?.displayName,
          home_score: home?.score,
          away_team: away?.team?.displayName,
          away_score: away?.score,
          home_keys: home ? Object.keys(home) : [],
        };
      });
      return Response.json({ total_completed: completed.length, sample });
    }

    return Response.json({ error: "Unknown type" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});