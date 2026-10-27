# ExamenGrupo4 - Sistema Multiplataforma

Sistema de tienda con arquitectura **cliente-servidor**. El backend es una API REST desarrollada con **ASP.NET Core Web API**, que será consumida por una aplicación web y una aplicación móvil.

> Estado de las ramas: `backend` contiene la API; `movil` integra esta base con el cliente móvil Expo. El cliente web sigue pendiente.

## Tecnologías

| Componente | Tecnología |
|---|---|
| Lenguaje y framework | C# / .NET 10 / ASP.NET Core Web API |
| Acceso a datos | Entity Framework Core (Code First + migraciones) |
| Base de datos | SQL Server LocalDB (`TiendaDB`) |
| Seguridad | JWT (JSON Web Tokens) con roles |
| Documentación y pruebas | Swagger |
| Cliente móvil | React Native / Expo Go (SDK 57) |



## Estructura del backend

```
TiendaApi/
├── Controllers/   Endpoints de la API (Auth, Categorias, Clientes, Productos, Pedidos, DetallesPedido)
├── Data/          TiendaDbContext y configuración de relaciones
├── DTOs/          Objetos de transferencia de datos con validaciones
├── Migrations/    Migraciones de Entity Framework Core
├── Models/        Entidades (Categoria, Cliente, Producto, Pedido, DetallePedido, Usuario)
├── Services/      PasswordService (hash y verificación de contraseñas)
└── Program.cs     Configuración de la aplicación, JWT y Swagger
database/
└── TiendaDB.sql   Script SQL generado desde las migraciones
```

## Modelo de datos

6 tablas relacionadas:

- **Categorias** 1:N **Productos**
- **Clientes** 1:N **Pedidos**
- **Pedidos** 1:N **DetallesPedido**
- **Productos** 1:N **DetallesPedido**
- Relación **N:M** entre `Pedidos` y `Productos`, resuelta con la tabla intermedia `DetallesPedido`
- **Usuarios** (autenticación y roles)

Datos iniciales: 3 categorías (Electrónica, Ropa, Hogar) y 10 productos de prueba.

## Cómo ejecutar el backend

### Requisitos

- .NET 10 SDK
- SQL Server LocalDB (se instala con Visual Studio o SQL Server Express)
- Herramienta de EF Core: `dotnet tool install --global dotnet-ef`

### 1. Clonar el repositorio

```
git clone <url-del-repositorio>
cd ExamenGrupo4
git checkout backend
```

### 2. Crear la base de datos (elegir una opción)

**Opción A: migraciones (recomendada)**

```
cd TiendaApi
dotnet ef database update
```

**Opción B: script SQL**

1. Crear la base de datos vacía:
   ```sql
   CREATE DATABASE TiendaDB;
   GO
   USE TiendaDB;
   GO
   ```
2. Ejecutar el contenido de `database/TiendaDB.sql` sobre `TiendaDB`.

### 3. Verificar la cadena de conexión

En `TiendaApi/appsettings.json` la conexión se llama `ConexionTienda` y apunta a `(localdb)\MSSQLLocalDB`, base de datos `TiendaDB`. Ajustarla si se usa otro servidor.

### 4. Ejecutar la API

```
cd TiendaApi
dotnet run
```

Abrir Swagger  (el puerto puede variar, se muestra en la consola).

## Autenticación y roles

La API usa **JWT**. Los endpoints, salvo registro e inicio de sesión, exigen un token.

1. Registrar un usuario: `POST /api/Auth/registro`
2. Iniciar sesión: `POST /api/Auth/login` (devuelve el `token`)
3. En Swagger, botón **Authorize**: pegar el token **sin** la palabra "Bearer".

Todo registro público recibe el rol `Cliente`; la app nunca permite que alguien se asigne permisos de administrador. El rol `Admin` se asigna desde la tabla `Usuarios`:

```sql
UPDATE Usuarios SET Rol = 'Admin' WHERE Correo = 'correo@ejemplo.com';
```

Después de cambiar el rol hay que volver a iniciar sesión para obtener un token nuevo.

> La clave JWT de `appsettings.json` es de ejemplo para este trabajo académico. En un entorno real debe guardarse fuera del repositorio (variables de entorno o User Secrets).

## Endpoints

| Recurso | Operación | Endpoint | Acceso |
|---|---|---|---|
| Auth | Registro | `POST /api/Auth/registro` | Público |
| Auth | Login | `POST /api/Auth/login` | Público |
| Categorías | Listar / obtener | `GET /api/Categorias`, `GET /api/Categorias/{id}` | Usuario autenticado |
| Categorías | Crear / editar / eliminar | `POST`, `PUT /{id}`, `DELETE /{id}` | Admin |
| Productos | Listar / obtener | `GET /api/Productos`, `GET /api/Productos/{id}` | Usuario autenticado |
| Productos | Crear / editar / eliminar | `POST`, `PUT /{id}`, `DELETE /{id}` | Admin |
| Clientes | Ver o editar el perfil propio | `GET /api/Clientes/mi-perfil`, `GET /{id}`, `POST`, `PUT /{id}` | Cliente autenticado; limitado a su correo |
| Clientes | Listar todos los perfiles | `GET /api/Clientes` | Admin |
| Clientes | Eliminar | `DELETE /api/Clientes/{id}` | Admin |
| Pedidos | Consultar | `GET`, `GET /{id}` | Admin ve todos; cliente solo los suyos |
| Pedidos | Crear | `POST` | Cliente autenticado; asociado a su propio perfil |
| Pedidos | Cambiar estado | `PUT /api/Pedidos/{id}/estado` | Admin |
| Pedidos | Eliminar (devuelve el stock) | `DELETE /api/Pedidos/{id}` | Admin |
| Detalles de pedido | Listar / obtener (solo lectura) | `GET /api/DetallesPedido`, `GET /{id}` | Admin |

### Ejemplo: crear un pedido

```json
{
  "clienteId": 1,
  "detalles": [
    { "productoId": 1, "cantidad": 2 },
    { "productoId": 3, "cantidad": 1 }
  ]
}
```

El servidor valida que existan el cliente y los productos, comprueba el stock, descuenta el stock, toma el precio actual de cada producto y calcula el total.

## Validaciones y manejo de errores

| Código | Cuándo ocurre |
|---|---|
| `400 Bad Request` | Datos inválidos (campos obligatorios, correo mal formado, precio o stock negativos, stock insuficiente, categoría o producto inexistente) |
| `401 Unauthorized` | Falta el token o es inválido o está vencido |
| `403 Forbidden` | El usuario está autenticado pero no tiene el rol necesario |
| `404 Not Found` | El recurso no existe |
| `409 Conflict` | Correo de cliente duplicado |

## Control de versiones

- Rama `main`: versión integrada.
- Rama `backend`: desarrollo del backend, trabajado en equipo con commits frecuentes.
- Rama `movil`: cliente React Native con Expo Go y la base del backend.

## Cliente móvil

La aplicación Android está en [`mobile/`](mobile/) y consume la API de `TiendaApi`. Para configurar la IP local del backend y abrirla con Expo Go, sigue la [guía de ejecución móvil](mobile/README.md).

