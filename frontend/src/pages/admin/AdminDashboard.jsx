import { useEffect, useState } from "react";
import { getDashboardStats } from "../../services/admin";

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
        <span className="text-xs font-bold text-steel uppercase tracking-wider">Chargement des données...</span>
      </div>
    );
  }

  const kpiCards = [
    { title: "Étudiants Actifs", value: stats?.total_students ?? 0, icon: "👥", color: "border-blue-200 bg-blue-50/30" },
    { title: "Réservations Totales", value: stats?.total_reservations ?? 0, icon: "📅", color: "border-purple-200 bg-purple-50/30" },
    { title: "Réservations Confirmées", value: stats?.confirmed_reservations ?? 0, icon: "✅", color: "border-emerald-200 bg-emerald-50/30" },
    { title: "Taux d'Annulation", value: `${stats?.cancellation_rate ?? 0}%`, icon: "⚠️", color: "border-rose-200 bg-rose-50/30" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-ink uppercase tracking-tight">Tableau de Bord</h1>
        <p className="text-xs font-bold text-steel uppercase tracking-wider mt-1">Aperçu en temps réel de la plateforme UniPlay</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi, idx) => (
          <div key={idx} className={`p-5 rounded-2xl border ${kpi.color} shadow-sm space-y-2`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-steel uppercase tracking-wider">{kpi.title}</span>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            <div className="text-3xl font-black text-ink tracking-tight">{kpi.value}</div>
          </div>
        ))}
      </div>

      {/* Status Distribution Section */}
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
        <h2 className="text-sm font-black text-ink uppercase tracking-wider">Répartition des Réservations</h2>
        
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-fog rounded-xl border border-gray-100">
            <span className="block text-xl font-bold text-emerald-600">{stats?.confirmed_reservations}</span>
            <span className="text-[10px] font-bold text-steel uppercase tracking-widest">Confirmées</span>
          </div>
          <div className="p-4 bg-fog rounded-xl border border-gray-100">
            <span className="block text-xl font-bold text-amber-500">{stats?.pending_reservations}</span>
            <span className="text-[10px] font-bold text-steel uppercase tracking-widest">En Attente</span>
          </div>
          <div className="p-4 bg-fog rounded-xl border border-gray-100">
            <span className="block text-xl font-bold text-rose-500">{stats?.cancelled_reservations}</span>
            <span className="text-[10px] font-bold text-steel uppercase tracking-widest">Annulées</span>
          </div>
        </div>
      </div>
    </div>
  );
}