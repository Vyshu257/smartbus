import { AVG_SPEED_KMPH } from "../data/seedBuses.js";

/**
 * Rule-based ETA: distance remaining / average speed.
 *
 * This is intentionally simple and transparent. The spec calls for an
 * ML model once there's enough historical trip data to train one -
 * until then we should NOT pretend to have ML-grade accuracy. Swap this
 * function's body for a call to the AI service's /predict/eta endpoint
 * once that's trained; keep the same signature so nothing else changes.
 *
 * @param {number} distanceKm
 * @param {number} [avgSpeedKmph]
 * @returns {number} predicted minutes
 */
export function estimateEtaMinutes(distanceKm, avgSpeedKmph = AVG_SPEED_KMPH) {
  if (distanceKm <= 0) return 0;
  const hours = distanceKm / avgSpeedKmph;
  return Math.round(hours * 60);
}

/**
 * "Can I catch this bus?" - a transparent scoring rule, not a trained
 * model. Returns one of HIGH / MAYBE / LOW plus the eta it was based on,
 * so the UI can always show *why* a verdict was given.
 */
export function estimateCatchability({ etaToBoardingMinutes, status }) {
  if (status === "AT_STOP") {
    return { verdict: "HIGH", label: "🟢 HIGH CHANCE OF CATCHING" };
  }
  if (status === "PASSED" || status === "COMPLETED") {
    return { verdict: "LOW", label: "🔴 LIKELY MISSED" };
  }
  if (etaToBoardingMinutes <= 10) {
    return { verdict: "HIGH", label: "🟢 HIGH CHANCE OF CATCHING" };
  }
  if (etaToBoardingMinutes <= 20) {
    return { verdict: "MAYBE", label: "🟡 MAY CATCH" };
  }
  return { verdict: "LOW", label: "🔴 LIKELY MISSED" };
}
