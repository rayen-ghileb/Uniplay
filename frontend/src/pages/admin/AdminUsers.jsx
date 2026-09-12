import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api.js";

const CheckIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const TrashIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

const ShieldIcon = ({ className = "h-3.5 w-3.5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const res = await api.get("/auth/admin/users/");
      return res.data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, is_active }) => {
      return api.patch(`/auth/admin/users/${id}/`, { is_active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
    },
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, is_admin }) => {
      return api.patch(`/auth/admin/users/${id}/`, { is_admin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/auth/admin/users/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
    },
  });

  const handleReject = (id, name) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer la demande de ${name} ?`)) {
      deleteMutation.mutate(id);
    }
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "pending") return !user.is_active;
    if (filter === "active") return user.is_active;
    return true;
  });

  const pendingCount = users.filter((u) => !u.is_active).length;

  if (isLoading) return <div className="p-8 text-center font-medium text-gray-500">Chargement des utilisateurs...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Gestion des Utilisateurs</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Validez les demandes de compte et gérez les droits d'accès des étudiants.
          </p>
        </div>

        <div className="flex rounded-xl border border-gray-200 bg-fog p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "all" ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
            }`}
          >
            Tous ({users.length})
          </button>
          <button
            onClick={() => setFilter("pending")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "pending" ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
            }`}
          >
            En Attente
            {pendingCount > 0 && (
              <span className="rounded-full bg-crimson px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {pendingCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "active" ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
            }`}
          >
            Approuvés
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-fog/50 text-xs uppercase text-ink">
            <tr>
              <th className="px-6 py-4 font-bold">Étudiant</th>
              <th className="px-6 py-4 font-bold">Matricule & Email</th>
              <th className="px-6 py-4 font-bold">Rôle</th>
              <th className="px-6 py-4 font-bold">Statut</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Aucun utilisateur ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-gray-50/50 ${
                    !user.is_active ? "bg-amber-50/20" : ""
                  }`}
                >
                  <td className="px-6 py-4 font-bold text-ink">
                    {user.first_name || user.last_name
                      ? `${user.first_name} ${user.last_name}`
                      : "Nom non renseigné"}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs font-bold text-ink">{user.username}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() =>
                        toggleAdminMutation.mutate({ id: user.id, is_admin: !user.is_admin })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                        user.is_admin
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ShieldIcon />
                      {user.is_admin ? "Admin" : "Étudiant"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.is_active ? "bg-emerald-500" : "bg-amber-500 animate-pulse"
                        }`}
                      ></span>
                      {user.is_active ? "Approuvé" : "En Attente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {!user.is_active ? (
                      <>
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: user.id, is_active: true })
                          }
                          disabled={updateStatusMutation.isPending}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold uppercase text-white shadow-sm hover:bg-emerald-700 transition-colors disabled:opacity-50"
                        >
                          <CheckIcon /> Approuver
                        </button>
                        <button
                          onClick={() => handleReject(user.id, `${user.first_name} ${user.last_name}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold uppercase text-crimson hover:bg-red-100 transition-colors"
                        >
                          <TrashIcon /> Refuser
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: user.id, is_active: false })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold uppercase text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                        >
                          Désactiver
                        </button>
                        <button
                          onClick={() => handleReject(user.id, `${user.first_name} ${user.last_name}`)}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-xs font-bold text-crimson hover:bg-red-50 transition-colors"
                        >
                          <TrashIcon />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}