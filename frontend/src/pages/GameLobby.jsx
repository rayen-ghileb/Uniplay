import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import ConfirmModal from "../components/ConfirmModal.jsx";

const ArrowLeftIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

function Avatar({ participant, size = "h-10 w-10" }) {
  const initials = (
    (participant.first_name?.[0] || "") + (participant.last_name?.[0] || participant.student_id?.[0] || "")
  ).toUpperCase() || "U";

  return (
    <div className={`flex ${size} flex-none items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-sm font-bold text-white shadow-sm`}>
      {participant.photo ? (
        <img src={participant.photo} alt={participant.student_id} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function UserSuggestionAvatar({ user }) {
  return <Avatar participant={{ ...user, student_id: user.username }} size="h-8 w-8" />;
}

export default function GameLobby() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [inviteSearch, setInviteSearch] = useState("");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [confirmation, setConfirmation] = useState(null);
  const [feedback, setFeedback] = useState({ type: "success", message: location.state?.feedback || "" });

  useEffect(() => {
    if (location.state?.feedback) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  const { data: me } = useQuery({
    queryKey: ["me"],
    queryFn: async () => (await api.get("/auth/me/")).data,
  });

  const { data: game, isLoading, isError } = useQuery({
    queryKey: ["game", gameId],
    queryFn: async () => (await api.get(`/games/${gameId}/`)).data,
  });

  const { data: allUsers = [] } = useQuery({
    queryKey: ["users"],
    queryFn: async () => (await api.get("/auth/users/")).data,
  });

  const refresh = () => {
    queryClient.invalidateQueries(["game", gameId]);
    queryClient.invalidateQueries(["my-games"]);
    queryClient.invalidateQueries(["browse-games"]);
  };

  const showError = (err, fallback) => {
    setFeedback({ type: "error", message: err.response?.data?.detail || fallback });
  };

  const inviteMutation = useMutation({
    mutationFn: async (studentId) => api.post(`/games/${gameId}/invite/`, { student_id: studentId }),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Invitation envoyée." });
      setInviteSearch("");
      refresh();
    },
    onError: (err) => showError(err, "Impossible d'envoyer l'invitation."),
  });

  const joinMutation = useMutation({
    mutationFn: async () => api.post(`/games/${gameId}/join/`),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Vous avez rejoint le jeu." });
      refresh();
    },
    onError: (err) => showError(err, "Impossible de rejoindre ce jeu."),
  });

  const acceptMutation = useMutation({
    mutationFn: async () => api.post(`/games/${gameId}/accept/`),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Invitation acceptée." });
      refresh();
    },
    onError: (err) => showError(err, "Impossible d'accepter l'invitation."),
  });

  const declineMutation = useMutation({
    mutationFn: async () => api.post(`/games/${gameId}/decline/`),
    onSuccess: () => navigate("/mes-jeux"),
    onError: (err) => showError(err, "Impossible de refuser l'invitation."),
  });

  const kickMutation = useMutation({
    mutationFn: async (studentId) => api.post(`/games/${gameId}/leave/`, { student_id: studentId }),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Participant exclu." });
      refresh();
    },
    onError: (err) => showError(err, "Impossible d'exclure ce participant."),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => api.post(`/games/${gameId}/leave/`),
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
      queryClient.invalidateQueries(["timeslots"]);
      navigate("/", {
        state: { feedback: "Vous avez quitté la partie. Consultez la liste des jeux publiques et rejoignez-en un autre." },
      });
    },
    onError: (err) => showError(err, "Impossible de quitter le jeu."),
  });

  const resizeMutation = useMutation({
    mutationFn: async (newSize) => api.post(`/games/${gameId}/resize/`, { max_players: newSize }),
    onSuccess: () => {
      setFeedback({ type: "success", message: "Taille du lobby mise à jour." });
      refresh();
    },
    onError: (err) => showError(err, "Impossible de modifier la taille du lobby."),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent" />
      </div>
    );
  }

  if (isError || !game) {
    return (
      <div className="min-h-screen bg-fog px-4 py-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
          <p className="text-sm font-medium text-steel">Ce jeu est introuvable ou vous n'y avez pas accès.</p>
          <Link to="/jeux" className="mt-4 inline-block rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase text-white">
            Parcourir les jeux
          </Link>
        </div>
      </div>
    );
  }

  const isOwner = me?.id === game.organizer_user_id || me?.username === game.organizer_id;
  const joined = game.participants.filter((p) => p.status === "joined");
  const invited = game.participants.filter((p) => p.status === "invited");
  const occupied = game.occupied_count ?? joined.length + invited.length;
  const isFull = occupied >= game.capacity;
  const myStatus = game.my_status;
  const isMember = myStatus === "joined";
  const isClosed = game.is_cancelled || game.is_finished;
  const canInvite = !isClosed && (isMember || isOwner);
  const alreadyInGame = new Set(game.participants.map((p) => p.student_id));
  const invitableUsers = allUsers.filter((u) => {
    if (u.username === me?.username || alreadyInGame.has(u.username)) return false;
    const term = inviteSearch.trim().toLowerCase();
    if (!term) return false;
    return (
      u.username.toLowerCase().includes(term) ||
      u.first_name?.toLowerCase().includes(term) ||
      u.last_name?.toLowerCase().includes(term) ||
      `${u.first_name} ${u.last_name}`.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">

        <div className="flex items-center gap-4">
          <Link
            to="/mes-jeux"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-steel transition-colors hover:border-crimson hover:text-crimson"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Lobby du jeu</h1>
            <p className="text-sm font-medium text-steel">Gérez les joueurs de votre match</p>
          </div>
        </div>

        {feedback.message && (
          <div
            className={`flex items-center justify-between rounded-2xl border p-4 text-xs font-bold ${
              feedback.type === "error"
                ? "border-red-200 bg-red-50 text-red-700"
                : "border-emerald-200 bg-emerald-50 text-emerald-700"
            }`}
          >
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback({ type: "", message: "" })} className="ml-4 px-2">✕</button>
          </div>
        )}

        {/* Game info */}
        <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-lg">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
            <div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                  {game.is_public ? "🌍 Public" : "🔒 Privé"}
                </span>
                {game.is_cancelled && (
                  <span className="rounded-full bg-gray-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Annulé
                  </span>
                )}
                {!game.is_cancelled && game.is_finished && (
                  <span className="rounded-full bg-gray-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Terminé
                  </span>
                )}
                {isFull && (
                  <span className="rounded-full bg-crimson px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider">
                    Complet
                  </span>
                )}
              </div>
              <h2 className="mt-2 font-display text-3xl tracking-tight">
                {game.sport_name} — {game.terrain_name}
              </h2>
              <p className="mt-1 text-sm font-medium text-gray-300">
                📅 {game.date} · {game.start_time?.slice(0, 5)} - {game.end_time?.slice(0, 5)}
              </p>
              <p className="mt-1 text-xs font-medium text-gray-400">
                Organisé par {game.owner_name}
              </p>
            </div>
            <div className="text-center">
              <div className="font-display text-4xl">{occupied}/{game.capacity}</div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Places {invited.length > 0 && `(${invited.length} en attente)`}
              </div>
            </div>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div>
              <h3 className="font-bold text-ink">Taille du lobby</h3>
              <p className="mt-0.5 text-xs font-medium text-steel">
                Entre {occupied} (places déjà occupées) et {game.terrain_capacity} (capacité du terrain).
              </p>
            </div>
            <div className="flex flex-none items-center gap-3">
              <button
                onClick={() => resizeMutation.mutate(game.capacity - 1)}
                disabled={game.capacity <= occupied || resizeMutation.isPending}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-ink transition-colors hover:border-crimson hover:text-crimson disabled:cursor-not-allowed disabled:opacity-40"
              >
                −
              </button>
              <span className="font-display text-2xl text-ink">{game.capacity}</span>
              <button
                onClick={() => resizeMutation.mutate(game.capacity + 1)}
                disabled={game.capacity >= game.terrain_capacity || resizeMutation.isPending}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-lg font-bold text-ink transition-colors hover:border-crimson hover:text-crimson disabled:cursor-not-allowed disabled:opacity-40"
              >
                +
              </button>
            </div>
          </div>
        )}

        {/* Action bar for non-members */}
        {!isMember && !isClosed && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-ink">
                {myStatus === "invited" ? "Vous avez été invité à ce jeu" : "Vous ne faites pas partie de ce jeu"}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-steel">
                {myStatus === "invited"
                  ? `${game.invited_by_name || game.owner_name} vous a invité à rejoindre ce match.`
                  : isFull
                  ? "Ce jeu est complet."
                  : game.is_public
                  ? "Ce jeu est public, vous pouvez le rejoindre librement."
                  : "Ce jeu est privé, une invitation est nécessaire."}
              </p>
            </div>
            <div className="flex flex-none gap-2">
              {myStatus === "invited" ? (
                <>
                  <button
                    onClick={() => acceptMutation.mutate()}
                    disabled={acceptMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-emerald-700 disabled:opacity-50"
                  >
                    Rejoindre
                  </button>
                  <button
                    onClick={() => declineMutation.mutate()}
                    disabled={declineMutation.isPending}
                    className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-steel transition-colors hover:border-crimson hover:text-crimson disabled:opacity-50"
                  >
                    Refuser
                  </button>
                </>
              ) : (
                game.is_public && (
                  <button
                    onClick={() => joinMutation.mutate()}
                    disabled={isFull || joinMutation.isPending}
                    className="rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-crimsonDark disabled:cursor-not-allowed disabled:bg-gray-300"
                  >
                    {isFull ? "Complet" : "Rejoindre"}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        {/* Roster */}
        <div className="space-y-3">
          <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-steel">
            Joueurs ({joined.length})
          </h2>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            {joined.map((p) => {
              const isThisOwner = p.student_id === game.organizer_id;
              return (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar participant={p} />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-ink">
                        {p.first_name} {p.last_name}
                        {isThisOwner && (
                          <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            Propriétaire
                          </span>
                        )}
                      </div>
                      <div className="font-mono text-xs text-steel">{p.student_id}</div>
                    </div>
                  </div>
                  {isOwner && !isClosed && !isThisOwner && (
                    <button
                      onClick={() => setConfirmation({ type: "kick", participant: p })}
                      disabled={kickMutation.isPending}
                      className="flex-none rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-bold uppercase text-crimson transition-colors hover:bg-red-100 disabled:opacity-50"
                    >
                      Exclure
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending invites */}
        {invited.length > 0 && (
          <div className="space-y-3">
            <h2 className="px-1 text-xs font-bold uppercase tracking-wider text-steel">
              Invitations en attente ({invited.length})
            </h2>
            <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
              {invited.map((p) => (
                <div key={p.id} className="flex items-center justify-between gap-3 p-4 opacity-75">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar participant={p} size="h-9 w-9" />
                    <div className="min-w-0">
                      <div className="truncate font-bold text-ink">{p.first_name} {p.last_name}</div>
                      <div className="font-mono text-xs text-steel">{p.student_id}</div>
                    </div>
                  </div>
                  <span className="flex-none rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                    En attente
                  </span>
                  {isOwner && !isClosed && (
                    <button
                      onClick={() => kickMutation.mutate(p.student_id)}
                      disabled={kickMutation.isPending}
                      className="flex-none rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold uppercase text-steel transition-colors hover:border-crimson hover:text-crimson disabled:opacity-50"
                    >
                      Annuler
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Invite box — joined members and the game owner can invite */}
        {canInvite && !isFull && (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink">Inviter un joueur</h3>
            <p className="mt-1 text-xs font-medium text-steel">
              Recherchez un étudiant par nom ou matricule.
            </p>
            <div className="relative mt-3">
              <input
                type="text"
                value={inviteSearch}
                onChange={(e) => {
                  setInviteSearch(e.target.value);
                  setInviteOpen(true);
                }}
                onFocus={() => setInviteOpen(true)}
                onBlur={() => setTimeout(() => setInviteOpen(false), 200)}
                placeholder="Nom ou matricule..."
                aria-label="Rechercher un étudiant à inviter"
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink outline-none focus:border-crimson focus:bg-white focus:ring-2 focus:ring-crimson/20"
              />
              {inviteOpen && inviteSearch.trim() && (
                <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-xl">
                  {invitableUsers.length > 0 ? (
                    invitableUsers.slice(0, 20).map((u) => (
                      <button
                        key={u.username}
                        type="button"
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => {
                          setInviteOpen(false);
                          setInviteSearch("");
                          inviteMutation.mutate(u.username);
                        }}
                        disabled={inviteMutation.isPending}
                        className="flex w-full items-center gap-3 border-b border-gray-50 px-4 py-2.5 text-left transition-colors last:border-0 hover:bg-gray-50 disabled:opacity-50"
                      >
                        <UserSuggestionAvatar user={u} />
                        <div className="min-w-0">
                          <div className="truncate text-xs font-bold text-ink">
                            {u.first_name} {u.last_name}
                          </div>
                          
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-center text-xs text-steel">Aucun étudiant trouvé.</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Leave / cancel */}
        {isMember && !isClosed && (
          <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-bold text-ink">
                {isOwner ? "Annuler ce jeu" : "Quitter ce jeu"}
              </h3>
              <p className="mt-0.5 text-xs font-medium text-steel">
                {isOwner
                  ? "En quittant le lobby, la réservation sera annulée et le jeu supprimé pour tous les joueurs."
                  : "Votre place sera immédiatement libérée pour un autre joueur."}
              </p>
            </div>
            <button
              onClick={() => {
                setConfirmation({ type: isOwner ? "cancel" : "leave" });
              }}
              disabled={leaveMutation.isPending}
              className="flex-none rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-crimson transition-colors hover:bg-red-100 disabled:opacity-50"
            >
              {leaveMutation.isPending ? "..." : isOwner ? "Annuler le jeu" : "Quitter"}
            </button>
          </div>
        )}
      </div>
      <ConfirmModal
        open={!!confirmation}
        title={
          confirmation?.type === "kick"
            ? "Exclure ce joueur ?"
            : confirmation?.type === "cancel"
            ? "Annuler ce jeu ?"
            : "Quitter ce jeu ?"
        }
        message={
          confirmation?.type === "kick"
            ? `${confirmation.participant?.first_name || "Ce joueur"} sera retiré du jeu.`
            : confirmation?.type === "cancel"
            ? "La réservation sera annulée et le lobby supprimé pour tous les joueurs."
            : "Votre place sera libérée immédiatement."
        }
        detail={confirmation?.type === "cancel" ? "Cette action ne peut pas être annulée." : null}
        confirmLabel={confirmation?.type === "kick" ? "Oui, exclure" : confirmation?.type === "cancel" ? "Oui, annuler" : "Oui, quitter"}
        pending={kickMutation.isPending || leaveMutation.isPending}
        onClose={() => setConfirmation(null)}
        onConfirm={() => {
          if (confirmation.type === "kick") {
            kickMutation.mutate(confirmation.participant.student_id, {
              onSettled: () => setConfirmation(null),
            });
          } else {
            leaveMutation.mutate(undefined, {
              onSettled: () => setConfirmation(null),
            });
          }
        }}
      />
    </div>
  );
}