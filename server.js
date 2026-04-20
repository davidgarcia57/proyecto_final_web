// ─── server.js ────────────────────────────────────────────────────────────────
const express = require('express');
const session = require('express-session');
const path    = require('path');

const authRoutes         = require('./routes/auth');
const serviciosRoutes    = require('./routes/servicios');    // GET public, POST/PUT/DELETE protegidos internamente
const pedidosRoutes      = require('./routes/pedidos');
const noticiasRoutes     = require('./routes/noticias');
const artistasRoutes     = require('./routes/artistas');     // perfil publico
const valoracionesRoutes = require('./routes/valoraciones'); // sistema de reputacion
const mensajesRoutes     = require('./routes/mensajes');     // mensajeria por pedido

const app = express();

// ── Middlewares globales ──────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'forge_pixel_secret_2025',
  resave: false,
  saveUninitialized: false
}));

// ── Middleware de autenticacion ───────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.usuario)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api',              authRoutes);
app.use('/api/servicios',    serviciosRoutes);          // GETs publicos, writes verifican auth internamente
app.use('/api/artistas',     artistasRoutes);           // publico
app.use('/api/pedidos',      requireAuth, pedidosRoutes);
app.use('/api/noticias',     noticiasRoutes);           // GET publico; POST/PUT/DELETE verifican auth internamente
app.use('/api/valoraciones', valoracionesRoutes);       // GET publico; POST/DELETE requieren auth
app.use('/api/mensajes',    requireAuth, mensajesRoutes); // GET/POST requieren auth + acceso al pedido

// ── Inicio del servidor ───────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Forge & Pixel corriendo en http://localhost:${PORT}`);
});
