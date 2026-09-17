import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const SERVICE_TYPES = ["All", "PALLEVELUGU", "EXPRESS", "ULTRA DELUXE"];

export default function SearchForm({ initial = {} }) {
  const [stops, setStops] = useState([]);
  const [from, setFrom] = useState(initial.from || "");
  const [to, setTo] = useState(initial.to || "");
  const [serviceType, setServiceType] = useState(initial.serviceType || "All");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    api
      .getStops()
      .then((data) => {
        setStops(data);
        if (!from && data[0]) setFrom(data[0].name);
        if (!to && data[data.length - 1]) setTo(data[data.length - 1].name);
      })
      .catch(() => setError("Couldn't load stop list. Is the backend running?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSubmit(e) {
    e.preventDefault();
    if (!from || !to) {
      setError("Choose both a starting point and a destination.");
      return;
    }
    if (from === to) {
      setError("Starting point and destination can't be the same.");
      return;
    }
    setError("");
    const params = new URLSearchParams({ from, to, serviceType });
    navigate(`/search?${params.toString()}`);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">From</span>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
          >
            {stops.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">To</span>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={to}
            onChange={(e) => setTo(e.target.value)}
          >
            {stops.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">Service type</span>
        <select
          className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          {SERVICE_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      <button
        type="submit"
        className="mt-5 w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white transition hover:bg-brand-600"
      >
        Find buses
      </button>
    </form>
  );
}
