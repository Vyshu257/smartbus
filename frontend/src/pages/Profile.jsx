import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Profile() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem("smartbus_user") || "null"));
    } catch {
      setUser(null);
    }
  }, []);

  function handleLogout() {
    localStorage.removeItem("smartbus_token");
    localStorage.removeItem("smartbus_user");
    navigate("/");
  }

  if (!user) {
    return (
      <div className="rounded-xl2 bg-white p-6 text-center shadow-card ring-1 ring-black/5">
        <p className="font-semibold">You're not logged in</p>
        <Link to="/login" className="mt-3 inline-block rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div className="rounded-xl2 bg-white p-6 shadow-card ring-1 ring-black/5">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-100 text-2xl">
          {user.email[0].toUpperCase()}
        </div>
        <p className="mt-3 font-display text-lg font-semibold">{user.email}</p>
        <p className="text-sm text-muted">{user.role}</p>
      </div>

      <button
        onClick={handleLogout}
        className="w-full rounded-lg border border-black/10 py-3 text-base font-semibold text-danger"
      >
        Log out
      </button>

      {user.role === "ADMIN" && (
        <Link to="/admin" className="block rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
          <p className="font-semibold">🛠️ Admin dashboard</p>
        </Link>
      )}
      {(user.role === "CONDUCTOR" || user.role === "ADMIN") && (
        <Link to="/conductor" className="block rounded-xl2 bg-white p-4 shadow-card ring-1 ring-black/5">
          <p className="font-semibold">🎫 Conductor ticketing</p>
        </Link>
      )}
    </div>
  );
}
