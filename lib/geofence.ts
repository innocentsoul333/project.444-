// lib/geofence.ts

export type LatLng = {
  lat: number;
  lng: number;
};

const EARTH_RADIUS_METERS = 6371000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function distanceMeters(a: LatLng, b: LatLng) {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);

  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);

  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);

  const aa =
    sinLat * sinLat +
    Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;

  const c = 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));

  return EARTH_RADIUS_METERS * c;
}

export function isInsideGeofence(
  userLocation: LatLng,
  fenceLocation: LatLng,
  radiusMeters: number
) {
  return distanceMeters(userLocation, fenceLocation) <= radiusMeters;
}

export function normalizeLatLng(lat: number, lng: number): LatLng {
  return {
    lat: Number(lat.toFixed(6)),
    lng: Number(lng.toFixed(6)),
  };
}
