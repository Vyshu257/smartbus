import { stopIndexOnRoute } from "../data/store.js";
import { estimateEtaMinutes, estimateCatchability } from "./etaEngine.js";
import { estimateOccupancy } from "./occupancyEngine.js";

// How close (km) the bus has to be to a stop to count as "at" it.
const AT_STOP_TOLERANCE_KM = 0.5;
// Below this distance from the boarding stop, a bus is "APPROACHING"
// rather than just "COMING".
const APPROACHING_RADIUS_KM = 8;
// If a trip's GPS hasn't updated in this long, treat location as stale.
const STALE_LOCATION_MS = 3 * 60 * 1000;

/**
 * Work out this trip's status *relative to a specific boarding stop*,
 * purely from its position along its own route. This is what lets us
 * distinguish "approaching my stop" from "already passed my stop" from
 * "completed the whole route", using stop ORDER rather than stop names.
 */
function classifyStatus(trip, fromKm) {
  if (trip.status === "COMPLETED") return "COMPLETED";
  if (trip.status === "NOT_STARTED") return "NOT_STARTED";

  const distanceToBoarding = fromKm - trip.currentKm;

  if (Math.abs(distanceToBoarding) <= AT_STOP_TOLERANCE_KM) return "AT_STOP";
  if (distanceToBoarding < 0) return "PASSED"; // currentKm already beyond boarding stop
  if (distanceToBoarding <= APPROACHING_RADIUS_KM) return "APPROACHING";
  return "COMING";
}

const STATUS_BADGES = {
  AT_STOP: "🟢 AT YOUR STOP",
  APPROACHING: "🟢 APPROACHING",
  COMING: "🟡 COMING",
  PASSED: "🔴 PASSED",
  COMPLETED: "🔴 COMPLETED",
  NOT_STARTED: "⚫ NOT YET STARTED",
  LOCATION_UNAVAILABLE: "⚫ LOCATION UNAVAILABLE",
};

// Statuses that should never appear in the default "available now" list.
const EXCLUDED_BY_DEFAULT = new Set(["PASSED", "COMPLETED", "NOT_STARTED"]);

/**
 * Evaluate a single trip against a requested from -> to search, applying
 * every rule in spec section 5 (steps 1-14). Returns null if the trip is
 * not a candidate at all (wrong route, wrong direction, wrong stops,
 * wrong service type) - as opposed to a candidate that is merely
 * PASSED/COMPLETED, which we still return so callers can choose to show
 * it if they explicitly ask for "all results" rather than "available now".
 */
export function evaluateTrip({ trip, route, fromStopId, toStopId, serviceType, now = Date.now() }) {
  // 1 & 2: must serve both requested stops
  const fromIdx = stopIndexOnRoute(route, fromStopId);
  const toIdx = stopIndexOnRoute(route, toStopId);
  if (fromIdx === -1 || toIdx === -1) return null;

  // 4 & 5: direction + stop sequence - "from" must come before "to" on
  // THIS route. A route running the opposite way will simply fail this
  // check and never surface, e.g. Kurnool -> Orvakal -> Nannur when the
  // passenger searched Nannur -> Kurnool.
  if (fromIdx >= toIdx) return null;

  // 3: service type filter (skip when caller asked for "All")
  if (serviceType && serviceType !== "All" && trip.serviceType !== serviceType) {
    return null;
  }

  const fromKm = route.cumulativeKm[fromIdx];
  const toKm = route.cumulativeKm[toIdx];

  // 6, 7, 8, 9, 10, 11: current time + GPS position determine status
  const status = classifyStatus(trip, fromKm);

  const locationStale =
    trip.updatedAt != null && now - trip.updatedAt > STALE_LOCATION_MS;
  const effectiveStatus =
    trip.status === "ACTIVE" && locationStale ? "LOCATION_UNAVAILABLE" : status;

  const distanceToBoardingKm =
    trip.status === "ACTIVE" ? Math.max(0, +(fromKm - trip.currentKm).toFixed(1)) : null;
  const distanceToDestKm =
    trip.status === "ACTIVE" ? Math.max(0, +(toKm - trip.currentKm).toFixed(1)) : null;

  const etaToBoardingMinutes =
    distanceToBoardingKm != null ? estimateEtaMinutes(distanceToBoardingKm) : null;
  const etaToDestMinutes =
    distanceToDestKm != null ? estimateEtaMinutes(distanceToDestKm) : null;

  const catchability = estimateCatchability({
    etaToBoardingMinutes: etaToBoardingMinutes ?? Infinity,
    status: effectiveStatus,
  });

  return {
    tripId: trip.tripId,
    busNumber: trip.busNumber,
    serviceNumber: trip.serviceNumber,
    serviceType: trip.serviceType,
    routeId: route.id,
    routeName: route.name,
    fromStopId,
    toStopId,
    status: effectiveStatus,
    statusBadge: STATUS_BADGES[effectiveStatus],
    distanceToBoardingKm,
    distanceToDestKm,
    etaToBoardingMinutes,
    etaToDestMinutes,
    catchability,
    updatedAt: trip.updatedAt,
    locationStale,
    isDefaultVisible: !EXCLUDED_BY_DEFAULT.has(effectiveStatus),
  };
}

/**
 * 15: sort the remaining buses by usefulness.
 * Order: at boarding point > closest to boarding point > lowest ETA >
 * lower crowd > everything else. Crowd is attached by the caller after
 * this function runs (it needs occupancy data), so sortByUsefulness
 * accepts an optional crowd score.
 */
export function sortByUsefulness(evaluated) {
  const rank = { AT_STOP: 0, APPROACHING: 1, COMING: 2 };
  return [...evaluated].sort((a, b) => {
    const ra = rank[a.status] ?? 99;
    const rb = rank[b.status] ?? 99;
    if (ra !== rb) return ra - rb;

    const da = a.distanceToBoardingKm ?? Infinity;
    const db = b.distanceToBoardingKm ?? Infinity;
    if (da !== db) return da - db;

    const ea = a.etaToBoardingMinutes ?? Infinity;
    const eb = b.etaToBoardingMinutes ?? Infinity;
    if (ea !== eb) return ea - eb;

    const ca = a.occupancy?.occupancyPercent ?? 0;
    const cb = b.occupancy?.occupancyPercent ?? 0;
    return ca - cb;
  });
}

/**
 * Full pipeline: search for buses between two stops and return only
 * the ones that are actually useful right now, sorted by usefulness.
 * `includeAll: true` bypasses the default PASSED/COMPLETED/NOT_STARTED
 * filter, useful for an admin/debug view that wants to see everything.
 */
export function findAvailableBuses({
  trips,
  routesById,
  fromStopId,
  toStopId,
  serviceType,
  now = Date.now(),
  includeAll = false,
}) {
  const evaluated = [];

  for (const trip of trips) {
    const route = routesById.get(trip.routeId);
    if (!route) continue;

    const result = evaluateTrip({ trip, route, fromStopId, toStopId, serviceType, now });
    if (!result) continue; // not a candidate at all (12 & wrong direction)
    if (!includeAll && !result.isDefaultVisible) continue; // 9, 10, 11
    evaluated.push(result);
  }

  return sortByUsefulness(evaluated);
}

/**
 * Attach an occupancy estimate to an already-evaluated trip result.
 * Kept as a separate step so the filtering engine itself has no
 * dependency on ticket data.
 */
export function attachOccupancy(evaluatedTrip, { route, tickets, currentStopIndex, capacity }) {
  evaluatedTrip.occupancy = estimateOccupancy({ route, tickets, currentStopIndex, capacity });
  return evaluatedTrip;
}
