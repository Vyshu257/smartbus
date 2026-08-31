import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

const SERVICE_TYPES = ["All", "PALLEVELUGU", "EXPRESS", "ULTRA DELUXE"];

export default function College() {
  const [stops, setStops] = useState([]);
  const [college, setCollege] = useState("");
  const [home, setHome] = useState("");
  const [destination, setDestination] = useState("");
  const [serviceType, setServiceType] = useState("All");
  const [saved, setSaved] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    api.getStops().then(setStops).catch(() => {});
    try {
      const existing = JSON.parse(localStorage.getItem("smartbus_college_route") || "null");
      if (existing) {
        setCollege(existing.college || "");
        setHome(existing.home || "");
        setDestination(existing.destination || "");
        setServiceType(existing.serviceType || "All");
      }
    } catch {
      // ignore malformed local storage
    }
  }, []);

  function handleSave(e) {
    e.preventDefault();
    localStorage.setItem(
      "smartbus_college_route",
      JSON.stringify({ college, home, destination, serviceType })
    );
    setSaved(true);
    setTimeout(() => navigate("/"), 700);
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Your college route</h1>
        <p className="mt-1 text-muted">
          Set this up once and your home page will show live buses for this route every time.
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">College</span>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            placeholder="G. Pulla Reddy Engineering College"
            value={college}
            onChange={(e) => setCollege(e.target.value)}
          />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Home / boarding village</span>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={home}
            onChange={(e) => setHome(e.target.value)}
          >
            <option value="">Select…</option>
            {stops.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Destination</span>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          >
            <option value="">Select…</option>
            {stops.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Preferred bus type</span>
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

        <button
          type="submit"
          disabled={!home || !destination}
          className="w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-50"
        >
          {saved ? "Saved ✓" : "Save my route"}
        </button>
      </form>
    </div>
  );
}
