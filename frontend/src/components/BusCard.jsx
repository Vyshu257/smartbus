import { Link } from "react-router-dom";
import StatusBadge from "./StatusBadge.jsx";

function timeAgo(timestamp) {
  if (!timestamp) return "no live data yet";
  const seconds = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (seconds < 60) return `Updated ${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  return `Updated ${minutes} min ago`;
}

export default function BusCard({ bus, recommended = false }) {
  return (
    <div
      className={`rounded-xl2 bg-white p-4 shadow-card ring-1 ${
        recommended ? "ring-brand-500" : "ring-black/5"
      }`}
    >
      {recommended && (
        <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-brand-500 px-2.5 py-0.5 text-xs font-semibold text-white">
          🏆 Recommended
        </div>
      )}

      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-lg font-semibold tracking-tight">{bus.busNumber}</p>
          <p className="text-sm text-muted">
            {bus.serviceNumber} · {bus.serviceType}
          </p>
        </div>
        <StatusBadge status={bus.status} label={bus.statusBadge} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-muted">Distance to your stop</p>
          <p className="font-semibold">
            {bus.distanceToBoardingKm != null ? `${bus.distanceToBoardingKm} km` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted">ETA to your stop</p>
          <p className="font-semibold">
            {bus.etaToBoardingMinutes != null ? `${bus.etaToBoardingMinutes} min` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted">ETA to destination</p>
          <p className="font-semibold">
            {bus.etaToDestMinutes != null ? `${bus.etaToDestMinutes} min` : "—"}
          </p>
        </div>
        <div>
          <p className="text-muted">Estimated crowd</p>
          <p className="font-semibold">
            {bus.occupancy ? `${bus.occupancy.crowdBadge} · ${bus.occupancy.occupancyPercent}%` : "—"}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-black/5 pt-3">
        <span className="text-xs text-muted">{timeAgo(bus.updatedAt)}</span>
        <Link
          to={`/bus/${bus.tripId}`}
          className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-600"
        >
          Track bus
        </Link>
      </div>
    </div>
  );
}
