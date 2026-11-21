export function parseJson(value, fallback) {
  if (value === null || value === undefined || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

export const OUTCOME_LABEL = {
  home: "Home win",
  away: "Away win",
  draw: "Draw",
};

export const BET_LABEL = {
  strong_bet: "Strong lean",
  moderate_bet: "Moderate lean",
  light_bet: "Light lean",
  no_bet: "No lean",
};

export const BET_TONE = {
  strong_bet: "text-emerald-400 bg-emerald-400/10",
  moderate_bet: "text-cyan-400 bg-cyan-400/10",
  light_bet: "text-amber-400 bg-amber-400/10",
  no_bet: "text-white/40 bg-white/5",
};

export function confidenceTone(value) {
  if (value >= 70) return "text-emerald-400 bg-emerald-400/10";
  if (value >= 50) return "text-amber-400 bg-amber-400/10";
  return "text-rose-400 bg-rose-400/10";
}

export function qualityLabel(quality) {
  if (quality === "full") return "Full stat sample";
  if (quality === "partial") return "Partial stat sample";
  return "Limited stat sample";
}

export function perGame(total, games) {
  if (!games) return null;
  return Number(total / games).toFixed(2);
}