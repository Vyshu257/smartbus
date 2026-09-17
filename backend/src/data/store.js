import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { stops as seedStops } from "./seedStops.js";
import { routes as seedRoutes } from "./seedRoutes.js";
import { buses as seedBuses, ticketTransactions as seedTickets } from "./seedBuses.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "../../data");
const IMPORT_FILE = path.join(DATA_DIR, "apsrtc-data.json");
const RUNTIME_FILE = path.join(DATA_DIR, "runtime-additions.json");

// The live, mutable in-memory dataset. Everything the app reads from
// (search, tracking, admin panel...) reads from here - never straight
// from the seed files - so imported and admin-added records show up
// everywhere automatically.
export const store = {
  stops: [...seedStops],
  routes: [...seedRoutes],
  buses: [...seedBuses],
  tickets: [...seedTickets],
};

function safeReadJson(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (err) {
    console.error(`Couldn't read ${filePath}:`, err.message);
    return null;
  }
}

/**
 * Merge in a one-time bulk import, if backend/data/apsrtc-data.json exists.
 * This is how a real, legitimately-sourced APSRTC (or any operator's)
 * dataset gets loaded - see backend/data/README.md for the expected
 * shape. Safe to call once at startup; does nothing if the file is absent.
 */
export function loadImportedDataset() {
  const imported = safeReadJson(IMPORT_FILE);
  if (!imported) return;

  const existingStopIds = new Set(store.stops.map((s) => s.id));
  const existingRouteIds = new Set(store.routes.map((r) => r.id));
  const existingTripIds = new Set(store.buses.map((b) => b.tripId));

  for (const stop of imported.stops || []) {
    if (!existingStopIds.has(stop.id)) store.stops.push(stop);
  }
  for (const route of imported.routes || []) {
    if (!existingRouteIds.has(route.id)) store.routes.push(route);
  }
  for (const b of imported.buses || []) {
    if (!existingTripIds.has(b.tripId)) store.buses.push(b);
  }

  console.log(
    `Loaded backend/data/apsrtc-data.json: +${imported.stops?.length ?? 0} stops, ` +
      `+${imported.routes?.length ?? 0} routes, +${imported.buses?.length ?? 0} buses`
  );
}

/**
 * Restore anything added previously through the admin panel (stops,
 * routes, buses added via POST /api/admin/*), so it survives a restart.
 */
export function loadRuntimeAdditions() {
  const saved = safeReadJson(RUNTIME_FILE);
  if (!saved) return;

  const existingStopIds = new Set(store.stops.map((s) => s.id));
  const existingRouteIds = new Set(store.routes.map((r) => r.id));
  const existingTripIds = new Set(store.buses.map((b) => b.tripId));

  for (const stop of saved.stops || []) if (!existingStopIds.has(stop.id)) store.stops.push(stop);
  for (const route of saved.routes || []) if (!existingRouteIds.has(route.id)) store.routes.push(route);
  for (const b of saved.buses || []) if (!existingTripIds.has(b.tripId)) store.buses.push(b);
}

// Tracks only what was added at runtime (via the admin panel), separately
// from the seed + one-time import, so we know what to persist.
const runtimeAdditions = { stops: [], routes: [], buses: [] };

function persistRuntimeAdditions() {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(RUNTIME_FILE, JSON.stringify(runtimeAdditions, null, 2));
  } catch (err) {
    console.error("Couldn't persist admin-added data:", err.message);
  }
}

export function addStop(stop) {
  store.stops.push(stop);
  runtimeAdditions.stops.push(stop);
  persistRuntimeAdditions();
  return stop;
}

export function addRoute(route) {
  store.routes.push(route);
  runtimeAdditions.routes.push(route);
  persistRuntimeAdditions();
  return route;
}

export function addBus(trip) {
  store.buses.push(trip);
  runtimeAdditions.buses.push(trip);
  persistRuntimeAdditions();
  return trip;
}

export function updateBus(tripId, patch) {
  const trip = store.buses.find((b) => b.tripId === tripId);
  if (!trip) return null;
  Object.assign(trip, patch);
  // if this trip was itself an admin-added one, keep the persisted copy in sync
  const persisted = runtimeAdditions.buses.find((b) => b.tripId === tripId);
  if (persisted) {
    Object.assign(persisted, patch);
    persistRuntimeAdditions();
  }
  return trip;
}

export function getStopById(id) {
  return store.stops.find((s) => s.id === id) || null;
}

export function getStopByName(name) {
  return store.stops.find((s) => s.name.toLowerCase() === String(name).toLowerCase()) || null;
}

export function getRouteById(id) {
  return store.routes.find((r) => r.id === id) || null;
}

export function stopIndexOnRoute(route, stopId) {
  return route.stopIds.indexOf(stopId);
}
