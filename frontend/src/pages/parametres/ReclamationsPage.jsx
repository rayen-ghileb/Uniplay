import { useState } from "react";
import { useForm } from "react-hook-form";
import { useMutation } from "@tanstack/react-query";
import api from "../../services/api.js";

export default function ReclamationsPage() {
  const [successMessage, setSuccessMessage] = useState("");
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm();

  const messageValue = watch("message", "");

  const submitReclamationMutation = useMutation({
    mutationFn: async (data) => api.post("/auth/reclamations/", { message: data.message }),
    onSuccess: () => {
      setSuccessMessage("Votre réclamation a été envoyée. Un administrateur la consultera prochainement.");
      setServerError("");
      reset();
      setTimeout(() => setSuccessMessage(""), 5000);
    },
    onError: () => {
      setServerError("Une erreur est survenue lors de l'envoi. Veuillez réessayer.");
    },
  });

  const onSubmit = (data) => {
    setServerError("");
    submitReclamationMutation.mutate(data);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="border-b border-gray-100 bg-fog/40 px-6 py-6">
        <h2 className="font-display text-lg font-bold text-ink">Réclamations</h2>
        <p className="mt-1 text-sm font-medium text-gray-500">
          Décrivez votre problème ou votre remarque, un administrateur la traitera dans les meilleurs délais.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-8">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-gray-500">
            Votre message
          </label>
          <textarea
            rows={8}
            {...register("message", {
              required: "Veuillez décrire votre réclamation",
              minLength: { value: 10, message: "Merci de détailler un peu plus (10 caractères minimum)" },
              maxLength: { value: 2000, message: "2000 caractères maximum" },
            })}
            className="w-full resize-none rounded-xl border border-gray-200 bg-fog px-4 py-3 text-sm font-medium leading-relaxed text-ink placeholder:text-gray-400 transition focus:border-crimson focus:bg-white focus:outline-none focus:ring-2 focus:ring-crimson/20"
            placeholder="Expliquez ici votre réclamation en détail..."
          />
          <div className="mt-1.5 flex items-center justify-between">
            {errors.message ? (
              <p className="text-sm font-medium text-crimsonDark">{errors.message.message}</p>
            ) : (
              <span />
            )}
            <span className="text-xs font-medium text-gray-400">{messageValue.length}/2000</span>
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
            disabled={submitReclamationMutation.isPending}
            className="rounded-xl bg-ink px-6 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-lg shadow-ink/20 transition-all hover:bg-crimson disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitReclamationMutation.isPending ? "Envoi en cours..." : "Envoyer la réclamation"}
          </button>
        </div>
      </form>
    </div>
  );
}