import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout({ children }) {
  const { logoutUser } = useAuth();
  const location = useLocation();

  const navLinks = [
    { path: "/admin", label: "📊 KPI Dashboard" },
    { path: "/admin/terrains", label: "🏟️ Terrains & Sports" },
    { path: "/admin/reservations", label: "📅 Réservations Globales" },
  ];

  return (
    <div className="flex min-h-screen bg-fog">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-6 border-b border-gray-100">
          <h1 className="font-display text-2xl text-ink uppercase">UniPlay</h1>
          <span className="text-[10px] font-bold text-crimson uppercase tracking-widest">Admin Panel</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-4 py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-ink text-white shadow-md"
                    : "text-steel hover:bg-gray-50 hover:text-ink"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <button
            onClick={logoutUser}
            className="w-full rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold uppercase tracking-wider text-steel hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-all"
          >
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}