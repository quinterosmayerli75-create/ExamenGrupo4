using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;
using TiendaApi.DTOs;
using TiendaApi.Models;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProductosController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public ProductosController(TiendaDbContext context)
        {
            _context = context;
        }

        // GET: api/Productos
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ProductoDTO>>> GetProductos()
        {
            return await _context.Productos
                .Select(p => new ProductoDTO
                {
                    Id = p.Id,
                    Nombre = p.Nombre,
                    Descripcion = p.Descripcion,
                    Precio = p.Precio,
                    Stock = p.Stock,
                    CategoriaId = p.CategoriaId,
                    CategoriaNombre = p.Categoria != null ? p.Categoria.Nombre : null
                })
                .ToListAsync();
        }

        // GET: api/Productos/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ProductoDTO>> GetProducto(int id)
        {
            var producto = await _context.Productos
                .Include(p => p.Categoria)
                .FirstOrDefaultAsync(p => p.Id == id);

            if (producto == null)
            {
                return NotFound(new { mensaje = "El producto no fue encontrado." });
            }

            return new ProductoDTO
            {
                Id = producto.Id,
                Nombre = producto.Nombre,
                Descripcion = producto.Descripcion,
                Precio = producto.Precio,
                Stock = producto.Stock,
                CategoriaId = producto.CategoriaId,
                CategoriaNombre = producto.Categoria?.Nombre
            };
        }

        // POST: api/Productos
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<ProductoDTO>> PostProducto(ProductoDTO dto)
        {
            // Comprobar que la categoría asignada realmente exista en la base de datos
            var categoria = await _context.Categorias.FindAsync(dto.CategoriaId);
            if (categoria == null)
            {
                return BadRequest(new { mensaje = "La categoría especificada no existe." });
            }

            var producto = new Producto
            {
                Nombre = dto.Nombre,
                Descripcion = dto.Descripcion ?? string.Empty,
                Precio = dto.Precio,
                Stock = dto.Stock,
                CategoriaId = dto.CategoriaId
            };

            _context.Productos.Add(producto);
            await _context.SaveChangesAsync();

            dto.Id = producto.Id;
            dto.CategoriaNombre = categoria.Nombre;
            return CreatedAtAction(nameof(GetProducto), new { id = producto.Id }, dto);
        }

        // PUT: api/Productos/5
        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> PutProducto(int id, ProductoDTO dto)
        {
            if (id != dto.Id)
            {
                return BadRequest(new { mensaje = "El ID del producto no coincide." });
            }

            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { mensaje = "El producto no existe." });
            }

            var categoriaExiste = await _context.Categorias.AnyAsync(c => c.Id == dto.CategoriaId);
            if (!categoriaExiste)
            {
                return BadRequest(new { mensaje = "La categoría especificada no existe." });
            }

            producto.Nombre = dto.Nombre;
            producto.Descripcion = dto.Descripcion ?? string.Empty;
            producto.Precio = dto.Precio;
            producto.Stock = dto.Stock;
            producto.CategoriaId = dto.CategoriaId;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Productos/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteProducto(int id)
        {
            var producto = await _context.Productos.FindAsync(id);
            if (producto == null)
            {
                return NotFound(new { mensaje = "El producto no fue encontrado." });
            }

            // Validar que el producto no esté ligado a ningún DetallePedido existente
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