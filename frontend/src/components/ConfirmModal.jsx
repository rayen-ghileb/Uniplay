export default function ConfirmModal({
  open,
  title,
  message,
  detail,
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  pending = false,
  onConfirm,
  onClose,
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="bg-ink px-6 py-5 text-white">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-crimson/20 text-crimson">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.3 4.5 2.7 18a2 2 0 0 0 1.75 3h15.1a2 2 0 0 0 1.75-3L13.7 4.5a2 2 0 0 0-3.4 0Z" />
              </svg>
            </div>
            <div>
              <h2 id="confirm-modal-title" className="font-display text-2xl uppercase tracking-tight">
                {title}
              </h2>
              <p className="mt-1 text-xs font-medium text-white/65">Cette action peut être irréversible.</p>
            </div>
          </div>
        </div>
        <div className="p-6">
          <p className="text-sm leading-6 text-steel">{message}</p>
          {detail && (
            <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm leading-6 text-red-800">
              {detail}
            </div>
          )}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-steel transition-colors hover:border-ink hover:text-ink disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={pending}
              className="rounded-xl bg-crimson px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-sm transition-colors hover:bg-crimsonDark disabled:cursor-wait disabled:opacity-50"
            >
              {pending ? "En cours..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
