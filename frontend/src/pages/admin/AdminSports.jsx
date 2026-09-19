import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api.js";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Toast from "../../components/Toast.jsx";

const PlusIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
);

const EditIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

const TrashIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

export default function AdminSports() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSport, setEditingSport] = useState(null);
  const [sportToDelete, setSportToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  
  const [formData, setFormData] = useState({ name: "", description: "", is_active: true });
  const [selectedFile, setSelectedFile] = useState(null);

  const { data: sports = [], isLoading } = useQuery({
    queryKey: ["admin-sports"],
    queryFn: async () => {
      const res = await api.get("/sports/admin/");
      return res.data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (payload) => {
      if (editingSport) {
        return api.patch(`/sports/admin/${editingSport.id}/`, payload);
      }
      return api.post("/sports/admin/", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sports"]);
      queryClient.invalidateQueries(["sports"]);
      setFeedback({
        type: "success",
        message: editingSport ? "Sport modifié avec succès." : "Sport ajouté avec succès.",
      });
      closeModal();
    },
    onError: () => setFeedback({ type: "error", message: "Impossible d'enregistrer le sport." }),
  });

  const toggleStatusMutation = useMutation({
    mutationFn: async (sport) => {
      return api.patch(`/sports/admin/${sport.id}/`, { is_active: !sport.is_active });
    },
    onSuccess: (_data, sport) => {
      queryClient.invalidateQueries(["admin-sports"]);
      queryClient.invalidateQueries(["sports"]);
      setFeedback({
        type: "success",
        message: sport.is_active ? "Sport désactivé avec succès." : "Sport activé avec succès.",
      });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de modifier le statut du sport." }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      return api.delete(`/sports/admin/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["admin-sports"]);
      queryClient.invalidateQueries(["sports"]);
      setFeedback({ type: "success", message: "Sport désactivé avec succès." });
    },
    onError: (error) => {
      const errorMessage = error.response?.data?.detail || "Une erreur est survenue lors de la suppression.";
      setFeedback({ type: "error", message: errorMessage });
    }
  });

  const openModal = (sport = null) => {
    setEditingSport(sport);
    setFormData(sport ? { name: sport.name, description: sport.description, is_active: sport.is_active } : { name: "", description: "", is_active: true });
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingSport(null);
    setSelectedFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const formDataToSend = new FormData();
    formDataToSend.append("name", formData.name);
    formDataToSend.append("description", formData.description || "");
    formDataToSend.append("is_active", formData.is_active);

    if (selectedFile) {
      formDataToSend.append("icon", selectedFile);
    }

    saveMutation.mutate(formDataToSend);
  };

  const handleDelete = (id) => {
    setSportToDelete(sports.find((sport) => sport.id === id));
  };

  if (isLoading) return <div className="p-8 text-center text-steel font-medium">Chargement des sports...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl tracking-tight text-ink">Gestion des Sports</h1>
          <p className="text-sm font-medium text-steel mt-1">Ajoutez ou modifiez les disciplines proposées sur le campus.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 rounded-xl bg-crimson px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-red-700"
        >
          <PlusIcon /> Nouveau Sport
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-steel">
          <thead className="bg-fog/50 text-xs uppercase text-ink">
            <tr>
              <th className="px-6 py-4 font-bold">Sport</th>
              <th className="px-6 py-4 font-bold">Terrains Actifs</th>
              <th className="px-6 py-4 font-bold">Statut</th>
              <th className="px-6 py-4 font-bold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sports.map((sport) => (
              <tr key={sport.id} className="transition-colors hover:bg-gray-50/50">
                <td className="px-6 py-4 font-bold text-ink flex items-center gap-3">
                  {sport.icon && (
                     <img src={sport.icon} alt={sport.name} className="h-8 w-8 rounded-full object-cover border border-gray-200 bg-fog" />
                  )}
                  {sport.name}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1.5">
                    <span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold text-steel">
                      {sport.active_terrains_count || 0} Terrains
                    </span>
                    {sport.maintenance_terrains_count > 0 && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                        {sport.maintenance_terrains_count} en maint.
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => toggleStatusMutation.mutate(sport)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                      sport.is_active ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${sport.is_active ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                    {sport.is_active ? "Actif" : "Inactif"}
                  </button>
                </td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button
                    onClick={() => openModal(sport)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-bold text-ink hover:border-crimson hover:text-crimson transition-colors"
                  >
                    <EditIcon /> Éditer
                  </button>
                  <button
                    onClick={() => handleDelete(sport.id)}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <TrashIcon /> Désactiver
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="font-display text-2xl text-ink mb-4">
              {editingSport ? "Modifier le sport" : "Nouveau sport"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-steel mb-1">Nom du sport</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-2.5 text-sm font-medium text-ink focus:border-crimson focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-steel mb-1">Logo / Icône</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="w-full rounded-xl border border-dashed border-gray-300 bg-fog px-4 py-2.5 text-xs font-medium text-steel file:mr-4 file:rounded-full file:border-0 file:bg-crimson/10 file:px-4 file:py-2 file:text-xs file:font-bold file:text-crimson hover:file:bg-crimson/20 cursor-pointer"
                />
                {editingSport?.icon && !selectedFile && (
                  <p className="mt-1 text-[10px] text-steel">Une icône existe déjà. Uploadez un nouveau fichier pour la remplacer.</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-steel mb-1">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-2.5 text-sm font-medium text-ink focus:border-crimson focus:outline-none focus:ring-1 focus:ring-crimson"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-crimson focus:ring-crimson"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-ink">Activer ce sport immédiatement</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 rounded-xl border border-gray-200 bg-white py-2.5 text-xs font-bold uppercase text-steel hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saveMutation.isPending}
                  className="flex-1 rounded-xl bg-crimson py-2.5 text-xs font-bold uppercase text-white shadow-sm hover:bg-red-700 disabled:opacity-50"
                >
                  {saveMutation.isPending ? "Sauvegarde..." : "Enregistrer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <Toast
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: "", message: "" })}
      />
      <ConfirmModal
        open={!!sportToDelete}
        title="Supprimer ce sport ?"
        message={`Le sport ${sportToDelete?.name || "sélectionné"} sera désactivé et ses réservations annulées.`}
        detail="Cette action peut affecter les terrains et les créneaux associés."
        confirmLabel="Oui, supprimer"
        pending={deleteMutation.isPending}
        onClose={() => setSportToDelete(null)}
        onConfirm={() => {
          deleteMutation.mutate(sportToDelete.id, {
            onSettled: () => setSportToDelete(null),
          });
        }}
      />
    </div>
  );
}