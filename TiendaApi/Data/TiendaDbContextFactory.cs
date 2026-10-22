
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace TiendaApi.Data
{
    public class TiendaDbContextFactory : IDesignTimeDbContextFactory<TiendaDbContext>
    {
        public TiendaDbContext CreateDbContext(string[] args)
        {
            var optionsBuilder = new DbContextOptionsBuilder<TiendaDbContext>();

            optionsBuilder.UseSqlServer(
                "Server=(localdb)\\MSSQLLocalDB;Database=TiendaDB;Trusted_Connection=True;TrustServerCertificate=True;");

            return new TiendaDbContext(optionsBuilder.Options);
        }
    }
}
