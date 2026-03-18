import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1";
const SEASON = 2026;

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const teams = await base44.asServiceRole.entities.Team.list();
    const espnToId = teams.reduce((acc, t) => { if (t.espn_id) acc[String(t.espn_id)] = t.id; return acc; }, {});
    const nameToId = teams.reduce((acc, t) => { acc[t.name.toLowerCase()] = t.id; return acc; }, {});

    // Fetch from 7 days ago through 60 days ahead (catches near-past + upcoming)
    const today = new Date();
    const past = new Date(today); past.setDate(past.getDate() - 7);
    const future = new Date(today); future.setDate(future.getDate() + 60);
    const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, "");

    const url = `${ESPN_BASE}/scoreboard?limit=200&dates=${fmt(past)}-${fmt(future)}`;
    const res = await fetch(url);
    const data = await res.json();
    const events = data.events || [];

    // Load existing games for dedup
    const dbGames = await base44.asServiceRole.entities.Game.filter({ season: SEASON });
    const gameKeySet = new Set(dbGames.map(g => `${g.home_team_id}_${g.away_team_id}_${g.game_date}`));
    const espnEventSet = new Set(dbGames.map(g => g.espn_event_id).filter(Boolean));

    // Build a quick lookup for games missing espn_event_id
    const gamesByTeamDate = dbGames.reduce((acc, g) => {
      acc[`${g.home_team_id}_${g.away_team_id}_${g.game_date}`] = g;
      return acc;
    }, {});

    let created = 0, skipped = 0, updated = 0;

    for (const event of events) {
      const competition = event.competitions?.[0];
      if (!competition) continue;

      const homeComp = competition.competitors?.find(c => c.homeAway === "home");
      const awayComp = competition.competitors?.find(c => c.homeAway === "away");
      if (!homeComp || !awayComp) continue;

      const homeId = espnToId[String(homeComp.team?.id)] || nameToId[homeComp.team?.displayName?.toLowerCase()];
      const awayId = espnToId[String(awayComp.team?.id)] || nameToId[awayComp.team?.displayName?.toLowerCase()];
      if (!homeId || !awayId) continue;

      const gameDate = event.date?.split("T")[0];
      const key = `${homeId}_${awayId}_${gameDate}`;

      if (espnEventSet.has(event.id)) { skipped++; continue; }

      if (gameKeySet.has(key)) {
        // Game exists — patch espn_event_id if missing
        const existing = gamesByTeamDate[key];
        if (existing && !existing.espn_event_id) {
          await base44.asServiceRole.entities.Game.update(existing.id, { espn_event_id: event.id });
          updated++;
        } else {
          skipped++;
        }
        continue;
      }

      const gameTime = event.date?.split("T")[1]?.substring(0, 5);
      const venue = competition.venue?.fullName || "";
      const statusType = event.status?.type?.name || "STATUS_SCHEDULED";
      const status = ["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"].includes(statusType) ? "completed"
        : statusType === "STATUS_IN_PROGRESS" ? "in_progress" : "scheduled";

      await base44.asServiceRole.entities.Game.create({
        home_team_id: homeId,
        away_team_id: awayId,
        game_date: gameDate,
        game_time: gameTime,
        venue,
        league: "MLS",
        season: SEASON,
        status,
        espn_event_id: event.id,
      });
      gameKeySet.add(key);
      created++;
    }

    return Response.json({ success: true, created, skipped, espn_ids_patched: updated });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});