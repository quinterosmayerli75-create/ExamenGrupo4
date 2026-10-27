
import api from "./api";

export const categoriaService = {
  async obtenerTodas() {
    const response = await api.get("/api/Categorias");
    return response.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/api/Categorias/${id}`);
    return response.data;
  },

  async crear(categoria) {
    const response = await api.post("/api/Categorias", {
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
    return response.data;
  },

  async actualizar(id, categoria) {
    await api.put(`/api/Categorias/${id}`, {
      id: Number(id),
      nombre: categoria.nombre,
      descripcion: categoria.descripcion || "",
    });
  },

  async eliminar(id) {
    await api.delete(`/api/Categorias/${id}`);
  },
};
