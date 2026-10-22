
using Microsoft.AspNetCore.Identity;
using TiendaApi.Models;

namespace TiendaApi.Services
{
    public class PasswordService
    {
        private readonly PasswordHasher<Usuario> _hasher = new();

        public string HashPassword(Usuario usuario, string password)
        {
            return _hasher.HashPassword(usuario, password);
        }

        public bool VerifyPassword(Usuario usuario, string password)
        {
            var resultado = _hasher.VerifyHashedPassword(
                usuario,
                usuario.PasswordHash,
                password);

            return resultado != PasswordVerificationResult.Failed;
        }
    }
}
