import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/images/uniplay-logo.png";

const DashboardIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z" />
  </svg>
);
const UsersIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
  </svg>
);

const TerrainIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="14" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v2m0 10v2" />
  </svg>
);

const CalendarIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4m8-4v4M3 10h18" />
  </svg>
);

const LogoutIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);
const ReclamationIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
  </svg>
);

export default function AdminLayout({ children }) {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: "/admin", label: "Tableau de bord", icon: DashboardIcon },
    { path: "/admin/users", label: "Gestion des Utilisateurs", icon: UsersIcon },
    { path: "/admin/students", label: "Gestion des Étudiants", icon: UsersIcon },
    { path: "/admin/terrains", label: "Gestion des terrains", icon: TerrainIcon },
    { path: "/admin/sports", label: "Gestion des sports", icon: TerrainIcon },
    { path: "/admin/planning", label: "Gestion de planning", icon: CalendarIcon },
    { path: "/admin/reservations", label: "Réservations globales", icon: CalendarIcon },
    { path: "/admin/reclamations", label: "Gestion des réclamations", icon: ReclamationIcon },
  ];

  return (
    <div className="flex min-h-screen bg-fog">
      {/* Sidebar */}
      <aside className="w-64 flex flex-col bg-white border-r border-gray-200">
        <div className="border-b border-gray-100 p-6">
          <img
            src={logo}
            alt="UniPlay"
            className="h-auto w-auto cursor-pointer"
            onClick={() => navigate("/admin")}
          />

        </div>

        <nav className="flex-1 space-y-1.5 p-4">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-xs font-bold uppercase tracking-wider transition-all ${
                  isActive
                    ? "bg-ink text-white shadow-md"
                    : "text-steel hover:bg-gray-50 hover:text-ink"
                }`}
              >
                <Icon className="h-4 w-4 flex-none" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={logoutUser}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold uppercase tracking-wider text-steel transition-all hover:border-crimson/30 hover:bg-crimson/5 hover:text-crimson"
          >
            <LogoutIcon className="h-4 w-4" />
            Déconnexion
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 overflow-y-auto p-8">{children}</main>
    </div>
  );
}
