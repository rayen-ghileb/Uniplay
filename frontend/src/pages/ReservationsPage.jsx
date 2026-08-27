import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "../services/api.js";

const ArrowLeftIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

export default function ReservationsPage() {
  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["reservations"],
    queryFn: async () => {
      const res = await api.get("/reservations/");
      return res.data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-fog">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent"></div>
      </div>
    );
  }

  const now = new Date();
  
  // Filter for HISTORY (Past or Cancelled)
  const historyReservations = reservations.filter((res) => {
    const isCancelled = res.status?.toLowerCase() === "cancelled";
    let isPast = false;

    if (res.timeslot?.date && res.timeslot?.end_time) {
      const slotEndTime = new Date(`${res.timeslot.date}T${res.timeslot.end_time}`);
      isPast = slotEndTime < now;
    }

    return isCancelled || isPast;
  });

  return (
    <div className="min-h-screen bg-fog px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-6">
        
        <div className="flex items-center gap-4">
          <Link
            to="/"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-steel hover:border-crimson hover:text-crimson transition-colors"
          >
            <ArrowLeftIcon />
          </Link>
          <div>
            <h1 className="font-display text-3xl uppercase text-ink">Historique</h1>
            <p className="text-sm text-steel mt-1">Vos réservations terminées ou annulées</p>
          </div>
        </div>

        {historyReservations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white/50 p-12 text-center">
            <p className="text-sm font-medium text-steel">Votre historique est vide.</p>
            <Link
              to="/"
              className="mt-4 inline-block rounded-xl bg-crimson px-5 py-2.5 text-xs font-bold uppercase text-white shadow-sm hover:bg-red-700 transition-colors"
            >
              Réserver un terrain
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {historyReservations.map((res) => {
              const isCancelled = res.status?.toLowerCase() === "cancelled";
              const displayStatus = isCancelled ? "Annulée" : "Terminée";
              
              return (
                <div
                  key={res.id}
                  className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm gap-4 transition-all hover:shadow-md grayscale-[20%] opacity-80"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
                        isCancelled ? "bg-red-50 text-red-600" : "bg-gray-100 text-gray-600"
                      }`}>
                        {displayStatus}
                      </span>
                      <span className="text-xs text-steel font-medium">#{res.id}</span>
                    </div>

                    <h3 className="font-display text-xl text-ink mt-2">
                      {res.sport_name} — {res.terrain_name}
                    </h3>
                    
                    <p className="text-xs text-steel mt-1 font-medium">
                      📅 Date: {res.timeslot?.date} ({res.timeslot?.start_time} - {res.timeslot?.end_time})
                    </p>
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