import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";

const ArrowLeftIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function GamesListPage() {
  const navigate = useNavigate();
  const [sportFilter, setSportFilter] = useState(null);

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => (await api.get("/sports/")).data,
  });

  const { data: games = [], isLoading } = useQuery({
    queryKey: ["browse-games", sportFilter],
    queryFn: async () => {
      const res = await api.get("/games/browse/", {
        params: sportFilter ? { sport: sportFilter } : {},
      });
      return res.data;
    },
  });

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6">

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-steel transition-colors hover:border-crimson hover:text-crimson"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Liste des Jeux</h1>
            <p className="text-sm font-medium text-steel">Trouvez un match public à rejoindre</p>
          </div>
        </div>

        {/* Sport filter */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSportFilter(null)}
            className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              sportFilter === null
                ? "border-ink bg-ink text-white shadow-sm"
                : "border-gray-200 bg-white text-steel hover:border-ink hover:text-ink"
            }`}
          >
            Tous les sports
          </button>
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSportFilter(sport.id)}
              className={`rounded-xl border px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                sportFilter === sport.id
                  ? "border-ink bg-ink text-white shadow-sm"
                  : "border-gray-200 bg-white text-steel hover:border-ink hover:text-ink"
              }`}
            >
              {sport.name}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent" />
          </div>
        ) : games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
            <p className="text-sm font-medium text-steel">
              Aucun jeu public disponible{sportFilter ? " pour ce sport" : ""} pour le moment.
            </p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase text-white shadow-sm transition-colors hover:bg-crimsonDark"
            >
              Créer votre propre jeu
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {games.map((game) => {
              const isFull = game.occupied_count >= game.capacity;
              const isMember = game.my_status === "joined";

              return (
                <div
                  key={game.id}
                  onClick={() => navigate(`/games/${game.id}`)}
                  className="group flex cursor-pointer flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-ink hover:shadow-md"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-steel">
                        {game.sport_name}
                      </span>
                      {isMember && (
                        <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Inscrit
                        </span>
                      )}
                      {isFull && !isMember && (
                        <span className="rounded-md bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-crimson">
                          Complet
                        </span>
                      )}
                    </div>

                    <h3 className="mt-3 font-display text-xl text-ink">{game.terrain_name}</h3>
                    <p className="mt-1 text-xs font-medium text-steel">
                      📅 {game.date}
                    </p>
                    <p className="text-xs font-medium text-steel">
                      🕒 {game.start_time?.slice(0, 5)} - {game.end_time?.slice(0, 5)}
                    </p>
                    <p className="mt-2 text-xs font-medium text-gray-400">
                      Par {game.owner_name}
                    </p>
                  </div>

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    <div>
                      <span className="font-display text-2xl text-ink">
                        {game.occupied_count}/{game.capacity}
                      </span>
                      <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        places
                      </span>
                    </div>
                    <span
                      className={`rounded-xl px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${
                        isMember
                          ? "bg-gray-100 text-steel"
                          : isFull
                          ? "bg-gray-200 text-gray-500"
                          : "bg-crimson text-white group-hover:bg-crimsonDark"
                      }`}
                    >
                      {isMember ? "Ouvrir" : isFull ? "Complet" : "Voir"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}