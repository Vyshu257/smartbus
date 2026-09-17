// Base seed fleet across every corridor in seedRoutes.js. Every corridor
// deliberately includes at least one ACTIVE forward trip, one reverse
// trip (must never appear in a forward search), and either a COMPLETED
// or NOT_STARTED trip, so the filtering engine has real cases to exclude
// no matter which corridor a search lands on.
//
// See seedStops.js for the note that this is illustrative mock data, not
// a real APSRTC feed - bus numbers here are made up for demo purposes.

import { routes } from "./seedRoutes.js";

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

// Backdate a plausible scheduled departure time so a trip's current
// position looks consistent with its timetable + a simulated delay -
// purely for demoing the Trip Details timeline against mock data.
function scheduledStartFor(routeId, currentKm, delayMinutes) {
  const route = routes.find((r) => r.id === routeId);
  const scheduledElapsed = interpolateScheduledMinutes(route, currentKm);
  return Date.now() - (scheduledElapsed + delayMinutes) * 60 * 1000;
}

function trip({ tripId, busNumber, serviceNumber, serviceType, routeId, capacity, currentKm, status, delay = 0 }) {
  const isActive = status === "ACTIVE";
  return {
    tripId,
    busNumber,
    serviceNumber,
    serviceType,
    routeId,
    capacity,
    currentKm,
    status,
    updatedAt: status === "NOT_STARTED" ? null : Date.now(),
    scheduleDelayMinutes: delay,
    scheduledStartTime:
      status === "NOT_STARTED"
        ? Date.now() + 25 * 60 * 1000
        : scheduledStartFor(routeId, currentKm, delay),
  };
}

export const buses = [
  // --- Kurnool Road <-> Kurnool ---
  trip({ tripId: "trip_001", busNumber: "AP21Z0646", serviceNumber: "GDV3/2", serviceType: "PALLEVELUGU", routeId: "rt_kroad_nannur_kurnool", capacity: 50, currentKm: 2.9, status: "ACTIVE", delay: 9 }),
  trip({ tripId: "trip_007", busNumber: "AP21Z7712", serviceNumber: "GDV4/1", serviceType: "PALLEVELUGU", routeId: "rt_kroad_nannur_kurnool", capacity: 50, currentKm: 0, status: "ACTIVE", delay: 3 }),
  trip({ tripId: "trip_006", busNumber: "AP21Z9981", serviceNumber: "GDV3/5", serviceType: "PALLEVELUGU", routeId: "rt_kroad_nannur_kurnool", capacity: 50, currentKm: 1.1, status: "ACTIVE", delay: 6 }),
  trip({ tripId: "trip_002", busNumber: "AP21X1122", serviceNumber: "GDV5/1", serviceType: "EXPRESS", routeId: "rt_kroad_nannur_kurnool", capacity: 45, currentKm: 18.9, status: "ACTIVE", delay: 26 }),
  trip({ tripId: "trip_003", busNumber: "AP21Y8890", serviceNumber: "GDV1/4", serviceType: "PALLEVELUGU", routeId: "rt_kroad_nannur_kurnool", capacity: 50, currentKm: 24.0, status: "COMPLETED", delay: 14 }),
  trip({ tripId: "trip_004", busNumber: "AP21Z5567", serviceNumber: "GDV3/2", serviceType: "PALLEVELUGU", routeId: "rt_kurnool_nannur_reverse", capacity: 50, currentKm: 4.1, status: "ACTIVE", delay: 5 }),
  trip({ tripId: "trip_005", busNumber: "AP21W3345", serviceNumber: "GDV7/3", serviceType: "ULTRA DELUXE", routeId: "rt_kroad_nannur_kurnool", capacity: 40, currentKm: 0, status: "NOT_STARTED" }),

  // --- Kadapa <-> Pulivendla ---
  trip({ tripId: "trip_101", busNumber: "AP04X2210", serviceNumber: "KDP1/2", serviceType: "PALLEVELUGU", routeId: "rt_kadapa_pulivendla", capacity: 50, currentKm: 13.0, status: "ACTIVE", delay: 7 }),
  trip({ tripId: "trip_102", busNumber: "AP04Y3391", serviceNumber: "KDP2/1", serviceType: "EXPRESS", routeId: "rt_kadapa_pulivendla", capacity: 45, currentKm: 0, status: "ACTIVE", delay: 2 }),
  trip({ tripId: "trip_103", busNumber: "AP04Z4471", serviceNumber: "KDP1/2", serviceType: "PALLEVELUGU", routeId: "rt_pulivendla_kadapa_reverse", capacity: 50, currentKm: 10.0, status: "ACTIVE", delay: 4 }),
  trip({ tripId: "trip_104", busNumber: "AP04W5512", serviceNumber: "KDP3/4", serviceType: "ULTRA DELUXE", routeId: "rt_kadapa_pulivendla", capacity: 40, currentKm: 0, status: "NOT_STARTED" }),

  // --- Anantapur <-> Dharmavaram ---
  trip({ tripId: "trip_201", busNumber: "AP02A6001", serviceNumber: "ATP1/1", serviceType: "PALLEVELUGU", routeId: "rt_anantapur_dharmavaram", capacity: 50, currentKm: 0, status: "ACTIVE", delay: 5 }),
  trip({ tripId: "trip_202", busNumber: "AP02B6120", serviceNumber: "ATP2/3", serviceType: "EXPRESS", routeId: "rt_anantapur_dharmavaram", capacity: 45, currentKm: 33.0, status: "COMPLETED", delay: 11 }),
  trip({ tripId: "trip_203", busNumber: "AP02C6233", serviceNumber: "ATP1/1", serviceType: "PALLEVELUGU", routeId: "rt_dharmavaram_anantapur_reverse", capacity: 50, currentKm: 5.0, status: "ACTIVE", delay: 3 }),

  // --- Nellore <-> Kavali ---
  trip({ tripId: "trip_301", busNumber: "AP26D7710", serviceNumber: "NLR1/2", serviceType: "PALLEVELUGU", routeId: "rt_nellore_kavali", capacity: 50, currentKm: 0, status: "ACTIVE", delay: 4 }),
  trip({ tripId: "trip_302", busNumber: "AP26E7821", serviceNumber: "NLR2/1", serviceType: "EXPRESS", routeId: "rt_nellore_kavali", capacity: 45, currentKm: 20.0, status: "ACTIVE", delay: 12 }),
  trip({ tripId: "trip_303", busNumber: "AP26F7932", serviceNumber: "NLR3/1", serviceType: "ULTRA DELUXE", routeId: "rt_nellore_kavali", capacity: 40, currentKm: 0, status: "NOT_STARTED" }),
];

// Simulated ticket transactions, used by the occupancy engine.
// boardingStopId / destinationStopId must exist on the trip's route.
export const ticketTransactions = [
  { tripId: "trip_001", boardingStopId: "stp_kurnool_road", destinationStopId: "stp_kurnool", quantity: 20, timestamp: Date.now() - 20 * 60 * 1000 },
  { tripId: "trip_001", boardingStopId: "stp_nannur", destinationStopId: "stp_orvakal", quantity: 10, timestamp: Date.now() - 8 * 60 * 1000 },
  { tripId: "trip_001", boardingStopId: "stp_kurnool_road", destinationStopId: "stp_nannur", quantity: 8, timestamp: Date.now() - 25 * 60 * 1000 },
  { tripId: "trip_101", boardingStopId: "stp_kadapa", destinationStopId: "stp_pulivendla", quantity: 24, timestamp: Date.now() - 30 * 60 * 1000 },
  { tripId: "trip_201", boardingStopId: "stp_anantapur", destinationStopId: "stp_dharmavaram", quantity: 15, timestamp: Date.now() - 18 * 60 * 1000 },
  { tripId: "trip_301", boardingStopId: "stp_nellore", destinationStopId: "stp_kavali", quantity: 12, timestamp: Date.now() - 10 * 60 * 1000 },
];
