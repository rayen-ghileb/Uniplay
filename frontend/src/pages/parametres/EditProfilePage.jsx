import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../services/api.js";

const CameraIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 17a4 4 0 100-8 4 4 0 000 8z" />
  </svg>
);

export default function EditProfilePage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const { data: user, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      const res = await api.get("/auth/me/");
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm();

  // Populate the form once the user data arrives (or changes, e.g. after a photo upload)
  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone_number: user.phone_number || "",
        classe: user.classe || "",
        specialite: user.specialite || "",
      });
    }
  }, [user, reset]);

  const updateProfileMutation = useMutation({
    mutationFn: async (data) => api.patch("/auth/me/", data),
    onSuccess: (res) => {
      queryClient.setQueryData(["me"], res.data);
      setSuccessMessage("Vos informations ont été mises à jour.");
      setServerError("");
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: (err) => {
      const resp = err.response?.data;
      if (resp?.email) {
        setServerError("Cet email est déjà utilisé.");
      } else if (resp?.phone_number) {
        setServerError("Numéro de téléphone invalide.");
      } else {
        setServerError("Une erreur est survenue lors de la mise à jour.");
      }
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
    onSuccess: (res) => {
      queryClient.setQueryData(["me"], res.data);
    },
  });

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) uploadPhotoMutation.mutate(file);
  };

  const onSubmit = (data) => {
    setServerError("");
    updateProfileMutation.mutate(data);
  };

  const initials = (
    (user?.first_name?.[0] || "") + (user?.last_name?.[0] || user?.username?.[0] || "")
  ).toUpperCase() || "U";

  if (isLoading) {
    return <div className="p-8 text-center font-medium text-gray-500">Chargement...</div>;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="flex flex-col items-center gap-4 border-b border-gray-100 bg-fog/40 px-6 py-8 sm:flex-row sm:items-center">
        <div className="relative">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-crimson font-display text-2xl font-bold text-white shadow-md ring-4 ring-white">
            {user?.photo ? (
              <img src={user.photo} alt="Photo de profil" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadPhotoMutation.isPending}
            title="Changer la photo"
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-ink text-white shadow-md ring-2 ring-white transition-colors hover:bg-crimson disabled:opacity-50"
          >
            <CameraIcon className="h-3.5 w-3.5" />
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
          <div className="font-mono text-xs font-bold uppercase tracking-wider text-gray-500">Matricule</div>
          <div className="font-display text-lg font-bold text-ink">{user?.username}</div>
          {uploadPhotoMutation.isPending && (
            <div className="mt-1 text-xs font-medium text-gray-400">Envoi de la photo...</div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-8">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Prénom</label>
            <input
              type="text"
              {...register("first_name", { required: "Prénom requis" })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            />
            {errors.first_name && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.first_name.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Nom</label>
            <input
              type="text"
              {...register("last_name", { required: "Nom requis" })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            />
            {errors.last_name && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.last_name.message}</p>}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Email institutionnel</label>
          <input
            type="email"
            {...register("email", {
              required: "Email requis",
              pattern: { value: /^\S+@\S+$/i, message: "Email invalide" },
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
          />
          {errors.email && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.email.message}</p>}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Numéro de téléphone</label>
          <input
            type="tel"
            {...register("phone_number", {
              required: "Numéro de téléphone requis",
              pattern: { value: /^[0-9+\s-]{8,15}$/, message: "Numéro invalide" },
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
          />
          {errors.phone_number && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.phone_number.message}</p>}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Classe</label>
            <input
              type="text"
              {...register("classe", { required: "Classe requise" })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            />
            {errors.classe && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.classe.message}</p>}
          </div>
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Spécialité</label>
            <input
              type="text"
              {...register("specialite", { required: "Spécialité requise" })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            />
            {errors.specialite && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.specialite.message}</p>}
          </div>
        </div>

        {serverError && (
          <div className="rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-medium text-crimsonDark">
            {serverError}
          </div>
        )}
        {successMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {successMessage}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isDirty || updateProfileMutation.isPending}
            className="rounded-xl bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-50"
          >
            {updateProfileMutation.isPending ? "Enregistrement..." : "Enregistrer les modifications"}
          </button>
        </div>
      </form>
    </div>
  );
}