import { Routes, Route, NavLink } from "react-router-dom";
import BottomNav from "./components/BottomNav.jsx";
import Home from "./pages/Home.jsx";
import Search from "./pages/Search.jsx";
import BusDetails from "./pages/BusDetails.jsx";
import Track from "./pages/Track.jsx";
import Favorites from "./pages/Favorites.jsx";
import College from "./pages/College.jsx";
import Conductor from "./pages/Conductor.jsx";
import Admin from "./pages/Admin.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";

const TOP_LINKS = [
  { to: "/", label: "Home" },
  { to: "/track", label: "Track a bus" },
  { to: "/favorites", label: "Favorites" },
  { to: "/college", label: "College route" },
  { to: "/conductor", label: "Conductor" },
];

export default function App() {
  return (
    <div className="min-h-screen bg-paper pb-16 sm:pb-0">
      <header className="border-b border-black/5 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <NavLink to="/" className="font-display text-xl font-bold tracking-tight text-brand-700">
            🚌 SmartBus
          </NavLink>
          <nav className="hidden gap-6 sm:flex">
            {TOP_LINKS.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `text-sm font-medium ${isActive ? "text-brand-600" : "text-muted hover:text-ink"}`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
          <NavLink
            to="/login"
            className="hidden rounded-lg border border-black/10 px-3 py-1.5 text-sm font-semibold sm:block"
          >
            Log in
          </NavLink>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/bus/:tripId" element={<BusDetails />} />
          <Route path="/track" element={<Track />} />
          <Route path="/map" element={<Track />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/college" element={<College />} />
          <Route path="/conductor" element={<Conductor />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </main>

      <BottomNav />
    </div>
  );
}
