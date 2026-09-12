import { useState, useEffect } from "react";
import {
  getAdminSports,
  createAdminTerrain,
  updateAdminTerrain,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-gray-100 bg-fog p-6">
          <h2 className="font-display text-xl uppercase tracking-tight text-ink">
            {isEditing ? "Modifier le terrain" : "Nouveau terrain"}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-steel transition-colors hover:bg-gray-200 hover:text-ink"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Nom du terrain
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              placeholder="Ex: Terrain Padel 1"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Sport
              </label>
              <select
                required
                name="sport"
                value={formData.sport}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              >
                <option value="">Sélectionner...</option>
                {sports.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Statut
              </label>
              <select
                required
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              >
                <option value="available">Disponible</option>
                <option value="maintenance">Maintenance</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Capacité (joueurs)
              </label>
              <input
                required
                type="number"
                min="1"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Durée créneau (min)
              </label>
              <input
                required
                type="number"
                step="15"
                name="slot_duration"
                value={formData.slot_duration}
                onChange={handleChange}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Photo du terrain
            </label>
            <input
              type="file"
              name="photo"
              accept="image/*"
              onChange={handleChange}
              className="w-full text-sm text-steel file:mr-4 file:rounded-full file:border-0 file:bg-fog file:px-4 file:py-2 file:text-xs file:font-bold file:text-ink hover:file:bg-gray-200"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-steel transition-all hover:bg-gray-100"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-ink px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark disabled:opacity-50"
            >
              {loading ? "Enregistrement..." : isEditing ? "Mettre à jour" : "Enregistrer"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
