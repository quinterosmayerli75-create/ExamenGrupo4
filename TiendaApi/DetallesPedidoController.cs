using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DetallesPedidoController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public DetallesPedidoController(TiendaDbContext context)
        {
            _context = context;
        }

        // GET: api/DetallesPedido
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DetallePedido>>> GetDetallesPedido()
        {
            return await _context.DetallesPedido
                .Include(dp => dp.Producto)
                .Include(dp => dp.Pedido)
                .ToListAsync();
        }

        // GET: api/DetallesPedido/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DetallePedido>> GetDetallePedido(int id)
        {
            var detalle = await _context.DetallesPedido
                .Include(dp => dp.Producto)
                .Include(dp => dp.Pedido)
                .FirstOrDefaultAsync(dp => dp.Id == id);

            if (detalle == null)
            {
                return NotFound(new { mensaje = "El detalle de pedido no fue encontrado." });
            }

            return detalle;
        }
    }
}