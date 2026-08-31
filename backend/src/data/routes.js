// A "route" here is a fixed, ORDERED sequence of stops.
// The order in `stopIds` is what lets the filtering engine tell the
// difference between "still to come" and "already passed", and between
// forward travel and reverse travel. Two routes can share the same stops
// in opposite order (a "down" and "up" route) - they are separate entries.

export const routes = [
  {
    id: "rt_kroad_nannur_kurnool",
    name: "Kurnool Road - Nannur - Kurnool",
    origin: "stp_kurnool_road",
    destination: "stp_kurnool",
    stopIds: [
      "stp_kurnool_road",
      "stp_nannur",
      "stp_bandi_tandrapadu",
      "stp_orvakal",
      "stp_kurnool",
    ],
    // distance in km from the start of this route to each stop, in order,
    // used for ETA / "distance to boarding stop" calculations
    cumulativeKm: [0, 3.2, 9.8, 16.4, 24.0],
    // scheduled minutes-from-departure at each stop, in order - this is
    // the "timetable" time shown in the Trip Details screen, independent
    // of where the bus actually is right now.
    scheduledMinutesFromStart: [0, 6, 18, 31, 45],
  },
  {
    id: "rt_kurnool_nannur_reverse",
    name: "Kurnool - Nannur - Kurnool Road (reverse)",
    origin: "stp_kurnool",
    destination: "stp_kurnool_road",
    stopIds: [
      "stp_kurnool",
      "stp_orvakal",
      "stp_bandi_tandrapadu",
      "stp_nannur",
      "stp_kurnool_road",
    ],
    cumulativeKm: [0, 7.6, 14.2, 20.8, 24.0],
    scheduledMinutesFromStart: [0, 14, 27, 39, 45],
  },
];

export function getRouteById(id) {
  return routes.find((r) => r.id === id) || null;
}

/**
 * Index of a stop within a route's ordered sequence, or -1 if the route
 * doesn't serve that stop at all. This index is the whole basis for
 * direction + "already passed" logic in the filtering engine.
 */
export function stopIndexOnRoute(route, stopId) {
  return route.stopIds.indexOf(stopId);
}
