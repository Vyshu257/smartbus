import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import BusCard from "../components/BusCard.jsx";
import { api } from "../api/client.js";

function loadCollegeRoute() {
  try {
    return JSON.parse(localStorage.getItem("smartbus_college_route") || "null");
  } catch {
    return null;
  }
}

export default function Home() {
  const collegeRoute = loadCollegeRoute();
  const [collegeBuses, setCollegeBuses] = useState(null);

  useEffect(() => {
    if (!collegeRoute) return;
    api
      .search({ from: collegeRoute.home, to: collegeRoute.destination, serviceType: collegeRoute.serviceType })
      .then((res) => setCollegeBuses(res.buses || []))
      .catch(() => setCollegeBuses([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">{greeting} 👋</h1>
        <p className="mt-1 text-muted">
          Search a route and SmartBus only shows the buses you can actually catch right now.
        </p>
      </div>

      <SearchForm />

      {collegeRoute ? (
        <section className="rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">Your college route</p>
              <p className="mt-1 font-display text-lg font-semibold">
                {collegeRoute.home} → {collegeRoute.destination}
              </p>
            </div>
            <Link
              to={`/search?from=${encodeURIComponent(collegeRoute.home)}&to=${encodeURIComponent(
                collegeRoute.destination
              )}&serviceType=${encodeURIComponent(collegeRoute.serviceType || "All")}`}
              className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white"
            >
              View buses
            </Link>
          </div>
          {collegeBuses && (
            <p className="mt-2 text-sm text-live">
              {collegeBuses.length > 0
                ? `🟢 ${collegeBuses.length} bus${collegeBuses.length > 1 ? "es" : ""} available now`
                : "No buses available right now."}
            </p>
          )}
        </section>
      ) : (
        <section className="rounded-xl2 border border-dashed border-black/10 bg-white/60 p-5 text-center">
          <p className="text-sm text-muted">
            Set up your college, home stop and destination for a one-tap daily route.
          </p>
          <Link to="/college" className="mt-2 inline-block text-sm font-semibold text-brand-600">
            Set up my college route →
          </Link>
        </section>
      )}

      {collegeBuses && collegeBuses.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-lg font-semibold">Nearby buses</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {collegeBuses.slice(0, 4).map((bus) => (
              <BusCard key={bus.tripId} bus={bus} />
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-3 sm:grid-cols-2">
        <Link to="/track" className="rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
          <p className="font-semibold">📡 Track by bus number</p>
          <p className="mt-1 text-sm text-muted">Already know your bus? Look it up directly.</p>
        </Link>
        <Link to="/favorites" className="rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
          <p className="font-semibold">⭐ Favorite routes</p>
          <p className="mt-1 text-sm text-muted">Save routes you use often for one-tap tracking.</p>
        </Link>
      </section>
    </div>
  );
}
