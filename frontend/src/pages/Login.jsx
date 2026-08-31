import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.login(email, password);
      localStorage.setItem("smartbus_token", token);
      localStorage.setItem("smartbus_user", JSON.stringify(user));
      navigate("/profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Log in</h1>
        <p className="mt-1 text-muted">
          Demo accounts: admin@smartbus.dev / admin123, conductor@smartbus.dev / conductor123
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-xl2 bg-white p-5 shadow-card ring-1 ring-black/5">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Email</span>
          <input
            type="email"
            required
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Password</span>
          <input
            type="password"
            required
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Logging in…" : "Log in"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        No account? <Link to="/register" className="font-semibold text-brand-600">Register</Link>
      </p>
    </div>
  );
}
