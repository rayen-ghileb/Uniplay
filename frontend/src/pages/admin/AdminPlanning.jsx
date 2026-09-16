import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api.js";

const XIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function buildMonthOptions() {
  const options = [];
  const now = new Date();
  for (let offset = -3; offset <= 12; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const label = d.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) });
  }
  return options;
}

function dayHeaderLabel(isoDate) {
  const d = new Date(isoDate + "T00:00:00");
  return {
    weekday: d.toLocaleDateString("fr-FR", { weekday: "short" }),
    num: d.getDate(),
  };
}

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function ReservationModal({ id, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reservation-detail", id],
    queryFn: async () => {
      const res = await api.get(`/admin/reservations/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !data ? (
          <div className="p-10 text-center font-medium text-gray-500">Chargement...</div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 bg-fog/40 px-6 py-5">
              <h2 className="font-display text-lg font-bold text-ink">Détails de la réservation</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 px-6 py-6 text-sm">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Terrain</div>
                <div className="mt-0.5 font-semibold text-ink">{data.terrain_name}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Sport</div>
                <div className="mt-0.5 font-semibold text-ink">{data.sport_name}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Organisateur</div>
                <div className="mt-0.5 font-semibold text-ink">{data.organizer_name}</div>
                <div className="font-mono text-xs text-gray-500">{data.organizer_matricule}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Statut</div>
                <div className="mt-0.5">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                      data.status === "confirmed"
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {data.status === "confirmed" ? "Confirmée" : "Annulée"}
                  </span>
                </div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Date</div>
                <div className="mt-0.5 font-semibold text-ink">{formatDate(data.date)}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Horaire</div>
                <div className="mt-0.5 font-semibold text-ink">
                  {data.start_time?.slice(0, 5)} - {data.end_time?.slice(0, 5)}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Participants</div>
                <div className="mt-0.5 font-semibold text-ink">
                  {data.participants?.length > 0 ? data.participants.join(", ") : "Aucun autre participant"}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminPlanning() {
  const monthOptions = useMemo(() => buildMonthOptions(), []);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[3]?.value || monthOptions[0].value); // defaults to current month
  const [selectedTerrainId, setSelectedTerrainId] = useState(null);
  const [selectedReservationId, setSelectedReservationId] = useState(null);

  const { data: terrains = [] } = useQuery({
    queryKey: ["admin-terrains"],
    queryFn: async () => {
      const res = await api.get("/admin/terrains/");
      if (!selectedTerrainId && res.data.length > 0) {
        setSelectedTerrainId(res.data[0].id);
      }
      return res.data;
    },
  });

  const [year, month] = selectedMonth.split("-").map(Number);

  const { data: planning, isLoading: planningLoading } = useQuery({
    queryKey: ["admin-planning", selectedTerrainId, year, month],
    queryFn: async () => {
      const res = await api.get("/admin/planning/", {
        params: { terrain: selectedTerrainId, year, month },
      });
      return res.data;
    },
    enabled: !!selectedTerrainId,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Gestion de Planning</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Visualisez les créneaux réservés et disponibles d'un terrain sur un mois.
        </p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <select
          value={selectedTerrainId || ""}
          onChange={(e) => setSelectedTerrainId(Number(e.target.value))}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink focus:border-crimson focus:outline-none"
        >
          {terrains.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <select
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-ink focus:border-crimson focus:outline-none"
        >
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {planningLoading || !planning ? (
          <div className="p-10 text-center font-medium text-gray-500">Chargement du planning...</div>
        ) : planning.rows.length === 0 ? (
          <div className="p-10 text-center font-medium text-gray-500">
            Aucune heure d'ouverture configurée pour ce terrain.
          </div>
        ) : (
          <div>
            <div className="flex flex-col gap-3 border-b border-gray-100 bg-fog/40 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-base font-bold text-ink">Planning mensuel</h2>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  Cliquez sur une réservation pour afficher ses détails.
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold text-gray-500">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-crimson" />
                  Réservé
                </span>
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full border border-gray-300 bg-white" />
                  Disponible
                </span>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr>
                    <th className="sticky left-0 top-0 z-20 min-w-[100px] border-b border-r border-gray-700 bg-ink px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wider text-white">
                      Horaire
                    </th>
                    {planning.days.map((day) => {
                      const { weekday, num } = dayHeaderLabel(day);
                      const isToday = day === new Date().toISOString().slice(0, 10);
                      return (
                        <th
                          key={day}
                          className={`sticky top-0 z-10 min-w-[72px] border-b border-r border-gray-700 px-3 py-3 text-center text-white ${
                            isToday ? "bg-crimson" : "bg-ink"
                          }`}
                        >
                          <div className="capitalize text-[10px] font-semibold tracking-wide text-white/70">
                            {weekday}
                          </div>
                          <div className="mt-1 text-base font-bold">{num}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {planning.rows.map((row, rowIndex) => (
                    <tr key={row.start} className={rowIndex % 2 ? "bg-gray-50/60" : "bg-white"}>
                      <td className="sticky left-0 z-10 min-w-[100px] border-b border-r border-gray-200 bg-fog px-4 py-3 font-mono text-xs font-bold text-ink">
                        {row.start}
                      </td>
                      {row.cells.map((cell) => (
                        <td
                          key={cell.date}
                          onClick={() => cell.reservation_id && setSelectedReservationId(cell.reservation_id)}
                          className={`h-12 min-w-[72px] border-b border-r border-gray-100 text-center transition-colors ${
                            cell.reservation_id
                              ? "cursor-pointer bg-crimson/15 hover:bg-crimson/30"
                              : "bg-transparent hover:bg-gray-100"
                          }`}
                          title={cell.reservation_id ? "Voir les détails" : "Disponible"}
                        >
                          {cell.reservation_id ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-crimson text-[10px] font-bold text-white shadow-sm">
                              ✓
                            </span>
                          ) : (
                            <span className="text-gray-300">·</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {selectedReservationId && (
        <ReservationModal id={selectedReservationId} onClose={() => setSelectedReservationId(null)} />
      )}
    </div>
  );
}