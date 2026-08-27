import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import BookingModal from "../components/BookingModal.jsx";

const ArrowLeftIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const MapPinIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

export default function SportPage() {
  const { sportId } = useParams();
  const [filter, setFilter] = useState("ALL");
  const [selectedTerrain, setSelectedTerrain] = useState(null); // Controls modal

  const { data: sport, isLoading } = useQuery({
    queryKey: ["sport", sportId],
    queryFn: async () => {
      const res = await api.get(`/sports/${sportId}/`);
      return res.data;
    },
  });

  const terrains = sport?.terrains || [];
  const filteredTerrains = terrains.filter((terrain) => {
    if (filter === "ALL") return true;
    if (filter === "AVAILABLE") return terrain.status === "AVAILABLE" || terrain.is_active;
    if (filter === "MAINTENANCE") return terrain.status === "MAINTENANCE" || !terrain.is_active;
    return true;
  });

  // --- IMAGE HELPER FUNCTION ---
  const backendBaseUrl = "http://localhost:8000"; // Adjust if your Django runs on a different port
  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/images/terrain-placeholder.jpg"; // Your fallback image
    if (photoPath.startsWith("http")) return photoPath;
    return `${backendBaseUrl}${photoPath}`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-steel transition-colors hover:border-crimson hover:text-crimson shadow-sm"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="font-display text-3xl tracking-tight text-ink uppercase">
              {sport?.name || "Sport"}
            </h1>
            <p className="text-sm font-medium text-steel">
              Sélectionnez un terrain pour voir les disponibilités
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          <button
            onClick={() => setFilter("ALL")}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              filter === "ALL"
                ? "bg-ink text-white shadow-md"
                : "bg-white text-steel border border-gray-200 hover:border-ink hover:text-ink"
            }`}
          >
            Tous les terrains ({terrains.length})
          </button>
          <button
            onClick={() => setFilter("AVAILABLE")}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              filter === "AVAILABLE"
                ? "bg-emerald-600 text-white shadow-md"
                : "bg-white text-steel border border-gray-200 hover:border-emerald-600 hover:text-emerald-600"
            }`}
          >
            Disponibles
          </button>
          <button
            onClick={() => setFilter("MAINTENANCE")}
            className={`whitespace-nowrap rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all ${
              filter === "MAINTENANCE"
                ? "bg-amber-500 text-white shadow-md"
                : "bg-white text-steel border border-gray-200 hover:border-amber-500 hover:text-amber-500"
            }`}
          >
            En Maintenance
          </button>
        </div>

        {/* Terrain Grid */}
        {filteredTerrains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
            <p className="text-sm font-medium text-steel">Aucun terrain ne correspond à ce filtre.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTerrains.map((terrain) => {
              const isAvailable = terrain.status === "AVAILABLE" || terrain.is_active !== false;

              return (
                <div
                  key={terrain.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
                    isAvailable ? "border-gray-200 hover:-translate-y-1 hover:shadow-lg" : "border-gray-200 opacity-75 grayscale-[0.5]"
                  }`}
                >
                  
                  {/* BEAUTIFUL TERRAIN IMAGE HEADER */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(terrain.photo)}
                      alt={terrain.name}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    
                    {/* Floating Badges over the image */}
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-steel shadow-sm backdrop-blur-md">
                        <MapPinIcon className="h-3 w-3" />
                        <span>Campus Principal</span>
                      </div>
                      
                      {isAvailable ? (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                          Dispo
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                          Maintenance
                        </span>
                      )}
                    </div>
                  </div>

                  {/* CONTENT SECTION */}
                  <div className="flex flex-1 flex-col p-5">
                    <div>
                      <h3 className="font-display text-xl text-ink">
                        {terrain.name}
                      </h3>
                      <p className="mt-1 text-xs text-steel line-clamp-2">
                        Terrain standard pour les matchs étudiants.
                      </p>
                    </div>

                    {/* Reserve Button */}
                    <div className="mt-6 mt-auto border-t border-gray-100 pt-4">
                      {isAvailable ? (
                        <button
                          onClick={() => setSelectedTerrain(terrain)}
                          className="w-full rounded-xl bg-crimson py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-red-700"
                        >
                          Réserver ce terrain
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full cursor-not-allowed rounded-xl bg-gray-100 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-400"
                        >
                          Indisponible
                        </button>
                      )}
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pop-up Booking Modal */}
      {selectedTerrain && (
        <BookingModal
          terrain={selectedTerrain}
          onClose={() => setSelectedTerrain(null)}
        />
      )}
    </div>
  );
}