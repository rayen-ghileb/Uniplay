import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api.js";

export default function ChangePasswordPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const newPassword = watch("new_password");

  const changePasswordMutation = useMutation({
    mutationFn: async (data) =>
      api.post("/auth/change-password/", {
        current_password: data.current_password,
        new_password: data.new_password,
      }),
    onSuccess: () => {
      setSuccessMessage("Votre mot de passe a été modifié avec succès.");
      setServerError("");
      reset();
      setTimeout(() => setSuccessMessage(""), 4000);
    },
    onError: (err) => {
      const resp = err.response?.data;
      if (resp?.current_password) {
        setServerError("Mot de passe actuel incorrect.");
      } else if (resp?.new_password) {
        setServerError("Le nouveau mot de passe ne respecte pas les critères requis.");
      } else {
        setServerError("Une erreur est survenue lors du changement de mot de passe.");
      }
    },
  });

  const onSubmit = (data) => {
    setServerError("");
    changePasswordMutation.mutate(data);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-fog/40 px-6 py-6">
        <h2 className="font-display text-lg font-bold text-ink">Réinitialiser mon mot de passe</h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Choisissez un nouveau mot de passe pour sécuriser votre compte.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-8">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Mot de passe actuel
          </label>
          <input
            type="password"
            {...register("current_password", { required: "Mot de passe actuel requis" })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="••••••••"
          />
          {errors.current_password && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.current_password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Nouveau mot de passe
          </label>
          <input
            type="password"
            {...register("new_password", {
              required: "Nouveau mot de passe requis",
              minLength: { value: 8, message: "Au moins 8 caractères" },
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="••••••••"
          />
          {errors.new_password && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.new_password.message}</p>
          )}
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Confirmer le nouveau mot de passe
          </label>
          <input
            type="password"
            {...register("confirm_password", {
              required: "Veuillez confirmer le mot de passe",
              validate: (value) => value === newPassword || "Les mots de passe ne correspondent pas",
            })}
            className="w-full rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium text-ink transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="••••••••"
          />
          {errors.confirm_password && (
            <p className="mt-1.5 text-sm font-medium text-crimsonDark">{errors.confirm_password.message}</p>
          )}
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
            disabled={changePasswordMutation.isPending}
            className="rounded-xl bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-50"
          >
            {changePasswordMutation.isPending ? "Modification..." : "Modifier le mot de passe"}
          </button>
        </div>
      </form>
    </div>
  );
}