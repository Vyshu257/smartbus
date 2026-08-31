import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import MapView from "../components/MapView.jsx";
import TripTimeline from "../components/TripTimeline.jsx";
import { api } from "../api/client.js";

export default function BusDetails() {
  const { tripId } = useParams();
  const [bus, setBus] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    function load() {
      api
        .getBus(tripId)
        .then((data) => !cancelled && setBus(data))
        .catch((err) => !cancelled && setError(err.message));
      api
        .getTimeline(tripId)
        .then((data) => !cancelled && setTimeline(data))
        .catch(() => {
          /* timeline is a nice-to-have - don't block the page on it */
        });
    }
    load();
    const interval = setInterval(load, 8000); // poll for live position updates
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [tripId]);

  if (error) {
    return (
      <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-semibold text-danger">{error}</p>
      </div>
    );
  }
  if (!bus) return <p className="text-muted">Loading bus details…</p>;

  return (
    <div className="space-y-5">
      <div className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">{bus.busNumber}</h1>
            <p className="text-muted">
              {bus.serviceNumber} · {bus.serviceType}
            </p>
          </div>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
            {bus.status}
          </span>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
          <Item label="Route" value={bus.routeName} />
          <Item label="Previous stop" value={bus.previousStop} />
          <Item label="Next stop" value={bus.nextStop} />
          <Item
            label="Last updated"
            value={bus.updatedAt ? new Date(bus.updatedAt).toLocaleTimeString() : "—"}
          />
          <Item
            label="Estimated occupancy"
            value={bus.occupancy ? `${bus.occupancy.occupancyPercent}% (${bus.occupancy.crowdLevel})` : "—"}
          />
          <Item label="Capacity" value={bus.capacity} />
        </dl>
      </div>

      {timeline && (
        <TripTimeline
          stops={timeline.stops}
          busPositionIndex={timeline.busPositionIndex}
          delayMinutes={timeline.delayMinutes}
        />
      )}

      <div className="h-80 overflow-hidden rounded-xl2 shadow-card ring-1 ring-black/5">
        {bus.currentLocation ? (
          <MapView
            busPosition={{ lat: bus.currentLocation.lat, lng: bus.currentLocation.lng }}
            busLabel={bus.busNumber}
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-white text-muted">
            ⚫ Live location unavailable.
          </div>
        )}
      </div>
    </div>
  );
}

function Item({ label, value }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted">{label}</dt>
      <dd className="mt-0.5 font-semibold">{value ?? "—"}</dd>
    </div>
  );
}
