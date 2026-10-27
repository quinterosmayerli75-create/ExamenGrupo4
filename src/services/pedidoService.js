
import api from "./api";

export const pedidoService = {
  async obtenerTodos() {
    const response = await api.get("/api/Pedidos");
    return response.data;
  },

  async obtenerPorId(id) {
    const response = await api.get(`/api/Pedidos/${id}`);
    return response.data;
  },

  async crear(clienteId, detalles) {
    const response = await api.post("/api/Pedidos", {
      clienteId: Number(clienteId),
      detalles: detalles.map((detalle) => ({
        productoId: Number(detalle.productoId),
        cantidad: Number(detalle.cantidad),
      })),
    });

    return response.data;
  },

  async cambiarEstado(id, estado) {
    await api.put(`/api/Pedidos/${id}/estado`, {
      estado,
    });
  },

  async eliminar(id) {
    await api.delete(`/api/Pedidos/${id}`);
  },
};
