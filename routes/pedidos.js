// ─── routes/pedidos.js ────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/pedidos
router.get('/', (req, res) => {
  const q = `
    SELECT p.*,
           s.titulo  AS servicio_titulo,
           u.nombre  AS comprador_nombre
    FROM pedidos p
    JOIN servicios s ON s.id = p.servicio_id
    JOIN usuarios  u ON u.id = p.comprador_id
    ORDER BY p.id DESC
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener pedidos' });
    res.json(results);
  });
});

// POST /api/pedidos
router.post('/', (req, res) => {
  const { servicio_id, monto, notas } = req.body;
  const comprador_id = req.session.usuario.id;

  if (!servicio_id || !monto)
    return res.status(400).json({ error: 'Servicio y monto son obligatorios' });

  db.query(
    'INSERT INTO pedidos (servicio_id, comprador_id, monto, notas) VALUES (?, ?, ?, ?)',
    [servicio_id, comprador_id, parseFloat(monto), notas || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear pedido' });
      res.status(201).json({ mensaje: 'Pedido creado', id: result.insertId });
    }
  );
});

// PUT /api/pedidos/:id — actualizar estado y notas
router.put('/:id', (req, res) => {
  const { estado, notas } = req.body;
  const validos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

  if (!validos.includes(estado))
    return res.status(400).json({ error: 'Estado no válido' });

  db.query(
    'UPDATE pedidos SET estado=?, notas=? WHERE id=?',
    [estado, notas || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar pedido' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ mensaje: 'Pedido actualizado' });
    }
  );
});

// DELETE /api/pedidos/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM pedidos WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar pedido' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
    res.json({ mensaje: 'Pedido eliminado' });
  });
});

module.exports = router;
