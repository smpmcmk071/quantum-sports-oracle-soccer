// Deterministic numerology, astrology and lunar helpers for the prediction engine.
// Every function is pure: same input, same output. No randomness, no external calls.

const MASTER_NUMBERS = [11, 22, 33];

const PYTHAGOREAN = {
  a: 1, b: 2, c: 3, d: 4, e: 5, f: 6, g: 7, h: 8, i: 9,
  j: 1, k: 2, l: 3, m: 4, n: 5, o: 6, p: 7, q: 8, r: 9,
  s: 1, t: 2, u: 3, v: 4, w: 5, x: 6, y: 7, z: 8,
};

const HARMONY_TABLE = {
  1: { friendly: [1, 5, 7], friction: [4, 8] },
  2: { friendly: [2, 4, 8], friction: [5, 7] },
  3: { friendly: [3, 6, 9], friction: [4, 5] },
  4: { friendly: [4, 8, 2], friction: [1, 5, 3] },
  5: { friendly: [5, 1, 7], friction: [2, 4, 6] },
  6: { friendly: [6, 3, 9], friction: [5, 7] },
  7: { friendly: [7, 5, 1], friction: [2, 6, 9] },
  8: { friendly: [8, 2, 4], friction: [1, 5, 3] },
  9: { friendly: [9, 3, 6], friction: [4, 7] },
};

// Air feeds Fire, Water feeds Earth; the reverse pairs suppress instead.
const FEEDS = { Air: "Fire", Water: "Earth" };
const DAMPS = { Water: "Fire", Earth: "Air", Fire: "Earth", Air: "Water" };

const SIGN_ELEMENTS = {
  aries: "Fire", leo: "Fire", sagittarius: "Fire",
  taurus: "Earth", virgo: "Earth", capricorn: "Earth",
  gemini: "Air", libra: "Air", aquarius: "Air",
  cancer: "Water", scorpio: "Water", pisces: "Water",
};

const ZODIAC_STARTS = [
  { sign: "Capricorn", month: 1, day: 1 },
  { sign: "Aquarius", month: 1, day: 20 },
  { sign: "Pisces", month: 2, day: 19 },
  { sign: "Aries", month: 3, day: 21 },
  { sign: "Taurus", month: 4, day: 20 },
  { sign: "Gemini", month: 5, day: 21 },
  { sign: "Cancer", month: 6, day: 21 },
  { sign: "Leo", month: 7, day: 23 },
  { sign: "Virgo", month: 8, day: 23 },
  { sign: "Libra", month: 9, day: 23 },
  { sign: "Scorpio", month: 10, day: 23 },
  { sign: "Sagittarius", month: 11, day: 22 },
  { sign: "Capricorn", month: 12, day: 22 },
];

const CHINESE_ANIMALS = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"];

const MOON_NAMES = ["New moon", "Waxing crescent", "First quarter", "Waxing gibbous", "Full moon", "Waning gibbous", "Last quarter", "Waning crescent"];
const NEW_MOON_EPOCH = Date.parse("2000-01-06T18:14:00Z");
const SYNODIC_MONTH = 29.530588853;

function digitsSum(value) {
  return String(value).split("").filter(c => /\d/.test(c)).reduce((sum, c) => sum + Number(c), 0);
}

export function reduceNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  let n = Math.abs(Math.trunc(Number(value)));
  if (n === 0) return 9;
  while (n > 9 && !MASTER_NUMBERS.includes(n)) {
    n = digitsSum(n);
  }
  return n;
}

// Masters collapse to their root digit for compatibility maths.
export function baseNumber(value) {
  const reduced = reduceNumber(value);
  if (reduced === 11) return 2;
  if (reduced === 22) return 4;
  if (reduced === 33) return 6;
  return reduced;
}

export function dateNumber(dateStr) {
  if (!dateStr) return null;
  const digits = String(dateStr).replace(/\D/g, "");
  if (digits.length < 8) return null;
  return reduceNumber(digitsSum(digits));
}

export function lifePathFromDate(dateStr) {
  return dateNumber(dateStr);
}

export function universalDay(dateStr) {
  return dateNumber(dateStr);
}

export function nameNumber(name) {
  if (!name) return null;
  const letters = String(name).toLowerCase().replace(/[^a-z]/g, "");
  if (!letters) return null;
  const total = letters.split("").reduce((sum, ch) => sum + (PYTHAGOREAN[ch] || 0), 0);
  return reduceNumber(total);
}

export function personalDay(lifePath, dayNumber) {
  const left = reduceNumber(lifePath);
  const right = reduceNumber(dayNumber);
  if (!left || !right) return null;
  return reduceNumber(left + right);
}

export function elementForSign(sign) {
  if (!sign) return null;
  return SIGN_ELEMENTS[String(sign).trim().toLowerCase()] || null;
}

export function zodiacFromDate(dateStr) {
  if (!dateStr) return null;
  const match = String(dateStr).match(/(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const month = Number(match[2]);
  const day = Number(match[3]);
  let found = ZODIAC_STARTS[0].sign;
  for (const entry of ZODIAC_STARTS) {
    if (month > entry.month || (month === entry.month && day >= entry.day)) {
      found = entry.sign;
    }
  }
  return found;
}

export function chineseZodiac(year) {
  if (!year) return null;
  return CHINESE_ANIMALS[((Number(year) - 4) % 12 + 12) % 12];
}

export function moonPhase(dateStr) {
  if (!dateStr) return null;
  const stamp = Date.parse(`${dateStr}T12:00:00Z`);
  if (Number.isNaN(stamp)) return null;
  const elapsedDays = (stamp - NEW_MOON_EPOCH) / 86400000;
  const age = ((elapsedDays % SYNODIC_MONTH) + SYNODIC_MONTH) % SYNODIC_MONTH;
  const fraction = age / SYNODIC_MONTH;
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * fraction)) / 2) * 100);
  const index = Math.floor(fraction * 8 + 0.5) % 8;
  return {
    name: MOON_NAMES[index],
    illumination,
    age: Math.round(age * 10) / 10,
    waxing: fraction < 0.5,
  };
}

export function harmonyBetween(a, b) {
  const left = baseNumber(a);
  const right = baseNumber(b);
  if (!left || !right) return { score: 0, label: "Unknown" };
  if (left === right) return { score: 0, label: "Mirror pairing" };
  const row = HARMONY_TABLE[left];
  if (row && row.friendly.includes(right)) return { score: 1, label: "Harmonious" };
  if (row && row.friction.includes(right)) return { score: -1, label: "Friction" };
  return { score: 0, label: "Neutral" };
}

// Directional: a positive tilt favours the home element.
export function elementRelation(homeElement, awayElement) {
  if (!homeElement || !awayElement) return { tilt: 0, label: "Unknown" };
  if (homeElement === awayElement) return { tilt: 0, label: `Both ${homeElement}` };
  if (FEEDS[homeElement] === awayElement) return { tilt: -1, label: `${homeElement} feeds ${awayElement}` };
  if (FEEDS[awayElement] === homeElement) return { tilt: 1, label: `${awayElement} feeds ${homeElement}` };
  if (DAMPS[homeElement] === awayElement) return { tilt: 1, label: `${homeElement} damps ${awayElement}` };
  if (DAMPS[awayElement] === homeElement) return { tilt: -1, label: `${awayElement} damps ${homeElement}` };
  return { tilt: 0, label: `${homeElement} and ${awayElement} are neutral` };
}