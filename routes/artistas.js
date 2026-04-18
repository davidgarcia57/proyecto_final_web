// ─── routes/artistas.js ───────────────────────────────────────────────────────
// Rutas publicas para perfiles de artistas
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/artistas/:id — perfil publico + servicios del artista
router.get('/:id', (req, res) => {
  const qUsuario = `
    SELECT id, nombre, bio, rol, created_at
    FROM usuarios
    WHERE id = ?
  `;
  const qServicios = `
    SELECT id, titulo, descripcion, precio, estilo, imagen_url, created_at
    FROM servicios
    WHERE artista_id = ? AND estado = 'activo'
    ORDER BY id DESC
  `;

  db.query(qUsuario, [req.params.id], (e1, r1) => {
    if (e1) return res.status(500).json({ error: 'Error al obtener artista' });
    if (r1.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });

    db.query(qServicios, [req.params.id], (e2, r2) => {
      if (e2) return res.status(500).json({ error: 'Error al obtener servicios' });
      res.json({ artista: r1[0], servicios: r2 });
    });
  });
});

module.exports = router;
