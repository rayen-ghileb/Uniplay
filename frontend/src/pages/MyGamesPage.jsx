import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "../services/api.js";
import Toast from "../components/Toast.jsx";

const ArrowLeftIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

function GameCard({ game, onOpen, pending, closedLabel }) {
  const isFull = game.occupied_count >= game.capacity;

  return (
    <div
      onClick={onOpen}
      className="flex cursor-pointer flex-col justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-steel">
            {game.is_public ? "🌍 Public" : "🔒 Privé"}
          </span>
          {pending && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
              Invitation
            </span>
          )}
          {closedLabel && (
            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">
              {closedLabel}
            </span>
          )}
          {isFull && (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-crimson">
              Complet
            </span>
          )}
        </div>

        <h3 className="mt-2 font-display text-xl text-ink">
          {game.sport_name} — {game.terrain_name}
        </h3>
        <p className="mt-1 text-xs font-medium text-steel">
          📅 {game.date} · {game.start_time?.slice(0, 5)} - {game.end_time?.slice(0, 5)}
        </p>
        <p className="mt-1 text-xs font-medium text-steel">
          {pending && game.invited_by_name
            ? `${game.invited_by_name} vous a invité`
            : `Organisé par ${game.owner_name}`}
        </p>
      </div>

      <div className="flex flex-none items-center gap-4">
        <div className="text-center">
          <div className="font-display text-2xl text-ink">
            {game.occupied_count}/{game.capacity}
          </div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Places</div>
        </div>
        <span className="rounded-xl bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white">
          {pending ? "Consulter" : "Lobby"}
        </span>
      </div>
    </div>
  );
}

export default function MyGamesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [tab, setTab] = useState("active");
  const [feedback, setFeedback] = useState({ type: "", message: location.state?.feedback || "" });

  useEffect(() => {
    if (location.state?.feedback) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ["my-games"],
    queryFn: async () => (await api.get("/games/mine/")).data,
  });

  const active = data?.active || [];
  const pending = data?.pending || [];
  const history = data?.history || [];
  const cancelled = data?.cancelled || [];
  const games = tab === "active"
    ? active
    : tab === "pending"
    ? pending
    : tab === "history"
    ? history
    : cancelled;

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-steel transition-colors hover:border-crimson hover:text-crimson"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Mes Jeux</h1>
            <p className="text-sm font-medium text-steel">Vos matchs, invitations et historique</p>
          </div>
        </div>

        <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
          <button
            onClick={() => setTab("active")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              tab === "active" ? "bg-ink text-white shadow-sm" : "text-steel hover:text-ink"
            }`}
          >
            Actifs ({active.length})
          </button>
          <button
            onClick={() => setTab("history")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              tab === "history" ? "bg-ink text-white shadow-sm" : "text-steel hover:text-ink"
            }`}
          >
            Historique ({history.length})
          </button>
          <button
            onClick={() => setTab("cancelled")}
            className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              tab === "cancelled" ? "bg-ink text-white shadow-sm" : "text-steel hover:text-ink"
            }`}
          >
            Annulées ({cancelled.length})
          </button>
          <button
            onClick={() => setTab("pending")}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
              tab === "pending" ? "bg-ink text-white shadow-sm" : "text-steel hover:text-ink"
            }`}
          >
            En attente
            {pending.length > 0 && (
              <span className="rounded-full bg-crimson px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {pending.length}
              </span>
            )}
          </button>
        </div>

        {games.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
            <p className="text-sm font-medium text-steel">
              {tab === "active"
                ? "Vous n'avez aucun jeu actif."
                : tab === "pending"
                ? "Aucune invitation en attente."
                : tab === "history"
                ? "Aucun jeu dans votre historique."
                : "Aucun jeu annulé."}
            </p>
            <Link
              to={tab === "active" ? "/jeux" : "/"}
              className="mt-4 inline-block rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase text-white shadow-sm transition-colors hover:bg-crimsonDark"
            >
              {tab === "active" ? "Parcourir les jeux" : "Réserver un terrain"}
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {games.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                pending={tab === "pending"}
                closedLabel={tab === "history" ? "Terminé" : tab === "cancelled" ? "Annulé" : ""}
                onOpen={() => navigate(`/games/${game.id}`)}
              />
            ))}
          </div>
        )}
      </div>
      <Toast
        type={feedback.type || "success"}
        message={feedback.message}
        onClose={() => setFeedback({ type: "", message: "" })}
      />
    </div>
  );
}