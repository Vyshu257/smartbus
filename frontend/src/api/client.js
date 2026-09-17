const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders() {
  const token = localStorage.getItem("smartbus_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });

  let body = null;
  try {
    body = await res.json();
  } catch {
    // no JSON body (e.g. 204 No Content) - fine
  }

  if (!res.ok) {
    const message = body?.message || body?.error || "Unable to load live bus data. Please try again.";
    throw new Error(message);
  }
  return body;
}

export const api = {
  getStops: () => request("/stops"),
  getRoutes: () => request("/routes"),
  search: ({ from, to, serviceType, preference }) => {
    const params = new URLSearchParams({ from, to, serviceType: serviceType || "All" });
    if (preference) params.set("preference", preference);
    return request(`/search?${params.toString()}`);
  },
  getBus: (tripId) => request(`/buses/${tripId}`),
  getTimeline: (tripId) => request(`/buses/${tripId}/timeline`),
  trackByBusNumber: (busNumber) => request(`/track/${encodeURIComponent(busNumber)}`),
  getFavorites: () => request("/favorites"),
  addFavorite: (favorite) => request("/favorites", { method: "POST", body: JSON.stringify(favorite) }),
  removeFavorite: (id) => request(`/favorites/${id}`, { method: "DELETE" }),
  issueTicket: (ticket) => request("/tickets", { method: "POST", body: JSON.stringify(ticket) }),
  getOccupancy: (tripId) => request(`/occupancy/${tripId}`),
  login: (email, password) => request("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  register: (email, password, role) =>
    request("/auth/register", { method: "POST", body: JSON.stringify({ email, password, role }) }),
  getAdminOverview: () => request("/admin/overview"),
  getAdminStops: () => request("/admin/stops"),
  addAdminStop: (stop) => request("/admin/stops", { method: "POST", body: JSON.stringify(stop) }),
  getAdminRoutes: () => request("/admin/routes"),
  addAdminRoute: (route) => request("/admin/routes", { method: "POST", body: JSON.stringify(route) }),
  getAdminBuses: () => request("/admin/buses"),
  addAdminBus: (bus) => request("/admin/buses", { method: "POST", body: JSON.stringify(bus) }),
  updateAdminBus: (tripId, patch) => request(`/admin/buses/${tripId}`, { method: "PUT", body: JSON.stringify(patch) }),
  importAdminData: (dataset) => request("/admin/import", { method: "POST", body: JSON.stringify(dataset) }),
};
