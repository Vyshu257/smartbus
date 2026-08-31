import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const loggedIn = Boolean(localStorage.getItem("smartbus_token"));

  useEffect(() => {
    if (!loggedIn) return;
    api.adminOverview().then(setOverview).catch((err) => setError(err.message));
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-semibold">Admin access required</p>
        <p className="mt-1 text-sm text-muted">
          Demo login: admin@smartbus.dev / admin123
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-muted">Fleet overview for the prototype (mock data).</p>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {overview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Total buses" value={overview.totalBuses} />
          <Stat label="Active buses" value={overview.activeBuses} accent="text-live" />
          <Stat label="Completed trips" value={overview.completedTrips} accent="text-danger" />
          <Stat label="Not yet started" value={overview.notStarted} accent="text-muted" />
          <Stat label="Available routes" value={overview.availableRoutes} />
        </div>
      )}

      <div className="rounded-xl2 border border-dashed border-black/10 bg-white/60 p-5 text-sm text-muted">
        Add bus / edit bus / manage routes &amp; stops / view ticket transactions are wired up as
        backend endpoints already (see <code>backend/src/routes/api.js</code>) — this prototype UI
        shows the read-only overview; forms for the write actions can be added the same way as the
        conductor screen.
      </div>
    </div>
  );
}

function Stat({ label, value, accent = "text-ink" }) {
  return (
    <div className="rounded-xl2 bg-white p-4 text-center shadow-card ring-1 ring-black/5">
      <p className={`font-display text-3xl font-bold ${accent}`}>{value}</p>
      <p className="mt-1 text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  );
}
