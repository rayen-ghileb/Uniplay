import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api.js";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Toast from "../../components/Toast.jsx";
import { useAuth } from "../../context/AuthContext.jsx";

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

const EditIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const emptyForm = {
  username: "",
  email: "",
  first_name: "",
  last_name: "",
  phone_number: "",
  classe: "",
  specialite: "",
  sex: "",
  date_of_birth: "",
  is_admin: false,
  account_status: "pending",
};

export default function AdminUsers() {
  const { user } = useAuth();
  const isSuperAdmin = Boolean(user?.is_superadmin);
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState("all");
  const [userToReject, setUserToReject] = useState(null);
  const [userToEdit, setUserToEdit] = useState(null);
  const [formData, setFormData] = useState(emptyForm);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(["admin-users"]);
      setFeedback({
        type: "success",
        message: variables.is_active ? "Compte activé avec succès." : "Compte désactivé avec succès.",
      });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de modifier le statut de l'utilisateur." }),
  });

  const updateSuspensionMutation = useMutation({
    mutationFn: async ({ id, is_suspended }) => {
      return api.patch(`/auth/admin/users/${id}/`, { is_suspended });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      setFeedback({ type: "success", message: "Compte réactivé avec succès." });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de réactiver le compte." }),
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ id, is_admin }) => {
      return api.patch(`/auth/admin/users/${id}/`, { is_admin });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries(["admin-users"]);
      setFeedback({
        type: "success",
        message: variables.is_admin ? "Rôle administrateur attribué." : "Rôle étudiant rétabli.",
      });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de modifier le rôle de l'utilisateur." }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/auth/admin/users/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-users"]);
      setFeedback({ type: "success", message: "Demande utilisateur supprimée." });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de supprimer cette demande." }),
  });

  const editMutation = useMutation({
    mutationFn: async ({ id, data }) => api.patch(`/auth/admin/users/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setFeedback({ type: "success", message: "Les informations de l'utilisateur ont été enregistrées avec succès." });
      closeEditModal();
    },
    onError: (error) => {
      const responseData = error.response?.data;
      const detail = responseData?.email?.[0]
        || responseData?.username?.[0]
        || responseData?.photo?.[0]
        || responseData?.detail
        || (responseData && Object.values(responseData).flat().join(" "));
      setFeedback({ type: "error", message: detail || "Impossible d'enregistrer les informations de l'utilisateur." });
    },
  });

  const handleReject = (id, name) => {
    setUserToReject({ id, name });
  };

  const openEditModal = (user) => {
    setUserToEdit(user);
    setSelectedPhoto(null);
    setFormData({
      username: user.username || "",
      email: user.email || "",
      first_name: user.first_name || "",
      last_name: user.last_name || "",
      phone_number: user.phone_number || "",
      classe: user.classe || "",
      specialite: user.specialite || "",
      sex: user.sex || "",
      date_of_birth: user.date_of_birth || "",
      is_admin: Boolean(user.is_admin),
      account_status: user.is_deactivated ? "deactivated" : user.is_active ? "active" : "pending",
    });
  };

  const closeEditModal = () => {
    setUserToEdit(null);
    setSelectedPhoto(null);
    setFormData(emptyForm);
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key !== "account_status") payload.append(key, value);
    });
    payload.set("is_active", formData.account_status === "active");
    payload.set("is_deactivated", formData.account_status === "deactivated");
    if (selectedPhoto) payload.append("photo", selectedPhoto);
    editMutation.mutate({ id: userToEdit.id, data: payload });
  };

  const filteredUsers = users.filter((user) => {
    if (filter === "pending") return !user.is_active && !user.is_deactivated;
    if (filter === "active") return user.is_active;
    if (filter === "deactivated") return user.is_deactivated;
    if (filter === "suspended") return user.is_suspended;
    return true;
  });

  const pendingCount = users.filter((u) => !u.is_active && !u.is_deactivated).length;
  const deactivatedCount = users.filter((u) => u.is_deactivated).length;
  const suspendedCount = users.filter((u) => u.is_suspended).length;

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
          <button
            onClick={() => setFilter("deactivated")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "deactivated" ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
            }`}
          >
            Désactivés
            {deactivatedCount > 0 && (
              <span className="ml-1.5 rounded-full bg-gray-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {deactivatedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("suspended")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
              filter === "suspended" ? "bg-white text-ink shadow-sm" : "text-gray-500 hover:text-ink"
            }`}
          >
            Suspendus
            {suspendedCount > 0 && (
              <span className="ml-1.5 rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-extrabold text-white">
                {suspendedCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-fog/50 text-xs uppercase text-ink">
            <tr>
              <th className="px-6 py-4 font-bold">Étudiant</th>
              <th className="px-6 py-4 font-bold">Matricule & Email</th>
              <th className="px-6 py-4 font-bold">Sexe</th>
              <th className="px-6 py-4 font-bold">Âge</th>
              <th className="px-6 py-4 font-bold">Rôle</th>
              <th className="px-6 py-4 font-bold">Statut</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Aucun utilisateur ne correspond au filtre sélectionné.
                </td>
              </tr>
            ) : (
              filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className={`transition-colors hover:bg-gray-50/50 ${
                    !user.is_active || user.is_suspended ? "bg-amber-50/20" : ""
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
                  <td className="px-6 py-4 text-sm font-medium text-ink">
                    {user.sex ? { F: "Femme", M: "Homme", O: "Autre" }[user.sex] : "Non renseigné"}
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-ink">
                    {user.age != null ? `${user.age} ans` : "Non renseigné"}
                  </td>
                  <td className="px-6 py-4">
                    <button
                      type="button"
                      disabled={!isSuperAdmin}
                      onClick={() =>
                        isSuperAdmin && toggleAdminMutation.mutate({ id: user.id, is_admin: !user.is_admin })
                      }
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors disabled:cursor-default ${
                        user.is_admin
                          ? "bg-purple-100 text-purple-800 hover:bg-purple-200"
                          : user.is_employee
                          ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      <ShieldIcon />
                      {user.is_admin ? "Admin" : user.is_employee ? "Employé(e)" : "Étudiant"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                        user.is_suspended
                          ? "bg-red-100 text-red-800"
                          : user.is_deactivated
                          ? "bg-gray-100 text-gray-600"
                          : user.is_active
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          user.is_suspended
                            ? "bg-red-600"
                            : user.is_deactivated
                            ? "bg-gray-500"
                            : user.is_active
                            ? "bg-emerald-500"
                            : "bg-amber-500 animate-pulse"
                        }`}
                      ></span>
                      {user.is_suspended
                        ? "Suspendu"
                        : user.is_deactivated
                        ? "Désactivé"
                        : user.is_active
                        ? "Approuvé"
                        : "En Attente"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    {(!user.is_admin || isSuperAdmin) && (
                      <button
                        onClick={() => openEditModal(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-crimson hover:text-crimson transition-colors"
                      >
                        <EditIcon /> Modifier
                      </button>
                    )}
                    {user.is_suspended ? (
                      <button
                        onClick={() =>
                          updateSuspensionMutation.mutate({ id: user.id, is_suspended: false })
                        }
                        disabled={updateSuspensionMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <CheckIcon /> Réactiver
                      </button>
                    ) : !user.is_active && !user.is_deactivated ? (
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
                    ) : user.is_active ? (
                      (!user.is_admin || isSuperAdmin) && (
                        <button
                          onClick={() =>
                            updateStatusMutation.mutate({ id: user.id, is_active: false })
                          }
                          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold uppercase text-gray-600 hover:border-amber-500 hover:text-amber-600 transition-colors"
                        >
                          Désactiver
                        </button>
                      )
                    ) : (
                      <button
                        onClick={() => updateStatusMutation.mutate({ id: user.id, is_active: true })}
                        disabled={updateStatusMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold uppercase text-emerald-700 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                      >
                        <CheckIcon /> Réactiver
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <Toast
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: "", message: "" })}
      />
      {userToEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-fog p-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-crimson">Fiche utilisateur</p>
                <h2 className="mt-1 font-display text-2xl font-bold text-ink">Modifier les informations</h2>
              </div>
              <button type="button" onClick={closeEditModal} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full text-gray-500 hover:bg-gray-200 hover:text-ink">
                <span className="text-xl leading-none">&times;</span>
              </button>
            </div>
            <form onSubmit={handleEditSubmit} className="space-y-5 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  ["first_name", "Prénom", "text"],
                  ["last_name", "Nom", "text"],
                  ["username", "Matricule", "text"],
                  ["email", "Email", "email"],
                  ["phone_number", "Téléphone", "tel"],
                  ["classe", "Classe", "text"],
                  ["specialite", "Spécialité", "text"],
                ].map(([name, label, type]) => (
                  <label key={name} className="block">
                    <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">{label}</span>
                    <input
                      required={name === "username" || name === "email" || name === "phone_number"}
                      type={type}
                      value={formData[name]}
                      onChange={(event) => setFormData({ ...formData, [name]: event.target.value })}
                      className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                    />
                  </label>
                ))}
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Sexe</span>
                  <select
                    value={formData.sex}
                    onChange={(event) => setFormData({ ...formData, sex: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                  >
                    <option value="">Non renseigné</option>
                    <option value="F">Femme</option>
                    <option value="M">Homme</option>
                    <option value="O">Autre</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Date de naissance</span>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                    onChange={(event) => setFormData({ ...formData, date_of_birth: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                  />
                  {formData.date_of_birth && userToEdit.age != null && <span className="mt-1 block text-xs text-gray-500">Âge actuel : {userToEdit.age} ans</span>}
                </label>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Statut du compte</span>
                  <select
                    value={formData.account_status}
                    onChange={(event) => setFormData({ ...formData, account_status: event.target.value })}
                    className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                  >
                    <option value="pending">En attente</option>
                    <option value="active">Approuvé</option>
                    <option value="deactivated">Désactivé</option>
                  </select>
                </label>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-fog px-4 py-3">
                <input
                  type="checkbox"
                  checked={formData.is_admin}
                  onChange={(event) => setFormData({ ...formData, is_admin: event.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-crimson focus:ring-crimson"
                />
                <span className="text-sm font-bold text-ink">Accorder les droits administrateur</span>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">Photo de profil</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedPhoto(event.target.files?.[0] || null)}
                  className="w-full rounded-xl border border-dashed border-gray-300 bg-fog px-4 py-3 text-xs font-medium text-gray-500 file:mr-4 file:rounded-full file:border-0 file:bg-crimson/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-crimson"
                />
                {selectedPhoto && (
                  <div className="mt-3 flex items-center gap-3 rounded-xl border border-gray-200 bg-fog p-2">
                    <img
                      src={URL.createObjectURL(selectedPhoto)}
                      alt="Aperçu de la nouvelle photo"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">{selectedPhoto.name}</p>
                    <button
                      type="button"
                      onClick={() => setSelectedPhoto(null)}
                      aria-label="Retirer la photo sélectionnée"
                      title="Retirer la photo sélectionnée"
                      className="flex h-7 w-7 flex-none items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-100 hover:text-crimson"
                    >
                      <span className="text-lg leading-none">&times;</span>
                    </button>
                  </div>
                )}
                {userToEdit.photo && !selectedPhoto && <p className="mt-1 text-xs text-gray-500">Une photo est déjà enregistrée.</p>}
              </label>
              <div className="flex gap-3 border-t border-gray-100 pt-5">
                <button type="button" onClick={closeEditModal} className="flex-1 rounded-xl border border-gray-200 bg-white py-3 text-xs font-bold uppercase text-gray-500 hover:bg-gray-50">Annuler</button>
                <button type="submit" disabled={editMutation.isPending} className="flex-1 rounded-xl bg-crimson py-3 text-xs font-bold uppercase text-white shadow-sm hover:bg-red-700 disabled:opacity-50">
                  {editMutation.isPending ? "Enregistrement..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        open={!!userToReject}
        title="Supprimer cette demande ?"
        message={`La demande de ${userToReject?.name || "cet utilisateur"} sera supprimée définitivement.`}
        confirmLabel="Oui, supprimer"
        pending={deleteMutation.isPending}
        onClose={() => setUserToReject(null)}
        onConfirm={() => {
          deleteMutation.mutate(userToReject.id, {
            onSettled: () => setUserToReject(null),
          });
        }}
      />
    </div>
  );
}