import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client.js";

export default function Favorites() {
  const [favorites, setFavorites] = useState(null);
  const [error, setError] = useState("");
  const loggedIn = Boolean(localStorage.getItem("smartbus_token"));

  useEffect(() => {
    if (!loggedIn) return;
    api
      .getFavorites()
      .then(setFavorites)
      .catch((err) => setError(err.message));
  }, [loggedIn]);

  async function handleRemove(id) {
    await api.removeFavorite(id);
    setFavorites((list) => list.filter((f) => f.id !== id));
  }

  if (!loggedIn) {
    return (
      <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-semibold">Log in to save favorite routes</p>
        <p className="mt-1 text-sm text-muted">
          Favorites, bus, boarding stop and destination preferences are saved to your account.
        </p>
        <Link to="/login" className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Favorite routes</h1>
        <p className="mt-1 text-muted">Save routes you use often and track them in one tap.</p>
      </div>

      {error && <p className="text-danger">{error}</p>}

      {favorites && favorites.length === 0 && (
        <div className="rounded-xl2 border border-dashed border-black/10 bg-white/60 p-6 text-center">
          <p className="text-muted">No favorites yet. Save one from a search results page.</p>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {favorites?.map((fav) => (
          <div key={fav.id} className="rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
            <p className="font-semibold">⭐ {fav.label}</p>
            <p className="mt-1 text-sm text-muted">
              {fav.from} → {fav.to} · {fav.serviceType}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Link
                to={`/search?from=${encodeURIComponent(fav.from)}&to=${encodeURIComponent(fav.to)}&serviceType=${encodeURIComponent(
                  fav.serviceType
                )}`}
                className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-semibold text-white"
              >
                Track now
              </Link>
              <button
                onClick={() => handleRemove(fav.id)}
                className="rounded-lg border border-black/10 px-3 py-1.5 text-sm font-semibold text-muted"
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
