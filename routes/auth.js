// ─── routes/auth.js ───────────────────────────────────────────────────────────
const express = require('express');
const bcrypt  = require('bcrypt');
const router  = express.Router();
const db      = require('../db');

// Registro
router.post('/registro', async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password)
      return res.status(400).json({ error: 'Todos los campos son obligatorios' });

    const rolFinal = ['artista', 'comprador'].includes(rol) ? rol : 'comprador';
    const hash = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO usuarios (nombre, email, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, email, hash, rolFinal],
      (err) => {
        if (err) {
          if (err.code === 'ER_DUP_ENTRY')
            return res.status(400).json({ error: 'El email ya está registrado' });
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }
        res.json({ mensaje: 'Usuario registrado correctamente' });
      }
    );
  } catch {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  db.query('SELECT * FROM usuarios WHERE email = ?', [email], async (err, results) => {
    if (err) return res.status(500).json({ error: 'Error del servidor' });
    if (results.length === 0)
      return res.status(401).json({ error: 'Usuario no encontrado' });

    const usuario = results[0];
    const match   = await bcrypt.compare(password, usuario.password);
    if (!match)
      return res.status(401).json({ error: 'Contraseña incorrecta' });

    req.session.usuario = {
      id:     usuario.id,
      nombre: usuario.nombre,
      email:  usuario.email,
      rol:    usuario.rol
    };
    res.json({ mensaje: 'Login correcto', usuario: req.session.usuario });
  });
});

// Logout
router.get('/logout', (req, res) => {
  req.session.destroy();
  res.json({ mensaje: 'Sesión cerrada' });
});

// Sesión actual
router.get('/sesion', (req, res) => {
  if (!req.session.usuario)
    return res.status(401).json({ autenticado: false });
  res.json({ autenticado: true, usuario: req.session.usuario });
});

module.exports = router;
