using System.ComponentModel.DataAnnotations;

namespace TiendaApi.DTOs
{
    public class ProductoDTO
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(150)]
        public string Nombre { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Descripcion { get; set; }

        [Range(typeof(decimal), "0.01", "999999999", ErrorMessage = "El precio debe ser mayor a 0.")]
        public decimal Precio { get; set; }

        [Range(0, int.MaxValue, ErrorMessage = "El stock no puede ser negativo.")]
        public int Stock { get; set; }

        [Range(1, int.MaxValue, ErrorMessage = "Debe indicar una categoría válida.")]
        public int CategoriaId { get; set; }

        // Solo de salida: el nombre de la categoría (se ignora al crear o editar)
        public string? CategoriaNombre { get; set; }
    }
}