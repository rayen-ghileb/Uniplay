import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import api from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function RegisterPage() {
  const [serverError, setServerError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      const formData = new FormData();
      formData.append("username", data.username);
      formData.append("email", data.email);
      formData.append("password", data.password);
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("phone_number", data.phone_number);
      formData.append("classe", data.classe);
      formData.append("specialite", data.specialite);
      formData.append("sex", data.sex);
      formData.append("date_of_birth", data.date_of_birth);
      if (data.photo?.[0]) {
        formData.append("photo", data.photo[0]);
      }

      await api.post("/auth/register/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setIsSuccess(true);
    } catch (err) {
      const resp = err.response?.data;
      if (resp?.username) {
        setServerError("Ce matricule est déjà enregistré.");
      } else if (resp?.email) {
        setServerError("Cet email est déjà utilisé.");
      } else if (resp?.phone_number) {
        setServerError("Numéro de téléphone invalide.");
      } else if (resp?.classe || resp?.specialite) {
        setServerError("Classe et spécialité sont requises.");
      } else if (resp?.sex || resp?.date_of_birth) {
        setServerError(resp.date_of_birth?.[0] || "Sexe et date de naissance sont requis.");
      } else {
        setServerError("Une erreur est survenue lors de la création du compte.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      eyebrow="Université ESPRIT"
      title="Demande d'accès"
      subtitle="Créez votre compte étudiant pour réserver des terrains"
    >
      {isSuccess ? (
        <div className="space-y-6 text-center">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-emerald-800">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 font-bold text-xl">
              ✓
            </div>
            <h3 className="font-display text-lg font-bold">Demande envoyée !</h3>
            <p className="mt-2 text-xs font-medium leading-relaxed">
              Votre compte a été créé avec succès. Il est en attente d'approbation par un administrateur. Vous recevrez l'accès une fois validé.
            </p>
          </div>

          <Link
            to="/login"
            className="block w-full rounded-xl bg-ink px-4 py-3.5 text-center text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 hover:bg-crimson transition-all"
          >
            Retour à la connexion
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Identifiant (Matricule)
            </label>
            <input
              type="text"
              {...register("username", { required: "Matricule requis" })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 font-mono text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              placeholder="Ex: 253JMT3797"
            />
            {errors.username && (
              <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.username.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Prénom
              </label>
              <input
                type="text"
                {...register("first_name", { required: "Prénom requis" })}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
              {errors.first_name && (
                <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.first_name.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Nom
              </label>
              <input
                type="text"
                {...register("last_name", { required: "Nom requis" })}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
              {errors.last_name && (
                <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.last_name.message}</p>
              )}
            </div>
          </div>
                    <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              {...register("phone_number", {
                required: "Numéro de téléphone requis",
                pattern: { value: /^[0-9+\s-]{8}$/, message: "Numéro invalide" },
              })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              placeholder="Ex: 20123456"
            />
            {errors.phone_number && (
              <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.phone_number.message}</p>
            )}
          </div>
                    <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Classe
              </label>
              <input
                type="text"
                {...register("classe", { required: "Classe requise" })}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                placeholder="Ex: 3A24"
              />
              {errors.classe && (
                <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.classe.message}</p>
              )}
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
                Spécialité
              </label>
              <input
                type="text"
                {...register("specialite", { required: "Spécialité requise" })}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
                placeholder="Ex: TWIN"
              />
              {errors.specialite && (
                <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.specialite.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Sexe</label>
              <select
                {...register("sex", { required: "Sexe requis" })}
                defaultValue=""
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              >
                <option value="" disabled>Sélectionner</option>
                <option value="F">Femme</option>
                <option value="M">Homme</option>
                <option value="O">Autre</option>
              </select>
              {errors.sex && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.sex.message}</p>}
            </div>
            <div>
              <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">Date de naissance</label>
              <input
                type="date"
                {...register("date_of_birth", {
                  required: "Date de naissance requise",
                  validate: (value) => {
                    const birthDate = new Date(`${value}T00:00:00`);
                    const today = new Date();
                    let age = today.getFullYear() - birthDate.getFullYear();
                    if (today.getMonth() < birthDate.getMonth() || (today.getMonth() === birthDate.getMonth() && today.getDate() < birthDate.getDate())) age -= 1;
                    return age >= 18 || "L'utilisateur doit avoir au moins 18 ans";
                  },
                })}
                max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]}
                className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              />
              {errors.date_of_birth && <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.date_of_birth.message}</p>}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Photo de profil <span className="normal-case font-medium text-gray-400">(optionnel)</span>
            </label>
            <input
              type="file"
              accept="image/*"
              {...register("photo")}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-2.5 text-sm font-medium text-ink file:mr-3 file:rounded-lg file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-xs file:font-bold file:uppercase file:text-white hover:file:bg-crimson file:transition-colors"
            />
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Email institutionnel
            </label>
            <input
              type="email"
              {...register("email", {
                required: "Email requis",
                pattern: { value: /^\S+@\S+$/i, message: "Email invalide" },
              })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              placeholder="etudiant@esprit.tn"
            />
            {errors.email && (
              <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
              Mot de passe
            </label>
            <input
              type="password"
              {...register("password", {
                required: "Mot de passe requis",
                minLength: { value: 6, message: "Au moins 6 caractères" },
              })}
              className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
              placeholder="••••••••"
            />
            {errors.password && (
              <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.password.message}</p>
            )}
          </div>

          {serverError && (
            <div className="flex items-start gap-2 rounded-xl border border-crimson/20 bg-crimson/5 px-4 py-3 text-sm font-medium text-crimsonDark">
              {serverError}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark disabled:cursor-not-allowed disabled:opacity-50 mt-2"
          >
            {isLoading ? "Envoi en cours..." : "Soumettre la demande"}
          </button>

          <div className="mt-6 text-center border-t border-gray-100 pt-5">
            <Link to="/login" className="text-sm font-bold text-ink hover:text-crimson transition-colors">
              Déjà un compte approuvé ? <span className="text-crimson">Se connecter</span>
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}