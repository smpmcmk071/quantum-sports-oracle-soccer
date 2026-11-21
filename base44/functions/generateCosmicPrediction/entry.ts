import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { buildPrediction } from '../../shared/predictionEngine.ts';

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { game_id } = await req.json().catch(() => ({}));
    if (!game_id) return Response.json({ error: 'game_id is required' }, { status: 400 });

    const game = await base44.entities.Game.get(game_id).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
    if (!game) return Response.json({ error: 'Match not found' }, { status: 404 });

    // One live reading per match: return the existing one instead of duplicating it.
    const existing = await base44.entities.Prediction.filter({ game_id, is_archived: false });
    if (existing.length > 0) {
      return Response.json({ prediction: existing[0], duplicate: true });
    }

    const season = game.season || 2026;
    const [teams, homeStats, awayStats] = await Promise.all([
      base44.entities.Team.list(),
      base44.entities.TeamStats.filter({ team_id: game.home_team_id, season }),
      base44.entities.TeamStats.filter({ team_id: game.away_team_id, season }),
    ]);

    const home = teams.find((t) => t.id === game.home_team_id);
    const away = teams.find((t) => t.id === game.away_team_id);
    if (!home || !away) {
      return Response.json({ error: 'Both teams must exist before a reading can be built' }, { status: 400 });
    }

    const payload = buildPrediction({
      game,
      home,
      away,
      homeStats: homeStats[0],
      awayStats: awayStats[0],
    });

    const prediction = await base44.entities.Prediction.create({ game_id, ...payload });

    return Response.json({ prediction, duplicate: false });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}