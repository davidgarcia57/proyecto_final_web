# Forge & Pixel

Marketplace de pixel art indie que conecta **artistas** (que publican servicios) con **compradores** (desarrolladores indie que contratan). Incluye una sección dedicada al juego propio **Vallecardo**, un RPG medieval 2D de pixel art en desarrollo.

Proyecto universitario para la materia **Aplicaciones Web** — Universidad Tecnológica de Durango.

---

## Stack técnico

| Capa | Tecnología |
|------|-----------|
| Servidor | Node.js + Express |
| Base de datos | MySQL 8+ |
| Auth | express-session + bcrypt |
| Uploads | multer |
| Frontend | HTML / CSS / JS vanilla |
| Puerto | 3000 |

---

## Requisitos previos

- **Node.js** v18 o superior
- **MySQL 8+** corriendo localmente
- (Opcional) **nodemon** para desarrollo con hot-reload

---

## Instalación

```bash
# 1. Clonar o descomprimir el proyecto
cd proyecto_final

# 2. Instalar dependencias
npm install
```

---

## Base de datos

### Crear la base de datos y las tablas

```bash
mysql -u root -p < database.sql
```

El script crea la base de datos `forge_pixel` e inicializa todas las tablas. Es idempotente (`IF NOT EXISTS`), por lo que puede ejecutarse varias veces sin problema.

### Tablas

| Tabla | Descripción |
|-------|-------------|
| `usuarios` | Artistas, compradores y admin. Campo `rol`: `artista` / `comprador` / `admin` |
| `servicios` | Catálogo de trabajos de pixel art |
| `pedidos` | Transacciones entre comprador y artista |
| `mensajes` | Hilo de chat por pedido |
| `valoraciones` | Reseñas de compradores (1–5 estrellas, una por pedido) |
| `noticias` | Blog de actualizaciones de Vallecardo |

### Crear usuario admin

El admin se crea directamente en la base de datos. Primero genera el hash de tu contraseña:

```bash
node -e "require('bcrypt').hash('TU_PASSWORD', 10).then(console.log)"
```

Luego inserta el usuario con el hash obtenido:

```sql
INSERT INTO usuarios (nombre, email, password, rol)
VALUES ('Admin', 'admin@forgeypixel.com', '<HASH>', 'admin');
```

---

## Configuración

El archivo `server.js` usa una clave de sesión hardcodeada. Para producción, cámbiala por una variable de entorno:

```js
// server.js
secret: process.env.SESSION_SECRET || 'forge_pixel_secret_2025'
```

La carpeta de uploads se crea automáticamente al subir el primer archivo:
- **Previews de servicios** → `uploads/previews/`
- **Assets descargables** → `uploads/assets/`

---

## Correr el proyecto

```bash
# Producción
npm start

# Desarrollo (hot-reload con nodemon)
npm run dev
```

Abrir en el navegador: [http://localhost:3000](http://localhost:3000)

---

## Páginas

### Públicas (sin login)

| URL | Descripción |
|-----|-------------|
| `/` | Landing page |
| `/login.html` | Login. Agregar `#registro` en la URL para abrir directamente el tab de registro |
| `/marketplace.html` | Catálogo de servicios con filtros por estilo, complejidad y precio |
| `/vallecardo.html` | Noticias y galería de assets del juego Vallecardo |
| `/artista.html?id=X` | Perfil público de un artista |

### Protegidas (requieren login)

| URL | Rol | Descripción |
|-----|-----|-------------|
| `/dashboard.html` | Cualquiera | Router: redirige al panel según rol |
| `/artista-dashboard.html` | Artista | Panel con estadísticas, HP bars, Oro de Vallecardo |
| `/comprador-dashboard.html` | Comprador | Panel con resumen de compras |
| `/mis-ventas.html` | Artista | Pedidos recibidos con chat y cambio de estado |
| `/mis-compras.html` | Comprador | Historial de compras con chat |
| `/checkout.html?id=X` | Comprador | Checkout de un servicio (tarjeta, PayPal u Oro) |

---

## API — Endpoints

### Auth `/api`

| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | `/api/registro` | Crear cuenta (artista o comprador) |
| POST | `/api/login` | Iniciar sesión |
| GET | `/api/logout` | Cerrar sesión |
| GET | `/api/sesion` | Estado de sesión actual |

### Servicios `/api/servicios`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/servicios` | No | Listar todos (acepta `?estilo=`, `?complejidad=`, `?min=`, `?max=`) |
| GET | `/api/servicios/propios` | Sí | Servicios del artista autenticado |
| GET | `/api/servicios/:id` | No | Detalle de un servicio |
| GET | `/api/servicios/:id/descargar` | Sí | Descargar asset (requiere pedido completado) |
| POST | `/api/servicios` | Artista | Crear servicio |
| PUT | `/api/servicios/:id` | Artista dueño | Editar servicio |
| DELETE | `/api/servicios/:id` | Artista dueño | Eliminar servicio |

### Pedidos `/api/pedidos`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/pedidos` | Admin | Todos los pedidos |
| GET | `/api/pedidos/mis-ventas` | Artista | Pedidos recibidos |
| GET | `/api/pedidos/mis-compras` | Comprador | Pedidos realizados |
| POST | `/api/pedidos` | Comprador | Crear pedido |
| PUT | `/api/pedidos/:id` | Artista dueño | Cambiar estado (premia Oro si pasa a `completado`) |
| DELETE | `/api/pedidos/:id` | Artista o comprador | Eliminar pedido |

### Mensajería `/api/mensajes`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/mensajes/:pedido_id` | Participante | Leer hilo de mensajes |
| POST | `/api/mensajes/:pedido_id` | Participante | Enviar mensaje |

Solo el `comprador` del pedido o el `artista` del servicio asociado pueden leer y escribir mensajes.

### Valoraciones `/api/valoraciones`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/valoraciones/servicio/:id` | No | Reseñas de un servicio |
| POST | `/api/valoraciones` | Comprador | Crear reseña (requiere pedido completado, una por pedido) |
| DELETE | `/api/valoraciones/:id` | Autor | Eliminar su reseña |

### Artistas `/api/artistas`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/artistas/:id` | No | Perfil público + servicios + rating + saldo de oro |

### Noticias `/api/noticias`

| Método | Ruta | Auth | Descripción |
|--------|------|------|-------------|
| GET | `/api/noticias` | No | Listar noticias de Vallecardo |
| GET | `/api/noticias/:id` | No | Detalle de una noticia |
| POST | `/api/noticias` | Admin | Crear noticia |
| PUT | `/api/noticias/:id` | Admin | Editar noticia |
| DELETE | `/api/noticias/:id` | Admin | Eliminar noticia |

---

## Economía: Oro de Vallecardo

Cuando un artista marca un pedido como **completado por primera vez**, recibe automáticamente:

```
Oro ganado = floor(monto / 10)
```

El saldo de oro se acumula en `usuarios.saldo_oro` y se muestra en el dashboard del artista. Los compradores pueden usar su oro como método de pago en el checkout.

---

## Estructura del proyecto

```
proyecto_final/
├── server.js               # Entrada principal, middlewares, montaje de rutas
├── db.js                   # Pool de conexiones MySQL2
├── database.sql            # Script de creación de BD (idempotente)
├── routes/
│   ├── auth.js             # Registro, login, logout, sesión
│   ├── servicios.js        # CRUD servicios + descarga de assets
│   ├── pedidos.js          # CRUD pedidos + lógica de Oro
│   ├── mensajes.js         # Chat por pedido
│   ├── valoraciones.js     # Sistema de reseñas
│   ├── artistas.js         # Perfil público de artistas
│   └── noticias.js         # Blog de Vallecardo
├── public/
│   ├── css/style.css       # Diseño completo (tokens, componentes, temas)
│   ├── js/
│   │   ├── api.js          # Capa de abstracción de fetch (objeto Api)
│   │   ├── settings.js     # Tema claro/oscuro + panel de ajustes
│   │   ├── landing.js      # Solo para index.html
│   │   ├── marketplace-app.js
│   │   ├── artista-dash.js
│   │   ├── comprador-dash.js
│   │   ├── mis-ventas.js
│   │   ├── mis-compras.js
│   │   ├── checkout-app.js
│   │   └── vallecardo-app.js
│   └── images/             # Assets estáticos del juego
└── uploads/
    ├── previews/           # Imágenes de portada de servicios
    └── assets/             # Archivos descargables de servicios
```

---

## Identidad visual

El diseño sigue una estética **Dark Fantasy / RPG de pixel art medieval** — no retro-futurismo ni cyberpunk.

| Token | Valor | Uso |
|-------|-------|-----|
| `--bg` | `#0D0B07` | Fondo principal |
| `--accent` | `#C85A2B` | Ember/forja — artistas, acciones primarias |
| `--cyan` | `#6BAED6` | Acero frío — compradores, info |
| `--yellow` | `#D4961A` | Oro — Vallecardo, advertencias |
| `--green` | `#3D8B5C` | Verde bosque — completado, activo |
| `--rose` | `#F43F5E` | Rosa — eliminar, cancelar, alerta |

**Fuentes:** `Chakra Petch` (body), `VT323` (pixel art / títulos), `Space Mono` (datos / precios)

Soporta tema **oscuro** (default) y **claro** (paleta pergamino), gestionado con `data-theme` en `<html>`.
