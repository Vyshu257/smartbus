/**
 * Recommend the single best bus from an already-filtered, already-sorted
 * list of candidates (output of filteringEngine.findAvailableBuses, with
 * occupancy attached). Never recommends anything the filtering engine
 * already excluded (PASSED/COMPLETED never reach this function).
 *
 * @param {Array} candidates
 * @param {"fastest"|"least_crowded"|"direct"|"lowest_wait"} preference
 */
export function recommendBus(candidates, preference = "fastest") {
  if (!candidates.length) return null;

  const scored = candidates.map((bus) => {
    const eta = bus.etaToBoardingMinutes ?? 999;
    const crowd = bus.occupancy?.occupancyPercent ?? 50;

    let score;
    switch (preference) {
      case "least_crowded":
        score = crowd * 2 + eta * 0.5;
        break;
      case "lowest_wait":
      case "fastest":
      default:
        score = eta * 2 + crowd * 0.3;
        break;
    }
    return { bus, score };
  });

  scored.sort((a, b) => a.score - b.score);
  const best = scored[0].bus;
  const runnerUp = scored[1]?.bus;

  let reason = `Closest available bus with low expected waiting time (${best.etaToBoardingMinutes} min).`;
  if (
    preference === "least_crowded" &&
    runnerUp &&
    best.occupancy?.occupancyPercent < runnerUp.occupancy?.occupancyPercent
  ) {
    reason = `Arrives a little later but has a noticeably lower predicted crowd (${best.occupancy.crowdLevel}).`;
  }

  return { busNumber: best.busNumber, tripId: best.tripId, reason };
}
