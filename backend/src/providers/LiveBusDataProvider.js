/**
 * LiveBusDataProvider is an interface (documented via JSDoc, since this is
 * plain JS). Anything that wants to feed bus data into SmartBus - mock data
 * today, an authorized APSRTC feed tomorrow - must implement these methods
 * with these exact shapes. Nothing outside `providers/` should ever import
 * mock data directly; everyone else talks to whatever provider is wired up
 * in server.js.
 *
 * Implementations must NOT scrape or bypass private/unauthorized APSRTC
 * systems. This interface exists specifically so a future, authorized
 * `APSRTCDataProvider` can be dropped in without touching the rest of the
 * app.
 *
 * @interface
 */
export class LiveBusDataProvider {
  /** @returns {Promise<Array<{id:string,name:string,lat:number,lng:number}>>} */
  async getStops() {
    throw new Error("not implemented");
  }

  /** @returns {Promise<Array<Object>>} routes with ordered stopIds + cumulativeKm */
  async getRoutes() {
    throw new Error("not implemented");
  }

  /**
   * @returns {Promise<Array<Object>>} every known trip, each with:
   *   tripId, busNumber, serviceNumber, serviceType, routeId, capacity,
   *   currentKm, status ("ACTIVE" | "COMPLETED" | "NOT_STARTED"), updatedAt
   */
  async getActiveTrips() {
    throw new Error("not implemented");
  }

  /** @param {string} tripId @returns {Promise<Object|null>} a single trip */
  async getTripById(tripId) {
    throw new Error("not implemented");
  }

  /** @param {string} busNumber @returns {Promise<Object|null>} the trip currently running for that bus number, if any */
  async getTripByBusNumber(busNumber) {
    throw new Error("not implemented");
  }

  /** @returns {Promise<Array<Object>>} raw ticket transactions used for occupancy estimation */
  async getTicketTransactions(tripId) {
    throw new Error("not implemented");
  }

  /** @param {Object} ticket @returns {Promise<Object>} the stored ticket transaction */
  async issueTicket(ticket) {
    throw new Error("not implemented");
  }
}
