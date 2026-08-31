import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("USER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const { token, user } = await api.register(email, password, role);
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
        <h1 className="font-display text-2xl font-bold">Create an account</h1>
        <p className="mt-1 text-muted">Save favorite routes and, if you're a conductor, issue tickets.</p>
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
            minLength={6}
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">Account type</span>
          <select
            className="mt-1 w-full rounded-lg border border-black/10 bg-paper px-3 py-2.5 text-base"
            value={role}
            onChange={(e) => setRole(e.target.value)}
          >
            <option value="USER">Passenger</option>
            <option value="CONDUCTOR">Conductor</option>
          </select>
        </label>

        {error && <p className="text-sm text-danger">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 py-3 text-base font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <p className="text-center text-sm text-muted">
        Already have an account? <Link to="/login" className="font-semibold text-brand-600">Log in</Link>
      </p>
    </div>
  );
}
