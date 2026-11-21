import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const PAGE_SIZE = 200;
const CHANCE_BASELINE = 33.3;
const LOW_SAMPLE_THRESHOLD = 30;

async function loadAll(entity, query) {
  const items = [];
  let cursor = null;
  for (let page = 0; page < 25; page++) {
    const result = await entity.filter(query, { limit: PAGE_SIZE, cursor });
    items.push(...(result.items || []));
    if (!result.has_more) break;
    cursor = result.next_cursor;
  }
  return items;
}

function pct(part, whole) {
  if (!whole) return null;
  return Math.round((part / whole) * 1000) / 10;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const [predictions, completedGames] = await Promise.all([
      loadAll(base44.entities.Prediction, { is_archived: false }),
      loadAll(base44.entities.Game, { status: 'completed' }),
    ]);

    const gameMap = {};
    for (const game of completedGames) gameMap[game.id] = game;

    const today = new Date().toISOString().slice(0, 10);
    const settledRows = [];
    const updates = [];

    for (const prediction of predictions) {
      const game = gameMap[prediction.game_id];
      if (!game) continue;

      const homeScore = game.home_score ?? 0;
      const awayScore = game.away_score ?? 0;
      const actualOutcome = homeScore > awayScore ? 'home' : awayScore > homeScore ? 'away' : 'draw';

      const predictedOutcome = prediction.predicted_outcome
        || (prediction.predicted_winner_id === 'draw' ? 'draw'
          : prediction.predicted_winner_id === game.home_team_id ? 'home'
            : prediction.predicted_winner_id === game.away_team_id ? 'away'
              : null);
      if (!predictedOutcome) continue;

      const wasCorrect = predictedOutcome === actualOutcome;

      settledRows.push({
        confidence: prediction.confidence_score || 0,
        wasCorrect,
        actualOutcome,
      });

      // Record the result next to the original call; the prediction itself is never rewritten.
      if (
        prediction.was_correct !== wasCorrect
        || prediction.actual_home_score !== homeScore
        || prediction.actual_away_score !== awayScore
        || prediction.predicted_outcome !== predictedOutcome
      ) {
        updates.push({
          id: prediction.id,
          was_correct: wasCorrect,
          predicted_outcome: predictedOutcome,
          actual_winner_id: actualOutcome === 'draw' ? 'draw' : actualOutcome === 'home' ? game.home_team_id : game.away_team_id,
          actual_home_score: homeScore,
          actual_away_score: awayScore,
          reconciled_date: today,
        });
      }
    }

    for (let i = 0; i < updates.length; i += 400) {
      await base44.entities.Prediction.bulkUpdate(updates.slice(i, i + 400));
    }

    const settled = settledRows.length;
    const correct = settledRows.filter((r) => r.wasCorrect).length;
    const accuracy = pct(correct, settled);
    const homeBaseline = pct(settledRows.filter((r) => r.actualOutcome === 'home').length, settled);

    const bands = [
      { label: '60%+ confidence', test: (r) => r.confidence >= 60 },
      { label: '50-59%', test: (r) => r.confidence >= 50 && r.confidence < 60 },
      { label: 'Under 50%', test: (r) => r.confidence < 50 },
    ].map((band) => {
      const rows = settledRows.filter(band.test);
      return {
        label: band.label,
        settled: rows.length,
        correct: rows.filter((r) => r.wasCorrect).length,
        accuracy: pct(rows.filter((r) => r.wasCorrect).length, rows.length),
      };
    });

    return Response.json({
      settled,
      correct,
      accuracy,
      home_baseline: homeBaseline,
      chance_baseline: CHANCE_BASELINE,
      edge_vs_home: accuracy !== null && homeBaseline !== null ? Math.round((accuracy - homeBaseline) * 10) / 10 : null,
      edge_vs_chance: accuracy !== null ? Math.round((accuracy - CHANCE_BASELINE) * 10) / 10 : null,
      pending: predictions.length - settled,
      low_sample: settled < LOW_SAMPLE_THRESHOLD,
      bands,
      reconciled: updates.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}