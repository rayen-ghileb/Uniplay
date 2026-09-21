import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "../../services/api.js";

const SearchIcon = ({ className = "h-4 w-4" }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export default function AdminStudents() {
  const [search, setSearch] = useState("");

  const { data: students = [], isLoading } = useQuery({
    queryKey: ["admin-students"],
    queryFn: async () => {
      const res = await api.get("/auth/admin/students/");
      return res.data;
    },
  });

  const filteredStudents = students.filter((student) => {
    if (!search.trim()) return true;
    const q = search.trim().toLowerCase();
    const fullName = `${student.first_name} ${student.last_name}`.toLowerCase();
    return (
      fullName.includes(q) ||
      student.username?.toLowerCase().includes(q) ||
      student.email?.toLowerCase().includes(q)
    );
  });

  if (isLoading) return <div className="p-8 text-center font-medium text-gray-500">Chargement des étudiants...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">Gestion des Étudiants</h1>
          <p className="mt-1 text-sm font-medium text-gray-500">
            Liste des étudiants inscrits sur la plateforme.
          </p>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un étudiant..."
            className="w-64 rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-ink placeholder:text-gray-400 focus:border-ink focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm text-gray-500">
          <thead className="bg-fog/50 text-xs uppercase text-ink">
            <tr>
              <th className="px-6 py-4 font-bold">Matricule</th>
              <th className="px-6 py-4 font-bold">Nom complet</th>
              <th className="px-6 py-4 font-bold">Email</th>
              <th className="px-6 py-4 font-bold">Téléphone</th>
              <th className="px-6 py-4 font-bold">Classe</th>
              <th className="px-6 py-4 font-bold">Spécialité</th>
              <th className="px-6 py-4 font-bold">Sexe</th>
              <th className="px-6 py-4 font-bold">Âge</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500 font-medium">
                  Aucun étudiant ne correspond à la recherche.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => (
                <tr key={student.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4 font-mono text-xs font-bold text-ink">{student.username}</td>
                  <td className="px-6 py-4 font-bold text-ink">
                    {student.first_name || student.last_name
                      ? `${student.first_name} ${student.last_name}`
                      : "Nom non renseigné"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">{student.email}</td>
                  <td className="px-6 py-4 text-gray-500">{student.phone_number || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{student.classe || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">{student.specialite || "—"}</td>
                  <td className="px-6 py-4 text-gray-500">
                    {student.sex ? { F: "Femme", M: "Homme", O: "Autre" }[student.sex] : "—"}
                  </td>
                  <td className="px-6 py-4 text-gray-500">
                    {student.age != null ? `${student.age} ans` : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}