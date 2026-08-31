import { Router } from "express";
import { nanoid } from "nanoid";
import { findAvailableBuses, attachOccupancy } from "../engine/filteringEngine.js";
import { recommendBus } from "../engine/recommendationEngine.js";
import { estimateOccupancy } from "../engine/occupancyEngine.js";
import { interpolatePosition } from "../engine/geo.js";
import { buildStopTimeline } from "../engine/timelineEngine.js";
import { getStopByName, searchStops } from "../data/stops.js";
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
  router.get("/stops/search", (req, res) => {
  const { q } = req.query;

  if (!q || q.trim().length === 0) {
    return res.json([]);
  }

  const results = searchStops(q);

  res.json(results);
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

  router.get("/admin/overview", requireAuth, requireRole("ADMIN"), async (_req, res) => {
    const trips = await provider.getActiveTrips();
    const routes = await provider.getRoutes();
    res.json({
      totalBuses: trips.length,
      activeBuses: trips.filter((t) => t.status === "ACTIVE").length,
      completedTrips: trips.filter((t) => t.status === "COMPLETED").length,
      notStarted: trips.filter((t) => t.status === "NOT_STARTED").length,
      availableRoutes: routes.length,
    });
  });

  return router;
}
