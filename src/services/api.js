
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Agregar el JWT automáticamente a cada petición.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Gestionar errores de autenticación.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.startsWith("/api/Auth/")
    ) {
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("usuario");

      window.dispatchEvent(new Event("sesion-expirada"));
    }

    return Promise.reject(error);
  }
);

export default api;
