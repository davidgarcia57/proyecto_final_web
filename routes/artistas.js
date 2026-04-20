// ─── routes/artistas.js ───────────────────────────────────────────────────────
// Rutas publicas para perfiles de artistas
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/artistas/:id — perfil publico + servicios + rating agregado
router.get('/:id', (req, res) => {
  const artistaId = req.params.id;

  const qUsuario = `
    SELECT u.id, u.nombre, u.bio, u.rol, u.saldo_oro, u.created_at,
           ROUND(COALESCE(AVG(v.estrellas), 0), 1) AS rating_promedio,
           COUNT(DISTINCT v.id)                     AS total_valoraciones,
           COUNT(DISTINCT s.id)                     AS total_servicios
    FROM usuarios u
    LEFT JOIN servicios    s ON s.artista_id = u.id AND s.estado = 'activo'
    LEFT JOIN valoraciones v ON v.servicio_id = s.id
    WHERE u.id = ?
    GROUP BY u.id
  `;

  const qServicios = `
    SELECT s.id, s.titulo, s.descripcion, s.precio, s.estilo, s.complejidad,
           s.imagen_url, s.created_at,
           ROUND(COALESCE(AVG(v.estrellas), 0), 1) AS rating_promedio,
           COUNT(v.id)                              AS total_valoraciones
    FROM servicios s
    LEFT JOIN valoraciones v ON v.servicio_id = s.id
    WHERE s.artista_id = ? AND s.estado = 'activo'
    GROUP BY s.id
    ORDER BY s.id DESC
  `;

  db.query(qUsuario, [artistaId], (e1, r1) => {
    if (e1) return res.status(500).json({ error: 'Error al obtener artista' });
    if (r1.length === 0) return res.status(404).json({ error: 'Artista no encontrado' });

    db.query(qServicios, [artistaId], (e2, r2) => {
      if (e2) return res.status(500).json({ error: 'Error al obtener servicios' });
      res.json({ artista: r1[0], servicios: r2 });
    });
  });
});

module.exports = router;
