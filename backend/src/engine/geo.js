import { getStopById } from "../data/store.js";

/**
 * Given a route (ordered stopIds + cumulativeKm) and a distance travelled,
 * linearly interpolate a lat/lng between the two bracketing stops. Good
 * enough for a prototype map marker; a real system would follow the
 * actual road polyline instead of a straight line between stops.
 */
export function interpolatePosition(route, currentKm) {
  const km = route.cumulativeKm;
  let i = 0;
  while (i < km.length - 1 && currentKm > km[i + 1]) i++;

  const startStop = getStopById(route.stopIds[i]);
  const endStop = getStopById(route.stopIds[Math.min(i + 1, km.length - 1)]);
  if (!startStop || !endStop) return null;

  const segStart = km[i];
  const segEnd = km[Math.min(i + 1, km.length - 1)];
  const segLen = segEnd - segStart || 1;
  const t = Math.min(1, Math.max(0, (currentKm - segStart) / segLen));

  return {
    lat: startStop.lat + (endStop.lat - startStop.lat) * t,
    lng: startStop.lng + (endStop.lng - startStop.lng) * t,
    nearestPreviousStop: startStop.name,
    nearestNextStop: endStop.name,
  };
}
