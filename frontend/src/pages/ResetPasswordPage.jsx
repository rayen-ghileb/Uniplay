import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useSearchParams, Link } from "react-router-dom";
import api from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [validParams, setValidParams] = useState(true);

  const uid = searchParams.get("uid");
  const token = searchParams.get("token");

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!uid || !token) {
      setValidParams(false);
      setServerError("Lien de réinitialisation invalide ou expiré.");
    }
  }, [uid, token]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      await api.post("/auth/password-reset-confirm/", {
        uid,
        token,
        new_password: data.new_password,
      });
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail;
      setServerError(msg || "Le lien est invalide ou a expiré. Veuillez demander un nouveau lien.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!validParams) {
    return (
      <AuthLayout eyebrow="Université ESPRIT" title="Lien invalide">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-crimson/10">
            <svg className="h-7 w-7 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <p className="mb-6 text-sm text-gray-600">{serverError}</p>
          <Link
            to="/forgot-password"
            className="inline-block w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark"
          >
            Demander un nouveau lien
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (success) {
    return (
      <AuthLayout eyebrow="Université ESPRIT" title="Mot de passe réinitialisé">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mb-6 text-sm text-gray-600">
            Votre mot de passe a été changé avec succès. Vous pouvez maintenant vous connecter.
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark"
          >
            Se connecter
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Université ESPRIT" title="Nouveau mot de passe" subtitle="Choisissez un mot de passe sécurisé">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            {...register("new_password", {
              required: "Mot de passe requis",
              minLength: { value: 8, message: "Minimum 8 caractères" },
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="••••••••"
          />
          {errors.new_password && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Confirmer le mot de passe
          </label>
          <input
            type="password"
            {...register("confirm_password", {
              required: "Confirmation requise",
              validate: (val) => val === watch("new_password") || "Les mots de passe ne correspondent pas",
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="••••••••"
          />
          {errors.confirm_password && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.confirm_password.message}</p>
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
          className="w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
        </button>
      </form>
    </AuthLayout>
  );
}
