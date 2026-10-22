using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PedidosController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public PedidosController(TiendaDbContext context)
        {
            _context = context;
        }

        // GET: api/Pedidos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Pedido>>> GetPedidos()
        {
            return await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .ToListAsync();
        }

        // GET: api/Pedidos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Pedido>> GetPedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound(new { mensaje = "El pedido no fue encontrado." });
            }

            return pedido;
        }

        // POST: api/Pedidos
        [HttpPost]
        public async Task<ActionResult<Pedido>> PostPedido(Pedido pedido)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Validar que el cliente exista
            var clienteExiste = await _context.Clientes.AnyAsync(c => c.Id == pedido.ClienteId);
            if (!clienteExiste)
            {
                return BadRequest(new { mensaje = "El cliente especificado no existe." });
            }

            if (pedido.DetallesPedido == null || !pedido.DetallesPedido.Any())
            {
                return BadRequest(new { mensaje = "El pedido debe contener al menos un producto." });
            }

            // Validar stock de cada producto y descontarlo
            foreach (var detalle in pedido.DetallesPedido)
            {
                var producto = await _context.Productos.FindAsync(detalle.ProductoId);
                if (producto == null)
                {
                    return BadRequest(new { mensaje = $"El producto con ID {detalle.ProductoId} no existe." });
                }

                if (producto.Stock < detalle.Cantidad)
                {
                    return BadRequest(new { mensaje = $"Stock insuficiente para el producto: {producto.Nombre}. Stock disponible: {producto.Stock}" });
                }

                // Descontar stock del producto
                producto.Stock -= detalle.Cantidad;
            }

            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, pedido);
        }

        // DELETE: api/Pedidos/5 (Eliminar o cancelar pedido y devolver stock)
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.DetallesPedido!)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound(new { mensaje = "El pedido no fue encontrado." });
            }

            // Devolver el stock a los productos al cancelar el pedido
            if (pedido.DetallesPedido != null)
            {
                foreach (var detalle in pedido.DetallesPedido)
                {
                    if (detalle.Producto != null)
                    {
                        detalle.Producto.Stock += detalle.Cantidad;
                    }
                }
            }

            _context.Pedidos.Remove(pedido);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}