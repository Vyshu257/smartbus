import { LiveBusDataProvider } from "./LiveBusDataProvider.js";
import { stops } from "../data/stops.js";
import { routes } from "../data/routes.js";
import { buses, ticketTransactions } from "../data/buses.js";

/**
 * Mock data source for the prototype. Clearly NOT connected to any real
 * APSRTC system - this exists purely to demonstrate the filtering /
 * ETA / occupancy engines against realistic-looking data, including
 * deliberately "wrong direction" and "already passed" trips.
 *
 * A future `APSRTCDataProvider` (backed by an authorized, official feed)
 * would implement this exact same class shape.
 */
export class MockBusDataProvider extends LiveBusDataProvider {
  async getStops() {
    return stops;
  }

  async getRoutes() {
    return routes;
  }

  async getActiveTrips() {
    return buses;
  }

  async getTripById(tripId) {
    return buses.find((b) => b.tripId === tripId) || null;
  }

  async getTripByBusNumber(busNumber) {
    return (
      buses.find(
        (b) => b.busNumber.toLowerCase() === String(busNumber).toLowerCase()
      ) || null
    );
  }

  async getTicketTransactions(tripId) {
    return ticketTransactions.filter((t) => t.tripId === tripId);
  }

  async issueTicket(ticket) {
    const record = { ...ticket, timestamp: Date.now() };
    ticketTransactions.push(record);
    return record;
  }
}
