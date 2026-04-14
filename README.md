# Sistema de Gestión Escolar

Aplicación web para gestionar alumnos de una escuela. Permite registrar usuarios, iniciar sesión y realizar operaciones CRUD (crear, leer, actualizar y eliminar) sobre el listado de alumnos.

## Tecnologías utilizadas

- **Node.js** + **Express** — servidor backend y API REST
- **MySQL** — base de datos relacional
- **express-session** — manejo de sesiones de usuario
- **bcrypt** — cifrado de contraseñas
- **HTML / CSS / JavaScript** — interfaz de usuario (frontend vanilla)

## Requisitos previos

- Node.js instalado
- MySQL instalado y corriendo (XAMPP, WAMP o similar)

## Instalación y puesta en marcha

1. Clona o descarga el proyecto.

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Crea la base de datos ejecutando el archivo SQL en tu gestor de MySQL (phpMyAdmin o MySQL Workbench etc):

   ```
   database.sql
   ```

4. Verifica que la conexión en `db.js` coincida con tu configuración de MySQL:

   ```js
   host: 'localhost',
   user: 'root',
   password: '',       // cambia si tienes contraseña
   database: 'escuela'
   ```

5. Inicia el servidor:

   ```bash
   npm start
   ```

   O en modo desarrollo (reinicio automático):

   ```bash
   npm run dev
   ```

6. Abre en el navegador: [http://localhost:3000](http://localhost:3000)

## Estructura del proyecto

```
proyecto_final/
├── public/
│   ├── index.html      # Dashboard principal (requiere login)
│   ├── login.html      # Pantalla de inicio de sesión / registro
│   ├── css/
│   │   └── style.css   # Estilos de la aplicación
│   └── js/
│       ├── app.js      # Lógica del dashboard (CRUD de alumnos)
│       └── login.js    # Lógica del formulario de login/registro
├── server.js           # Servidor Express y endpoints de la API
├── db.js               # Conexión a MySQL
├── database.sql        # Script para crear la base de datos
└── package.json
```

## Endpoints de la API

### Autenticación

| Método | Ruta          | Descripción             |
| ------ | ------------- | ----------------------- |
| POST   | /api/registro | Registrar nuevo usuario |
| POST   | /api/login    | Iniciar sesión          |
| GET    | /api/logout   | Cerrar sesión           |
| GET    | /api/sesion   | Verificar sesión activa |

### Alumnos (requieren sesión iniciada)

| Método | Ruta             | Descripción               |
| ------ | ---------------- | ------------------------- |
| GET    | /api/alumnos     | Obtener todos los alumnos |
| GET    | /api/alumnos/:id | Obtener un alumno por ID  |
| POST   | /api/alumnos     | Crear nuevo alumno        |
| PUT    | /api/alumnos/:id | Actualizar alumno         |
| DELETE | /api/alumnos/:id | Eliminar alumno           |

## Usuario de prueba

Puedes crear un usuario desde la pantalla de registro, o usar las credenciales de prueba que vengan precargadas en `database.sql`:

- **Email:** admin@escuela.com
- **Contraseña:** admin123
