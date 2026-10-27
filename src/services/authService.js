
import api from "./api";

export const authService = {
  async login(email, password) {
    const response = await api.post("/api/Auth/login", {
      email,
      password,
    });

    const { token, usuario } = response.data;

    sessionStorage.setItem("token", token);
    sessionStorage.setItem("usuario", JSON.stringify(usuario));

    return response.data;
  },

  async registro(nombreUsuario, email, password) {
    const response = await api.post("/api/Auth/registro", {
      nombreUsuario,
      email,
      password,
    });

    return response.data;
  },

  logout() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("usuario");
  },

  getUsuario() {
    try {
      return JSON.parse(sessionStorage.getItem("usuario") || "null");
    } catch {
      return null;
    }
  },

  getToken() {
    return sessionStorage.getItem("token");
  },

  estaAutenticado() {
    return Boolean(sessionStorage.getItem("token"));
  },

  esAdmin() {
    return this.getUsuario()?.rol === "Admin";
  },
};
