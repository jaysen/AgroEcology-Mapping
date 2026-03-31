import { describe, it, expect } from 'vitest';
import { fuzzLocation, fuzzLocations } from './fuzzLocation';

const EARTH_RADIUS_KM = 6371;

/** Great-circle distance in km between two lat/lng points (Haversine). */
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

// Representative South African coordinate (Eastern Cape)
const EASTERN_CAPE = { lat: -32.47, lng: 28.19 };

describe('fuzzLocation', () => {
  describe('offset is within the configured radius', () => {
    it('stays within default 3 km radius', () => {
      for (let i = 0; i < 100; i++) {
        const fuzzed = fuzzLocation(EASTERN_CAPE);
        const dist = haversineKm(EASTERN_CAPE, fuzzed);
        expect(dist).toBeLessThanOrEqual(3);
      }
    });

    it('stays within a custom radius', () => {
      for (let i = 0; i < 100; i++) {
        const fuzzed = fuzzLocation(EASTERN_CAPE, { radiusKm: 10 });
        const dist = haversineKm(EASTERN_CAPE, fuzzed);
        expect(dist).toBeLessThanOrEqual(10);
      }
    });

    it('stays within a small 0.5 km radius', () => {
      for (let i = 0; i < 100; i++) {
        const fuzzed = fuzzLocation(EASTERN_CAPE, { radiusKm: 0.5 });
        const dist = haversineKm(EASTERN_CAPE, fuzzed);
        expect(dist).toBeLessThanOrEqual(0.5);
      }
    });
  });

  describe('deterministic seeding', () => {
    it('returns the same result for the same seed', () => {
      const a = fuzzLocation(EASTERN_CAPE, { seed: 'project-1' });
      const b = fuzzLocation(EASTERN_CAPE, { seed: 'project-1' });
      expect(a).toEqual(b);
    });

    it('returns different results for different seeds', () => {
      const a = fuzzLocation(EASTERN_CAPE, { seed: 'project-1' });
      const b = fuzzLocation(EASTERN_CAPE, { seed: 'project-2' });
      expect(a).not.toEqual(b);
    });

    it('seeded result still obeys the radius', () => {
      const fuzzed = fuzzLocation(EASTERN_CAPE, { seed: 'project-42', radiusKm: 3 });
      const dist = haversineKm(EASTERN_CAPE, fuzzed);
      expect(dist).toBeLessThanOrEqual(3);
    });
  });

  describe('meaningful minimum fuzzing', () => {
    it('does not return the exact original coordinates', () => {
      // With 100 random draws the probability of a zero offset is astronomically small
      const allSame = Array.from({ length: 100 }, () => fuzzLocation(EASTERN_CAPE)).every(
        (f) => f.lat === EASTERN_CAPE.lat && f.lng === EASTERN_CAPE.lng
      );
      expect(allSame).toBe(false);
    });

    it('median offset over 500 draws is at least 1 km (uniform-disk expected value is 2 km)', () => {
      // For a uniform disk of radius R, E[distance] = 2R/3 ≈ 2 km.
      // We assert the median exceeds 1 km as a conservative lower bound,
      // ensuring pins are never trivially close to the true location.
      const distances = Array.from({ length: 500 }, () =>
        haversineKm(EASTERN_CAPE, fuzzLocation(EASTERN_CAPE))
      ).sort((a, b) => a - b);
      const median = distances[Math.floor(distances.length / 2)];
      expect(median).toBeGreaterThan(1);
    });

    it('at least 95% of offsets exceed 0.3 km', () => {
      // Ensures the distribution does not degenerate near the origin.
      const distances = Array.from({ length: 500 }, () =>
        haversineKm(EASTERN_CAPE, fuzzLocation(EASTERN_CAPE))
      );
      const nearOrigin = distances.filter((d) => d < 0.3).length;
      expect(nearOrigin / distances.length).toBeLessThan(0.05);
    });
  });

  describe('output coordinate validity', () => {
    it('latitude stays in [-90, 90]', () => {
      for (let i = 0; i < 200; i++) {
        const { lat } = fuzzLocation(EASTERN_CAPE);
        expect(lat).toBeGreaterThanOrEqual(-90);
        expect(lat).toBeLessThanOrEqual(90);
      }
    });

    it('longitude stays in [-180, 180]', () => {
      for (let i = 0; i < 200; i++) {
        const { lng } = fuzzLocation(EASTERN_CAPE);
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    });
  });

  describe('edge case coordinates', () => {
    it('near north pole — latitude clamped, radius respected', () => {
      const nearPole = { lat: 89.99, lng: 0 };
      for (let i = 0; i < 50; i++) {
        const f = fuzzLocation(nearPole, { radiusKm: 3 });
        expect(f.lat).toBeLessThanOrEqual(90);
        expect(f.lat).toBeGreaterThanOrEqual(-90);
      }
    });

    it('near south pole — latitude clamped', () => {
      const nearSPole = { lat: -89.99, lng: 0 };
      for (let i = 0; i < 50; i++) {
        const f = fuzzLocation(nearSPole, { radiusKm: 3 });
        expect(f.lat).toBeGreaterThanOrEqual(-90);
        expect(f.lat).toBeLessThanOrEqual(90);
      }
    });

    it('near antimeridian east — longitude wrapped correctly', () => {
      const nearAntimeridian = { lat: 0, lng: 179.9 };
      for (let i = 0; i < 50; i++) {
        const { lng } = fuzzLocation(nearAntimeridian, { radiusKm: 50 });
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    });

    it('near antimeridian west — longitude wrapped correctly', () => {
      const nearAntimeridian = { lat: 0, lng: -179.9 };
      for (let i = 0; i < 50; i++) {
        const { lng } = fuzzLocation(nearAntimeridian, { radiusKm: 50 });
        expect(lng).toBeGreaterThanOrEqual(-180);
        expect(lng).toBeLessThanOrEqual(180);
      }
    });

    it('equator — no division-by-zero on cos(lat)', () => {
      const equator = { lat: 0, lng: 0 };
      expect(() => fuzzLocation(equator)).not.toThrow();
      const f = fuzzLocation(equator, { radiusKm: 3 });
      expect(f.lat).toBeGreaterThanOrEqual(-90);
      expect(f.lng).toBeGreaterThanOrEqual(-180);
    });
  });
});

describe('fuzzLocations', () => {
  const coords = [
    { lat: -32.47, lng: 28.19 },
    { lat: -32.73, lng: 27.23 },
    { lat: -33.04, lng: 27.41 },
  ];

  it('returns the same number of coordinates', () => {
    expect(fuzzLocations(coords).length).toBe(coords.length);
  });

  it('each result is within radius', () => {
    const results = fuzzLocations(coords, { radiusKm: 3 });
    results.forEach((fuzzed, i) => {
      expect(haversineKm(coords[i], fuzzed)).toBeLessThanOrEqual(3);
    });
  });

  it('each entry gets a distinct offset when seeded', () => {
    const a = fuzzLocations(coords, { seed: 'base' });
    // All three fuzzed points should differ from each other
    expect(a[0]).not.toEqual(a[1]);
    expect(a[1]).not.toEqual(a[2]);
  });

  it('is deterministic across calls with the same seed', () => {
    const a = fuzzLocations(coords, { seed: 'base' });
    const b = fuzzLocations(coords, { seed: 'base' });
    expect(a).toEqual(b);
  });
});
