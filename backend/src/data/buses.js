// In-memory "current state" of every bus trip. The GPS simulator
// (src/simulation/gpsSimulator.js) mutates `currentKm` and `updatedAt` on
// these objects every few seconds; everything else derives from that.
//
// Deliberately includes one of each case the filtering engine must handle:
//   - a normal forward bus, part-way along, approaching the boarding stop
//   - a bus that already passed the boarding stop
//   - a bus that already completed its trip
//   - a bus running the reverse route (should never match a forward search)
//   - a bus that hasn't started yet (upcoming / not yet active)

import { routes } from "./routes.js";

export const AVG_SPEED_KMPH = 32; // used by the rule-based ETA calculator

function interpolateScheduledMinutes(route, currentKm) {
  const kmArr = route.cumulativeKm;
  const minArr = route.scheduledMinutesFromStart;
  let i = 0;
  while (i < kmArr.length - 1 && currentKm > kmArr[i + 1]) i++;
  const segStart = kmArr[i];
  const segEnd = kmArr[Math.min(i + 1, kmArr.length - 1)];
  const segLen = segEnd - segStart || 1;
  const t = Math.min(1, Math.max(0, (currentKm - segStart) / segLen));
  return minArr[i] + (minArr[Math.min(i + 1, minArr.length - 1)] - minArr[i]) * t;
}

// Backdate a plausible scheduled departure time so this trip's current
// position looks consistent with its timetable + a simulated running-late
// delay - purely for demoing the Trip Details timeline against mock data.
function scheduledStartFor(routeId, currentKm, delayMinutes) {
  const route = routes.find((r) => r.id === routeId);
  const scheduledElapsed = interpolateScheduledMinutes(route, currentKm);
  return Date.now() - (scheduledElapsed + delayMinutes) * 60 * 1000;
}

export const buses = [
  {
    tripId: "trip_001",
    busNumber: "AP21Z0646",
    serviceNumber: "GDV3/2",
    serviceType: "PALLEVELUGU",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 50,
    currentKm: 2.9, // just short of Nannur (3.2) -> shows up as AT_STOP
    status: "ACTIVE", // ACTIVE | COMPLETED | NOT_STARTED
    updatedAt: Date.now(),
    scheduleDelayMinutes: 9,
    scheduledStartTime: scheduledStartFor("rt_kroad_nannur_kurnool", 2.9, 9),
  },
  {
    tripId: "trip_007",
    busNumber: "AP21Z7712",
    serviceNumber: "GDV4/1",
    serviceType: "PALLEVELUGU",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 50,
    currentKm: 0, // just left Kurnool Road, further out -> COMING
    status: "ACTIVE",
    updatedAt: Date.now(),
    scheduleDelayMinutes: 3,
    scheduledStartTime: scheduledStartFor("rt_kroad_nannur_kurnool", 0, 3),
  },
  {
    tripId: "trip_002",
    busNumber: "AP21X1122",
    serviceNumber: "GDV5/1",
    serviceType: "EXPRESS",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 45,
    currentKm: 18.9, // already past Nannur (3.2) and Orvakal (16.4)
    status: "ACTIVE",
    updatedAt: Date.now(),
    scheduleDelayMinutes: 26,
    scheduledStartTime: scheduledStartFor("rt_kroad_nannur_kurnool", 18.9, 26),
  },
  {
    tripId: "trip_003",
    busNumber: "AP21Y8890",
    serviceNumber: "GDV1/4",
    serviceType: "PALLEVELUGU",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 50,
    currentKm: 24.0, // reached the end of the route
    status: "COMPLETED",
    updatedAt: Date.now(),
    scheduleDelayMinutes: 14,
    scheduledStartTime: scheduledStartFor("rt_kroad_nannur_kurnool", 24.0, 14),
  },
  {
    tripId: "trip_004",
    busNumber: "AP21Z5567",
    serviceNumber: "GDV3/2",
    serviceType: "PALLEVELUGU",
    routeId: "rt_kurnool_nannur_reverse",
    capacity: 50,
    currentKm: 4.1, // between Kurnool and Orvakal, heading AWAY from Nannur
    status: "ACTIVE",
    updatedAt: Date.now(),
    scheduleDelayMinutes: 5,
    scheduledStartTime: scheduledStartFor("rt_kurnool_nannur_reverse", 4.1, 5),
  },
  {
    tripId: "trip_005",
    busNumber: "AP21W3345",
    serviceNumber: "GDV7/3",
    serviceType: "ULTRA DELUXE",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 40,
    currentKm: 0,
    status: "NOT_STARTED", // scheduled later today, no live GPS yet
    updatedAt: null,
    scheduleDelayMinutes: 0,
    scheduledStartTime: Date.now() + 25 * 60 * 1000, // scheduled to start in 25 min
  },
  {
    tripId: "trip_006",
    busNumber: "AP21Z9981",
    serviceNumber: "GDV3/5",
    serviceType: "PALLEVELUGU",
    routeId: "rt_kroad_nannur_kurnool",
    capacity: 50,
    currentKm: 1.1, // just left Kurnool Road, well before Nannur
    status: "ACTIVE",
    updatedAt: Date.now(),
    scheduleDelayMinutes: 6,
    scheduledStartTime: scheduledStartFor("rt_kroad_nannur_kurnool", 1.1, 6),
  },
];

// Simulated ticket transactions, used by the occupancy engine.
// boardingStopId / destinationStopId must exist on the trip's route.
export const ticketTransactions = [
  { tripId: "trip_001", boardingStopId: "stp_kurnool_road", destinationStopId: "stp_kurnool", quantity: 20, timestamp: Date.now() - 20 * 60 * 1000 },
  { tripId: "trip_001", boardingStopId: "stp_nannur", destinationStopId: "stp_orvakal", quantity: 10, timestamp: Date.now() - 8 * 60 * 1000 },
  { tripId: "trip_001", boardingStopId: "stp_kurnool_road", destinationStopId: "stp_nannur", quantity: 8, timestamp: Date.now() - 25 * 60 * 1000 },
];
