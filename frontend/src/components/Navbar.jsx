import { useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import logo from "../assets/images/uniplay-logo.png";


const HomeIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 00-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 00-1 1m-6 0h6" />
  </svg>
);

const LogoutIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  // Fetch current user details automatically
  const { data: user } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return res.data;
    },
  });

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
        <div className="flex items-center gap-3">
          <div
            title={`${user?.first_name || ""} ${user?.last_name || ""} (${user?.username || ""})`}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-crimson font-display text-sm font-bold text-white shadow-sm ring-2 ring-crimson/20"
          >
            {initial}
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-bold text-steel hover:border-red-200 hover:bg-red-50 hover:text-crimson transition-all"
          >
            <LogoutIcon />
            <span className="hidden sm:inline">Déconnexion</span>
          </button>
        </div>

      </div>
    </header>
  );
}