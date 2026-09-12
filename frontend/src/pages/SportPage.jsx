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

const UsersIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 10-8 0 4 4 0 008 0z" />
  </svg>
);

export default function SportPage() {
  const { sportId } = useParams();
  const [selectedTerrain, setSelectedTerrain] = useState(null);

  const { data: sport, isLoading } = useQuery({
    queryKey: ["sport", sportId],
    queryFn: async () => {
      const res = await api.get(`/sports/${sportId}/`);
      return res.data;
    },
  });

  const terrains = sport?.terrains || [];
  
  // Show available AND maintenance terrains, excluding only 'inactive' ones
  const visibleTerrains = terrains.filter(
    (terrain) => 
      terrain.status?.toLowerCase() === "available" || 
      terrain.status?.toLowerCase() === "maintenance" || 
      terrain.is_active === true
  );

  const backendBaseUrl = "http://localhost:8000"; 
  const getImageUrl = (photoPath) => {
    if (!photoPath) return "/images/terrain-placeholder.jpg"; 
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

        {visibleTerrains.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
            <p className="text-sm font-medium text-steel">Aucun terrain disponible pour ce sport actuellement.</p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleTerrains.map((terrain) => {
              const isMaintenance = terrain.status?.toLowerCase() === "maintenance";

              return (
                <div
                  key={terrain.id}
                  className={`group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-all duration-300 ${
                    !isMaintenance ? "hover:-translate-y-1 hover:shadow-lg" : "opacity-90"
                  }`}
                >
                  
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100">
                    <img
                      src={getImageUrl(terrain.photo)}
                      alt={terrain.name}
                      className={`h-full w-full object-cover transition-transform duration-500 ${
                        !isMaintenance ? "group-hover:scale-105" : "grayscale-[30%]"
                      }`}
                    />
                    
                    <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
                      <div className="flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-steel shadow-sm backdrop-blur-md">
                        <MapPinIcon className="h-3 w-3" />
                        <span>Campus Principal</span>
                      </div>

                      {isMaintenance ? (
                        <span className="flex items-center gap-1 rounded-full bg-amber-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                          Maintenance
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-md">
                          <span className="h-1.5 w-1.5 rounded-full bg-white"></span>
                          Dispo
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-display text-xl text-ink">
                          {terrain.name}
                        </h3>
                        <span className="flex flex-none items-center gap-1 rounded-full bg-fog px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-steel">
                          <UsersIcon className="h-3 w-3" />
                          {terrain.capacity} joueurs
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-steel line-clamp-2">
                        {isMaintenance 
                          ? "Terrain indisponible pour le moment suite à des travaux d'entretien." 
                          : "Terrain standard pour les matchs étudiants."}
                      </p>
                    </div>

                    <div className="mt-6 mt-auto border-t border-gray-100 pt-4">
                      <button
                        onClick={() => !isMaintenance && setSelectedTerrain(terrain)}
                        disabled={isMaintenance}
                        className={`w-full rounded-xl py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all ${
                          isMaintenance
                            ? "bg-gray-300 cursor-not-allowed"
                            : "bg-crimson hover:bg-red-700"
                        }`}
                      >
                        {isMaintenance ? "Indisponible" : "Réserver ce terrain"}
                      </button>
                    </div>
                  </div>
                  
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTerrain && (
        <BookingModal
          terrain={selectedTerrain}
          onClose={() => setSelectedTerrain(null)}
        />
      )}
    </div>
  );
}