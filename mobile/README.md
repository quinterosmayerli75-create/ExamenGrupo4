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

La primera pantalla permite iniciar sesión o registrar una cuenta. Tras autenticar, el catálogo y las categorías se cargan desde la API. Los pedidos se registran en `POST /api/Pedidos`; el backend valida el stock y calcula los importes.

## Funcionalidades

- Registro e inicio de sesión con JWT; el token se guarda en el almacenamiento seguro del dispositivo.
- Catálogo con búsqueda, categorías, disponibilidad y detalle de producto.
- Carrito con cantidades limitadas por el stock de la API.
- Creación y consulta de pedidos, filtrados por el perfil de cliente asociado al correo de la cuenta.
- Perfil de contacto y cierre de sesión.

El backend maneja por separado `Usuario` y `Cliente`. Al confirmar la primera compra, la aplicación busca el perfil de cliente con el correo de la cuenta; si todavía no existe, lo crea mediante `POST /api/Clientes` y lo usa en el pedido.
