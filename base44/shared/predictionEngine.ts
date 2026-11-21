// Builds a full match reading: statistical scoreline baseline, cosmic tilt,
// scenario ranking, confidence and a plain-language rationale.
// Everything is deterministic so the same inputs always reproduce the same reading.

import {
  reduceNumber,
  baseNumber,
  lifePathFromDate,
  nameNumber,
  universalDay,
  personalDay,
  zodiacFromDate,
  elementForSign,
  chineseZodiac,
  moonPhase,
  harmonyBetween,
  elementRelation,
} from "./numerology.ts";

export const ENGINE_VERSION = "cosmic-v1";

const LEAGUE_GOALS_PER_GAME = 1.42;
const HOME_BUMP = 0.25;
const AWAY_DAMP = 0.92;
const MAX_GOALS = 4;
const SCENARIO_COUNT = 3;
const TILT_STRENGTH = 0.22;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const round1 = (value) => Math.round(value * 10) / 10;
const round2 = (value) => Math.round(value * 100) / 100;

function yearOf(dateStr) {
  const match = dateStr ? String(dateStr).match(/(\d{4})/) : null;
  return match ? Number(match[1]) : null;
}

function poisson(goals, lambda) {
  let factorial = 1;
  for (let i = 2; i <= goals; i++) factorial *= i;
  return (Math.exp(-lambda) * Math.pow(lambda, goals)) / factorial;
}

export function buildTeamProfile(team, dayNumber) {
  const lifePath = team?.life_path_number ?? lifePathFromDate(team?.founded_date) ?? nameNumber(team?.name);
  const destiny = team?.destiny_number ?? nameNumber(team?.name);
  const cityNumber = team?.city_numerology ?? nameNumber(team?.city);
  const zodiac = team?.zodiac_sign || zodiacFromDate(team?.founded_date) || null;
  const element = elementForSign(zodiac) || team?.element || null;
  const chinese = team?.chinese_zodiac || chineseZodiac(yearOf(team?.founded_date)) || null;

  return {
    id: team?.id || null,
    name: team?.name || "Unknown",
    city: team?.city || null,
    life_path_number: reduceNumber(lifePath),
    destiny_number: reduceNumber(destiny),
    city_numerology: reduceNumber(cityNumber),
    zodiac_sign: zodiac,
    element,
    chinese_zodiac: chinese,
    personal_day: personalDay(baseNumber(lifePath), dayNumber),
  };
}

export function expectedGoals(homeStats, awayStats) {
  const homeGames = homeStats?.games_played || 0;
  const awayGames = awayStats?.games_played || 0;

  const homeFor = homeGames ? (homeStats.goals_for || 0) / homeGames : LEAGUE_GOALS_PER_GAME;
  const homeAgainst = homeGames ? (homeStats.goals_against || 0) / homeGames : LEAGUE_GOALS_PER_GAME;
  const awayFor = awayGames ? (awayStats.goals_for || 0) / awayGames : LEAGUE_GOALS_PER_GAME;
  const awayAgainst = awayGames ? (awayStats.goals_against || 0) / awayGames : LEAGUE_GOALS_PER_GAME;

  return {
    homeXg: round2(clamp((homeFor + awayAgainst) / 2 + HOME_BUMP, 0.4, 3.2)),
    awayXg: round2(clamp(((awayFor + homeAgainst) / 2) * AWAY_DAMP, 0.3, 3.0)),
    homeFor,
    homeAgainst,
    awayFor,
    awayAgainst,
    homeGames,
    awayGames,
  };
}

function moonTilt(phase, homeDay, awayDay) {
  if (!phase || !homeDay || !awayDay) {
    return { tilt: 0, label: "Moon data unavailable" };
  }
  const gap = homeDay - awayDay;
  if (gap === 0) {
    return { tilt: 0, label: `${phase.name}: identical personal days, no lunar edge` };
  }
  if (phase.name === "New moon") {
    return { tilt: 0, label: "New moon: neutral, the slate resets" };
  }
  const strength = phase.name === "Full moon" ? 0.9 : 0.6;
  const favoursHigher = phase.waxing;
  const homeFavoured = favoursHigher ? gap > 0 : gap < 0;
  const magnitude = strength * clamp(Math.abs(gap) / 6, 0.35, 1);
  const side = homeFavoured ? "home side" : "away side";
  return {
    tilt: homeFavoured ? magnitude : -magnitude,
    label: `${phase.name} tilts toward the ${side} (personal days ${homeDay} vs ${awayDay})`,
  };
}

export function cosmicReading(home, away, dayNumber, phase) {
  const homeHarmony = harmonyBetween(home.life_path_number, dayNumber);
  const awayHarmony = harmonyBetween(away.life_path_number, dayNumber);
  const numerologyEdge = clamp((homeHarmony.score - awayHarmony.score) / 2, -1, 1);

  const homeDestiny = harmonyBetween(home.destiny_number, dayNumber);
  const awayDestiny = harmonyBetween(away.destiny_number, dayNumber);
  const destinyEdge = clamp((homeDestiny.score - awayDestiny.score) / 2, -1, 1);

  const elements = elementRelation(home.element, away.element);
  const moon = moonTilt(phase, home.personal_day, away.personal_day);

  const edge = clamp(
    numerologyEdge * 0.35 + destinyEdge * 0.2 + elements.tilt * 0.25 + moon.tilt * 0.2,
    -1,
    1,
  );

  return {
    edge,
    homeHarmony,
    awayHarmony,
    homeDestiny,
    awayDestiny,
    numerologyEdge,
    destinyEdge,
    elements,
    moon,
  };
}

function scenarioMatrix(homeXg, awayXg, edge) {
  const rows = [];
  for (let home = 0; home <= MAX_GOALS; home++) {
    for (let away = 0; away <= MAX_GOALS; away++) {
      const base = poisson(home, homeXg) * poisson(away, awayXg);
      const tilt = Math.exp(edge * TILT_STRENGTH * (home - away));
      rows.push({
        home_score: home,
        away_score: away,
        outcome: home > away ? "home" : away > home ? "away" : "draw",
        probability: base * tilt,
      });
    }
  }
  const total = rows.reduce((sum, row) => sum + row.probability, 0) || 1;
  return rows.map(row => ({ ...row, probability: row.probability / total }));
}

export function buildPrediction({ game, home, away, homeStats, awayStats }) {
  const dayNumber = universalDay(game?.game_date);
  const phase = moonPhase(game?.game_date);

  const homeProfile = buildTeamProfile(home, dayNumber);
  const awayProfile = buildTeamProfile(away, dayNumber);

  const goals = expectedGoals(homeStats, awayStats);
  const cosmic = cosmicReading(homeProfile, awayProfile, dayNumber, phase);

  const rows = scenarioMatrix(goals.homeXg, goals.awayXg, cosmic.edge);
  const outcomeProbability = rows.reduce((acc, row) => {
    acc[row.outcome] += row.probability;
    return acc;
  }, { home: 0, draw: 0, away: 0 });

  const scenarios = [...rows]
    .sort((a, b) => b.probability - a.probability)
    .slice(0, SCENARIO_COUNT)
    .map(row => ({
      outcome: row.outcome,
      home_score: row.home_score,
      away_score: row.away_score,
      likelihood: round1(row.probability * 100),
    }));

  const top = scenarios[0];
  const topOutcomeProbability = outcomeProbability[top.outcome];
  const sampleGames = Math.min(goals.homeGames, goals.awayGames);
  const sampleFactor = clamp(sampleGames / 12, 0.35, 1);
  // Confidence tracks the called outcome's own probability, pulled toward the
  // three-way chance baseline (33%) when the completed-game sample is thin.
  const chanceLevel = 1 / 3;
  const confidence = Math.round(clamp(
    chanceLevel * 100 + (topOutcomeProbability - chanceLevel) * 100 * sampleFactor,
    5,
    92,
  ));

  const dataQuality = sampleGames >= 10 ? "full" : sampleGames >= 4 ? "partial" : "limited";

  let betRecommendation = "no_bet";
  if (confidence >= 55 && sampleGames >= 10) betRecommendation = "strong_bet";
  else if (confidence >= 46 && sampleGames >= 5) betRecommendation = "moderate_bet";
  else if (confidence >= 38) betRecommendation = "light_bet";

  const numerologyScore = Math.round(clamp(50 + (cosmic.numerologyEdge * 0.6 + cosmic.destinyEdge * 0.4) * 45, 5, 95));
  const astrologyScore = Math.round(clamp(50 + (cosmic.elements.tilt * 0.6 + cosmic.moon.tilt * 0.4) * 45, 5, 95));
  const statsScore = Math.round(clamp(50 + (goals.homeXg - goals.awayXg) * 28, 5, 95));
  const cosmicScore = Math.round((numerologyScore + astrologyScore) / 2);

  const sampleNote = dataQuality === "full"
    ? "Both sides have a full season sample behind this."
    : dataQuality === "partial"
      ? `Only ${sampleGames} completed games back this reading, so treat it as provisional.`
      : `Almost no completed-game data (${sampleGames}), so the statistical base is thin.`;

  const isDrawCall = top.outcome === "draw";
  const calledSide = isDrawCall ? "A draw" : top.outcome === "home" ? home.name : away.name;
  const verdict = `${calledSide} ${isDrawCall ? "is" : "are"} the most likely ${isDrawCall ? "outcome" : "winner"} at ${Math.round(topOutcomeProbability * 100)}% (${home.name} ${Math.round(outcomeProbability.home * 100)}%, draw ${Math.round(outcomeProbability.draw * 100)}%, ${away.name} ${Math.round(outcomeProbability.away * 100)}%). ${sampleNote}`;

  const rationale = {
    verdict,
    statistical: [
      `${home.name} score ${goals.homeFor.toFixed(2)} per game and concede ${goals.homeAgainst.toFixed(2)}; ${away.name} score ${goals.awayFor.toFixed(2)} and concede ${goals.awayAgainst.toFixed(2)}.`,
      `That sets expected goals at ${goals.homeXg} for ${home.name} and ${goals.awayXg} for ${away.name}, home advantage included.`,
      `The likeliest scoreline is ${top.home_score}-${top.away_score}, about ${Math.round(top.likelihood)}% of the weighted outcomes.`,
      `Sample: ${goals.homeGames} games for ${home.name}, ${goals.awayGames} for ${away.name}.`,
    ],
    cosmic: [
      `${home.name} life path ${homeProfile.life_path_number} on universal day ${dayNumber}: ${cosmic.homeHarmony.label.toLowerCase()}. ${away.name} life path ${awayProfile.life_path_number}: ${cosmic.awayHarmony.label.toLowerCase()}.`,
      `Destiny numbers ${homeProfile.destiny_number} and ${awayProfile.destiny_number} read as ${cosmic.homeDestiny.label.toLowerCase()} and ${cosmic.awayDestiny.label.toLowerCase()} against the day.`,
      `Elements: ${cosmic.elements.label}.`,
      `Moon: ${cosmic.moon.label}.`,
    ],
  };

  const outcomeOdds = `${home.name} ${Math.round(outcomeProbability.home * 100)}% · Draw ${Math.round(outcomeProbability.draw * 100)}% · ${away.name} ${Math.round(outcomeProbability.away * 100)}%`;

  const inputSnapshot = {
    home: {
      ...homeProfile,
      goals_for_pg: round2(goals.homeFor),
      goals_against_pg: round2(goals.homeAgainst),
      games_played: goals.homeGames,
    },
    away: {
      ...awayProfile,
      goals_for_pg: round2(goals.awayFor),
      goals_against_pg: round2(goals.awayAgainst),
      games_played: goals.awayGames,
    },
    game: {
      universal_day: dayNumber,
      moon_phase: phase?.name || null,
      moon_illumination: phase?.illumination ?? null,
      home_advantage: `+${HOME_BUMP} xG`,
      harmony: `${cosmic.homeHarmony.label} / ${cosmic.awayHarmony.label}`,
      element_relation: cosmic.elements.label,
      outcome_odds: outcomeOdds,
      expected_goals: `${goals.homeXg} vs ${goals.awayXg}`,
      sample_games: sampleGames,
      engine_version: ENGINE_VERSION,
    },
  };

  return {
    predicted_winner_id: top.outcome === "draw" ? "draw" : top.outcome === "home" ? game.home_team_id : game.away_team_id,
    predicted_outcome: top.outcome,
    confidence_score: confidence,
    numerology_score: numerologyScore,
    astrology_score: astrologyScore,
    cosmic_energy_score: cosmicScore,
    battle_stats_score: statsScore,
    predicted_score_diff: top.home_score - top.away_score,
    bet_recommendation: betRecommendation,
    prediction_notes: verdict,
    scenarios: JSON.stringify(scenarios),
    rationale: JSON.stringify(rationale),
    input_snapshot: JSON.stringify(inputSnapshot),
    universal_day: dayNumber,
    moon_phase: phase?.name || null,
    data_quality: dataQuality,
    sample_games: sampleGames,
    engine_version: ENGINE_VERSION,
    is_archived: false,
  };
}