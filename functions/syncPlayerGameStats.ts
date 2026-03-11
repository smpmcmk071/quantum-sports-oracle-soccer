import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

const ESPN_BASE = "https://site.api.espn.com/apis/site/v2/sports/soccer/usa.1";
const SEASON = 2026;
const MAX_EVENTS_PER_RUN = 25; // batch to avoid timeout; automation runs daily to catch up

function safeInt(val) { const n = parseInt(val, 10); return isNaN(n) ? 0 : n; }
function safeFloat(val) { const n = parseFloat(val); return isNaN(n) ? null : n; }

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    const [teams, allPlayers, allGames, existingPGS] = await Promise.all([
      base44.asServiceRole.entities.Team.list(),
      base44.asServiceRole.entities.Player.list(),
      base44.asServiceRole.entities.Game.filter({ status: "completed", season: SEASON }),
      base44.asServiceRole.entities.PlayerGameStats.filter({ season: SEASON }),
    ]);

    const espnToTeamId = teams.reduce((acc, t) => { if (t.espn_id) acc[String(t.espn_id)] = t.id; return acc; }, {});
    const espnToPlayer = allPlayers.reduce((acc, p) => { if (p.espn_id) acc[String(p.espn_id)] = p; return acc; }, {});
    const nameToPlayer = allPlayers.reduce((acc, p) => { acc[p.name.toLowerCase()] = p; return acc; }, {});

    // Events already fully processed
    const processedEvents = new Set(existingPGS.map(s => s.espn_event_id).filter(Boolean));

    // DB game lookups
    const gameByEventId = {};
    const gamesByTeamDate = {};
    for (const g of allGames) {
      if (g.espn_event_id) gameByEventId[g.espn_event_id] = g;
      gamesByTeamDate[`${g.home_team_id}_${g.away_team_id}_${g.game_date}`] = g;
    }

    // Scan ESPN scoreboard week by week from Feb 1 to today to discover event IDs
    const startDate = new Date(`${SEASON}-02-01`);
    const today = new Date();
    const fmt = d => d.toISOString().slice(0, 10).replace(/-/g, "");

    const unprocessed = [];
    let cursor = new Date(startDate);

    while (cursor <= today) {
      const end = new Date(cursor);
      end.setDate(end.getDate() + 6);
      const url = `${ESPN_BASE}/scoreboard?limit=100&dates=${fmt(cursor)}-${fmt(end > today ? today : end)}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        for (const event of data.events || []) {
          if (!["STATUS_FINAL", "STATUS_FULL_TIME", "STATUS_FT"].includes(event.status?.type?.name)) continue;
          if (processedEvents.has(event.id)) continue;

          const comp = event.competitions?.[0];
          const homeComp = comp?.competitors?.find(c => c.homeAway === "home");
          const awayComp = comp?.competitors?.find(c => c.homeAway === "away");
          if (!homeComp || !awayComp) continue;

          const homeTeamId = espnToTeamId[String(homeComp.team?.id)];
          const awayTeamId = espnToTeamId[String(awayComp.team?.id)];
          if (!homeTeamId || !awayTeamId) continue;

          const gameDate = event.date?.split("T")[0];
          let dbGame = gameByEventId[event.id] || gamesByTeamDate[`${homeTeamId}_${awayTeamId}_${gameDate}`];
          if (!dbGame) continue;

          // Patch espn_event_id onto game if missing
          if (!dbGame.espn_event_id) {
            await base44.asServiceRole.entities.Game.update(dbGame.id, { espn_event_id: event.id });
            dbGame.espn_event_id = event.id;
            gameByEventId[event.id] = dbGame;
          }

          unprocessed.push({ eventId: event.id, dbGame, homeTeamId, awayTeamId });
        }
      }
      cursor.setDate(cursor.getDate() + 7);
    }

    // Process up to MAX_EVENTS_PER_RUN
    const toProcess = unprocessed.slice(0, MAX_EVENTS_PER_RUN);
    let statsCreated = 0;

    for (const { eventId, dbGame, homeTeamId, awayTeamId } of toProcess) {
      const summaryRes = await fetch(`${ESPN_BASE}/summary?event=${eventId}`);
      if (!summaryRes.ok) continue;
      const summary = await summaryRes.json();

      for (const teamGroup of summary.boxscore?.players || []) {
        const teamId = espnToTeamId[String(teamGroup.team?.id)];
        if (!teamId) continue;

        const isHome = teamId === homeTeamId;
        const opponentId = isHome ? awayTeamId : homeTeamId;
        const homeAway = isHome ? "home" : "away";

        // Merge stats across groups (ESPN sometimes splits by position group)
        const playerStatsMap = new Map();

        for (const statGroup of teamGroup.statistics || []) {
          const keys = statGroup.keys || [];
          for (const athleteEntry of statGroup.athletes || []) {
            const espnPId = athleteEntry.athlete?.id ? String(athleteEntry.athlete.id) : null;
            const pName = athleteEntry.athlete?.displayName || "";
            const pKey = espnPId || pName.toLowerCase();
            if (!pKey) continue;

            const stats = athleteEntry.stats || [];
            const s = {};
            keys.forEach((k, i) => { s[k] = stats[i] || "0"; });

            if (!playerStatsMap.has(pKey)) {
              playerStatsMap.set(pKey, { espnPId, pName, goals: 0, assists: 0, minutesPlayed: 0, shots: 0, shotsOnTarget: 0, yellowCards: 0, redCards: 0, saves: 0, rating: null });
            }
            const ps = playerStatsMap.get(pKey);
            ps.goals        += safeInt(s.goals        ?? s.G);
            ps.assists      += safeInt(s.assists       ?? s.A);
            ps.minutesPlayed = Math.max(ps.minutesPlayed, safeInt(s.minutesPlayed ?? s.MIN));
            ps.shots        += safeInt(s.shots         ?? s.SH);
            ps.shotsOnTarget += safeInt(s.shotsOnTarget ?? s.SOG);
            ps.yellowCards  += safeInt(s.yellowCards   ?? s.YC);
            ps.redCards     += safeInt(s.redCards      ?? s.RC);
            ps.saves        += safeInt(s.saves         ?? s.SV);
            const r = safeFloat(s.rating);
            if (r) ps.rating = r;
          }
        }

        for (const [, ps] of playerStatsMap) {
          const player = (ps.espnPId && espnToPlayer[ps.espnPId]) || nameToPlayer[ps.pName.toLowerCase()];
          if (!player) continue;

          const record = {
            player_id: player.id,
            game_id: dbGame.id,
            team_id: teamId,
            opponent_team_id: opponentId,
            home_away: homeAway,
            game_date: dbGame.game_date,
            venue: dbGame.venue || "",
            season: SEASON,
            goals: ps.goals,
            assists: ps.assists,
            minutes_played: ps.minutesPlayed,
            shots: ps.shots,
            shots_on_target: ps.shotsOnTarget,
            yellow_cards: ps.yellowCards,
            red_cards: ps.redCards,
            saves: ps.saves,
            espn_event_id: eventId,
          };
          if (ps.rating !== null) record.rating = ps.rating;
          if (ps.espnPId) record.espn_player_id = ps.espnPId;

          await base44.asServiceRole.entities.PlayerGameStats.create(record);
          statsCreated++;
        }
      }
    }

    // Aggregate PlayerGameStats → update Player season stats (for battle accuracy)
    const allPGS = await base44.asServiceRole.entities.PlayerGameStats.filter({ season: SEASON });
    const playerAgg = {};

    for (const pgs of allPGS) {
      if (!playerAgg[pgs.player_id]) {
        playerAgg[pgs.player_id] = { goals: 0, assists: 0, appearances: 0, minutes_played: 0, yellow_cards: 0, red_cards: 0, saves: 0, shots: 0 };
      }
      const a = playerAgg[pgs.player_id];
      a.goals         += pgs.goals || 0;
      a.assists       += pgs.assists || 0;
      a.appearances   += 1;
      a.minutes_played += pgs.minutes_played || 0;
      a.yellow_cards  += pgs.yellow_cards || 0;
      a.red_cards     += pgs.red_cards || 0;
      a.saves         += pgs.saves || 0;
      a.shots         += pgs.shots || 0;
    }

    let playersUpdated = 0;
    for (const [playerId, agg] of Object.entries(playerAgg)) {
      const apps = Math.max(1, agg.appearances);
      await base44.asServiceRole.entities.Player.update(playerId, {
        goals: agg.goals,
        assists: agg.assists,
        appearances: agg.appearances,
        minutes_played: agg.minutes_played,
        yellow_cards: agg.yellow_cards,
        red_cards: agg.red_cards,
        saves_per_game: Math.round((agg.saves / apps) * 10) / 10,
        shots_per_game: Math.round((agg.shots / apps) * 10) / 10,
      });
      playersUpdated++;
    }

    return Response.json({
      success: true,
      events_found: unprocessed.length,
      events_processed: toProcess.length,
      remaining: Math.max(0, unprocessed.length - MAX_EVENTS_PER_RUN),
      stats_created: statsCreated,
      players_updated: playersUpdated,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});