
using System.ComponentModel.DataAnnotations;

namespace TiendaApi.Models
{
    public class Pedido
    {
        public int Id { get; set; }

        public DateTime Fecha { get; set; } = DateTime.Now;

        [Required]
        [StringLength(30)]
        public string Estado { get; set; } = "Pendiente";

        public int ClienteId { get; set; }

        public Cliente? Cliente { get; set; }

        public ICollection<DetallePedido> DetallesPedido { get; set; } = new List<DetallePedido>();
    }
}
