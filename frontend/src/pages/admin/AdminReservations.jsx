import { useEffect, useState } from "react";
import { getAdminReservations, cancelAdminReservation, exportReservationsCSV } from "../../services/admin";

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
    if (res.status === 'cancelled') return 'cancelled';
    
    if (res.date && res.end_time) {
      const slotEndDateTime = new Date(`${res.date}T${res.end_time}`);
      if (slotEndDateTime < new Date()) {
        return 'finished';
      }
    }
    return res.status;
  };

  const getStatusBadge = (res) => {
    const status = getDisplayStatus(res);
    switch (status) {
      case 'finished':
        return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">Terminé</span>;
      case 'confirmed':
        return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700">Confirmée</span>;
      case 'cancelled':
        return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-700">Annulée</span>;
      default:
        return <span className="px-2 py-1 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-ink uppercase tracking-tight">Réservations Globales</h1>
          <p className="text-xs font-bold text-steel uppercase tracking-wider mt-1">Supervision de l'ensemble du campus</p>
        </div>
        
        <div className="flex space-x-3 w-full sm:w-auto">
          <input 
            type="text" 
            placeholder="Rechercher matricule ou terrain..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border-gray-200 rounded-xl p-2 text-sm focus:ring-ink focus:border-ink w-full sm:w-64"
          />
          <button 
            onClick={handleExportCSV}
            className="bg-ink text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-black whitespace-nowrap"
          >
            📥 Exporter CSV
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-steel font-bold uppercase tracking-widest mt-8">Chargement...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm min-w-max">
              <thead className="bg-fog border-b border-gray-100 text-steel font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">Étudiant (Matricule)</th>
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
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="p-4 text-steel">#{res.id}</td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.organizer_name}</div>
                        <div className="text-[10px] text-steel uppercase">{res.organizer_matricule}</div>
                        
                        {res.participants && res.participants.length > 0 && (
                          <div className="mt-1 text-[11px] text-gray-500">
                            <span className="font-semibold text-steel">Participants: </span>
                            {res.participants.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.terrain_name}</div>
                        <div className="text-[10px] text-steel uppercase">{res.sport_name}</div>
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-ink">{res.date}</div>
                        <div className="text-[10px] text-steel uppercase">
                          {res.start_time?.slice(0, 5)} - {res.end_time?.slice(0, 5)}
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(res)}
                      </td>
                      <td className="p-4 text-right">
                        {displayStatus === 'confirmed' && (
                          <button 
                            onClick={() => handleCancel(res.id)} 
                            className="text-rose-600 text-xs font-bold uppercase hover:underline"
                          >
                            Forcer Annulation
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {reservations.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-steel text-sm">Aucune réservation trouvée.</td>
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