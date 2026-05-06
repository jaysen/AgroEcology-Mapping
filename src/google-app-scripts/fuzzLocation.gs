/**
 * Coordinate fuzzing for geolocation privacy.
 *
 * Displaces a coordinate by a random offset within an annulus
 * [minRadiusKm, maxRadiusKm], guaranteeing the pin is always
 * meaningfully far from the true location.
 *
 * Distribution: uniform-area annulus via r = sqrt(lerp(min², max², u))
 * so area is evenly covered with no clustering at edges.
 *
 * Usage in Sheets:
 *   =FUZZ_LAT(A2, B2)           -- fuzz with default radius (1–2 km)
 *   =FUZZ_LAT(A2, B2, 0.5, 1)  -- fuzz with custom min/max radius
 *   =FUZZ_LNG(A2, B2)
 *   =FUZZ_LNG(A2, B2, 0.5, 1)
 *
 * IMPORTANT: These use Math.random() — values change on every recalculation.
 * Once you have acceptable fuzzed coordinates, paste them as VALUES only
 * (Edit > Paste special > Values only) to freeze them.
 */

const EARTH_RADIUS_KM = 6371;
const DEFAULT_MIN_RADIUS_KM = 1.0;
const DEFAULT_MAX_RADIUS_KM = 2.0;

/**
 * Compute a single fuzzed displacement vector.
 * Returns { deltaLat, deltaLng } in degrees.
 * Both components share the same r and theta — the vector is coherent.
 *
 * @param {number} lat - Original latitude in degrees
 * @param {number} minRadiusKm - Inner radius of annulus
 * @param {number} maxRadiusKm - Outer radius of annulus
 * @returns {{ deltaLat: number, deltaLng: number }}
 */
function _fuzzDelta(lat, minRadiusKm, maxRadiusKm) {
  if (minRadiusKm >= maxRadiusKm) {
    throw new Error(`minRadiusKm (${minRadiusKm}) must be less than maxRadiusKm (${maxRadiusKm})`);
  }

  const minSq = minRadiusKm * minRadiusKm;
  const maxSq = maxRadiusKm * maxRadiusKm;

  // Uniform area distribution over annulus
  const r = Math.sqrt(minSq + Math.random() * (maxSq - minSq));
  const theta = Math.random() * 2 * Math.PI;

  const latRad = lat * (Math.PI / 180);
  const radToDeg = 180 / Math.PI;

  const deltaLat = (r * Math.cos(theta) / EARTH_RADIUS_KM) * radToDeg;
  const deltaLng = (r * Math.sin(theta) / (EARTH_RADIUS_KM * Math.cos(latRad))) * radToDeg;

  return { deltaLat, deltaLng };
}

/**
 * Returns a fuzzed latitude displaced by a random offset within [minRadiusKm, maxRadiusKm].
 *
 * @param {number} lat Original latitude
 * @param {number} lng Original longitude (needed for vector coherence — both axes must share the same r/theta)
 * @param {number} [minRadiusKm=1.0] Inner radius of displacement annulus in km
 * @param {number} [maxRadiusKm=2.0] Outer radius of displacement annulus in km
 * @return {number} Fuzzed latitude clamped to [-90, 90]
 * @customfunction
 */
function FUZZ_LAT(lat, lng, minRadiusKm, maxRadiusKm) {
  minRadiusKm = minRadiusKm || DEFAULT_MIN_RADIUS_KM;
  maxRadiusKm = maxRadiusKm || DEFAULT_MAX_RADIUS_KM;

  const { deltaLat } = _fuzzDelta(lat, minRadiusKm, maxRadiusKm);
  return Math.max(-90, Math.min(90, lat + deltaLat));
}

/**
 * Returns a fuzzed longitude displaced by a random offset within [minRadiusKm, maxRadiusKm].
 * Must use the same cell references as the paired FUZZ_LAT call — but NOTE: because
 * each call to FUZZ_LAT/FUZZ_LNG generates independent r/theta values, the lat and lng
 * offsets will not be from the same vector. See FUZZ_COORDS for a paired output.
 *
 * @param {number} lat Original latitude
 * @param {number} lng Original longitude
 * @param {number} [minRadiusKm=1.0] Inner radius of displacement annulus in km
 * @param {number} [maxRadiusKm=2.0] Outer radius of displacement annulus in km
 * @return {number} Fuzzed longitude wrapped to [-180, 180]
 * @customfunction
 */
function FUZZ_LNG(lat, lng, minRadiusKm, maxRadiusKm) {
  minRadiusKm = minRadiusKm || DEFAULT_MIN_RADIUS_KM;
  maxRadiusKm = maxRadiusKm || DEFAULT_MAX_RADIUS_KM;

  const { deltaLng } = _fuzzDelta(lat, minRadiusKm, maxRadiusKm);
  let fuzzedLng = lng + deltaLng;
  if (fuzzedLng > 180) fuzzedLng -= 360;
  if (fuzzedLng < -180) fuzzedLng += 360;
  return fuzzedLng;
}

/**
 * Returns BOTH fuzzed coordinates as a 1×2 array [fuzzed_lat, fuzzed_lng].
 * This is the PREFERRED function — lat and lng share the same r/theta so the
 * displacement vector is coherent (the pin lands where it's supposed to).
 *
 * Use as an array formula across two adjacent columns:
 *   Select C2:D2, type =FUZZ_COORDS(A2, B2), press Ctrl+Shift+Enter
 *
 * Or in modern Sheets simply enter in C2 and it will spill into D2.
 *
 * @param {number} lat Original latitude
 * @param {number} lng Original longitude
 * @param {number} [minRadiusKm=1.0] Inner radius of displacement annulus in km
 * @param {number} [maxRadiusKm=2.0] Outer radius of displacement annulus in km
 * @return {number[][]} 1×2 array: [[fuzzed_lat, fuzzed_lng]]
 * @customfunction
 */
function FUZZ_COORDS(lat, lng, minRadiusKm, maxRadiusKm) {
  minRadiusKm = minRadiusKm || DEFAULT_MIN_RADIUS_KM;
  maxRadiusKm = maxRadiusKm || DEFAULT_MAX_RADIUS_KM;

  const { deltaLat, deltaLng } = _fuzzDelta(lat, minRadiusKm, maxRadiusKm);

  const fuzzedLat = Math.max(-90, Math.min(90, lat + deltaLat));
  let fuzzedLng = lng + deltaLng;
  if (fuzzedLng > 180) fuzzedLng -= 360;
  if (fuzzedLng < -180) fuzzedLng += 360;

  return [[fuzzedLat, fuzzedLng]];
}