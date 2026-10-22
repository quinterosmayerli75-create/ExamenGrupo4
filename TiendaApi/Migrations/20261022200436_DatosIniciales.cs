using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace TiendaApi.Migrations
{
    /// <inheritdoc />
    public partial class DatosIniciales : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.InsertData(
                table: "Categorias",
                columns: new[] { "Id", "Descripcion", "Nombre" },
                values: new object[,]
                {
                    { 1, "Dispositivos electrónicos", "Electrónica" },
                    { 2, "Prendas de vestir", "Ropa" },
                    { 3, "Productos para el hogar", "Hogar" }
                });

            migrationBuilder.InsertData(
                table: "Productos",
                columns: new[] { "Id", "CategoriaId", "Descripcion", "Nombre", "Precio", "Stock" },
                values: new object[,]
                {
                    { 1, 1, "Audífonos inalámbricos", "Audífonos", 120m, 20 },
                    { 2, 1, "Teclado USB", "Teclado", 150m, 15 },
                    { 3, 1, "Mouse óptico", "Mouse", 70m, 25 },
                    { 4, 2, "Camiseta de algodón", "Camiseta", 60m, 30 },
                    { 5, 2, "Pantalón casual", "Pantalón", 140m, 12 },
                    { 6, 2, "Chaqueta ligera", "Chaqueta", 220m, 8 },
                    { 7, 3, "Lámpara de escritorio", "Lámpara", 95m, 10 },
                    { 8, 3, "Almohada suave", "Almohada", 50m, 18 },
                    { 9, 3, "Taza de cerámica", "Taza", 25m, 40 },
                    { 10, 1, "Parlante Bluetooth", "Parlante", 180m, 7 }
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 3);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 5);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 6);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 7);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 8);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 9);

            migrationBuilder.DeleteData(
                table: "Productos",
                keyColumn: "Id",
                keyValue: 10);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 1);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 2);

            migrationBuilder.DeleteData(
                table: "Categorias",
                keyColumn: "Id",
                keyValue: 3);
        }
    }
}
