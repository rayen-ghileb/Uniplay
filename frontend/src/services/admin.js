import api from "./api.js";

// Dashboard KPI
export const getDashboardStats = () => api.get("/admin/dashboard/stats/");

// Sports
export const getAdminSports = () => api.get("/admin/sports/");

// Terrains CRUD & Generation
export const getAdminTerrains = () => api.get("/admin/terrains/");

// Let Axios handle the Content-Type header automatically for FormData
// services/admin.js

export const createAdminTerrain = (data) => api.post("/admin/terrains/", data, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const updateAdminTerrain = (id, data) => api.patch(`/admin/terrains/${id}/`, data, {
  headers: { "Content-Type": "multipart/form-data" }
});

export const deleteAdminTerrain = (id) => api.delete(`/admin/terrains/${id}/`);
export const generateTerrainSlots = (id, target) => api.post(`/admin/terrains/${id}/generate_slots/`, { target });

// Global Reservations
export const getAdminReservations = (search = "") => api.get(`/admin/reservations/?search=${search}`);
export const cancelAdminReservation = (id) => api.post(`/admin/reservations/${id}/cancel/`);
export const exportReservationsCSV = () => api.get("/admin/reservations/export_csv/", { responseType: 'blob' });