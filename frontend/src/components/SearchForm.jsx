import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const SERVICE_TYPES = ["All", "PALLEVELUGU", "EXPRESS", "ULTRA DELUXE"];

function StopSuggestions({ results, onSelect }) {
  if (!results.length) return null;

  return (
    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-black/10 bg-white shadow-lg">
      {results.map((stop) => (
        <button
          key={stop.id}
          type="button"
          onClick={() => onSelect(stop)}
          className="block w-full border-b border-black/5 px-3 py-3 text-left last:border-b-0 hover:bg-paper"
        >
          <p className="font-semibold text-ink">{stop.name}</p>

          <p className="text-xs text-muted">
            {stop.district}
            {stop.mandal ? ` • ${stop.mandal} (MDL)` : ""}
          </p>

          <p className="text-xs text-muted">
            {stop.pincode} • {stop.state}
          </p>
        </button>
      ))}
    </div>
  );
}

export default function SearchForm({ initial = {} }) {
  const [stops, setStops] = useState([]);
  const [from, setFrom] = useState(initial.from || "");
  const [to, setTo] = useState(initial.to || "");

  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);

  const [serviceType, setServiceType] = useState(initial.serviceType || "All");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    api
      .getStops()
      .then((data) => {
        setStops(data);

        if (!from && data[0]) {
          setFrom(data[0].name);
        }

        if (!to && data[data.length - 1]) {
          setTo(data[data.length - 1].name);
        }
      })
      .catch(() => setError("Couldn't load stop list. Is the backend running?"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function searchFrom(value) {
    setFrom(value);
    setError("");

    if (value.trim().length === 0) {
      setFromSuggestions([]);
      return;
    }

    const query = value.trim().toLowerCase();

    const matches = stops
      .filter((stop) => stop.name.toLowerCase().includes(query))
      .slice(0, 8);

    setFromSuggestions(matches);
  }

  function searchTo(value) {
    setTo(value);
    setError("");

    if (value.trim().length === 0) {
      setToSuggestions([]);
      return;
    }

    const query = value.trim().toLowerCase();

    const matches = stops
      .filter((stop) => stop.name.toLowerCase().includes(query))
      .slice(0, 8);

    setToSuggestions(matches);
  }

  function selectFrom(stop) {
    setFrom(stop.name);
    setFromSuggestions([]);
  }

  function selectTo(stop) {
    setTo(stop.name);
    setToSuggestions([]);
  }

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

    const params = new URLSearchParams({
      from,
      to,
      serviceType,
    });

    navigate(`/search?${params.toString()}`);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5"
    >
      <div className="grid gap-4 sm:grid-cols-2">

        {/* FROM */}
        <label className="relative block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            From
          </span>

          <input
            type="text"
            value={from}
            placeholder="Enter starting station"
            onChange={(e) => searchFrom(e.target.value)}
            onFocus={() => {
              if (from.trim()) {
                searchFrom(from);
              }
            }}
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base outline-none focus:border-brand-500"
          />

          <StopSuggestions
            results={fromSuggestions}
            onSelect={selectFrom}
          />
        </label>

        {/* TO */}
        <label className="relative block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            To
          </span>

          <input
            type="text"
            value={to}
            placeholder="Enter destination"
            onChange={(e) => searchTo(e.target.value)}
            onFocus={() => {
              if (to.trim()) {
                searchTo(to);
              }
            }}
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base outline-none focus:border-brand-500"
          />

          <StopSuggestions
            results={toSuggestions}
            onSelect={selectTo}
          />
        </label>
      </div>

      {/* SERVICE TYPE */}
      <label className="mt-4 block">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted">
          Service type
        </span>

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