
using Microsoft.EntityFrameworkCore;
using TiendaApi.Models;

namespace TiendaApi.Data
{
    public class TiendaDbContext : DbContext
    {
        public TiendaDbContext(
            DbContextOptions<TiendaDbContext> options)
            : base(options)
        {
        }

        public DbSet<Cliente> Clientes { get; set; }
        public DbSet<Categoria> Categorias { get; set; }
        public DbSet<Producto> Productos { get; set; }
        public DbSet<Pedido> Pedidos { get; set; }
        public DbSet<DetallePedido> DetallesPedido { get; set; }
        public DbSet<Usuario> Usuarios { get; set; }

        protected override void OnConfiguring(
            DbContextOptionsBuilder optionsBuilder)
        {
            if (!optionsBuilder.IsConfigured)
            {
                optionsBuilder.UseSqlServer(
                    "Server=(localdb)\\MSSQLLocalDB;Database=TiendaDB;Trusted_Connection=True;TrustServerCertificate=True;");
            }
        }

        protected override void OnModelCreating(
            ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Relaciones
            modelBuilder.Entity<Producto>()
                .HasOne(p => p.Categoria)
                .WithMany(c => c.Productos)
                .HasForeignKey(p => p.CategoriaId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Pedido>()
                .HasOne(p => p.Cliente)
                .WithMany(c => c.Pedidos)
                .HasForeignKey(p => p.ClienteId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Pedido)
                .WithMany(p => p.DetallesPedido)
                .HasForeignKey(d => d.PedidoId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<DetallePedido>()
                .HasOne(d => d.Producto)
                .WithMany(p => p.DetallesPedido)
                .HasForeignKey(d => d.ProductoId)
                .OnDelete(DeleteBehavior.Restrict);

            // Índices únicos
            modelBuilder.Entity<Usuario>()
                .HasIndex(u => u.Correo)
                .IsUnique();

            modelBuilder.Entity<Cliente>()
                .HasIndex(c => c.Correo)
                .IsUnique();

            // Precisión de precios
            modelBuilder.Entity<Producto>()
                .Property(p => p.Precio)
                .HasPrecision(18, 2);

            modelBuilder.Entity<DetallePedido>()
                .Property(d => d.PrecioUnitario)
                .HasPrecision(18, 2);

            // Categorías iniciales
            modelBuilder.Entity<Categoria>().HasData(
                new Categoria
                {
                    Id = 1,
                    Nombre = "Electrónica",
                    Descripcion = "Dispositivos electrónicos"
                },
                new Categoria
                {
                    Id = 2,
                    Nombre = "Ropa",
                    Descripcion = "Prendas de vestir"
                },
                new Categoria
                {
                    Id = 3,
                    Nombre = "Hogar",
                    Descripcion = "Productos para el hogar"
                }
            );

            // Productos iniciales
            modelBuilder.Entity<Producto>().HasData(
                new Producto
                {
                    Id = 1,
                    Nombre = "Audífonos",
                    Descripcion = "Audífonos inalámbricos",
                    Precio = 120m,
                    Stock = 20,
                    CategoriaId = 1
                },
                new Producto
                {
                    Id = 2,
                    Nombre = "Teclado",
                    Descripcion = "Teclado USB",
                    Precio = 150m,
                    Stock = 15,
                    CategoriaId = 1
                },
                new Producto
                {
                    Id = 3,
                    Nombre = "Mouse",
                    Descripcion = "Mouse óptico",
                    Precio = 70m,
                    Stock = 25,
                    CategoriaId = 1
                },
                new Producto
                {
                    Id = 4,
                    Nombre = "Camiseta",
                    Descripcion = "Camiseta de algodón",
                    Precio = 60m,
                    Stock = 30,
                    CategoriaId = 2
                },
                new Producto
                {
                    Id = 5,
                    Nombre = "Pantalón",
                    Descripcion = "Pantalón casual",
                    Precio = 140m,
                    Stock = 12,
                    CategoriaId = 2
                },
                new Producto
                {
                    Id = 6,
                    Nombre = "Chaqueta",
                    Descripcion = "Chaqueta ligera",
                    Precio = 220m,
                    Stock = 8,
                    CategoriaId = 2
                },
                new Producto
                {
                    Id = 7,
                    Nombre = "Lámpara",
                    Descripcion = "Lámpara de escritorio",
                    Precio = 95m,
                    Stock = 10,
                    CategoriaId = 3
                },
                new Producto
                {
                    Id = 8,
                    Nombre = "Almohada",
                    Descripcion = "Almohada suave",
                    Precio = 50m,
                    Stock = 18,
                    CategoriaId = 3
                },
                new Producto
                {
                    Id = 9,
                    Nombre = "Taza",
                    Descripcion = "Taza de cerámica",
                    Precio = 25m,
                    Stock = 40,
                    CategoriaId = 3
                },
                new Producto
                {
                    Id = 10,
                    Nombre = "Parlante",
                    Descripcion = "Parlante Bluetooth",
                    Precio = 180m,
                    Stock = 7,
                    CategoriaId = 1
                }
            );
        }
    }
}
