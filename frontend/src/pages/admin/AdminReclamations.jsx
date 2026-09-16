import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api.js";

const XIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReclamationModal({ id, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-reclamation", id],
    queryFn: async () => {
      const res = await api.get(`/admin/reclamations/${id}/`);
      return res.data;
    },
    enabled: !!id,
  });

  const initials = (
    (data?.sender_name?.[0] || "U")
  ).toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !data ? (
          <div className="p-10 text-center font-medium text-gray-500">Chargement...</div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-gray-100 bg-fog/40 px-6 py-5">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 flex-none items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-lg font-bold text-white shadow-sm">
                  {data.sender_photo ? (
                    <img src={data.sender_photo} alt={data.sender_name} className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div>
                  <div className="font-display text-base font-bold text-ink">{data.sender_name}</div>
                  <div className="font-mono text-xs font-bold text-gray-500">{data.sender_username}</div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-gray-100 px-6 py-5 text-sm">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Email</div>
                <div className="mt-0.5 font-semibold text-ink">{data.sender_email}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Téléphone</div>
                <div className="mt-0.5 font-semibold text-ink">{data.sender_phone_number || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Classe</div>
                <div className="mt-0.5 font-semibold text-ink">{data.sender_classe || "—"}</div>
              </div>
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Spécialité</div>
                <div className="mt-0.5 font-semibold text-ink">{data.sender_specialite || "—"}</div>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400">Message</div>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink">{data.message}</p>
              <div className="mt-4 text-xs font-medium text-gray-400">Envoyé le {formatDate(data.created_at)}</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminReclamations() {
  const [selectedId, setSelectedId] = useState(null);

  const { data: reclamations = [], isLoading } = useQuery({
    queryKey: ["admin-reclamations"],
    queryFn: async () => {
      const res = await api.get("/admin/reclamations/");
      return res.data;
    },
  });

  if (isLoading) return <div className="p-8 text-center font-medium text-gray-500">Chargement des réclamations...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Réclamations</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Cliquez sur une réclamation pour voir le message complet et les informations de l'expéditeur.
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-fog/50 text-xs uppercase text-ink">
            <tr>
              <th className="px-6 py-4 font-bold">Expéditeur</th>
              <th className="px-6 py-4 font-bold">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {reclamations.length === 0 ? (
              <tr>
                <td colSpan={2} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Aucune réclamation pour le moment.
                </td>
              </tr>
            ) : (
              reclamations.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  className="cursor-pointer transition-colors hover:bg-gray-50/50"
                >
                  <td className="px-6 py-4 font-bold text-ink">{r.sender_name}</td>
                  <td className="px-6 py-4">{formatDate(r.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedId && <ReclamationModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}