
import api from "./api";

export const clienteService = {
  async obtenerTodos() {
    const response = await api.get("/api/Clientes");
    return response.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/api/Clientes/${id}`);
    return response.data;
  },

  async crear(cliente) {
    const response = await api.post("/api/Clientes", cliente);
    return response.data;
  },

  async actualizar(id, cliente) {
    await api.put(`/api/Clientes/${id}`, {
      ...cliente,
      id: Number(id),
    });
  },

  async eliminar(id) {
    await api.delete(`/api/Clientes/${id}`);
  },
};
