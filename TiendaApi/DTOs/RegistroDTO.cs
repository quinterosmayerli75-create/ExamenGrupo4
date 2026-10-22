using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class RegistroDTO
    {
        [Required]
        public string Nombre { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Correo { get; set; } = string.Empty;

        [Required]
        [MinLength(8)]
        public string Password { get; set; } = string.Empty;
    }
}