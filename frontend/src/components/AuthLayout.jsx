import logo from "../assets/images/uniplay-logo.png";
import { useAuth } from "../context/AuthContext"; 

const DEFAULT_FEATURES = [
  "Réservez un terrain en un clic",
  "Padel, Foot, Basket — un seul endroit",
  "Confirmation instantanée",
];

/**
 * Shared visual shell for all auth pages (Login, Forgot Password, Reset Password).
 * Desktop: split screen — dark hero panel (left) + white form card (right).
 * Mobile: dark banner on top, white sheet floats up over it (ticket-stub effect).
 */
export default function AuthLayout({ eyebrow, title, subtitle, features = DEFAULT_FEATURES, children }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-fog">
      {/* Hero panel */}
      <div className="relative overflow-hidden bg-gradient-to-br from-ink via-ink to-carbon px-8 pt-10 pb-16 lg:w-1/2 lg:px-16 lg:py-16 lg:flex lg:flex-col lg:justify-between">
        {/* Diagonal crimson stripe */}
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          style={{
            background:
              "linear-gradient(115deg, transparent 46%, rgba(216,30,44,0.55) 48%, rgba(216,30,44,0.15) 58%, transparent 60%)",
          }}
        />
        {/* Soft crimson glow */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-crimson/30 blur-3xl" />

        {/* Pitch-line texture */}
        <svg
          className="pointer-events-none absolute -bottom-16 -left-16 h-72 w-72 opacity-[0.07] lg:h-96 lg:w-96"
          viewBox="0 0 200 200"
          fill="none"
        >
          <circle cx="100" cy="100" r="60" stroke="white" strokeWidth="2" />
          <circle cx="100" cy="100" r="3" fill="white" />
          <line x1="0" y1="100" x2="200" y2="100" stroke="white" strokeWidth="2" />
        </svg>

{/* Content */}
<div className="relative z-10">
  <div className="inline-flex items-center rounded-2xl bg-white px-6 py-4 shadow-2xl shadow-black/50 ring-1 ring-white/20">
    <img src={logo} alt="UniPlay" className="h-10 w-auto lg:h-12" />
  </div>

  <h2 className="mt-8 font-display text-4xl leading-[0.95] tracking-tight text-white lg:text-5xl">
    Book. Play.
    <br />
    <span className="text-crimson">Dominate.</span>
  </h2>
          <p className="mt-3 max-w-xs text-sm text-steel">
            La plateforme officielle de réservation sportive de l'Université ESPRIT.
          </p>
        </div>

        <ul className="relative z-10 mt-10 hidden space-y-4 lg:block">
          {features.map((feature) => (
            <li key={feature} className="flex items-center gap-3 text-sm font-medium text-white/90">
              <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full bg-crimson/20">
                <svg className="h-3 w-3 text-crimson" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Form panel */}
      <div className="relative z-10 -mt-8 flex flex-1 items-start justify-center px-6 pb-10 lg:mt-0 lg:items-center lg:py-16">
        <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl shadow-black/10 lg:rounded-2xl lg:p-10">
          <div className="mb-8">
            {eyebrow && (
              <p className="mb-1.5 text-xs font-bold uppercase tracking-[0.15em] text-crimson">{eyebrow}</p>
            )}
            <h1 className="font-display text-2xl tracking-tight text-ink lg:text-3xl">{title}</h1>
            {subtitle && <p className="mt-2 text-sm text-gray-500">{subtitle}</p>}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
