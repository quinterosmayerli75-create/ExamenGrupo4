using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using TiendaApi.Data;
using TiendaApi.DTOs;
using TiendaApi.Models;
using TiendaApi.Services;

namespace TiendaApi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly TiendaDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly PasswordService _passwordService;

        public AuthController(TiendaDbContext context, IConfiguration configuration, PasswordService passwordService)
        {
            _context = context;
            _configuration = configuration;
            _passwordService = passwordService;
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

            // El rol lo asigna el servidor: todo registro público es "Cliente"
            var usuario = new Usuario
            {
                Nombre = dto.NombreUsuario,
                Correo = dto.Email,
                Rol = "Cliente"
            };
            usuario.PasswordHash = _passwordService.HashPassword(usuario, dto.Password);

            _context.Usuarios.Add(usuario);
            await _context.SaveChangesAsync();

            return Ok(new { mensaje = "Usuario registrado exitosamente." });
        }

        // POST: api/Auth/login
        [HttpPost("login")]
        public async Task<IActionResult> Login(LoginDTO dto)
        {
            var usuario = await _context.Usuarios.FirstOrDefaultAsync(u => u.Correo == dto.Email);

            // Mismo mensaje para correo inexistente y contraseña incorrecta
            if (usuario == null || !_passwordService.VerifyPassword(usuario, dto.Password))
            {
                return Unauthorized(new { mensaje = "Correo o contraseña incorrectos." });
            }

            string token = GenerarTokenJwt(usuario);

            return Ok(new
            {
                token,
                mensaje = "Inicio de sesión exitoso.",
                usuario = new UsuarioDTO
                {
                    Id = usuario.Id,
                    Nombre = usuario.Nombre,
                    Correo = usuario.Correo,
                    Rol = usuario.Rol
                }
            });
        }

        private string GenerarTokenJwt(Usuario usuario)
        {
            var claims = new List<Claim>
            {
                new Claim(JwtRegisteredClaimNames.Sub, usuario.Id.ToString()),
                new Claim("name", usuario.Nombre),
                new Claim(JwtRegisteredClaimNames.Email, usuario.Correo),
                new Claim("role", string.IsNullOrEmpty(usuario.Rol) ? "Cliente" : usuario.Rol)
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