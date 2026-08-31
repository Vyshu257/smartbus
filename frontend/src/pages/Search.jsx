import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import SearchForm from "../components/SearchForm.jsx";
import BusCard from "../components/BusCard.jsx";
import { api } from "../api/client.js";

export default function Search() {
  const [params] = useSearchParams();
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const serviceType = params.get("serviceType") || "All";

  const [state, setState] = useState({ loading: true, error: "", data: null });
  const [favoriteStatus, setFavoriteStatus] = useState("");
  const loggedIn = Boolean(localStorage.getItem("smartbus_token"));

  useEffect(() => {
    if (!from || !to) return;
    setState({ loading: true, error: "", data: null });
    api
      .search({ from, to, serviceType })
      .then((data) => setState({ loading: false, error: "", data }))
      .catch((err) => setState({ loading: false, error: err.message, data: null }));
  }, [from, to, serviceType]);

  async function handleSaveFavorite() {
    try {
      await api.addFavorite({ label: `${from} → ${to}`, from, to, serviceType });
      setFavoriteStatus("Saved to favorites ✓");
    } catch (err) {
      setFavoriteStatus(err.message);
    }
  }

  return (
    <div className="space-y-6">
      <SearchForm initial={{ from, to, serviceType }} />

      {state.loading && <p className="text-muted">Checking live positions…</p>}

      {state.error && (
        <div className="rounded-xl2 bg-white p-5 text-center shadow-card ring-1 ring-black/5">
          <p className="font-semibold text-danger">{state.error}</p>
        </div>
      )}

      {state.data && state.data.count === 0 && (
        <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
          <p className="font-semibold">{state.data.message}</p>
          <p className="mt-1 text-sm text-muted">{state.data.suggestion}</p>
        </div>
      )}

      {state.data && state.data.count > 0 && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold">
              {state.data.count} bus{state.data.count > 1 ? "es" : ""} available now
            </h2>
            {loggedIn && (
              <button onClick={handleSaveFavorite} className="text-sm font-semibold text-brand-600">
                ⭐ Save route
              </button>
            )}
          </div>
          {favoriteStatus && <p className="mb-3 text-sm text-live">{favoriteStatus}</p>}
          <div className="grid gap-4 sm:grid-cols-2">
            {state.data.buses.map((bus) => (
              <BusCard
                key={bus.tripId}
                bus={bus}
                recommended={state.data.recommendation?.tripId === bus.tripId}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
