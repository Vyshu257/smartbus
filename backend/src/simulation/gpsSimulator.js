import { getRouteById, store } from "../data/store.js";
import { AVG_SPEED_KMPH } from "../data/seedBuses.js";

const TICK_MS = 5000; // "Live Simulation" tick interval

/**
 * Moves every ACTIVE trip a little further along its route each tick, so
 * the map and ETA figures visibly update. Marks a trip COMPLETED once it
 * reaches the end of its route. This stands in for a real GPS feed -
 * swap this whole module out (or just don't start it) once a real
 * provider supplies live positions.
 */
export function startGpsSimulation() {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const trip of store.buses) {
      if (trip.status !== "ACTIVE") continue;

      const route = getRouteById(trip.routeId);
      if (!route) continue;

      const totalKm = route.cumulativeKm[route.cumulativeKm.length - 1];
      const kmPerTick = (AVG_SPEED_KMPH * (TICK_MS / 1000)) / 3600;
      // small random jitter so buses don't all move in perfect lockstep
      const jitter = 0.85 + Math.random() * 0.3;

      trip.currentKm = Math.min(totalKm, trip.currentKm + kmPerTick * jitter);
      trip.updatedAt = now;

      if (trip.currentKm >= totalKm) {
        trip.status = "COMPLETED";
      }
    }
  }, TICK_MS);

  // don't keep the Node process alive just for this timer in test runs
  timer.unref?.();
  return timer;
}
