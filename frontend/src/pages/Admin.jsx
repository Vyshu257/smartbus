import { useEffect, useState } from "react";
import { api } from "../api/client.js";

export default function Admin() {
  const [overview, setOverview] = useState(null);
  const [stops, setStops] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [buses, setBuses] = useState([]);
  const [error, setError] = useState("");
  const loggedIn = Boolean(localStorage.getItem("smartbus_token"));

  function refresh() {
    Promise.all([api.getAdminOverview(), api.getAdminStops(), api.getAdminRoutes(), api.getAdminBuses()])
      .then(([ov, st, rt, bs]) => {
        setOverview(ov);
        setStops(st);
        setRoutes(rt);
        setBuses(bs);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    if (loggedIn) refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loggedIn]);

  if (!loggedIn) {
    return (
      <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-semibold">Admin access required</p>
        <p className="mt-1 text-sm text-muted">Demo login: admin@smartbus.dev / admin123</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-muted">
          Manage the fleet directly here. Real data goes in exactly the same way as this demo data
          — one stop/route/bus at a time, or as a bulk import.
        </p>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {overview && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <Stat label="Total stops" value={overview.totalStops} />
          <Stat label="Total buses" value={overview.totalBuses} />
          <Stat label="Active buses" value={overview.activeBuses} accent="text-live" />
          <Stat label="Completed trips" value={overview.completedTrips} accent="text-danger" />
          <Stat label="Not yet started" value={overview.notStarted} accent="text-muted" />
          <Stat label="Available routes" value={overview.availableRoutes} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <AddStopForm stops={stops} onAdded={refresh} />
        <AddRouteForm stops={stops} routes={routes} onAdded={refresh} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <AddBusForm routes={routes} onAdded={refresh} />
        <BulkImportForm onImported={refresh} />
      </div>

      <FleetTable buses={buses} onChanged={refresh} />
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

function Card({ title, children }) {
  return (
    <div className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
      <p className="mb-3 font-display text-base font-semibold">{title}</p>
      {children}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</span>
      {children}
    </label>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2 text-sm";

function AddStopForm({ onAdded }) {
  const [name, setName] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      await api.addAdminStop({ name, lat: Number(lat), lng: Number(lng) });
      setStatus(`✓ Added "${name}"`);
      setName("");
      setLat("");
      setLng("");
      onAdded();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <Card title="Add stop">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Latitude">
            <input className={inputClass} type="number" step="any" value={lat} onChange={(e) => setLat(e.target.value)} required />
          </Field>
          <Field label="Longitude">
            <input className={inputClass} type="number" step="any" value={lng} onChange={(e) => setLng(e.target.value)} required />
          </Field>
        </div>
        {status && <p className="text-sm text-muted">{status}</p>}
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Add stop
        </button>
      </form>
    </Card>
  );
}

function AddRouteForm({ stops, onAdded }) {
  const [name, setName] = useState("");
  const [stopIds, setStopIds] = useState("");
  const [cumulativeKm, setCumulativeKm] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      await api.addAdminRoute({
        name,
        stopIds: stopIds.split(",").map((s) => s.trim()).filter(Boolean),
        cumulativeKm: cumulativeKm.split(",").map((s) => Number(s.trim())),
      });
      setStatus(`✓ Added "${name}"`);
      setName("");
      setStopIds("");
      setCumulativeKm("");
      onAdded();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <Card title="Add route">
      <form onSubmit={handleSubmit} className="space-y-3">
        <Field label="Name">
          <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
        </Field>
        <Field label="Stop IDs, in travel order (comma-separated)">
          <input
            className={inputClass}
            placeholder="stp_kurnool_road, stp_nannur, stp_kurnool"
            value={stopIds}
            onChange={(e) => setStopIds(e.target.value)}
            required
          />
        </Field>
        <Field label="Cumulative km per stop (comma-separated, same order)">
          <input
            className={inputClass}
            placeholder="0, 3.2, 24.0"
            value={cumulativeKm}
            onChange={(e) => setCumulativeKm(e.target.value)}
            required
          />
        </Field>
        {stops.length > 0 && (
          <details className="text-xs text-muted">
            <summary className="cursor-pointer select-none">Known stop IDs</summary>
            <ul className="mt-1 max-h-24 overflow-y-auto">
              {stops.map((s) => (
                <li key={s.id}>
                  <code>{s.id}</code> — {s.name}
                </li>
              ))}
            </ul>
          </details>
        )}
        {status && <p className="text-sm text-muted">{status}</p>}
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Add route
        </button>
      </form>
    </Card>
  );
}

const SERVICE_TYPES = ["PALLEVELUGU", "EXPRESS", "ULTRA DELUXE"];

function AddBusForm({ routes, onAdded }) {
  const [busNumber, setBusNumber] = useState("");
  const [serviceNumber, setServiceNumber] = useState("");
  const [serviceType, setServiceType] = useState("PALLEVELUGU");
  const [routeId, setRouteId] = useState("");
  const [capacity, setCapacity] = useState("50");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      await api.addAdminBus({ busNumber, serviceNumber, serviceType, routeId, capacity });
      setStatus(`✓ Added "${busNumber}"`);
      setBusNumber("");
      setServiceNumber("");
      onAdded();
    } catch (err) {
      setStatus(err.message);
    }
  }

  return (
    <Card title="Add bus">
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Bus number">
            <input className={inputClass} value={busNumber} onChange={(e) => setBusNumber(e.target.value)} required />
          </Field>
          <Field label="Service number">
            <input className={inputClass} value={serviceNumber} onChange={(e) => setServiceNumber(e.target.value)} required />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Service type">
            <select className={inputClass} value={serviceType} onChange={(e) => setServiceType(e.target.value)}>
              {SERVICE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Capacity">
            <input className={inputClass} type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} required />
          </Field>
        </div>
        <Field label="Route">
          <select className={inputClass} value={routeId} onChange={(e) => setRouteId(e.target.value)} required>
            <option value="">Select a route…</option>
            {routes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </Field>
        {status && <p className="text-sm text-muted">{status}</p>}
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Add bus (starts as Not Started)
        </button>
      </form>
    </Card>
  );
}

function BulkImportForm({ onImported }) {
  const [json, setJson] = useState("");
  const [status, setStatus] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("");
    try {
      const dataset = JSON.parse(json);
      const result = await api.importAdminData(dataset);
      setStatus(`✓ Imported ${result.addedStops} stops, ${result.addedRoutes} routes, ${result.addedBuses} buses`);
      setJson("");
      onImported();
    } catch (err) {
      setStatus(err.message.startsWith("Unexpected") ? "That doesn't look like valid JSON." : err.message);
    }
  }

  return (
    <Card title="Bulk import">
      <p className="mb-3 text-sm text-muted">
        Paste a <code>{`{ stops, routes, buses }`}</code> dataset (see{" "}
        <code>backend/data/README.md</code> for the format) to load many records at once.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <textarea
          className={`${inputClass} h-32 font-mono text-xs`}
          placeholder='{ "stops": [...], "routes": [...], "buses": [...] }'
          value={json}
          onChange={(e) => setJson(e.target.value)}
        />
        {status && <p className="text-sm text-muted">{status}</p>}
        <button type="submit" className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Import
        </button>
      </form>
    </Card>
  );
}

function FleetTable({ buses, onChanged }) {
  async function toggleStatus(bus) {
    const next = bus.status === "ACTIVE" ? "COMPLETED" : "ACTIVE";
    await api.updateAdminBus(bus.tripId, { status: next, updatedAt: Date.now() });
    onChanged();
  }

  return (
    <Card title={`Fleet (${buses.length})`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-muted">
              <th className="py-2 pr-4">Bus</th>
              <th className="py-2 pr-4">Service</th>
              <th className="py-2 pr-4">Type</th>
              <th className="py-2 pr-4">Status</th>
              <th className="py-2"></th>
            </tr>
          </thead>
          <tbody>
            {buses.map((b) => (
              <tr key={b.tripId} className="border-t border-black/5">
                <td className="py-2 pr-4 font-semibold">{b.busNumber}</td>
                <td className="py-2 pr-4 text-muted">{b.serviceNumber}</td>
                <td className="py-2 pr-4 text-muted">{b.serviceType}</td>
                <td className="py-2 pr-4">{b.status}</td>
                <td className="py-2">
                  {b.status !== "NOT_STARTED" && (
                    <button onClick={() => toggleStatus(b)} className="text-xs font-semibold text-brand-600">
                      Mark {b.status === "ACTIVE" ? "completed" : "active"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
