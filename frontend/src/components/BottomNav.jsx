import { NavLink } from "react-router-dom";

const ITEMS = [
  { to: "/", label: "Home", icon: "🏠" },
  { to: "/track", label: "Live", icon: "📡" },
  { to: "/favorites", label: "Favorites", icon: "⭐" },
  { to: "/profile", label: "Profile", icon: "👤" },
];

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-around border-t border-black/5 bg-white/95 py-2 backdrop-blur sm:hidden">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-xs font-medium ${
              isActive ? "text-brand-500" : "text-muted"
            }`
          }
        >
          <span className="text-lg leading-none">{item.icon}</span>
          {item.label}
        </NavLink>
      ))}
    </nav>
  );
}
