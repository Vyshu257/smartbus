import { Router } from "express";
import { nanoid } from "nanoid";
import { getStopByName } from "../data/store.js";
import { findAvailableBuses, attachOccupancy } from "../engine/filteringEngine.js";
import { recommendBus } from "../engine/recommendationEngine.js";
import { estimateOccupancy } from "../engine/occupancyEngine.js";
import { interpolatePosition } from "../engine/geo.js";
import { buildStopTimeline } from "../engine/timelineEngine.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

export default function buildApiRouter(provider) {
  const router = Router();

  // In-memory favorites/notifications, keyed by user id - prototype only.
  const favoritesByUser = new Map();

  async function routesById() {
    const routes = await provider.getRoutes();
    return new Map(routes.map((r) => [r.id, r]));
  }

  async function enrichWithOccupancyAndPosition(evaluated, routesMap) {
    for (const bus of evaluated) {
      const route = routesMap.get(bus.routeId);
      const trip = await provider.getTripById(bus.tripId);
      const tickets = await provider.getTicketTransactions(bus.tripId);
      const currentStopIndex = trip
        ? route.cumulativeKm.findIndex((km) => km >= trip.currentKm)
        : -1;

      attachOccupancy(bus, {
        route,
        tickets,
        currentStopIndex: currentStopIndex === -1 ? route.stopIds.length - 1 : currentStopIndex,
        capacity: trip?.capacity ?? 0,
      });

      if (trip && trip.status === "ACTIVE") {
        bus.currentLocation = interpolatePosition(route, trip.currentKm);
      } else {
        bus.currentLocation = null;
      }
    }
    return evaluated;
  }

  // ---- Reference data -------------------------------------------------

  router.get("/stops", async (_req, res) => {
    res.json(await provider.getStops());
  });

  router.get("/routes", async (_req, res) => {
    res.json(await provider.getRoutes());
  });

  // ---- Search / "available now" ---------------------------------------

  async function handleSearch(req, res) {
    const { from, to, serviceType = "All", preference } = req.query;
    if (!from || !to) {
      return res.status(400).json({ error: "from and to are required" });
    }

    const fromStop = getStopByName(from);
    const toStop = getStopByName(to);
    if (!fromStop || !toStop) {
      return res.status(404).json({
        error: "Unknown stop name",
        message: `No stop found for "${!fromStop ? from : to}".`,
      });
    }

    const [trips, rMap] = await Promise.all([provider.getActiveTrips(), routesById()]);

    let evaluated = findAvailableBuses({
      trips,
      routesById: rMap,
      fromStopId: fromStop.id,
      toStopId: toStop.id,
      serviceType,
    });

    evaluated = await enrichWithOccupancyAndPosition(evaluated, rMap);

    if (evaluated.length === 0) {
      return res.json({
        count: 0,
        buses: [],
        message: `No buses currently available for ${fromStop.name} → ${toStop.name}.`,
        suggestion: "Try another service type.",
      });
    }

    const recommendation = preference ? recommendBus(evaluated, preference) : recommendBus(evaluated);

    res.json({ count: evaluated.length, buses: evaluated, recommendation });
  }

  router.get("/search", handleSearch);

  // Same underlying logic as /search - kept as a separate path so a
  // dashboard widget (e.g. "My College Route") can use a name that
  // reads better than "search" when it already knows from/to.
  router.get("/buses/available", handleSearch);

  // ---- Single bus lookups ----------------------------------------------

  router.get("/buses/:id", async (req, res) => {
    const trip = await provider.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Bus trip not found" });
    const rMap = await routesById();
    const route = rMap.get(trip.routeId);
    const tickets = await provider.getTicketTransactions(trip.tripId);
    const currentStopIndex = route.cumulativeKm.findIndex((km) => km >= trip.currentKm);

    res.json({
      ...trip,
      routeName: route.name,
      previousStop: route.stopIds[Math.max(0, currentStopIndex - 1)],
      nextStop: route.stopIds[Math.min(route.stopIds.length - 1, currentStopIndex)],
      currentLocation: trip.status === "ACTIVE" ? interpolatePosition(route, trip.currentKm) : null,
      occupancy: estimateOccupancy({
        route,
        tickets,
        currentStopIndex: currentStopIndex === -1 ? route.stopIds.length - 1 : currentStopIndex,
        capacity: trip.capacity,
      }),
    });
  });

  router.get("/buses/:id/location", async (req, res) => {
    const trip = await provider.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Bus trip not found" });
    if (trip.status !== "ACTIVE") {
      return res.json({ available: false, message: "Live location unavailable." });
    }
    const rMap = await routesById();
    const route = rMap.get(trip.routeId);
    res.json({
      available: true,
      position: interpolatePosition(route, trip.currentKm),
      updatedAt: trip.updatedAt,
    });
  });

  // Horizontal "Trip Details" timeline: scheduled vs actual/ETA time per
  // stop, plus where along the route the bus currently is.
  router.get("/buses/:id/timeline", async (req, res) => {
    const trip = await provider.getTripById(req.params.id);
    if (!trip) return res.status(404).json({ error: "Bus trip not found" });
    const rMap = await routesById();
    const route = rMap.get(trip.routeId);
    res.json(buildStopTimeline({ trip, route }));
  });

  // Track by bus number (spec section 9)
  router.get("/track/:busNumber", async (req, res) => {
    const trip = await provider.getTripByBusNumber(req.params.busNumber);
    if (!trip) {
      return res.status(404).json({ error: `No bus found with number ${req.params.busNumber}` });
    }
    res.redirect(307, `/api/buses/${trip.tripId}`);
  });

  // ---- Tickets / occupancy (conductor prototype) -----------------------

  router.post("/tickets", requireAuth, requireRole("CONDUCTOR", "ADMIN"), async (req, res) => {
    const { tripId, boardingStopId, destinationStopId, quantity } = req.body || {};
    if (!tripId || !boardingStopId || !destinationStopId || !quantity) {
      return res.status(400).json({ error: "tripId, boardingStopId, destinationStopId and quantity are required" });
    }
    const trip = await provider.getTripById(tripId);
    if (!trip) return res.status(404).json({ error: "Bus trip not found" });

    const ticket = await provider.issueTicket({
      id: nanoid(10),
      tripId,
      boardingStopId,
      destinationStopId,
      quantity: Number(quantity),
    });
    res.status(201).json(ticket);
  });

  router.get("/occupancy/:tripId", async (req, res) => {
    const trip = await provider.getTripById(req.params.tripId);
    if (!trip) return res.status(404).json({ error: "Bus trip not found" });
    const rMap = await routesById();
    const route = rMap.get(trip.routeId);
    const tickets = await provider.getTicketTransactions(trip.tripId);
    const currentStopIndex = route.cumulativeKm.findIndex((km) => km >= trip.currentKm);

    res.json(
      estimateOccupancy({
        route,
        tickets,
        currentStopIndex: currentStopIndex === -1 ? route.stopIds.length - 1 : currentStopIndex,
        capacity: trip.capacity,
      })
    );
  });

  // ---- Favorites (spec section 10) --------------------------------------

  router.get("/favorites", requireAuth, (req, res) => {
    res.json(favoritesByUser.get(req.user.sub) || []);
  });

  router.post("/favorites", requireAuth, (req, res) => {
    const { label, from, to, serviceType, busNumber } = req.body || {};
    if (!label || !from || !to) {
      return res.status(400).json({ error: "label, from and to are required" });
    }
    const list = favoritesByUser.get(req.user.sub) || [];
    const favorite = { id: nanoid(10), label, from, to, serviceType: serviceType || "All", busNumber: busNumber || null };
    list.push(favorite);
    favoritesByUser.set(req.user.sub, list);
    res.status(201).json(favorite);
  });

  router.delete("/favorites/:id", requireAuth, (req, res) => {
    const list = favoritesByUser.get(req.user.sub) || [];
    favoritesByUser.set(
      req.user.sub,
      list.filter((f) => f.id !== req.params.id)
    );
    res.status(204).end();
  });

  // ---- Admin (spec section 24) -------------------------------------------
  // Full CRUD so real data (once you have it) can be entered without
  // touching code - add stops/routes/buses one at a time, or bulk-import
  // a whole dataset at once. Everything added here is written to
  // backend/data/runtime-additions.json so it survives a server restart.

  router.get("/admin/overview", requireAuth, requireRole("ADMIN"), async (_req, res) => {
    const trips = await provider.getActiveTrips();
    const routes = await provider.getRoutes();
    const stops = await provider.getStops();
    res.json({
      totalBuses: trips.length,
      activeBuses: trips.filter((t) => t.status === "ACTIVE").length,
      completedTrips: trips.filter((t) => t.status === "COMPLETED").length,
      notStarted: trips.filter((t) => t.status === "NOT_STARTED").length,
      availableRoutes: routes.length,
      totalStops: stops.length,
    });
  });

  router.get("/admin/stops", requireAuth, requireRole("ADMIN"), async (_req, res) => {
    res.json(await provider.getStops());
  });

  router.post("/admin/stops", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { name, lat, lng } = req.body || {};
    if (!name || lat == null || lng == null) {
      return res.status(400).json({ error: "name, lat and lng are required" });
    }
    const stop = { id: `stp_${nanoid(8)}`, name, lat: Number(lat), lng: Number(lng) };
    if (!provider.addStop) return res.status(501).json({ error: "Current data provider doesn't support adding stops" });
    res.status(201).json(await provider.addStop(stop));
  });

  router.get("/admin/routes", requireAuth, requireRole("ADMIN"), async (_req, res) => {
    res.json(await provider.getRoutes());
  });

  router.post("/admin/routes", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { name, stopIds, cumulativeKm, scheduledMinutesFromStart } = req.body || {};
    if (!name || !Array.isArray(stopIds) || stopIds.length < 2) {
      return res.status(400).json({ error: "name and at least 2 stopIds (in travel order) are required" });
    }
    if (!Array.isArray(cumulativeKm) || cumulativeKm.length !== stopIds.length) {
      return res.status(400).json({ error: "cumulativeKm must have one entry per stop, in the same order" });
    }
    const stops = await provider.getStops();
    const known = new Set(stops.map((s) => s.id));
    const unknown = stopIds.filter((id) => !known.has(id));
    if (unknown.length) {
      return res.status(400).json({ error: `Unknown stop id(s): ${unknown.join(", ")}` });
    }
    const route = {
      id: `rt_${nanoid(8)}`,
      name,
      origin: stopIds[0],
      destination: stopIds[stopIds.length - 1],
      stopIds,
      cumulativeKm: cumulativeKm.map(Number),
      scheduledMinutesFromStart: (scheduledMinutesFromStart || cumulativeKm).map(Number),
    };
    if (!provider.addRoute) return res.status(501).json({ error: "Current data provider doesn't support adding routes" });
    res.status(201).json(await provider.addRoute(route));
  });

  router.get("/admin/buses", requireAuth, requireRole("ADMIN"), async (_req, res) => {
    res.json(await provider.getActiveTrips());
  });

  router.post("/admin/buses", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { busNumber, serviceNumber, serviceType, routeId, capacity, status } = req.body || {};
    if (!busNumber || !serviceNumber || !routeId || !capacity) {
      return res.status(400).json({ error: "busNumber, serviceNumber, routeId and capacity are required" });
    }
    const routes = await provider.getRoutes();
    if (!routes.some((r) => r.id === routeId)) {
      return res.status(400).json({ error: `Unknown routeId: ${routeId}` });
    }
    const trip = {
      tripId: `trip_${nanoid(8)}`,
      busNumber,
      serviceNumber,
      serviceType: serviceType || "PALLEVELUGU",
      routeId,
      capacity: Number(capacity),
      currentKm: 0,
      status: status || "NOT_STARTED",
      updatedAt: status === "ACTIVE" ? Date.now() : null,
      scheduleDelayMinutes: 0,
      scheduledStartTime: Date.now(),
    };
    if (!provider.addBus) return res.status(501).json({ error: "Current data provider doesn't support adding buses" });
    res.status(201).json(await provider.addBus(trip));
  });

  router.put("/admin/buses/:tripId", requireAuth, requireRole("ADMIN"), async (req, res) => {
    if (!provider.updateBus) return res.status(501).json({ error: "Current data provider doesn't support editing buses" });
    const updated = await provider.updateBus(req.params.tripId, req.body || {});
    if (!updated) return res.status(404).json({ error: "Bus trip not found" });
    res.json(updated);
  });

  // Bulk import: paste/upload a whole { stops, routes, buses } dataset at
  // once (e.g. one you've digitized from real timetables, or an official
  // feed export). Existing ids are skipped, not overwritten.
  router.post("/admin/import", requireAuth, requireRole("ADMIN"), async (req, res) => {
    const { stops = [], routes = [], buses = [] } = req.body || {};
    if (!provider.addStop || !provider.addRoute || !provider.addBus) {
      return res.status(501).json({ error: "Current data provider doesn't support importing data" });
    }
    const existingStopIds = new Set((await provider.getStops()).map((s) => s.id));
    const existingRouteIds = new Set((await provider.getRoutes()).map((r) => r.id));
    const existingTripIds = new Set((await provider.getActiveTrips()).map((b) => b.tripId));

    let addedStops = 0, addedRoutes = 0, addedBuses = 0;
    for (const s of stops) if (!existingStopIds.has(s.id)) { await provider.addStop(s); addedStops++; }
    for (const r of routes) if (!existingRouteIds.has(r.id)) { await provider.addRoute(r); addedRoutes++; }
    for (const b of buses) if (!existingTripIds.has(b.tripId)) { await provider.addBus(b); addedBuses++; }

    res.status(201).json({ addedStops, addedRoutes, addedBuses });
  });

  return router;
}
