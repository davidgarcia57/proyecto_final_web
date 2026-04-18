// ─── routes/noticias.js ───────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/noticias
router.get('/', (req, res) => {
  db.query('SELECT * FROM noticias ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener noticias' });
    res.json(results);
  });
});

// POST /api/noticias
router.post('/', (req, res) => {
  const { titulo, contenido, imagen_url } = req.body;

  if (!titulo || !contenido)
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });

  db.query(
    'INSERT INTO noticias (titulo, contenido, imagen_url) VALUES (?, ?, ?)',
    [titulo, contenido, imagen_url || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear noticia' });
      res.status(201).json({ mensaje: 'Noticia creada', id: result.insertId });
    }
  );
});

// PUT /api/noticias/:id
router.put('/:id', (req, res) => {
  const { titulo, contenido, imagen_url } = req.body;

  if (!titulo || !contenido)
    return res.status(400).json({ error: 'Título y contenido son obligatorios' });

  db.query(
    'UPDATE noticias SET titulo=?, contenido=?, imagen_url=? WHERE id=?',
    [titulo, contenido, imagen_url || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar noticia' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Noticia no encontrada' });
      res.json({ mensaje: 'Noticia actualizada' });
    }
  );
});

// DELETE /api/noticias/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM noticias WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar noticia' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Noticia no encontrada' });
    res.json({ mensaje: 'Noticia eliminada' });
  });
});

module.exports = router;
