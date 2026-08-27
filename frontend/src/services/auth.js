import api from "./api.js";

export const login = (credentials) => api.post("/auth/login/", credentials);
export const logout = (refresh) => api.post("/auth/logout/", { refresh });
export const getMe = () => api.get("/auth/me/");
export const refreshToken = (refresh) =>
  axios.post(`${import.meta.env.VITE_API_URL}/auth/refresh/`, { refresh });