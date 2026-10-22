
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;

namespace TiendaApi.Controllers
{
    [ApiController]
    [Route("api/productos-prueba")]
    public class ProductosPruebaController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public ProductosPruebaController(TiendaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var productos = await _context.Productos
                .AsNoTracking()
                .Select(p => new
                {
                    p.Id,
                    p.Nombre,
                    p.Descripcion,
                    p.Precio,
                    p.Stock,
                    p.CategoriaId
                })
                .ToListAsync();

            return Ok(new
            {
                total = productos.Count,
                productos
            });
        }
    }
}
