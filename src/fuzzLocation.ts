/**
 * Coordinate fuzzing for geolocation privacy.
 *
 * Farm and project locations are private. Pins on the public map must never
 * reveal a precise address. This module displaces every coordinate by a random
 * offset that falls within a configurable annulus [FUZZ_RADIUS_MIN_KM,
 * FUZZ_RADIUS_MAX_KM], guaranteeing the pin is always meaningfully far from
 * the true location but still within a recognisable area.
 *
 * ## Distribution
 * Offsets are drawn from a uniform-area annulus (not a full disk). The radius
 * is sampled as r = sqrt(lerp(min², max², u)) so that area is evenly covered
 * — no clustering near the inner or outer edge. Direction (theta) is uniform
 * over [0, 2π).
 *
 * ## Determinism & pin stability
 * When a `seed` string is supplied, a mulberry32 PRNG is used instead of
 * Math.random. The same seed always produces the same offset, so pins do not
 * jump between page reloads. This means the direction from origin → fuzzed pin
 * is fixed per seed — an acceptable trade-off for UX stability. If pin
 * direction stability is a concern, omit the seed (random each load) or rotate
 * the seed on a schedule (e.g. weekly).
 *
 * ## Edge cases
 * - Latitude is clamped to [-90, 90] after displacement.
 * - Longitude is wrapped to [-180, 180] after displacement.
 * - Throws if minRadiusKm >= radiusKm.
 *
 * Spec ref: ProjectSpec.md §1 "Pins must not be geo-precise", §4 obfuscation.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FuzzOptions {
  /** Maximum displacement in kilometres. Defaults to FUZZ_RADIUS_MAX_KM. */
  radiusKm?: number;
  /** Minimum displacement in kilometres. Defaults to FUZZ_RADIUS_MIN_KM.
   * Must be > 0 and < radiusKm — enforces a hard privacy floor. */
  minRadiusKm?: number;
  /** Seed string for deterministic output (same seed → same offset every call).
   * Pin direction is fixed per seed — see module doc for trade-off discussion.
   * Omit to use Math.random (different offset each call). */
  seed?: string;
}

const EARTH_RADIUS_KM = 6371;
const RAD_TO_DEG = 180 / Math.PI;
const DEG_TO_RAD = Math.PI / 180;

// ─── Fuzzing radius defaults (kilometres) ────────────────────────────────────
// Adjust these to tune how far pins are displaced from true coordinates.
// MIN must be > 0 and < MAX.
export const FUZZ_RADIUS_MIN_KM = 1.00; // closest a pin can land to the real location
export const FUZZ_RADIUS_MAX_KM = 2.00; // furthest a pin can land from the real location

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Simple deterministic pseudo-random number generator (mulberry32).
 * Returns a function that yields values in [0, 1).
 */
function makeSeededRng(seed: string): () => number {
  // Hash the seed string to a 32-bit integer
  let h = 0x9e3779b9;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 0x85ebca6b);
    h ^= h >>> 13;
  }
  let state = h >>> 0;
  return function mulberry32() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 0x100000000;
  };
}

interface FuzzDelta {
  deltaLat: number;
  deltaLng: number;
}

/**
 * Compute a fuzzed displacement vector for the given origin and options.
 *
 * Factored out of fuzzLocation so that both lat and lng deltas are derived
 * from the same r and theta — keeping the displacement vector coherent.
 * Both components use the same conversion factor (r / EARTH_RADIUS_KM * RAD_TO_DEG);
 * the only difference is cos vs sin for direction, and the longitude component
 * divides by cos(lat) to account for meridian convergence at higher latitudes.
 */
function computeFuzzDelta(coords: LatLng, rng: () => number, minRadiusKm: number, maxRadiusKm: number): FuzzDelta {
  const minSq = minRadiusKm * minRadiusKm;
  const maxSq = maxRadiusKm * maxRadiusKm;

  // Uniform area distribution over annulus [minRadiusKm, maxRadiusKm]
  const r = Math.sqrt(minSq + rng() * (maxSq - minSq));
  const theta = rng() * 2 * Math.PI;

  const latRad = coords.lat * DEG_TO_RAD;
  const kmToDeg = r / EARTH_RADIUS_KM * RAD_TO_DEG;

  return {
    deltaLat: kmToDeg * Math.cos(theta),
    deltaLng: kmToDeg * Math.sin(theta) / Math.cos(latRad),
  };
}

/**
 * Displace a single coordinate by a random offset within the annulus
 * [minRadiusKm, radiusKm]. Returns a new LatLng; the input is not modified.
 */
export function fuzzLocation(coords: LatLng, options: FuzzOptions = {}): LatLng {
  const maxRadiusKm = options.radiusKm ?? FUZZ_RADIUS_MAX_KM;
  const minRadiusKm = options.minRadiusKm ?? FUZZ_RADIUS_MIN_KM;

  if (minRadiusKm >= maxRadiusKm) {
    throw new Error(`minRadiusKm (${minRadiusKm}) must be less than radiusKm (${maxRadiusKm})`);
  }

  const rng = options.seed !== undefined ? makeSeededRng(options.seed) : Math.random;

  const { deltaLat, deltaLng } = computeFuzzDelta(coords, rng, minRadiusKm, maxRadiusKm);

  const lat = Math.max(-90, Math.min(90, coords.lat + deltaLat));
  let lng = coords.lng + deltaLng;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;

  return { lat, lng };
}

/**
 * Displace an array of coordinates, each with an independent offset.
 * When a seed is provided, each entry's seed is derived as `${seed}:${index}`
 * so every pin lands in a different spot while remaining individually stable.
 */
export function fuzzLocations(
  coords: LatLng[],
  options: FuzzOptions = {}
): LatLng[] {
  return coords.map((c, i) => {
    const seed = options.seed !== undefined
      ? `${options.seed}:${i}`
      : undefined;
    return fuzzLocation(c, { ...options, seed });
  });
}