import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import ConfirmModal from "../components/ConfirmModal.jsx";
import Toast from "../components/Toast.jsx";

const InfoIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const getSportTag = (sportName) => {
  const name = sportName.toLowerCase();
  if (name.includes("padel")) return "GAZON SYNTHÉTIQUE";
  if (name.includes("foot")) return "OUTDOOR 7V7";
  if (name.includes("basket")) return "COUVERT / PARQUET";
  if (name.includes("tennis")) return "TERRE BATTUE";
  return "TERRAIN CAMPUS";
};

export default function HomePage({ user: propUser }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const sportsRef = useRef(null);
  
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [reservationToCancel, setReservationToCancel] = useState(null);

  const { data: fetchedUser } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return res.data;
    },
    enabled: !propUser, 
  });

  const currentUser = propUser || fetchedUser;

  const { data: sports = [] } = useQuery({
    queryKey: ["sports"],
    queryFn: async () => {
      const res = await api.get("/sports/");
      return res.data;
    },
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await api.get("/reservations/");
      return res.data;
    },
  });

  const cancelMutation = useMutation({
    mutationFn: async (id) => {
      setErrorMessage(null);
      await api.delete(`/reservations/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["reservations"]);
    },
    onError: (error) => {
      const detail = error.response?.data?.detail || "Impossible d'annuler cette réservation pour le moment.";
      setErrorMessage(detail);
    },
  });

  const now = new Date();
  const upcomingReservations = reservations
    .filter((res) => {
      const isCancelled = res.status?.toLowerCase() === "cancelled";
      let isUpcoming = true;

      if (res.timeslot?.date && res.timeslot?.end_time) {
        const slotEndTime = new Date(`${res.timeslot.date}T${res.timeslot.end_time}`);
        isUpcoming = slotEndTime >= now;
      }

      return !isCancelled && isUpcoming;
    })
    .sort((a, b) => {
      const dateA = new Date(`${a.timeslot?.date}T${a.timeslot?.start_time}`);
      const dateB = new Date(`${b.timeslot?.date}T${b.timeslot?.start_time}`);
      return dateA - dateB;
    });

  const handleReserveClick = () => {
    sportsRef.current?.scrollIntoView({ behavior: "smooth" });
    setIsHighlighted(true);
    setTimeout(() => setIsHighlighted(false), 2000);
  };

  const getDefaultSportImage = (sportName) => {
    const name = sportName.toLowerCase();
    if (name.includes("padel")) return "/images/padel.png";
    if (name.includes("foot")) return "/images/football.png";
    if (name.includes("basket")) return "/images/basketball.png";
    return "/images/generic-sport-default.png";
  };

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-8">
        
        <div className="relative overflow-hidden rounded-3xl bg-ink p-8 text-white shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-crimson">
                UNIVERSITÉ ESPRIT
              </span>
              <h1 className="font-display text-4xl mt-1 tracking-tight">
                Bonjour, {currentUser?.first_name || currentUser?.firstName || currentUser?.username || "Sportif"}
              </h1>
              <p className="text-sm text-gray-300 mt-1 font-medium">
                Prêt pour votre prochain match sur le campus ?
              </p>
            </div>

            <button
              onClick={() => navigate("/mes-jeux")}
              className="flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3.5 text-xs font-bold text-ink transition-transform hover:scale-105 shadow-md self-start sm:self-auto"
            >
              <span>🎮</span> Mes jeux
            </button>
          </div>
        </div>

        <div
          ref={sportsRef}
          className={`space-y-4 rounded-3xl transition-all duration-500 p-2 ${
            isHighlighted ? "ring-4 ring-crimson/40 bg-crimson/5" : ""
          }`}
        >
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight text-ink">
                Réserver un terrain
              </h2>
              <p className="text-xs text-steel font-medium">
                Choisissez votre discipline pour voir les créneaux
              </p>
            </div>
            <span className="rounded-full bg-gray-200/60 px-3 py-1 text-xs font-bold text-steel">
              {sports.length} Sports
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {sports.map((sport) => {
              const activeCount = sport.active_terrains_count || 0;
              const maintenanceCount = sport.maintenance_terrains_count || 0;
              const isClickable = (activeCount + maintenanceCount) > 0;
              const tag = getSportTag(sport.name);

              return (
                <div
                  key={sport.id}
                  onClick={() => isClickable && navigate(`/sports/${sport.id}`)}
                  className={`group relative overflow-hidden rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200 flex flex-col justify-between h-44 ${
                    isClickable
                      ? "cursor-pointer border-gray-200 hover:-translate-y-1 hover:border-ink hover:shadow-md"
                      : "cursor-not-allowed border-gray-200 bg-gray-50/60 opacity-60"
                  }`}
                >
                  <div className="absolute top-0 right-0 -mr-6 -mt-6 h-28 w-28 rounded-full bg-emerald-500/10 blur-xl pointer-events-none transition-all group-hover:bg-emerald-500/20" />

                  <div className="flex items-start justify-between relative z-10">
                    <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-bold tracking-wider text-steel uppercase">
                      {tag}
                    </span>
                    
                    <div className="flex h-17 w-17 items-center justify-center rounded-full bg-gray-50 p-2 shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:bg-white group-hover:shadow-md">
                      <img 
                        src={getDefaultSportImage(sport.name)} 
                        alt={`${sport.name} icon`} 
                        className="h-full w-full object-contain" 
                      />
                    </div>
                  </div>

                  <div className="relative z-10 mt-4">
                    {/* FLEX ROW FOR TITLE AND ACTIVE BADGE */}
                    <div className="flex items-center gap-3">
                      <h3 className="font-display text-2xl text-ink">
                        {sport.name}
                      </h3>
                      {activeCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                            {activeCount} {activeCount > 1 ? "Actifs" : "Actif"}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-1 flex flex-col items-start gap-1">
                      {activeCount === 0 && (
                        <p className="text-xs font-bold text-gray-500">Aucun terrain dispo</p>
                      )}
                      
                      {maintenanceCount > 0 && (
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-50 border border-amber-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                            {maintenanceCount} en maintenance
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-steel px-1">
            VOS PROCHAINES RÉSERVATIONS
          </h2>

          {upcomingReservations.length > 0 ? (
            <div className="space-y-4">
              {upcomingReservations.map((res) => {
                const isConfirmed = res.status?.toLowerCase() === "confirmed";

                return (
                  <div
                    key={res.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-gray-200 bg-white p-6 shadow-sm gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${
                          isConfirmed ? "bg-emerald-50 text-emerald-600" : "bg-yellow-50 text-yellow-600"
                        }`}>
                          {isConfirmed ? "Confirmé" : res.status}
                        </span>
                        <span className="text-xs text-steel font-medium">#{res.id}</span>
                      </div>
                      
                      <h3 className="font-display text-2xl text-ink mt-2">
                        {res.sport_name} — {res.terrain_name}
                      </h3>
                      
                      <p className="text-xs font-medium text-steel mt-1">
                        📅 {res.timeslot?.date} de {res.timeslot?.start_time} à {res.timeslot?.end_time}
                      </p>
                    </div>
                    
                    <button
                      onClick={() => setReservationToCancel(res)}
                      disabled={cancelMutation.isPending}
                      className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold uppercase text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors self-start sm:self-auto"
                    >
                      {cancelMutation.isPending ? "Annulation..." : "Annuler"}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl border border-dashed border-gray-300 bg-white/70 p-6 gap-4">
              <div>
                <h3 className="font-bold text-ink">Aucun match prévu à venir</h3>
                <p className="text-xs text-steel mt-0.5">
                  Réservez un terrain avec vos camarades en quelques clics.
                </p>
              </div>
              <button
                onClick={handleReserveClick}
                className="rounded-xl bg-red-50 px-5 py-2.5 text-xs font-bold text-crimson hover:bg-crimson hover:text-white transition-all shadow-sm"
              >
                Réserver un terrain
              </button>
            </div>
          )}
        </div>

        <div className="space-y-3 pt-4">
          <h2 className="text-xs font-bold uppercase tracking-wider text-steel px-1">
            INFOS PRATIQUES & RÈGLEMENT CAMPUS
          </h2>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-crimson font-bold text-xs uppercase tracking-wider">
                <ClockIcon className="h-4 w-4" />
                <span>Horaires Accès</span>
              </div>
              <p className="text-xs font-medium text-steel leading-relaxed">
                Terrains ouverts du Lundi au Samedi de <span className="font-bold text-ink">08:00 à 21:30</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-crimson font-bold text-xs uppercase tracking-wider">
                <ShieldIcon className="h-4 w-4" />
                <span>Matériel Sportif</span>
              </div>
              <p className="text-xs font-medium text-steel leading-relaxed">
                Raquettes et ballons disponibles sur présentation de la carte étudiant à l'accueil.
              </p>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center gap-2 text-crimson font-bold text-xs uppercase tracking-wider">
                <InfoIcon className="h-4 w-4" />
                <span>Annulation</span>
              </div>
              <p className="text-xs font-medium text-steel leading-relaxed">
                Annulation sans pénalité possible jusqu'à <span className="font-bold text-ink">12 heures</span> avant le début du créneau.
              </p>
            </div>
          </div>
        </div>

      </div>
      <Toast
        type="error"
        message={errorMessage}
        onClose={() => setErrorMessage(null)}
      />
      <ConfirmModal
        open={!!reservationToCancel}
        title="Annuler la réservation ?"
        message="Votre réservation et la place réservée seront supprimées."
        detail="L'annulation est possible uniquement plus de 12 heures avant le début du créneau."
        confirmLabel="Oui, annuler"
        pending={cancelMutation.isPending}
        onClose={() => setReservationToCancel(null)}
        onConfirm={() => {
          cancelMutation.mutate(reservationToCancel.id, {
            onSettled: () => setReservationToCancel(null),
          });
        }}
      />
    </div>
  );
}