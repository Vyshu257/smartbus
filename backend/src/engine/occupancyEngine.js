import { stopIndexOnRoute } from "../data/store.js";

// Configurable crowd thresholds (spec section 18) - tune per operator/route.
export const CROWD_THRESHOLDS = { low: 40, moderate: 75 };

/**
 * Estimate passengers currently onboard a trip by walking its ticket
 * transactions against the route's stop order: a ticket contributes to
 * "currently onboard" only for the stretch between its boarding stop and
 * its destination stop. This avoids the naive (and wrong) approach of just
 * counting every ticket ever issued.
 *
 * @param {Object} route - route with ordered stopIds
 * @param {Array} tickets - transactions for this trip
 * @param {number} currentStopIndex - index of the bus's current position on the route
 */
export function estimateOnboardPassengers(route, tickets, currentStopIndex) {
  let onboard = 0;
  for (const ticket of tickets) {
    const boardIdx = stopIndexOnRoute(route, ticket.boardingStopId);
    const destIdx = stopIndexOnRoute(route, ticket.destinationStopId);
    if (boardIdx === -1 || destIdx === -1) continue;
    // still onboard if the bus has passed/reached boarding but not yet
    // reached (or passed) the destination stop
    if (currentStopIndex >= boardIdx && currentStopIndex < destIdx) {
      onboard += ticket.quantity;
    }
  }
  return onboard;
}

export function crowdLevelFor(occupancyPercent, thresholds = CROWD_THRESHOLDS) {
  if (occupancyPercent <= thresholds.low) return { level: "LOW", badge: "🟢 LOW" };
  if (occupancyPercent <= thresholds.moderate) return { level: "MODERATE", badge: "🟡 MODERATE" };
  return { level: "HIGH", badge: "🔴 HIGH" };
}

/**
 * Full occupancy estimate for a trip. Always labelled as an ESTIMATE in the
 * API response and UI, per spec - this is derived from simulated ticket
 * data, not a headcount sensor.
 */
export function estimateOccupancy({ route, tickets, currentStopIndex, capacity }) {
  const onboard = estimateOnboardPassengers(route, tickets, currentStopIndex);
  const percent = capacity > 0 ? Math.round((onboard / capacity) * 100) : 0;
  const crowd = crowdLevelFor(percent);
  return {
    estimatedPassengers: onboard,
    capacity,
    occupancyPercent: Math.min(percent, 100),
    crowdLevel: crowd.level,
    crowdBadge: crowd.badge,
    isEstimate: true,
  };
}
