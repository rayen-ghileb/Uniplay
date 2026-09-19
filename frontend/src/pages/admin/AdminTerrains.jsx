import { useEffect, useState } from "react";
import { 
  getAdminTerrains, 
  deleteAdminTerrain, 
  generateTerrainSlots 
} from "../../services/admin";
import TerrainFormModal from "./TerrainFormModal";
import ConfirmModal from "../../components/ConfirmModal.jsx";
import Toast from "../../components/Toast.jsx";

export default function AdminTerrains() {
  const [terrains, setTerrains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTerrain, setEditingTerrain] = useState(null);
  const [generatingId, setGeneratingId] = useState(null);
  const [terrainToDelete, setTerrainToDelete] = useState(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const fetchTerrains = () => {
    setLoading(true);
    getAdminTerrains()
      .then((res) => setTerrains(res.data))
      .catch((err) => console.error("Erreur lors de la récupération des terrains:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTerrains();
  }, []);

  const handleOpenCreate = () => {
    setEditingTerrain(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (terrain) => {
    setEditingTerrain(terrain);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTerrain(null);
  };

  const handleTerrainSuccess = (message) => {
    fetchTerrains();
    setFeedback({ type: "success", message });
  };

  const handleDelete = async (id) => {
    try {
      await deleteAdminTerrain(id);
      setFeedback({ type: "success", message: "Terrain désactivé avec succès." });
      fetchTerrains();
    } catch (error) {
      console.error("Erreur lors de la suppression:", error);
      setFeedback({ type: "error", message: "Erreur lors de la désactivation du terrain." });
    }
  };

  const handleGenerateSlots = async (id, target) => {
    setGeneratingId(id);
    try {
      const res = await generateTerrainSlots(id, target);
      setFeedback({ type: "success", message: res.data.message || "Créneaux générés avec succès." });
    } catch (error) {
      console.error("Erreur de génération:", error);
      setFeedback({ type: "error", message: "Erreur lors de la génération des créneaux." });
    } finally {
      setGeneratingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">Disponible</span>;
      case "maintenance":
        return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-amber-50 text-amber-700 border border-amber-200">Maintenance</span>;
      case "inactive":
        return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-rose-50 text-rose-700 border border-rose-200">Inactif</span>;
      default:
        return <span className="px-2 py-1 text-[10px] font-bold uppercase rounded-md bg-gray-50 text-gray-600 border border-gray-200">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-black text-ink uppercase tracking-tight">Gestion des Terrains</h1>
        <button 
          onClick={handleOpenCreate} 
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all"
        >
          + Nouveau Terrain
        </button>
      </div>

      <TerrainFormModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleTerrainSuccess}
        terrainToEdit={editingTerrain}
      />

      {loading ? (
        <p className="text-sm text-steel font-bold uppercase tracking-widest mt-8">Chargement...</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-fog border-b border-gray-100 text-steel font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Nom</th>
                <th className="p-4">Sport</th>
                <th className="p-4">Statut</th>
                <th className="p-4">Capacité</th>
                
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {terrains.map((terrain) => (
                <tr key={terrain.id} className="hover:bg-gray-50">
                  <td className="p-4 font-bold text-ink">{terrain.name}</td>
                  <td className="p-4 text-steel">{terrain.sport_name || terrain.sport?.name || "N/A"}</td>
                  <td className="p-4">{getStatusBadge(terrain.status)}</td>
                  <td className="p-4 text-steel">{terrain.capacity} joueurs</td>
                  


                  <td className="p-4 text-right space-x-3">
                    <button 
                      onClick={() => handleOpenEdit(terrain)}
                      className="text-blue-600 text-xs font-bold uppercase hover:underline"
                    >
                      Éditer
                    </button>
                    <button 
                      onClick={() => setTerrainToDelete(terrain)} 
                      className="text-red-600 text-xs font-bold uppercase hover:underline"
                    >
                      Supprimer
                    </button>
                  </td>
                </tr>
              ))}
              {terrains.length === 0 && (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-steel text-sm">Aucun terrain trouvé.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <Toast
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: "", message: "" })}
      />
      <ConfirmModal
        open={!!terrainToDelete}
        title="Désactiver ce terrain ?"
        message={`Le terrain ${terrainToDelete?.name || "sélectionné"} ne sera plus proposé à la réservation.`}
        detail="Son statut passera à inactif. Les réservations existantes ne seront pas supprimées."
        confirmLabel="Oui, désactiver"
        onClose={() => setTerrainToDelete(null)}
        onConfirm={async () => {
          await handleDelete(terrainToDelete.id);
          setTerrainToDelete(null);
        }}
      />
    </div>
  );
}