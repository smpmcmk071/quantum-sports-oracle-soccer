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

    if (type === "schedule") {
      // Fetch upcoming MLS events from ESPN
      const url = `${ESPN_BASE}/scoreboard?limit=50&dates=${season}`;
      const res = await fetch(url);
      const data = await res.json();

      const events = data.events || [];

      // Get existing teams from our DB to map ESPN IDs → our IDs
      const teams = await base44.asServiceRole.entities.Team.list();
      const espnToId = teams.reduce((acc, t) => { if (t.espn_id) acc[t.espn_id] = t.id; return acc; }, {});
      const nameToId = teams.reduce((acc, t) => { acc[t.name.toLowerCase()] = t.id; return acc; }, {});

      let created = 0;

      for (const event of events) {
        const competition = event.competitions?.[0];
        if (!competition) continue;

        const homeComp = competition.competitors?.find(c => c.homeAway === "home");
        const awayComp = competition.competitors?.find(c => c.homeAway === "away");
        if (!homeComp || !awayComp) continue;

        const homeEspnId = homeComp.team?.id;
        const awayEspnId = awayComp.team?.id;

        const homeId = espnToId[homeEspnId] || nameToId[homeComp.team?.displayName?.toLowerCase()];
        const awayId = espnToId[awayEspnId] || nameToId[awayComp.team?.displayName?.toLowerCase()];

        if (!homeId || !awayId) continue;

        const gameDate = event.date?.split("T")[0];
        const gameTime = event.date?.split("T")[1]?.substring(0, 5);
        const venue = competition.venue?.fullName || "";

        const statusType = event.status?.type?.name || "STATUS_SCHEDULED";
        const status = statusType === "STATUS_FINAL" ? "completed"
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

    return Response.json({ error: "Unknown type" }, { status: 400 });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});