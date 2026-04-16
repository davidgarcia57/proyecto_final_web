// ─── server.js ────────────────────────────────────────────────────────────────
// Punto de entrada. Monta routers separados por dominio (SOLID - O, S).
// Abierto para agregar nuevos routers sin modificar los existentes.
const express = require('express');
const session = require('express-session');
const path    = require('path');

const authRoutes           = require('./routes/auth');
const alumnosRoutes        = require('./routes/alumnos');
const materiasRoutes       = require('./routes/materias');
const calificacionesRoutes = require('./routes/calificaciones');

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'clave_secreta_escuela_2024',
  resave: false,
  saveUninitialized: false
}));

// ── Middleware de autenticación ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.usuario)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ── Montaje de routers ────────────────────────────────────────────────────────
app.use('/api',                   authRoutes);
app.use('/api/alumnos',           requireAuth, alumnosRoutes);
app.use('/api/materias',          requireAuth, materiasRoutes);
app.use('/api/calificaciones',    requireAuth, calificacionesRoutes);

// ── Inicio del servidor ───────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
