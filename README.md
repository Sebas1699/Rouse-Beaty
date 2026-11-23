# Rouse Beauty

Plantilla inicial de tienda de maquillaje con Next.js App Router, React y TypeScript.

## Requisitos

- Node.js 20.9 o posterior
- npm

## Empezar

```bash
npm install
npm run dev
```

Abre <http://localhost:3000>. Para validar el proyecto:

```bash
npm run typecheck
npm run build
```

## Estructura

- `src/app/(public)`: portada, catálogo, producto y carrito.
- `src/app/(auth)`: acceso y registro.
- `src/app/(user)`: cuenta del cliente.
- `src/app/(admin)`: panel administrativo.
- `src/components`: componentes por área visual.
- `src/context`: estado inicial de cuenta y carrito.
- `src/services`: punto de entrada para peticiones al backend.
- `src/types`: modelos TypeScript compartidos.

El catálogo se carga desde PostgreSQL y el panel admin permite administrar productos, pedidos y acceso de clientes. El carrito se mantiene en memoria del navegador; los pedidos confirmados se guardan en PostgreSQL.

La portada sigue la referencia visual compartida: navegación por categorías, banner, servicios, presentación del estudio y contacto. Las fotos de `public/images/` y los datos de contacto del pie son ejemplos; reemplázalos por las imágenes y datos reales del negocio.

## Sesiones protegidas

`POST /api/auth/register` crea una cuenta de cliente con contraseña hasheada con bcrypt y `POST /api/auth/login` valida las credenciales contra PostgreSQL. Al iniciar sesión se emite una cookie HTTP-only llamada `session`, firmada como JWT HS256 con duración de 8 horas. `src/middleware.ts` comprueba la firma y el rol para proteger rutas; los layouts de perfil y administración vuelven a consultar al usuario en la base de datos para verificar que siga activo y conservar el rol vigente.

Antes de probar rutas protegidas, crea `.env.local` a partir de `.env.example`, configura `DATABASE_URL` y define `AUTH_JWT_SECRET` con una clave aleatoria de al menos 32 bytes. Puedes generarla con `node -e "console.log(require('node:crypto').randomBytes(32).toString('base64url'))"`. No expongas esta clave con el prefijo `NEXT_PUBLIC_` ni la guardes en el repositorio. Sin una sesión válida, `/perfil/*` y `/admin/*` redirigen a `/login`; los usuarios sin rol administrador no pueden entrar a `/admin/*`.

Al iniciar el servidor, Next.js aplica automáticamente las migraciones pendientes antes de aceptar peticiones. Los registros nuevos siempre tienen rol `user`; para conceder administración, cambia el rol del usuario desde un acceso seguro a la base de datos. La recuperación de contraseña del formulario es un enlace de contacto provisional y no restablece credenciales automáticamente.

Para agregar o cambiar tablas, agrega una migración con un identificador nuevo y SQL idempotente al arreglo `migrations` en `src/lib/migrations.ts`. El servidor la ejecutará una sola vez y guardará su identificador en `schema_migrations`. Mantén `database/schema.sql` actualizado para que el seed de usuarios de prueba cree también el esquema vigente. Las migraciones se ejecutan dentro de una transacción y se serializan para evitar que varias instancias las apliquen simultáneamente.

El perfil permite editar nombre, apellidos y dirección, además de agregar referencias de entrega. Los métodos de pago guardan únicamente titular, marca, últimos cuatro dígitos y vencimiento; nunca ingreses ni almacenes el número completo o el CVV. Para procesar pagos reales hace falta integrar un proveedor de pagos seguro. El checkout actual guarda pedidos y descuenta existencias, pero no cobra: el pago queda por coordinar.

El panel `admin` puede crear y editar productos, cambiar precios y existencias, y desactivar/reactivar productos; las ventas muestran pedidos y permiten avanzar su estado o cancelarlos. Al cancelar un pedido se restauran las existencias. La sección de clientes permite consultar cuentas y desactivarlas/reactivarlas; no permite cambiar roles.

### Usuarios de prueba

El seed aplica `database/schema.sql` y crea o actualiza `usuario@gmail.com` con rol `user` y `admin@gmail.com` con rol `admin`; ambos usan la contraseña `123456`. Úsalo solo en una base local/de pruebas. En `.env.local`, configura `DATABASE_URL` y `TEST_DATABASE_URL` con la misma URL de esa base; el script verifica que coincidan para que la aplicación pueda iniciar sesión con esos usuarios.

En PowerShell:

```powershell
$env:ALLOW_TEST_USER_SEED = "1"
npm run db:seed:test-users
Remove-Item Env:ALLOW_TEST_USER_SEED
```

El comando se niega a ejecutarse si `NODE_ENV=production` y requiere una confirmación explícita. No reutilices estas credenciales en producción.

> Next.js 16 marca la convención `middleware.ts` como obsoleta en favor de `proxy.ts`. Se conserva aquí para ajustarse a la estructura solicitada; planifica migrarla al actualizar esta plantilla.

## PostgreSQL

El pool del servidor se crea en `src/lib/db.ts` y se reutiliza durante el desarrollo. Copia `.env.example` a `.env.local`, reemplaza `DATABASE_URL` por la URL de tu instancia PostgreSQL y reinicia el servidor; la inicialización de la base se ejecuta en `src/instrumentation.ts`. No compartas ni subas `.env.local` al repositorio.

La ruta `GET /api/health/database` comprueba la conexión con `SELECT 1`. Responde `200` al conectar y `503` si falta la configuración o la base de datos no está disponible; no devuelve la URL ni credenciales.
