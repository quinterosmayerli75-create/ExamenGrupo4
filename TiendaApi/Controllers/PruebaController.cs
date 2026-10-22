
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TiendaApi.Data;

namespace TiendaApi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PruebaController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public PruebaController(TiendaDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            try
            {
                bool conectado = await _context.Database.CanConnectAsync();

                if (!conectado)
                    return StatusCode(503, new
                    {
                        mensaje = "No se pudo conectar a la base de datos."
                    });

                return Ok(new
                {
                    mensaje = "API funcionando y base de datos conectada."
                });
            }
            catch (Exception)
            {
                return StatusCode(503, new
                {
                    mensaje = "Error de conexión con la base de datos."
                });
            }
        }
    }
}
