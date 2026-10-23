using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.DTOs;


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
        public async Task<ActionResult<IEnumerable<DetallePedidoDTO>>> GetDetallesPedido()
        {
            return await _context.DetallesPedido
                .Select(dp => new DetallePedidoDTO
                {
                    Id = dp.Id,
                    PedidoId = dp.PedidoId,
                    ProductoId = dp.ProductoId,
                    ProductoNombre = dp.Producto != null ? dp.Producto.Nombre : null,
                    Cantidad = dp.Cantidad,
                    PrecioUnitario = dp.PrecioUnitario,
                    Subtotal = dp.Cantidad * dp.PrecioUnitario
                })
                .ToListAsync();
        }

        // GET: api/DetallesPedido/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DetallePedidoDTO>> GetDetallePedido(int id)
        {
            var detalle = await _context.DetallesPedido
                .Include(dp => dp.Producto)
                .FirstOrDefaultAsync(dp => dp.Id == id);

            if (detalle == null)
            {
                return NotFound(new { mensaje = "El detalle de pedido no fue encontrado." });
            }

            return new DetallePedidoDTO
            {
                Id = detalle.Id,
                PedidoId = detalle.PedidoId,
                ProductoId = detalle.ProductoId,
                ProductoNombre = detalle.Producto?.Nombre,
                Cantidad = detalle.Cantidad,
                PrecioUnitario = detalle.PrecioUnitario,
                Subtotal = detalle.Cantidad * detalle.PrecioUnitario
            };
        }
    }
}