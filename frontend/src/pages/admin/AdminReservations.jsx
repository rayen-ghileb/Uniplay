import { useEffect, useState } from "react";
import { getAdminReservations, cancelAdminReservation, exportReservationsCSV } from "../../services/admin";

const DownloadIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
  </svg>
);

const SearchIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <circle cx="11" cy="11" r="7" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35" />
  </svg>
);

export default function AdminReservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchReservations = () => {
    setLoading(true);
    getAdminReservations(searchTerm)
      .then((res) => setReservations(res.data))
      .catch((err) => console.error("Erreur de chargement des réservations:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchReservations();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleCancel = async (id) => {
    if (window.confirm("Êtes-vous sûr de vouloir annuler cette réservation (Override Admin) ?")) {
      try {
        await cancelAdminReservation(id);
        fetchReservations();
      } catch (error) {
        alert(error.response?.data?.error || "Erreur lors de l'annulation.");
      }
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await exportReservationsCSV();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "reservations_uniplay.csv");
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      alert("Erreur lors de l'exportation CSV.");
    }
  };

  const getDisplayStatus = (res) => {
    if (res.status === "cancelled") return "cancelled";

    if (res.date && res.end_time) {
      const slotEndDateTime = new Date(`${res.date}T${res.end_time}`);
      if (slotEndDateTime < new Date()) {
        return "finished";
      }
    }
    return res.status;
  };

  const getStatusBadge = (res) => {
    const status = getDisplayStatus(res);
    switch (status) {
      case "finished":
        return (
          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-[10px] font-bold uppercase text-steel">
            Terminé
          </span>
        );
      case "confirmed":
        return (
          <span className="rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase text-emerald-700">
            Confirmée
          </span>
        );
      case "cancelled":
        return (
          <span className="rounded-md bg-crimson/10 px-2 py-1 text-[10px] font-bold uppercase text-crimsonDark">
            Annulée
          </span>
        );
      default:
        return (
          <span className="rounded-md bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase text-gray-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Réservations globales</h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-wider text-steel">
            Supervision de l'ensemble du campus
          </p>
        </div>

        <div className="flex w-full gap-3 sm:w-auto">
          <div className="relative w-full sm:w-64">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher matricule ou terrain..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-fog py-2.5 pl-9 pr-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            />
          </div>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 whitespace-nowrap rounded-xl bg-ink px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark"
          >
            <DownloadIcon />
            Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent"></div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left text-sm">
              <thead className="border-b border-gray-100 bg-fog text-[10px] font-bold uppercase tracking-wider text-steel">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Étudiant (matricule)</th>
                  <th className="p-4">Terrain</th>
                  <th className="p-4">Créneau</th>
                  <th className="p-4">Statut</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {reservations.map((res) => {
                  const displayStatus = getDisplayStatus(res);
                  return (
                    <tr key={res.id} className="hover:bg-fog">
                      <td className="p-4 text-steel">#{res.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.organizer_name}</div>
                        <div className="font-mono text-[10px] uppercase text-steel">{res.organizer_matricule}</div>

                        {res.participants && res.participants.length > 0 && (
                          <div className="mt-1 text-[11px] text-gray-500">
                            <span className="font-semibold text-steel">Participants: </span>
                            {res.participants.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.terrain_name}</div>
                        <div className="text-[10px] uppercase text-steel">{res.sport_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.date}</div>
                        <div className="text-[10px] uppercase text-steel">
                          {res.start_time?.slice(0, 5)} - {res.end_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="p-4">{getStatusBadge(res)}</td>
                      <td className="p-4 text-right">
                        {displayStatus === "confirmed" && (
                          <button
                            onClick={() => handleCancel(res.id)}
                            className="text-xs font-bold uppercase text-crimson hover:underline"
                          >
                            Forcer annulation
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-sm text-steel">
                      Aucune réservation trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}