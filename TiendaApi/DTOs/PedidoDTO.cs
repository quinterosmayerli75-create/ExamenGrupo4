
namespace TiendaApi.DTOs
{
    public class PedidoDTO
    {
        public int Id { get; set; }
        public DateTime Fecha { get; set; }
        public string Estado { get; set; } = "Pendiente";
        public int ClienteId { get; set; }
    }
}
