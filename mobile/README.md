# Cliente móvil

Aplicación de tienda para Android, hecha con React Native y Expo Go. Se conecta a la API ASP.NET Core de `../TiendaApi`.

## Requisitos

- Node.js 22.13 o posterior.
- Expo Go para Android con soporte para Expo SDK 57.
- El backend y el teléfono conectados a la misma red Wi-Fi.

## Ejecutar en Expo Go

1. Inicia la API desde la carpeta raíz del repositorio y haz que escuche en la red local:

   ```powershell
   $env:ASPNETCORE_URLS = "http://0.0.0.0:5194"
   dotnet run --project .\TiendaApi --no-launch-profile
   ```

   Si Windows Firewall pregunta, permite el acceso en la red privada. Expo Go no puede usar `localhost` de la computadora desde el teléfono.

2. En `mobile`, crea el archivo `.env` a partir de `.env.example` y cambia la IP por la IPv4 de la computadora que ejecuta el backend:

   ```env
   EXPO_PUBLIC_API_URL=http://192.168.1.20:5194/api
   ```

   En Windows puedes consultar la IP con `ipconfig`. Para un emulador Android, usa `http://10.0.2.2:5194/api`.

3. Instala las dependencias y abre Expo:

   ```powershell
   cd .\mobile
   npm install
   npx expo start
   ```

4. Escanea el QR con Expo Go. Si la versión de Expo Go instalada no coincide con SDK 57, instala la versión Android de SDK 57 desde [expo.dev/go](https://expo.dev/go).

La primera pantalla permite iniciar sesión o registrar una cuenta. Tras autenticar, la app usa el rol firmado por la API para abrir el espacio correspondiente: los clientes ven el catálogo y sus pedidos; los administradores entran al panel de control.

El panel Admin usa solo las seis tablas existentes (`Usuarios`, `Clientes`, `Categorias`, `Productos`, `Pedidos` y `DetallesPedido`). Permite consultar indicadores de inventario y pedidos, crear y editar productos y categorías, revisar pedidos y actualizar su estado, y consultar perfiles de cliente. La API valida el rol en cada operación de escritura; el registro público siempre asigna `Cliente`.

Para dar acceso Admin a una cuenta, regístrala primero y asígnale el rol desde la base de datos como se explica en la sección **Autenticación y roles** del README de la raíz. Después cierra la sesión en el móvil e inicia sesión de nuevo para obtener un JWT con el nuevo rol.

## Funcionalidades

- Registro e inicio de sesión con JWT; el token se guarda en el almacenamiento seguro del dispositivo.
- Catálogo con búsqueda, categorías, disponibilidad y detalle de producto.
- Carrito con cantidades limitadas por el stock de la API.
- Creación y consulta de pedidos, filtrados por el perfil de cliente asociado al correo de la cuenta.
- Perfil de contacto y cierre de sesión.

El backend maneja por separado `Usuario` y `Cliente`. Al confirmar la primera compra, la aplicación busca el perfil de cliente con el correo de la cuenta; si todavía no existe, lo crea mediante `POST /api/Clientes` y lo usa en el pedido.
