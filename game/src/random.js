// A tiny seeded random generator (mulberry32): the same seed always deals the
// same level of jitter, so a screenshot staged with ?seed=N is reproducible.

/** Returns a function that yields a pseudo-random number in [0, 1). */
export function createRandom(seed) {
  let value = seed >>> 0;
  return function random() {
    value = (value + 0x6d2b79f5) >>> 0;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
