import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import api from "../services/api.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function ForgotPasswordPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    setServerError("");
    try {
      await api.post("/auth/password-reset/", data);
      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.detail || err.response?.data?.email?.[0];
      setServerError(msg || "Une erreur est survenue. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <AuthLayout eyebrow="Université ESPRIT" title="Email envoyé" subtitle="Vérifiez votre boîte de réception">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
            <svg className="h-7 w-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mb-6 text-sm text-gray-600">
            Si un compte existe avec cette adresse email, vous recevrez un lien de réinitialisation.
          </p>
          <Link
            to="/login"
            className="inline-block w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark"
          >
            Retour à la connexion
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      eyebrow="Université ESPRIT"
      title="Mot de passe oublié"
      subtitle="Entrez votre email pour recevoir un lien de réinitialisation"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Adresse email
          </label>
          <input
            type="email"
            {...register("email", {
              required: "Email requis",
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: "Adresse email invalide",
              },
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="votre.email@esprit.tn"
          />
          {errors.email && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.email.message}</p>
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
          {isLoading ? "Envoi..." : "Envoyer le lien"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/login" className="text-sm font-semibold text-crimson hover:text-crimsonDark">
          Retour à la connexion
        </Link>
      </div>
    </AuthLayout>
  );
}
