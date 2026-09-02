import {
  haversineDistanceMeters,
  isWithinRadius,
  formatDistance,
} from '../../../src/utils/geo';

// Approximate distance between San Francisco and Los Angeles (~560 km straight line).
const SF = { latitude: 37.7749, longitude: -122.4194 };
const LA = { latitude: 34.0522, longitude: -118.2437 };

describe('haversineDistanceMeters', () => {
  it('returns 0 for identical points', () => {
    expect(haversineDistanceMeters(SF, SF)).toBeCloseTo(0, 3);
  });

  it('is symmetric', () => {
    expect(haversineDistanceMeters(SF, LA)).toBeCloseTo(haversineDistanceMeters(LA, SF), 3);
  });

  it('computes a realistic SF→LA distance (~560 km)', () => {
    const meters = haversineDistanceMeters(SF, LA);
    const km = meters / 1000;
    expect(km).toBeGreaterThan(500);
    expect(km).toBeLessThan(620);
  });

  it('approximates 1 degree of latitude ≈ 111 km', () => {
    const oneDegreeNorth = { latitude: SF.latitude + 1, longitude: SF.longitude };
    const km = haversineDistanceMeters(SF, oneDegreeNorth) / 1000;
    expect(km).toBeGreaterThan(109);
    expect(km).toBeLessThan(113);
  });
});

describe('isWithinRadius', () => {
  const gym = { latitude: 37.7749, longitude: -122.4194, radius: 200 };

  it('is inside when very close to the center', () => {
    const nearby = { latitude: 37.7749, longitude: -122.4194 + 0.0005 }; // ~40m
    expect(isWithinRadius(nearby, gym, gym.radius)).toBe(true);
  });

  it('is outside when well beyond the radius', () => {
    const farAway = { latitude: 37.7749, longitude: -122.4194 + 0.05 }; // ~4km
    expect(isWithinRadius(farAway, gym, gym.radius)).toBe(false);
  });

  it('returns false for missing points', () => {
    expect(isWithinRadius(null, gym, gym.radius)).toBe(false);
    expect(isWithinRadius(SF, null, gym.radius)).toBe(false);
  });

  it('treats the exact radius boundary as inside', () => {
    // ~0.9m away from center, radius 1m
    const pos = { latitude: gym.latitude, longitude: gym.longitude + 0.000008 };
    expect(isWithinRadius(pos, gym, 1)).toBe(true);
  });
});

describe('formatDistance', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistance(42)).toBe('42m');
    expect(formatDistance(999.4)).toBe('999m');
  });

  it('formats kilometer distances with one decimal', () => {
    expect(formatDistance(1500)).toBe('1.5km');
    expect(formatDistance(12345)).toBe('12.3km');
  });
});
