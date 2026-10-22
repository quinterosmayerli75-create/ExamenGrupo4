using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.Models;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductosController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public ProductosController(TiendaDbContext context)
        {
            _context = context;
        }

        // GET: api/Productos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Producto>>> GetProductos()
        {
            return await _context.Productos
                .Include(p => p.Categoria) // Incluye los datos de la categoría relacionada
                .ToListAsync();
        }

        // GET: api/Productos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Producto>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null)
            {
                return NotFound(new { mensaje = "El producto no fue encontrado." });
            }

            return producto;
        }

        // POST: api/Productos
        [HttpPost]
        public async Task<ActionResult<Producto>> PostProducto(Producto producto)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            // Comprobar que la categoría asignada realmente exista en la base de datos
            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == producto.CategoriaId);
            if (!categoriaExiste)
            {
                return BadRequest(new { mensaje = "La categoría especificada no existe." });
            }

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, producto);
        }

        // PUT: api/Productos/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutProducto(int id, Producto producto)
        {
            if (id != producto.Id)
            {
                return BadRequest(new { mensaje = "El ID del producto no coincide." });
            }

            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == producto.CategoriaId);
            if (!categoriaExiste)
            {
                return BadRequest(new { mensaje = "La categoría especificada no existe." });
            }

            _context.Entry(producto).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Productos.Any(e => e.Id == id))
                {
                    return NotFound(new { mensaje = "El producto no existe." });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/Productos/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { mensaje = "El producto no fue encontrado." });
            }

            // Validar que el producto no esté ligado a ningún DetallePedido existente
            // Cambiar _context.DetallePedido por el nombre que tenga en el DbContext de tu compañera, por ejemplo:
            bool estaEnPedidos = await _context.DetallesPedido.AnyAsync(dp => dp.ProductoId == id);
            if (estaEnPedidos)
            {
                return BadRequest(new { mensaje = "No se puede eliminar el producto porque está asociado a pedidos existentes." });
            }

            _context.Productos.Remove(producto);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}