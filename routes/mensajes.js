// ─── routes/mensajes.js ───────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// Helper: verifica que el usuario autenticado sea comprador o artista del pedido.
// Llama a cb(err, pedido|null) donde pedido = { comprador_id, artista_id } si autorizado.
function verificarAcceso(pedidoId, uid, cb) {
  db.query(
    `SELECT p.comprador_id, s.artista_id
     FROM pedidos p
     JOIN servicios s ON s.id = p.servicio_id
     WHERE p.id = ?`,
    [pedidoId],
    (err, rows) => {
      if (err) return cb(err);
      if (rows.length === 0) return cb(null, null);
      const { comprador_id, artista_id } = rows[0];
      if (uid !== comprador_id && uid !== artista_id) return cb(null, null);
      cb(null, rows[0]);
    }
  );
}

// GET /api/mensajes/:pedido_id
router.get('/:pedido_id', (req, res) => {
  const pedidoId = parseInt(req.params.pedido_id, 10);
  const uid      = req.session.usuario.id;

  verificarAcceso(pedidoId, uid, (err, pedido) => {
    if (err)    return res.status(500).json({ error: 'Error al verificar acceso' });
    if (!pedido) return res.status(403).json({ error: 'Acceso no autorizado' });

    db.query(
      `SELECT m.id, m.pedido_id, m.autor_id, m.contenido, m.created_at,
              u.nombre AS autor_nombre
       FROM mensajes m
       JOIN usuarios u ON u.id = m.autor_id
       WHERE m.pedido_id = ?
       ORDER BY m.created_at ASC`,
      [pedidoId],
      (err2, rows) => {
        if (err2) return res.status(500).json({ error: 'Error al obtener mensajes' });
        res.json(rows);
      }
    );
  });
});

// POST /api/mensajes/:pedido_id
router.post('/:pedido_id', (req, res) => {
  const pedidoId = parseInt(req.params.pedido_id, 10);
  const uid      = req.session.usuario.id;
  const { contenido } = req.body;

  if (!contenido || !String(contenido).trim())
    return res.status(400).json({ error: 'El mensaje no puede estar vacío' });

  const texto = String(contenido).trim().substring(0, 2000);

  verificarAcceso(pedidoId, uid, (err, pedido) => {
    if (err)    return res.status(500).json({ error: 'Error al verificar acceso' });
    if (!pedido) return res.status(403).json({ error: 'Acceso no autorizado' });

    db.query(
      'INSERT INTO mensajes (pedido_id, autor_id, contenido) VALUES (?, ?, ?)',
      [pedidoId, uid, texto],
      (err2, result) => {
        if (err2) return res.status(500).json({ error: 'Error al enviar mensaje' });
        res.status(201).json({ id: result.insertId, mensaje: 'Mensaje enviado' });
      }
    );
  });
});

module.exports = router;
