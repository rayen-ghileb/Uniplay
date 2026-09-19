import { useEffect } from "react";

export default function Toast({ type = "error", message, onClose }) {
  useEffect(() => {
    if (!message) return undefined;
    const timeout = setTimeout(onClose, 4500);
    return () => clearTimeout(timeout);
  }, [message, onClose]);

  if (!message) return null;

  const isSuccess = type === "success";

  return (
    <div className="fixed right-4 top-4 z-[70] w-[min(24rem,calc(100vw-2rem))]">
      <div className={`flex items-start gap-3 rounded-2xl border p-4 shadow-xl ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : "border-red-200 bg-red-50 text-red-800"
      }`}>
        <span className={`mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-xs font-black ${
          isSuccess ? "bg-emerald-600 text-white" : "bg-crimson text-white"
        }`}>
          {isSuccess ? "✓" : "!"}
        </span>
        <p className="flex-1 text-sm font-semibold leading-6">{message}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="text-current/50 transition-colors hover:text-current"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
