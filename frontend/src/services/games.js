import api from "./api.js";

export const createGame = (payload) => api.post("/games/", payload);
export const getMyGames = () => api.get("/games/mine/");
export const browseGames = (sportId) =>
  api.get("/games/browse/", { params: sportId ? { sport: sportId } : {} });
export const getGame = (id) => api.get(`/games/${id}/`);
export const inviteToGame = (id, studentId) => api.post(`/games/${id}/invite/`, { student_id: studentId });
export const acceptGame = (id) => api.post(`/games/${id}/accept/`);
export const declineGame = (id) => api.post(`/games/${id}/decline/`);
export const joinGame = (id) => api.post(`/games/${id}/join/`);
export const leaveGame = (id) => api.post(`/games/${id}/leave/`);
export const kickFromGame = (id, studentId) => api.post(`/games/${id}/leave/`, { student_id: studentId });
export const getNotifications = () => api.get("/games/notifications/");
export const markNotificationsRead = (id) =>
  api.post("/games/notifications/read/", id ? { id } : {});
export const deleteNotification = (id) => api.delete(`/games/notifications/${id}/`);