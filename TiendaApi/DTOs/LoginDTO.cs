using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class LoginDTO
    {
        [Required]
        [EmailAddress]
        public string Correo { get; set; } = string.Empty;

        [Required]
        public string Password { get; set; } = string.Empty;
    }
}