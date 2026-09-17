import { LiveBusDataProvider } from "./LiveBusDataProvider.js";
import { store, addStop, addRoute, addBus, updateBus } from "../data/store.js";

/**
 * Mock data source for the prototype. Clearly NOT connected to any real
 * APSRTC system - this exists purely to demonstrate the filtering /
 * ETA / occupancy engines against realistic-looking data, including
 * deliberately "wrong direction" and "already passed" trips.
 *
 * Reads from the shared, mutable `store` (backend/src/data/store.js),
 * which merges the built-in seed data with anything imported from
 * backend/data/apsrtc-data.json and anything added through the admin
 * panel - so this same class scales from "one demo corridor" to "a
 * full, real, imported network" without any code changes.
 *
 * A future `APSRTCDataProvider` (backed by an authorized, official feed)
 * would implement this exact same class shape.
 */
export class MockBusDataProvider extends LiveBusDataProvider {
  async getStops() {
    return store.stops;
  }

  async getRoutes() {
    return store.routes;
  }

  async getActiveTrips() {
    return store.buses;
  }

  async getTripById(tripId) {
    return store.buses.find((b) => b.tripId === tripId) || null;
  }

  async getTripByBusNumber(busNumber) {
    return (
      store.buses.find((b) => b.busNumber.toLowerCase() === String(busNumber).toLowerCase()) ||
      null
    );
  }

  async getTicketTransactions(tripId) {
    return store.tickets.filter((t) => t.tripId === tripId);
  }

  async issueTicket(ticket) {
    const record = { ...ticket, timestamp: Date.now() };
    store.tickets.push(record);
    return record;
  }

  // ---- Admin write operations ------------------------------------------
  // Not part of the LiveBusDataProvider interface (a real, read-only feed
  // wouldn't support these) - the admin routes call these directly on
  // whichever provider is mock. An APSRTCDataProvider would simply not
  // implement these, and the admin write endpoints would be disabled.

  async addStop(stop) {
    return addStop(stop);
  }

  async addRoute(route) {
    return addRoute(route);
  }

  async addBus(trip) {
    return addBus(trip);
  }

  async updateBus(tripId, patch) {
    return updateBus(tripId, patch);
  }
}
