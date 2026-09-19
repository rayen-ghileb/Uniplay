import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
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

const BellIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

function AdminNotificationBell() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => (await api.get("/games/notifications/")).data,
    refetchInterval: 60000,
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllRead = async () => {
    try {
      await api.post("/games/notifications/read/", {});
      queryClient.invalidateQueries(["notifications"]);
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const dismissNotification = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/games/notifications/${id}/`);
      queryClient.invalidateQueries(["notifications"]);
    } catch (err) {
      console.error("Failed to dismiss notification:", err);
    }
  };

  // Admin notifications (booking created/cancelled) always route to the reservations list,
  // regardless of the underlying game, since the admin's job here is the booking record, not the lobby.
  const handleNotificationClick = (n) => {
    setOpen(false);
    if (n.kind === "booking_created" || n.kind === "booking_cancelled") {
      navigate("/admin/reservations");
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          setOpen((o) => {
            const next = !o;
            if (next && unreadCount > 0) markAllRead();
            return next;
          });
        }}
        aria-label="Notifications"
        className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
          open
            ? "border-gray-300 bg-gray-100 text-ink"
            : "border-gray-200 bg-white text-steel hover:border-gray-300 hover:bg-gray-50"
        }`}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-crimson px-1 text-[9px] font-extrabold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 bg-fog/50 px-4 py-2.5 text-[10px] font-bold uppercase tracking-wider text-steel">
            Notifications
          </div>
          {notifications.length === 0 ? (
            <div className="px-4 py-5 text-center text-xs font-medium text-gray-400">
              Aucune notification.
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`group flex items-start gap-2 border-b border-gray-50 px-4 py-3 text-left transition-colors last:border-0 hover:bg-gray-50 ${
                    n.kind === "booking_created" || n.kind === "booking_cancelled" ? "cursor-pointer" : ""
                  } ${!n.is_read ? "bg-crimson/5" : ""}`}
                >
                  {!n.is_read && <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-crimson" />}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-ink">{n.message}</div>
                    <div className="mt-0.5 text-[10px] font-medium text-gray-400">
                      {new Date(n.created_at).toLocaleString("fr-FR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <button
                    onClick={(e) => dismissNotification(e, n.id)}
                    className="flex-none px-1 text-gray-300 opacity-0 transition-opacity hover:text-crimson group-hover:opacity-100"
                    aria-label="Supprimer"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminLayout({ children }) {
  const { logoutUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navLinks = [
    { path: "/admin", label: "Tableau de bord", icon: DashboardIcon },
    { path: "/admin/users", label: "Gestion des Utilisateurs", icon: UsersIcon },
    { path: "/admin/students", label: "Gestion des Étudiants", icon: UsersIcon },
    { path: "/admin/terrains", label: "Gestion des terrains", icon: TerrainIcon },
    { path: "/admin/planning", label: "Gestion de planning", icon: CalendarIcon },
    { path: "/admin/sports", label: "Gestion des sports", icon: TerrainIcon },
    { path: "/admin/reservations", label: "Réservations globales", icon: CalendarIcon },
    { path: "/admin/reclamations", label: "Réclamations", icon: UsersIcon },
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
      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="sticky top-0 z-20 flex justify-end border-b border-gray-200 bg-white/90 px-8 py-3 backdrop-blur-md">
          <AdminNotificationBell />
        </div>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}