import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function Track() {
  const [busNumber, setBusNumber] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    if (!busNumber.trim()) return;
    setLoading(true);
    setError("");
    try {
      const trip = await api.trackByBusNumber(busNumber.trim());
      navigate(`/bus/${trip.tripId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Track a bus</h1>
        <p className="mt-1 text-muted">Already know the bus number? Look it up directly.</p>
      </div>

      <form onSubmit={handleSubmit} className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Bus number</span>
          <input
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base uppercase tracking-wide"
            placeholder="AP21Z0646"
            value={busNumber}
            onChange={(e) => setBusNumber(e.target.value)}
          />
        </label>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Looking up…" : "Track this bus"}
        </button>
      </form>
    </div>
  );
}
