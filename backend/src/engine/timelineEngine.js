import { getStopById } from "../data/stops.js";
import { estimateEtaMinutes } from "./etaEngine.js";

/**
 * Build the per-stop timeline for a trip - the data behind the horizontal
 * "Trip Details" strip in the UI (modelled on APSRTC's own Trip Details
 * screen, laid out horizontally here instead of vertically).
 *
 * For each stop on the route this returns:
 *   - scheduledTime: the timetabled time, independent of live position
 *   - actualOrEtaTime: the actual time the bus left that stop (for stops
 *     already behind it) or a live ETA (for stops still ahead)
 *   - status: "LEFT" | "APPROXIMATION"
 *
 * Also returns `busPositionIndex`, a fractional stop index (e.g. 1.4 =
 * 40% of the way from stop 1 to stop 2) used to place the bus icon
 * between two stop markers.
 */
export function buildStopTimeline({ trip, route, now = Date.now() }) {
  const km = route.cumulativeKm;
  const scheduledMin = route.scheduledMinutesFromStart;
  const delayMs = (trip.scheduleDelayMinutes ?? 0) * 60 * 1000;

  const stops = route.stopIds.map((stopId, i) => {
    const stop = getStopById(stopId);
    const isPast =
      trip.status === "COMPLETED" || (trip.status === "ACTIVE" && trip.currentKm >= km[i]);
    const scheduledTime = trip.scheduledStartTime + scheduledMin[i] * 60 * 1000;
    const etaMinutes =
      trip.status === "ACTIVE" && !isPast ? estimateEtaMinutes(Math.max(0, km[i] - trip.currentKm)) : null;

    return {
      stopId,
      stopName: stop?.name ?? stopId,
      scheduledTime,
      actualOrEtaTime: isPast ? scheduledTime + delayMs : etaMinutes != null ? now + etaMinutes * 60 * 1000 : null,
      status: isPast ? "LEFT" : "APPROXIMATION",
      isPast,
    };
  });

  // Fractional position of the bus between two stop indices, so the UI
  // can draw the bus icon between markers rather than snapped to one.
  let busPositionIndex = null;
  if (trip.status === "ACTIVE") {
    for (let i = 0; i < km.length - 1; i++) {
      if (trip.currentKm >= km[i] && trip.currentKm <= km[i + 1]) {
        busPositionIndex = i + (trip.currentKm - km[i]) / (km[i + 1] - km[i] || 1);
        break;
      }
    }
    if (busPositionIndex === null) busPositionIndex = km.length - 1;
  } else if (trip.status === "COMPLETED") {
    busPositionIndex = km.length - 1;
  }

  return { stops, busPositionIndex, delayMinutes: trip.scheduleDelayMinutes ?? 0 };
}
