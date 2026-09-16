import { Link, useLocation } from "react-router-dom";

const UserIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

const LockIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="5" y="11" width="14" height="9" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0v4" />
  </svg>
);

const MessageIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" />
  </svg>
);

const links = [
  { path: "/parametres/profil", label: "Modifier mon profil", icon: UserIcon },
  { path: "/parametres/mot-de-passe", label: "Réinitialiser mon mot de passe", icon: LockIcon },
  { path: "/parametres/reclamations", label: "Réclamations", icon: MessageIcon },
];

export default function ParametresLayout({ children }) {
  const location = useLocation();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Paramètres</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">Gérez votre compte et vos préférences.</p>
      </div>

      <div className="mt-8 flex flex-col gap-6 md:flex-row">
        <aside className="w-full flex-none md:w-64">
          <nav className="space-y-1.5 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
            {links.map((link) => {
              const isActive = location.pathname === link.path;
              const Icon = link.icon;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                    isActive
                      ? "bg-ink text-white shadow-sm"
                      : "text-steel hover:bg-gray-50 hover:text-ink"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-none" />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}