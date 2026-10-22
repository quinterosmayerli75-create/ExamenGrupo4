
using System.ComponentModel.DataAnnotations;

namespace TiendaApi.Models
{
    public class DetallePedido
    {
        public int Id { get; set; }

        [Range(1, int.MaxValue)]
        public int PedidoId { get; set; }

        public Pedido? Pedido { get; set; }

        [Range(1, int.MaxValue)]
        public int ProductoId { get; set; }

        public Producto? Producto { get; set; }

        [Range(1, int.MaxValue,
            ErrorMessage = "La cantidad debe ser mayor que cero.")]
        public int Cantidad { get; set; }

        [Range(typeof(decimal), "0.01", "999999999",
            ErrorMessage = "El precio debe ser mayor que cero.")]
        public decimal PrecioUnitario { get; set; }
    }
}
