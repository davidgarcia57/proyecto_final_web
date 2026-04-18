// ─── routes/servicios.js ──────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// GET /api/servicios/stats — publico
router.get('/stats', (req, res) => {
  const qServicios = `SELECT COUNT(*) AS total FROM servicios WHERE estado = 'activo'`;
  const qArtistas  = `SELECT COUNT(DISTINCT artista_id) AS total FROM servicios WHERE estado = 'activo'`;
  const qPedidos   = `SELECT COUNT(*) AS total FROM pedidos`;

  db.query(qServicios, (e1, r1) => {
    if (e1) return res.status(500).json({ error: 'Error stats' });
    db.query(qArtistas, (e2, r2) => {
      if (e2) return res.status(500).json({ error: 'Error stats' });
      db.query(qPedidos, (e3, r3) => {
        if (e3) return res.status(500).json({ error: 'Error stats' });
        res.json({
          totalServicios: r1[0].total,
          totalArtistas:  r2[0].total,
          totalPedidos:   r3[0].total
        });
      });
    });
  });
});

// GET /api/servicios — publico
router.get('/', (req, res) => {
  const q = `
    SELECT s.*, u.nombre AS artista_nombre
    FROM servicios s
    JOIN usuarios u ON u.id = s.artista_id
    WHERE s.estado = 'activo'
    ORDER BY s.id DESC
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener servicios' });
    res.json(results);
  });
});

// GET /api/servicios/:id — publico
router.get('/:id', (req, res) => {
  const q = `
    SELECT s.*, u.nombre AS artista_nombre
    FROM servicios s
    JOIN usuarios u ON u.id = s.artista_id
    WHERE s.id = ?
  `;
  db.query(q, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener servicio' });
    if (results.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(results[0]);
  });
});

// POST /api/servicios — requiere autenticacion
router.post('/', requireAuth, (req, res) => {
  const { titulo, descripcion, precio, estilo, imagen_url } = req.body;
  const artista_id = req.session.usuario.id;

  if (!titulo || !descripcion || !precio)
    return res.status(400).json({ error: 'Titulo, descripcion y precio son obligatorios' });

  db.query(
    'INSERT INTO servicios (titulo, descripcion, precio, estilo, artista_id, imagen_url) VALUES (?, ?, ?, ?, ?, ?)',
    [titulo, descripcion, parseFloat(precio), estilo || 'Pixel Art', artista_id, imagen_url || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear servicio' });
      res.status(201).json({ mensaje: 'Servicio creado', id: result.insertId });
    }
  );
});

// PUT /api/servicios/:id — requiere autenticacion
router.put('/:id', requireAuth, (req, res) => {
  const { titulo, descripcion, precio, estilo, imagen_url, estado } = req.body;

  if (!titulo || !descripcion || !precio)
    return res.status(400).json({ error: 'Titulo, descripcion y precio son obligatorios' });

  db.query(
    'UPDATE servicios SET titulo=?, descripcion=?, precio=?, estilo=?, imagen_url=?, estado=? WHERE id=?',
    [titulo, descripcion, parseFloat(precio), estilo || 'Pixel Art', imagen_url || null, estado || 'activo', req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar servicio' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json({ mensaje: 'Servicio actualizado' });
    }
  );
});

// DELETE /api/servicios/:id — requiere autenticacion
router.delete('/:id', requireAuth, (req, res) => {
  db.query('DELETE FROM servicios WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar servicio' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json({ mensaje: 'Servicio eliminado' });
  });
});

module.exports = router;
