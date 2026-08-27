import { useState, useEffect } from "react";
import { 
  getAdminSports, 
  createAdminTerrain, 
  updateAdminTerrain 
} from "../../services/admin";

export default function TerrainFormModal({ isOpen, onClose, onSuccess, terrainToEdit = null }) {
  const [sports, setSports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    sport: "",
    capacity: 4,
    slot_duration: 60,
    status: "available",
    photo: null,
  });

  const isEditing = Boolean(terrainToEdit);

  useEffect(() => {
    if (isOpen) {
      getAdminSports()
        .then((res) => setSports(res.data))
        .catch((err) => console.error("Erreur chargement sports:", err));

      if (terrainToEdit) {
        setFormData({
          name: terrainToEdit.name || "",
          sport: terrainToEdit.sport?.id || terrainToEdit.sport || "",
          capacity: terrainToEdit.capacity || 4,
          slot_duration: terrainToEdit.slot_duration || 60,
          status: terrainToEdit.status || "available",
          photo: null,
        });
      } else {
        setFormData({
          name: "",
          sport: "",
          capacity: 4,
          slot_duration: 60,
          status: "available",
          photo: null,
        });
      }
    }
  }, [isOpen, terrainToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "photo") {
      setFormData({ ...formData, photo: files[0] });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("name", formData.name);
    data.append("sport", formData.sport);
    data.append("capacity", formData.capacity);
    data.append("slot_duration", formData.slot_duration);
    data.append("status", formData.status);
    
    // Only attach a photo if a new file was selected
    if (formData.photo) {
      data.append("photo", formData.photo);
    }

    try {
      if (isEditing) {
        await updateAdminTerrain(terrainToEdit.id, data);
      } else {
        await createAdminTerrain(data);
      }
      onSuccess();
      onClose();
    } catch (error) {
      const backendError = error.response?.data 
        ? JSON.stringify(error.response.data) 
        : "Une erreur est survenue.";
      
      console.error("Backend validation error:", error.response?.data);
      alert(`Erreur d'enregistrement: ${backendError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-fog">
          <h2 className="text-lg font-black text-ink uppercase tracking-tight">
            {isEditing ? "Modifier le Terrain" : "Nouveau Terrain"}
          </h2>
          <button onClick={onClose} className="text-steel hover:text-ink font-bold text-xl">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Nom du Terrain</label>
            <input 
              required 
              type="text" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-ink focus:border-ink" 
              placeholder="Ex: Terrain Padel 1" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Sport</label>
              <select 
                required 
                name="sport" 
                value={formData.sport} 
                onChange={handleChange} 
                className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-ink focus:border-ink"
              >
                <option value="">Sélectionner...</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Statut</label>
              <select 
                required 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-ink focus:border-ink"
              >
                <option value="available">Disponible</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Capacité (Joueurs)</label>
              <input 
                required 
                type="number" 
                min="1" 
                name="capacity" 
                value={formData.capacity} 
                onChange={handleChange} 
                className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-ink focus:border-ink" 
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Durée Créneau (Min)</label>
              <input 
                required 
                type="number" 
                step="15" 
                name="slot_duration" 
                value={formData.slot_duration} 
                onChange={handleChange} 
                className="w-full border-gray-200 rounded-xl p-3 text-sm focus:ring-ink focus:border-ink" 
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-steel uppercase tracking-widest mb-1">Photo du Terrain</label>
            <input 
              type="file" 
              name="photo" 
              accept="image/*" 
              onChange={handleChange} 
              className="w-full text-sm text-steel file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-fog file:text-ink hover:file:bg-gray-200" 
            />
          </div>

          <div className="pt-4 flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider text-steel hover:bg-gray-100 transition-all"
            >
              Annuler
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider bg-ink text-white hover:bg-black transition-all disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}