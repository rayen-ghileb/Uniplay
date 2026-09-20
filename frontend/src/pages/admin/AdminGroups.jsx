import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api.js";

const XIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const AlertIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function Avatar({ member }) {
  const initials = (
    (member.first_name?.[0] || "") + (member.last_name?.[0] || member.student_id?.[0] || "")
  ).toUpperCase() || "U";

  return (
    <div className="flex h-10 w-10 flex-none items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-sm font-bold text-white shadow-sm">
      {member.photo ? (
        <img src={member.photo} alt={member.student_id} className="h-full w-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}

function GroupModal({ gameId, onClose }) {
  const queryClient = useQueryClient();
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const { data: group, isLoading } = useQuery({
    queryKey: ["admin-group", gameId],
    queryFn: async () => (await api.get(`/admin/groups/${gameId}/`)).data,
    enabled: !!gameId,
  });

  const warnMutation = useMutation({
    mutationFn: async (studentId) => api.post(`/admin/students/${studentId}/warn/${gameId}/`),
    onSuccess: (res) => {
      setFeedback({ type: "success", message: res.data.detail });
      queryClient.invalidateQueries(["admin-group", gameId]);
    },
    onError: (err) => {
      setFeedback({
        type: "error",
        message: err.response?.data?.detail || "Impossible d'envoyer l'avertissement.",
      });
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading || !group ? (
          <div className="p-10 text-center font-medium text-gray-500">Chargement...</div>
        ) : (
          <>
            <div className="flex items-start justify-between border-b border-gray-100 bg-fog/40 px-6 py-5">
              <div>
                <h2 className="font-display text-lg font-bold text-ink">
                  {group.sport_name} — {group.terrain_name}
                </h2>
                <p className="mt-0.5 text-xs font-medium text-steel">
                  📅 {formatDate(group.date)} · {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
                </p>
                <p className="mt-0.5 text-xs font-medium text-gray-400">
                  Organisé par {group.owner_name} · {group.is_public ? "Public" : "Privé"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-ink"
              >
                <XIcon />
              </button>
            </div>

            {feedback.message && (
              <div
                className={`mx-6 mt-4 flex items-center justify-between rounded-xl border p-3 text-xs font-bold ${
                  feedback.type === "error"
                    ? "border-red-200 bg-red-50 text-red-700"
                    : "border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                <span>{feedback.message}</span>
                <button onClick={() => setFeedback({ type: "", message: "" })} className="ml-3 px-1">✕</button>
              </div>
            )}

            <div className="divide-y divide-gray-100 px-6 py-4">
              {group.members.map((member) => {
                const isSuspended = member.is_suspended;
                const warningCount = member.warning_count;

                return (
                  <div key={member.student_id} className="flex items-center justify-between gap-3 py-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <Avatar member={member} />
                      <div className="min-w-0">
                        <div className="truncate font-bold text-ink">
                          {member.first_name} {member.last_name}
                        </div>
                        <div className="font-mono text-xs text-steel">{member.student_id}</div>
                      </div>
                      {warningCount > 0 && (
                        <span
                          className={`inline-flex flex-none items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wider ${
                            isSuspended
                              ? "bg-red-100 text-red-700"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          <AlertIcon />
                          {isSuspended ? "Suspendu" : `${warningCount} avertissement${warningCount > 1 ? "s" : ""}`}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => {
                        const msg = isSuspended
                          ? null
                          : warningCount === 0
                          ? `Envoyer un premier avertissement à ${member.first_name} ${member.last_name} ?`
                          : `Ceci est le second avertissement pour ${member.first_name} ${member.last_name} — son compte sera automatiquement suspendu. Continuer ?`;
                        if (isSuspended) return;
                        if (window.confirm(msg)) {
                          warnMutation.mutate(member.student_id);
                        }
                      }}
                      disabled={isSuspended || warnMutation.isPending}
                      className="flex-none rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-bold uppercase text-amber-800 transition-colors hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {isSuspended ? "Suspendu" : "Avertissement"}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminGroups() {
  const [selectedGameId, setSelectedGameId] = useState(null);

  const { data: groups = [], isLoading } = useQuery({
    queryKey: ["admin-groups"],
    queryFn: async () => (await api.get("/admin/groups/")).data,
  });

  if (isLoading) return <div className="p-8 text-center font-medium text-gray-500">Chargement des groupes...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Gestion de Groupe</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Consultez les joueurs de chaque match terminé et gérez les avertissements de conduite.
        </p>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-12 text-center">
          <p className="text-sm font-medium text-steel">Aucun match terminé pour le moment.</p>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => setSelectedGameId(group.id)}
              className="group cursor-pointer rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:-translate-y-1 hover:border-ink hover:shadow-md"
            >
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-steel">
                  {group.sport_name}
                </span>
                <span className="rounded-md bg-gray-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {group.is_public ? "Public" : "Privé"}
                </span>
              </div>

              <h3 className="mt-3 font-display text-xl text-ink">{group.terrain_name}</h3>
              <p className="mt-1 text-xs font-medium text-steel">📅 {formatDate(group.date)}</p>
              <p className="text-xs font-medium text-steel">
                🕒 {group.start_time?.slice(0, 5)} - {group.end_time?.slice(0, 5)}
              </p>
              <p className="mt-2 text-xs font-medium text-gray-400">Organisé par {group.owner_name}</p>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                <div>
                  <span className="font-display text-2xl text-ink">{group.player_count}</span>
                  <span className="ml-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">joueurs</span>
                </div>
                <span className="rounded-xl bg-ink px-4 py-2 text-xs font-bold uppercase tracking-wider text-white transition-colors group-hover:bg-crimsonDark">
                  Voir le groupe
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedGameId && (
        <GroupModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}
    </div>
  );
}