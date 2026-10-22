using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using TiendaApi.Data;
using TiendaApi.DTOs;
using TiendaApi.Models;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly TiendaDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(TiendaDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        // POST: api/Auth/registro
        [HttpPost("registro")]
        public async Task<IActionResult> Registro(RegistroDTO dto)
        {
            bool usuarioExiste = await _context.Usuarios.AnyAsync(u => u.Correo == dto.Email);
            if (usuarioExiste)
            {
                return BadRequest(new { mensaje = "El correo electrónico ya está registrado." });
            }

            using var hmac = new HMACSHA512();
            var usuario = new Usuario
            {
                Nombre = dto.NombreUsuario,
                Correo = dto.Email,
                PasswordHash = Convert.ToBase64String(hmac.ComputeHash(Encoding.UTF8.GetBytes(dto.Password))),
                Rol = dto.Rol
            };

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado exitosamente." });
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == dto.Email);
            if (usuario == null)
            {
                return Unauthorized(new { mensaje = "Credenciales inválidas (correo no encontrado)." });
            }

            string token = GenerarTokenJwt(usuario);

            return Ok(new { token, mensaje = "Inicio de sesión exitoso." });
        }

        private string GenerarTokenJwt(Usuario usuario)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, usuario.Id.ToString()),
                new Claim(ClaimTypes.Name, usuario.Nombre),
                new Claim(ClaimTypes.Email, usuario.Correo),
                new Claim(ClaimTypes.Role, string.IsNullOrEmpty(usuario.Rol) ? "Cliente" : usuario.Rol)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddHours(3),
                Issuer = _configuration["Jwt:Issuer"],
                Audience = _configuration["Jwt:Audience"],
                SigningCredentials = creds
            };

            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);

            return tokenHandler.WriteToken(token);
        }
    }
}