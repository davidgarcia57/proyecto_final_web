# EduGest — Sistema de Gestión Escolar

Aplicación web para la administración de alumnos, materias y calificaciones. Backend en Node.js + Express, frontend en HTML/CSS/JS puro con diseño **Claymorphism**, sidebar de navegación y tema oscuro/claro.

---

## Características

- Autenticación con sesiones y contraseñas hasheadas (bcrypt)
- **Dashboard** con estadísticas en tiempo real: alumnos, grupos activos, altas del mes y promedio general
- **Gestión de Alumnos** — CRUD completo con búsqueda en vivo, paginación y exportación a CSV
- **Gestión de Materias** — CRUD completo con grid de tarjetas y conteo de calificaciones asociadas
- **Detalle de Alumno** — calificaciones por materia y periodo con formulario inline
- **Boletín de Calificaciones** — exportación a PDF (generado en el cliente con jsPDF) y CSV (generado en el servidor)
- Menú lateral (sidebar) con navegación entre Dashboard, Alumnos y Materias
- Tema oscuro / claro / sistema persistente en `localStorage`

---

## Tecnologías

| Capa       | Tecnología                                          |
|------------|-----------------------------------------------------|
| Runtime    | Node.js 18+                                         |
| Framework  | Express 4                                           |
| Base datos | MySQL 8                                             |
| Auth       | express-session + bcrypt                            |
| Frontend   | HTML5 · CSS3 · JavaScript vanilla (sin frameworks)  |
| PDF export | jsPDF + jsPDF-AutoTable (cargados desde CDN)        |
| Estilos    | Sistema de diseño propio — Claymorphism + Dark mode |

---

## Requisitos previos

- Node.js 18 o superior
- MySQL 8 corriendo en `localhost:3306` (XAMPP, WAMP o servicio nativo)
- npm

---

## Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Crear la base de datos
#    Ejecuta el script en tu gestor (phpMyAdmin, MySQL Workbench, CLI):
mysql -u root -p < database.sql

# 3. Crear el primer usuario administrador
#    Genera el hash bcrypt de tu contraseña:
node -e "require('bcrypt').hash('tu_contraseña', 10).then(console.log)"
#    Luego ejecuta en MySQL:
#    INSERT INTO usuarios (nombre, email, password)
#    VALUES ('Admin', 'admin@escuela.com', '<hash_generado>');

# 4. Iniciar el servidor
npm start          # producción
npm run dev        # desarrollo (nodemon — recarga automática)
```

Abre **http://localhost:3000** en el navegador.

---

## Configuración de base de datos

El archivo `db.js` usa estos valores por defecto:

```js
host:     'localhost'
user:     'root'
password: ''          // cambia si tu MySQL tiene contraseña
database: 'escuela'
```

---

## Estructura del proyecto

```
proyecto_final/
│
├── server.js               # Punto de entrada — monta routers y middlewares
├── db.js                   # Conexión MySQL
├── database.sql            # Schema completo + datos iniciales de materias
├── package.json
│
├── routes/
│   ├── auth.js             # Registro, login, logout, sesión
│   ├── alumnos.js          # CRUD + exportar CSV + estadísticas
│   ├── materias.js         # CRUD completo
│   └── calificaciones.js   # CRUD + exportar boletín CSV
│
└── public/
    ├── login.html          # Pantalla de acceso / registro
    ├── index.html          # Dashboard con estadísticas
    ├── alumnos.html        # Tabla de alumnos
    ├── materias.html       # Catálogo de materias
    ├── alumno.html         # Detalle de alumno + calificaciones + exportar
    │
    ├── css/
    │   └── style.css       # Sistema de diseño Claymorphism completo
    │
    ├── js/
    │   ├── api.js          # Capa de abstracción sobre fetch()
    │   ├── settings.js     # Tema dark/light/system + panel de ajustes
    │   ├── app.js          # Orquestador del dashboard
    │   ├── alumnos.js      # Módulo CRUD de alumnos
    │   ├── alumnos-app.js  # Orquestador de la página de alumnos
    │   ├── materias.js     # Módulo CRUD de materias
    │   ├── materias-app.js # Orquestador de la página de materias
    │   ├── alumno.js       # Detalle de alumno + exportar PDF y CSV
    │   └── login.js        # Lógica del formulario de acceso
    │
    └── images/
        └── logo.png
```

---

## Endpoints de la API

Todos los endpoints (excepto auth) requieren sesión iniciada. El servidor responde `401` y el frontend redirige a `/login.html` automáticamente.

### Autenticación

| Método | Ruta            | Descripción                     |
|--------|-----------------|---------------------------------|
| POST   | /api/registro   | Crear cuenta de administrador   |
| POST   | /api/login      | Iniciar sesión                  |
| GET    | /api/logout     | Cerrar sesión                   |
| GET    | /api/sesion     | Verificar sesión activa         |

### Alumnos

| Método | Ruta                    | Descripción                            |
|--------|-------------------------|----------------------------------------|
| GET    | /api/alumnos            | Listar todos los alumnos               |
| GET    | /api/alumnos/stats      | Estadísticas del dashboard             |
| GET    | /api/alumnos/export/csv | Descargar lista completa en CSV        |
| GET    | /api/alumnos/:id        | Obtener un alumno                      |
| POST   | /api/alumnos            | Crear alumno                           |
| PUT    | /api/alumnos/:id        | Actualizar alumno                      |
| DELETE | /api/alumnos/:id        | Eliminar alumno (cascada en califs.)   |

### Materias

| Método | Ruta                | Descripción                              |
|--------|---------------------|------------------------------------------|
| GET    | /api/materias       | Listar materias con conteo de califs.    |
| GET    | /api/materias/:id   | Obtener una materia                      |
| POST   | /api/materias       | Crear materia                            |
| PUT    | /api/materias/:id   | Actualizar materia                       |
| DELETE | /api/materias/:id   | Eliminar materia (cascada en califs.)    |

### Calificaciones

| Método | Ruta                                       | Descripción                          |
|--------|--------------------------------------------|--------------------------------------|
| GET    | /api/calificaciones/alumno/:id             | Calificaciones de un alumno          |
| GET    | /api/calificaciones/alumno/:id/export/csv  | Boletín del alumno en CSV            |
| POST   | /api/calificaciones                        | Registrar calificación               |
| PUT    | /api/calificaciones/:id                    | Actualizar calificación              |
| DELETE | /api/calificaciones/:id                    | Eliminar calificación                |

---

## Exportación del boletín

Desde `/alumno.html?id=N`, el botón **Exportar** ofrece dos formatos:

| Formato | Generado en | Contenido |
|---------|-------------|-----------|
| **PDF** | Cliente (jsPDF) | Cabecera con branding, datos del alumno, tabla de calificaciones con colores por rango y badge de promedio |
| **CSV** | Servidor | Datos del alumno + tabla de calificaciones + promedio, con BOM UTF-8 para compatibilidad con Excel |

---

## Rangos de calificaciones

| Rango   | Color    | Interpretación |
|---------|----------|----------------|
| 9 – 10  | Verde    | Excelente      |
| 7 – 8.9 | Azul     | Bueno          |
| 6 – 6.9 | Amarillo | Suficiente     |
| 0 – 5.9 | Rojo     | Reprobado      |

---

## Usuario de prueba

Registra una cuenta desde `/login.html` (pestaña "Registrarse") o inserta el usuario directamente en la base de datos siguiendo el paso 3 de la instalación.

- **Email sugerido:** admin@escuela.com
- **Contraseña sugerida:** admin123
