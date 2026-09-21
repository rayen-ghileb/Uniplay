import { useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../services/api.js";
import Toast from "../components/Toast.jsx";

const CameraIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

function InfoField({ label, value }) {
  return (
    <div>
      <div className="text-xs font-bold uppercase tracking-wider text-gray-500">{label}</div>
      <div className="mt-1 text-sm font-semibold text-ink">
        {value && value.length > 0 ? value : <span className="font-medium text-gray-400">Non renseigné</span>}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return res.data;
    },
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("photo", file);
      return api.patch("/auth/me/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["me"]);
      setFeedback({ type: "success", message: "Photo de profil mise à jour avec succès." });
    },
    onError: () => setFeedback({ type: "error", message: "Impossible de mettre à jour la photo de profil." }),
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPhotoMutation.mutate(file);
  };

  const initials = (
    (user?.first_name?.[0] || "") + (user?.last_name?.[0] || user?.username?.[0] || "")
  ).toUpperCase() || "U";

  if (isLoading) {
    return <div className="p-8 text-center font-medium text-gray-500">Chargement du profil...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Mon Profil</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">Vos informations personnelles enregistrées sur UniPlay.</p>
      </div>

      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col items-center gap-4 border-b border-gray-100 bg-fog/40 px-6 py-8 sm:flex-row sm:items-center">
          <div className="relative">
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-3xl font-bold text-white shadow-md ring-4 ring-white">
              {user?.photo ? (
                <img src={user.photo} alt="Photo de profil" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadPhotoMutation.isPending}
              title="Changer la photo"
              className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white shadow-md ring-2 ring-white transition-colors hover:bg-crimson disabled:opacity-50"
            >
              <CameraIcon />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          <div className="text-center sm:text-left">
            <div className="font-display text-xl font-bold text-ink">
              {user?.first_name || user?.last_name
                ? `${user.first_name} ${user.last_name}`
                : "Nom non renseigné"}
            </div>
            <div className="font-mono text-xs font-bold text-gray-500">{user?.username}</div>
            {uploadPhotoMutation.isPending && (
              <div className="mt-1 text-xs font-medium text-gray-400">Envoi de la photo...</div>
            )}
            {uploadPhotoMutation.isError && (
              <div className="mt-1 text-xs font-medium text-crimsonDark">
                Échec de l'envoi. Réessayez avec une image plus légère.
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 px-6 py-8 sm:grid-cols-2">
          <InfoField label="Matricule" value={user?.username} />
          <InfoField label="Email" value={user?.email} />
          <InfoField label="Prénom" value={user?.first_name} />
          <InfoField label="Nom" value={user?.last_name} />
          <InfoField label="Numéro de téléphone" value={user?.phone_number} />
          <InfoField label="Classe" value={user?.classe} />
          <InfoField label="Spécialité" value={user?.specialite} />
          <InfoField label="Sexe" value={{ F: "Femme", M: "Homme", O: "Autre" }[user?.sex]} />
          <InfoField label="Date de naissance" value={user?.date_of_birth} />
          <InfoField label="Âge" value={user?.age != null ? `${user.age} ans` : ""} />
        </div>
      </div>
      <Toast
        type={feedback.type}
        message={feedback.message}
        onClose={() => setFeedback({ type: "", message: "" })}
      />
    </div>
  );
}