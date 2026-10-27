
import api from "./api";

export const productoService = {
  // Obtener todos los productos
  async obtenerTodos() {
    const response = await api.get("/api/Productos");
    return response.data;
  },

  // Obtener un producto por ID
  async obtenerPorId(id) {
    const response = await api.get(`/api/Productos/${id}`);
    return response.data;
  },

  // Crear producto
  async crear(producto) {
    const response = await api.post("/api/Productos", producto);
    return response.data;
  },

  // Editar producto
  async actualizar(id, producto) {
    const response = await api.put(`/api/Productos/${id}`, {
      ...producto,
      id: Number(id),
    });

    return response.data;
  },

  // Eliminar producto
  async eliminar(id) {
    const response = await api.delete(`/api/Productos/${id}`);
    return response.data;
  },
};
