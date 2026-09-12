import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/admin";

const UsersIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-4a4 4 0 10-8 0 4 4 0 008 0zm6 0a4 4 0 10-8 0 4 4 0 008 0z" />
  </svg>
);

const CalendarIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="5" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 3v4m8-4v4M3 10h18" />
  </svg>
);

const CheckIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const AlertIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
  </svg>
);

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats()
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Error loading KPI stats:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-crimson border-t-transparent"></div>
      </div>
    );
  }

  const kpiCards = [
    { title: "Étudiants actifs", value: stats?.total_students ?? 0, icon: UsersIcon },
    { title: "Réservations totales", value: stats?.total_reservations ?? 0, icon: CalendarIcon },
    { title: "Réservations confirmées", value: stats?.confirmed_reservations ?? 0, icon: CheckIcon },
    { title: "Taux d'annulation", value: `${stats?.cancellation_rate ?? 0}%`, icon: AlertIcon },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl uppercase tracking-tight text-ink">Tableau de bord</h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-wider text-steel">
          Aperçu en temps réel de la plateforme UniPlay
        </p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.title}
              className="space-y-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-steel">{kpi.title}</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-crimson/10">
                  <Icon className="h-4 w-4 text-crimson" />
                </div>
              </div>
              <div className="font-display text-3xl tracking-tight text-ink">{kpi.value}</div>
            </div>
          );
        })}
      </div>

      {/* Status distribution */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink">Répartition des réservations</h2>

        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="rounded-xl border border-gray-100 bg-fog p-4">
            <span className="block text-xl font-bold text-emerald-600">{stats?.confirmed_reservations}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-steel">Confirmées</span>
          </div>
          <div className="rounded-xl border border-gray-100 bg-fog p-4">
            <span className="block text-xl font-bold text-amber-500">{stats?.pending_reservations}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-steel">En attente</span>
          </div>
          <div className="rounded-xl border border-gray-100 bg-fog p-4">
            <span className="block text-xl font-bold text-crimson">{stats?.cancelled_reservations}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-steel">Annulées</span>
          </div>
        </div>
      </div>

      {/* Most played sports */}
      <div className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-wider text-ink">Sports les plus joués</h2>

        {stats?.most_played_sports?.length > 0 ? (
          <div className="space-y-3">
            {(() => {
              const maxCount = Math.max(...stats.most_played_sports.map((s) => s.reservation_count));
              return stats.most_played_sports.map((sport, idx) => (
                <div key={sport.sport_name} className="flex items-center gap-4">
                  <span className="font-display w-6 flex-none text-lg text-steel">#{idx + 1}</span>
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-bold text-ink">{sport.sport_name}</span>
                      <span className="text-xs font-bold text-steel">
                        {sport.reservation_count} réservation{sport.reservation_count > 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-fog">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-crimson to-crimsonDark"
                        style={{ width: `${(sport.reservation_count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        ) : (
          <p className="text-sm text-steel">Pas encore assez de données pour établir un classement.</p>
        )}
      </div>
    </div>
  );
}
