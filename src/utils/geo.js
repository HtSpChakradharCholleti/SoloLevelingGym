// Pure geospatial helpers for geofencing (distance + radius checks).
// Kept free of React / native imports so it's trivially unit-testable.

const EARTH_RADIUS_M = 6371000; // mean Earth radius, meters
const TO_RADIANS = Math.PI / 180;

/**
 * Great-circle distance between two lat/lng points (haversine formula).
 * @param {{latitude: number, longitude: number}} a
 * @param {{latitude: number, longitude: number}} b
 * @returns {number} distance in meters (>= 0)
 */
export function haversineDistanceMeters(a, b) {
  const lat1 = a.latitude * TO_RADIANS;
  const lat2 = b.latitude * TO_RADIANS;
  const dLat = (b.latitude - a.latitude) * TO_RADIANS;
  const dLng = (b.longitude - a.longitude) * TO_RADIANS;

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Whether point `pos` falls within `radiusMeters` of center `center`.
 * @param {{latitude: number, longitude: number}} pos
 * @param {{latitude: number, longitude: number}} center
 * @param {number} radiusMeters
 * @returns {boolean}
 */
export function isWithinRadius(pos, center, radiusMeters) {
  if (!pos || !center) return false;
  return haversineDistanceMeters(pos, center) <= radiusMeters;
}

/**
 * Human-readable distance, meters → "Xm" / "X.Xkm".
 * @param {number} meters
 * @returns {string}
 */
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
}
