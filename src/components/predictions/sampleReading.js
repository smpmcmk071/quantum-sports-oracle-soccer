// Labeled demonstration data used only when no real predictions exist yet.
export const SAMPLE_HOME = {
  id: "sample-home",
  name: "Inter Miami",
  city: "Miami",
  life_path_number: 7,
  destiny_number: 5,
  city_numerology: 3,
  zodiac_sign: "Aquarius",
  element: "Air",
  personal_day: 3,
  goals_for_pg: "1.84",
  goals_against_pg: "1.12",
};

export const SAMPLE_AWAY = {
  id: "sample-away",
  name: "LAFC",
  city: "Los Angeles",
  life_path_number: 4,
  destiny_number: 9,
  city_numerology: 6,
  zodiac_sign: "Pisces",
  element: "Water",
  personal_day: 6,
  goals_for_pg: "1.47",
  goals_against_pg: "1.28",
};

export const SAMPLE_GAME = {
  id: "sample-game",
  game_date: "2026-03-21",
  venue: "Chase Stadium",
  home_team_id: SAMPLE_HOME.id,
  away_team_id: SAMPLE_AWAY.id,
};

export const SAMPLE_PREDICTION = {
  id: "sample-prediction",
  game_id: SAMPLE_GAME.id,
  predicted_winner_id: SAMPLE_HOME.id,
  confidence_score: 58,
  numerology_score: 71,
  astrology_score: 62,
  cosmic_energy_score: 66,
  battle_stats_score: 64,
  bet_recommendation: "light_bet",
  data_quality: "full",
  scenarios: JSON.stringify([
    { outcome: "home", home_score: 2, away_score: 1, likelihood: 14 },
    { outcome: "draw", home_score: 1, away_score: 1, likelihood: 12 },
    { outcome: "away", home_score: 1, away_score: 2, likelihood: 9 },
  ]),
  rationale: JSON.stringify({
    verdict:
      "Miami carries the stronger season baseline and a friendlier game-day number. The gap is real but small, so the second and third scorelines stay plausible.",
    statistical: [
      "Miami scores 1.84 per game against LAFC's 1.47.",
      "Home advantage adds roughly 0.25 expected goals.",
      "Both defences concede at a similar rate, so the edge is in attack.",
    ],
    cosmic: [
      "Miami's life path 7 meets universal day 3: a supportive pairing.",
      "LAFC's life path 4 against universal day 3 is a friction pairing.",
      "Waxing moon favours the side with the higher personal day.",
    ],
  }),
  input_snapshot: JSON.stringify({
    home: SAMPLE_HOME,
    away: SAMPLE_AWAY,
    game: {
      universal_day: 3,
      moon_phase: "Waxing gibbous",
      moon_illumination: 71,
      home_advantage: "+0.25 xG",
      harmony: "Supportive",
      element_relation: "Air feeds Water",
    },
  }),
};