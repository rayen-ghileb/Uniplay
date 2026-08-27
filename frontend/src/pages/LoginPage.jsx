import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { useAuth } from "../context/AuthContext.jsx";
import { login } from "../services/auth.js";
import AuthLayout from "../components/AuthLayout.jsx";

export default function LoginPage() {
  const { loginUser } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
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
      const res = await login(data);
      const { user, access, refresh } = res.data;
      loginUser(user, { access, refresh });
      navigate(user.is_admin ? "/admin" : "/");
    } catch (err) {
      const msg = err.response?.data?.detail;
      setServerError(msg || "Identifiants invalides. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout eyebrow="Université ESPRIT" title="Connexion" subtitle="Accédez à votre espace UniPlay">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Mot de passe
          </label>
          <input
            type="password"
            {...register("password", { required: "Mot de passe requis" })}
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
          className="w-full rounded-xl bg-ink px-4 py-3.5 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-gradient-to-r hover:from-crimson hover:to-crimsonDark disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? "Connexion..." : "Se connecter"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <Link to="/forgot-password" className="text-sm font-semibold text-crimson hover:text-crimsonDark">
          Mot de passe oublié ?
        </Link>
      </div>
    </AuthLayout>
  );
}
