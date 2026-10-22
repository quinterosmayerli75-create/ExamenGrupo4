
using System.ComponentModel.DataAnnotations;

namespace TiendaApi.Models
{
    public class DetallePedido
    {
        public int Id { get; set; }

        public int PedidoId { get; set; }

        public Pedido? Pedido { get; set; }

        public int ProductoId { get; set; }

        public Producto? Producto { get; set; }

        [Range(1, int.MaxValue)]
        public int Cantidad { get; set; }

        [Range(typeof(decimal), "0.01", "999999999")]
        public decimal PrecioUnitario { get; set; }
    }
}
