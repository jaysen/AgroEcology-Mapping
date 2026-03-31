/**
 * Coordinate fuzzing for geolocation privacy.
 *
 * Pins must not be geo-precise — exact farm/project locations are private.
 * Applies a random offset within a configurable radius (default ±3 km) using
 * a uniform-disk distribution so offsets are spread evenly, not biased toward
 * the centre.
 *
 * Spec ref: ProjectSpec.md §1 "Pins must not be geo-precise"
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export interface FuzzOptions {
  /** Maximum obfuscation radius in kilometres. Default: 3 */
  radiusKm?: number;
  /** Minimum obfuscation radius in kilometres. Default: 1.
   *  Ensures pins are never placed too close to the real location. */
  minRadiusKm?: number;
  /** Optional seed string for deterministic fuzzing (same input → same output).
   *  Useful for stable pin positions across page reloads without storing fuzzed coords. */
  seed?: string;
}

const EARTH_RADIUS_KM = 6371;

// ─── Fuzzing radius defaults (kilometres) ────────────────────────────────────
// Adjust these to tune how far pins are displaced from true coordinates.
// MIN must be > 0 and < MAX.
export const FUZZ_RADIUS_MIN_KM = 1;   // closest a pin can land to the real location
export const FUZZ_RADIUS_MAX_KM = 3;   // furthest a pin can land from the real location
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

/**
 * Apply a random offset to a coordinate, keeping it within `radiusKm`.
 * Uses a uniform-disk distribution (square-root of uniform radius) to avoid
 * clustering near the centre.
 *
 * Edge cases handled:
 * - Latitude is clamped to [-90, 90]
 * - Longitude is wrapped to [-180, 180]
 */
export function fuzzLocation(coords: LatLng, options: FuzzOptions = {}): LatLng {
  const maxRadiusKm = options.radiusKm ?? FUZZ_RADIUS_MAX_KM;
  const minRadiusKm = options.minRadiusKm ?? FUZZ_RADIUS_MIN_KM;

  if (minRadiusKm >= maxRadiusKm) {
    throw new Error(`minRadiusKm (${minRadiusKm}) must be less than radiusKm (${maxRadiusKm})`);
  }

  const rng = options.seed !== undefined
    ? makeSeededRng(options.seed)
    : Math.random;

  // Uniform-disk over an annulus [minRadiusKm, maxRadiusKm]:
  // r = sqrt(lerp(min², max², u)) ensures uniform area distribution within the ring.
  const minSq = minRadiusKm * minRadiusKm;
  const maxSq = maxRadiusKm * maxRadiusKm;
  const r = Math.sqrt(minSq + rng() * (maxSq - minSq));
  const theta = rng() * 2 * Math.PI;

  // Convert km offset to degrees
  const deltaLat = (r * Math.cos(theta)) / EARTH_RADIUS_KM * (180 / Math.PI);
  const deltaLng = (r * Math.sin(theta)) /
    (EARTH_RADIUS_KM * Math.cos(coords.lat * (Math.PI / 180))) *
    (180 / Math.PI);

  // Clamp latitude, wrap longitude
  const lat = Math.max(-90, Math.min(90, coords.lat + deltaLat));
  let lng = coords.lng + deltaLng;
  if (lng > 180) lng -= 360;
  if (lng < -180) lng += 360;

  return { lat, lng };
}

/**
 * Fuzz an array of coordinates, each with a unique deterministic seed derived
 * from a base seed + index. Useful for stable map pins across reloads.
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
