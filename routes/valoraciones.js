// ─── routes/valoraciones.js ────────────────────────────────────────────────────
// Sistema de reputación del ERS: compradores valoran pedidos completados.
const express = require('express');
const router  = express.Router();
const db      = require('../db');

function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ── GET /api/valoraciones/servicio/:id — público, valoraciones de un servicio ──
router.get('/servicio/:id', (req, res) => {
  db.query(
    `SELECT v.id, v.estrellas, v.comentario, v.created_at,
            u.nombre AS comprador_nombre
     FROM valoraciones v
     JOIN usuarios u ON u.id = v.comprador_id
     WHERE v.servicio_id = ?
     ORDER BY v.id DESC`,
    [req.params.id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener valoraciones' });
      res.json(results);
    }
  );
});

// ── POST /api/valoraciones — comprador valora un pedido completado ─────────────
router.post('/', requireAuth, (req, res) => {
  const { pedido_id, estrellas, comentario } = req.body;
  const comprador_id = req.session.usuario.id;

  if (!pedido_id || !estrellas)
    return res.status(400).json({ error: 'pedido_id y estrellas son obligatorios' });

  const stars = parseInt(estrellas);
  if (stars < 1 || stars > 5)
    return res.status(400).json({ error: 'Las estrellas deben estar entre 1 y 5' });

  // Verificar que el pedido existe, está completado y pertenece al comprador
  db.query(
    `SELECT p.id, p.servicio_id, p.comprador_id
     FROM pedidos p
     WHERE p.id = ? AND p.comprador_id = ? AND p.estado = 'completado'`,
    [pedido_id, comprador_id],
    (err, pedidos) => {
      if (err)   return res.status(500).json({ error: 'Error al verificar pedido' });
      if (pedidos.length === 0)
        return res.status(403).json({
          error: 'Solo puedes valorar pedidos completados que te pertenecen'
        });

      const { servicio_id } = pedidos[0];

      db.query(
        `INSERT INTO valoraciones (servicio_id, comprador_id, pedido_id, estrellas, comentario)
         VALUES (?, ?, ?, ?, ?)`,
        [servicio_id, comprador_id, pedido_id, stars, comentario || null],
        (e2, result) => {
          if (e2) {
            if (e2.code === 'ER_DUP_ENTRY')
              return res.status(409).json({ error: 'Ya valoraste este pedido' });
            return res.status(500).json({ error: 'Error al guardar valoración' });
          }
          res.status(201).json({ mensaje: 'Valoración guardada', id: result.insertId });
        }
      );
    }
  );
});

// ── DELETE /api/valoraciones/:id — solo el autor puede borrar su valoración ────
router.delete('/:id', requireAuth, (req, res) => {
  db.query(
    'DELETE FROM valoraciones WHERE id = ? AND comprador_id = ?',
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar valoración' });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Valoración no encontrada' });
      res.json({ mensaje: 'Valoración eliminada' });
    }
  );
});

module.exports = router;
