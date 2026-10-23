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
    public class ClientesController : ControllerBase
    {
        private readonly TiendaDbContext _context;

        public ClientesController(TiendaDbContext context)
        {
            _context = context;
        }

        // GET: api/Clientes
        [HttpGet]
        public async Task<ActionResult<IEnumerable<ClienteDTO>>> GetClientes()
        {
            return await _context.Clientes
                .Select(c => new ClienteDTO
                {
                    Id = c.Id,
                    Nombre = c.Nombre,
                    Correo = c.Correo,
                    Telefono = c.Telefono
                })
                .ToListAsync();
        }

        // GET: api/Clientes/5
        [HttpGet("{id}")]
        public async Task<ActionResult<ClienteDTO>> GetCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);

            if (cliente == null)
            {
                return NotFound(new { mensaje = "El cliente no fue encontrado." });
            }

            return new ClienteDTO
            {
                Id = cliente.Id,
                Nombre = cliente.Nombre,
                Correo = cliente.Correo,
                Telefono = cliente.Telefono
            };
        }

        // POST: api/Clientes
        [HttpPost]
        public async Task<ActionResult<ClienteDTO>> PostCliente(ClienteDTO dto)
        {
            bool correoExiste = await _context.Clientes.AnyAsync(c => c.Correo == dto.Correo);
            if (correoExiste)
            {
                return Conflict(new { mensaje = "Ya existe un cliente con ese correo." });
            }
            var cliente = new Cliente
            {
                Nombre = dto.Nombre,
                Correo = dto.Correo,
                Telefono = dto.Telefono ?? string.Empty
            };

            _context.Clientes.Add(cliente);
            await _context.SaveChangesAsync();

            dto.Id = cliente.Id;
            return CreatedAtAction(nameof(GetCliente), new { id = cliente.Id }, dto);
        }

        // PUT: api/Clientes/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCliente(int id, ClienteDTO dto)
        {
            if (id != dto.Id)
            {
                return BadRequest(new { mensaje = "El ID del cliente no coincide." });
            }

            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { mensaje = "El cliente no existe." });
            }
            bool correoEnUso = await _context.Clientes.AnyAsync(c => c.Correo == dto.Correo && c.Id != id);
            if (correoEnUso)
            {
                return Conflict(new { mensaje = "Ya existe otro cliente con ese correo." });
            }

            cliente.Nombre = dto.Nombre;
            cliente.Correo = dto.Correo;
            cliente.Telefono = dto.Telefono ?? string.Empty;

            await _context.SaveChangesAsync();

            return NoContent();
        }

        // DELETE: api/Clientes/5
        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteCliente(int id)
        {
            var cliente = await _context.Clientes.FindAsync(id);
            if (cliente == null)
            {
                return NotFound(new { mensaje = "El cliente no fue encontrado." });
            }

            // Validar si el cliente tiene pedidos registrados antes de eliminarlo
            bool tienePedidos = await _context.Pedidos.AnyAsync(p => p.ClienteId == id);
            if (tienePedidos)
            {
                return BadRequest(new { mensaje = "No se puede eliminar el cliente porque tiene pedidos registrados." });
            }

            _context.Clientes.Remove(cliente);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}