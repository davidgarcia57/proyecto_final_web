const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const path = require('path');
const db = require('./db');

const app = express();

// Middlewares
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'clave_secreta_escuela_2024',
  resave: false,
  saveUninitialized: false
}));

// ─── Middleware de autenticación ────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session.usuario) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

// ─── RUTAS DE AUTENTICACIÓN ──────────────────────────────────────────────────

// Registro de usuario
app.post('/api/registro', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const sql = 'INSERT INTO usuarios (nombre, email, password) VALUES (?, ?, ?)';
    db.query(sql, [nombre, email, hashedPassword], (err) => {
      if (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          return res.status(400).json({ error: 'El email ya está registrado' });
        }
        return res.status(500).json({ error: 'Error al registrar usuario' });
      }
      res.json({ mensaje: 'Usuario registrado correctamente' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña requeridos' });
  }
  const sql = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(sql, [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }
    const usuario = results[0];
    const match = await bcrypt.compare(password, usuario.password);
    if (!match) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }
    req.session.usuario = { id: usuario.id, nombre: usuario.nombre, email: usuario.email };
    res.json({ mensaje: 'Login correcto', usuario: req.session.usuario });
  });
});

// Logout
app.get('/api/logout', (req, res) => {
  req.session.destroy();
  res.json({ mensaje: 'Sesión cerrada' });
});

// Sesión actual
app.get('/api/sesion', (req, res) => {
  if (!req.session.usuario) {
    return res.status(401).json({ autenticado: false });
  }
  res.json({ autenticado: true, usuario: req.session.usuario });
});

// ─── CRUD DE ALUMNOS (rutas protegidas) ────────────────────────────────────

// GET - Obtener todos los alumnos
app.get('/api/alumnos', requireAuth, (req, res) => {
  db.query('SELECT * FROM alumnos ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener alumnos' });
    res.json(results);
  });
});

// GET - Obtener un alumno por ID
app.get('/api/alumnos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM alumnos WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener alumno' });
    if (results.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json(results[0]);
  });
});

// POST - Crear alumno
app.post('/api/alumnos', requireAuth, (req, res) => {
  const { nombre, grupo, email, telefono } = req.body;
  if (!nombre || !grupo) {
    return res.status(400).json({ error: 'Nombre y grupo son obligatorios' });
  }
  const sql = 'INSERT INTO alumnos (nombre, grupo, email, telefono) VALUES (?, ?, ?, ?)';
  db.query(sql, [nombre, grupo, email || null, telefono || null], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear alumno' });
    res.status(201).json({ mensaje: 'Alumno creado', id: result.insertId });
  });
});

// PUT - Actualizar alumno
app.put('/api/alumnos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  const { nombre, grupo, email, telefono } = req.body;
  if (!nombre || !grupo) {
    return res.status(400).json({ error: 'Nombre y grupo son obligatorios' });
  }
  const sql = 'UPDATE alumnos SET nombre = ?, grupo = ?, email = ?, telefono = ? WHERE id = ?';
  db.query(sql, [nombre, grupo, email || null, telefono || null, id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al actualizar alumno' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json({ mensaje: 'Alumno actualizado' });
  });
});

// DELETE - Eliminar alumno
app.delete('/api/alumnos/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM alumnos WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar alumno' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json({ mensaje: 'Alumno eliminado' });
  });
});

// ─── INICIO DEL SERVIDOR ─────────────────────────────────────────────────────
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
