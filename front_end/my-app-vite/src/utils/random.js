// Deterministic pseudo-random helpers used for decorative layouts
// (background shapes, card characters, etc.).
//
// NOTE: This is intentionally simple and not suitable for security-sensitive
// randomness. It is only used to get stable-looking layouts from a string
// seed so that decorations are repeatable but can change when the seed
// changes (e.g. per navigation or per card id).

// xmur3 string hash → 32-bit integer
function xmur3(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i += 1) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function next() {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0; // force unsigned
  };
}

// mulberry32 PRNG from 32-bit seed → function() => [0, 1)
function mulberry32(a) {
  return function rng() {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * createRng
 *
 * Construct a small deterministic RNG from a string or numeric seed.
 *
 * Examples:
 *   const rng = createRng("workshop-12");
 *   const value = rng(); // 0-1
 */
export function createRng(seedInput) {
  let seedStr;
  if (seedInput == null) {
    seedStr = "default-seed";
  } else if (typeof seedInput === "number") {
    seedStr = String(seedInput);
  } else {
    seedStr = String(seedInput);
  }

  const seedFn = xmur3(seedStr);
  const seed = seedFn();
  return mulberry32(seed);
}

/**
 * pickFrom
 *
 * Pick a single element from an array using the provided RNG.
 * Returns null if the array is empty or not an array.
 */
export function pickFrom(rng, arr) {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const r = typeof rng === "function" ? rng() : Math.random();
  const idx = Math.floor(r * arr.length);
  return arr[idx];
}
