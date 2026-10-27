using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.IdentityModel.Tokens.Jwt;
using TiendaApi.Data;
using TiendaApi.DTOs;
using TiendaApi.Models;


namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class PedidosController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public PedidosController(TiendaDbContext context)
        {
            _context = context;
        }

        private IQueryable<Pedido> ConsultaPedidos()
        {
            return _context.Pedidos
                .Include(p => p.Cliente)
                .Include(p => p.DetallesPedido)
                    .ThenInclude(dp => dp.Producto);
        }

        private static PedidoDTO ToDto(Pedido p)
        {
            return new PedidoDTO
            {
                Id = p.Id,
                Fecha = p.Fecha,
                Estado = p.Estado,
                ClienteId = p.ClienteId,
                ClienteNombre = p.Cliente?.Nombre,
                Total = p.DetallesPedido.Sum(d => d.Cantidad * d.PrecioUnitario),
                Detalles = p.DetallesPedido.Select(d => new DetallePedidoDTO
                {
                    Id = d.Id,
                    PedidoId = d.PedidoId,
                    ProductoId = d.ProductoId,
                    ProductoNombre = d.Producto?.Nombre,
                    Cantidad = d.Cantidad,
                    PrecioUnitario = d.PrecioUnitario,
                    Subtotal = d.Cantidad * d.PrecioUnitario
                }).ToList()
            };
        }

        // GET: api/Pedidos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<PedidoDTO>>> GetPedidos()
        {
            var consulta = ConsultaPedidos();
            if (!User.IsInRole("Admin"))
            {
                var correo = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
                if (string.IsNullOrWhiteSpace(correo)) return Forbid();
                consulta = consulta.Where(p => p.Cliente != null && p.Cliente.Correo == correo);
            }

            var pedidos = await consulta.ToListAsync();
            return Ok(pedidos.Select(ToDto).ToList());
        }

        // GET: api/Pedidos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<PedidoDTO>> GetPedido(int id)
        {
            var pedido = await ConsultaPedidos().FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound(new { mensaje = "El pedido no fue encontrado." });
            }

            var correo = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
            if (!User.IsInRole("Admin") && !string.Equals(pedido.Cliente?.Correo, correo, StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            return ToDto(pedido);
        }

        // POST: api/Pedidos
        [HttpPost]
        [Authorize(Roles = "Cliente")]
        public async Task<ActionResult<PedidoDTO>> PostPedido(PedidoDTO dto)
        {
            var correo = User.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
            if (string.IsNullOrWhiteSpace(correo)) return Forbid();

            // El cliente de un pedido se obtiene de la identidad autenticada, no del formulario.
            var clienteExiste = await _context.Clientes.AnyAsync(c => c.Id == dto.ClienteId && c.Correo == correo);
            if (!clienteExiste)
            {
                return Forbid();
            }

            // Si un producto viene repetido, se suman sus cantidades
            var lineas = dto.Detalles
                .GroupBy(d => d.ProductoId)
                .Select(g => new { ProductoId = g.Key, Cantidad = g.Sum(x => x.Cantidad) })
                .ToList();

            var ids = lineas.Select(l => l.ProductoId).ToList();
            var productos = await _context.Productos
                .Where(p => ids.Contains(p.Id))
                .ToDictionaryAsync(p => p.Id);

            var pedido = new Pedido
            {
                ClienteId = dto.ClienteId,
                Fecha = DateTime.Now,
                Estado = "Pendiente"
            };

            foreach (var linea in lineas)
            {
                if (!productos.TryGetValue(linea.ProductoId, out var producto))
                {
                    return BadRequest(new { mensaje = $"El producto con ID {linea.ProductoId} no existe." });
                }

                if (producto.Stock < linea.Cantidad)
                {
                    return BadRequest(new { mensaje = $"Stock insuficiente para el producto: {producto.Nombre}. Stock disponible: {producto.Stock}" });
                }

                // Descontar stock y registrar el detalle con el precio actual del producto
                producto.Stock -= linea.Cantidad;

                pedido.DetallesPedido.Add(new DetallePedido
                {
                    ProductoId = producto.Id,
                    Cantidad = linea.Cantidad,
                    PrecioUnitario = producto.Precio
                });
            }

            // Un solo SaveChanges: pedido, detalles y stock se guardan juntos o no se guarda nada
            _context.Pedidos.Add(pedido);
            await _context.SaveChangesAsync();

            var creado = await ConsultaPedidos().FirstAsync(p => p.Id == pedido.Id);
            return CreatedAtAction(nameof(GetPedido), new { id = pedido.Id }, ToDto(creado));
        }

        // PUT: api/Pedidos/5/estado
        [HttpPut("{id}/estado")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutEstado(int id, PedidoEstadoDTO dto)
        {
            var estadosValidos = new[] { "Pendiente", "Pagado", "Enviado", "Entregado" };
            var estado = estadosValidos.FirstOrDefault(e => e.Equals(dto.Estado, StringComparison.OrdinalIgnoreCase));

            if (estado == null)
            {
                return BadRequest(new { mensaje = "Estado inválido. Valores permitidos: " + string.Join(", ", estadosValidos) });
            }

            var pedido = await _context.Pedidos.FindAsync(id);
            if (pedido == null)
            {
                return NotFound(new { mensaje = "El pedido no fue encontrado." });
            }

            pedido.Estado = estado;
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Pedidos/5 (Eliminar o cancelar pedido y devolver stock)
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var pedido = await _context.Pedidos
                .Include(p => p.DetallesPedido)
                    .ThenInclude(dp => dp.Producto)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (pedido == null)
            {
                return NotFound(new { mensaje = "El pedido no fue encontrado." });
            }

            // Devolver el stock a los productos al cancelar el pedido
            foreach (var detalle in pedido.DetallesPedido)
            {
                if (detalle.Producto != null)
                {
                    detalle.Producto.Stock += detalle.Cantidad;
                }
            }

            _context.DetallesPedido.RemoveRange(pedido.DetallesPedido);
            _context.Pedidos.Remove(pedido);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}
