using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class DetallePedidoDTO
    {
        public int Id { get; set; }
        public int PedidoId { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debe indicar un producto válido.")]
        public int ProductoId { get; set; }

        // Solo de salida
        public string? ProductoNombre { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "La cantidad debe ser mayor que cero.")]
        public int Cantidad { get; set; }

        // Solo de salida: lo pone el servidor con el precio del producto
        public decimal PrecioUnitario { get; set; }
        public decimal Subtotal { get; set; }
    }
}