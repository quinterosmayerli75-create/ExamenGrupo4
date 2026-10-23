using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class RegistroDTO
    {
        [Required(ErrorMessage = "El nombre de usuario es obligatorio.")]
        [StringLength(100)]
        public string NombreUsuario { get; set; } = string.Empty;

        [Required(ErrorMessage = "El correo es obligatorio.")]
        [EmailAddress(ErrorMessage = "El correo no tiene un formato válido.")]
        [StringLength(150)]
        public string Email { get; set; } = string.Empty;

        [Required(ErrorMessage = "La contraseña es obligatoria.")]
        [MinLength(6, ErrorMessage = "La contraseña debe tener al menos 6 caracteres.")]
        [StringLength(100)]
        public string Password { get; set; } = string.Empty;
    }
}