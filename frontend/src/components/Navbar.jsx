import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import logo from "../assets/images/uniplay-logo.png";


const HomeIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6" />
  </svg>
);

const LogoutIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const SettingsIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ChevronIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Fetch current user details automatically
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return res.data;
    },
  });

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      const refresh = localStorage.getItem("refresh_token");
      if (refresh) {
        await api.post("/auth/logout/", { refresh });
      }
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      navigate("/login");
    }
  };

  const initial = (
    user?.first_name?.[0] ||
    user?.username?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200/80 bg-white/90 backdrop-blur-md shadow-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3 sm:px-6">

        {/* Navigation with Logo */}
        <div className="flex items-center gap-4">
          <img
            src={logo}
            alt="Website Logo"
            className="h-18 w-auto object-contain cursor-pointer"
            onClick={() => navigate("/")}
          />
          <button
            onClick={() => navigate("/")}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold transition-colors ${
              location.pathname === "/"
                ? "bg-ink text-white"
                : "text-steel hover:bg-gray-100 hover:text-ink"
            }`}
          >
            <HomeIcon />
            <span className="hidden sm:inline">Accueil</span>
          </button>
        </div>

        {/* User Info & Actions */}
        <div className="flex items-center gap-2" ref={menuRef}>
          <div
            onClick={() => navigate("/profile")}
            title={`${user?.first_name || ""} ${user?.last_name || ""} (${user?.username || ""})`}
            className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-sm font-bold text-white shadow-sm ring-2 ring-crimson/20 transition-transform hover:scale-105"
          >
            {user?.photo ? (
              <img src={user.photo} alt="Profil" className="h-full w-full object-cover" />
            ) : (
              initial
            )}
          </div>

          <div className="relative">
            <button
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Ouvrir le menu utilisateur"
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                menuOpen
                  ? "border-gray-300 bg-gray-100 text-ink"
                  : "border-gray-200 bg-gray-50 text-steel hover:border-gray-300 hover:bg-gray-100"
              }`}
            >
              <ChevronIcon className={`h-3.5 w-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-gray-200 bg-white py-1.5 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    navigate("/parametres/profil");
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-ink hover:bg-gray-50"
                >
                  <SettingsIcon />
                  Paramètres
                </button>
                <div className="my-1 border-t border-gray-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-semibold text-crimsonDark hover:bg-red-50"
                >
                  <LogoutIcon />
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
}