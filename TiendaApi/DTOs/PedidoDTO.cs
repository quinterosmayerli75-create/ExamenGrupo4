using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class PedidoDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string? Estado { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debe indicar un cliente válido.")]
        public int ClienteId { get; set; }

        // Solo de salida
        public string? ClienteNombre { get; set; }
        public decimal Total { get; set; }

        [MinLength(1, ErrorMessage = "El pedido debe contener al menos un producto.")]
        public List<DetallePedidoDTO> Detalles { get; set; } = new();
    }

    public class PedidoEstadoDTO
    {
        [Required(ErrorMessage = "El estado es obligatorio.")]
        [StringLength(30)]
        public string Estado { get; set; } = string.Empty;
    }
}