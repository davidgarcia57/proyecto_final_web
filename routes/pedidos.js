// ─── routes/pedidos.js ────────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/pedidos/mis-ventas — pedidos de los servicios del artista autenticado
router.get('/mis-ventas', (req, res) => {
  const artista_id = req.session.usuario.id;
  const q = `
    SELECT p.*, s.titulo AS servicio_titulo, u.nombre AS comprador_nombre
    FROM pedidos p
    JOIN servicios s ON s.id = p.servicio_id
    JOIN usuarios  u ON u.id = p.comprador_id
    WHERE s.artista_id = ?
    ORDER BY p.id DESC
  `;
  db.query(q, [artista_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener ventas' });
    res.json(results);
  });
});

// GET /api/pedidos/mis-compras — pedidos del comprador autenticado
router.get('/mis-compras', (req, res) => {
  const comprador_id = req.session.usuario.id;
  const q = `
    SELECT p.*, s.titulo AS servicio_titulo, u.nombre AS artista_nombre
    FROM pedidos p
    JOIN servicios s ON s.id = p.servicio_id
    JOIN usuarios  u ON u.id = s.artista_id
    WHERE p.comprador_id = ?
    ORDER BY p.id DESC
  `;
  db.query(q, [comprador_id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener compras' });
    res.json(results);
  });
});

// GET /api/pedidos — solo admin
router.get('/', (req, res) => {
  if (req.session.usuario.rol !== 'admin')
    return res.status(403).json({ error: 'Acceso restringido' });

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

// PUT /api/pedidos/:id — solo el artista del servicio puede cambiar estado
router.put('/:id', (req, res) => {
  const { estado, notas } = req.body;
  const validos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];

  if (!validos.includes(estado))
    return res.status(400).json({ error: 'Estado no válido' });

  db.query(
    `UPDATE pedidos p
     JOIN servicios s ON s.id = p.servicio_id
     SET p.estado=?, p.notas=?
     WHERE p.id=? AND s.artista_id=?`,
    [estado, notas || null, req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar pedido' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ mensaje: 'Pedido actualizado' });
    }
  );
});

// DELETE /api/pedidos/:id — artista del servicio o comprador del pedido
router.delete('/:id', (req, res) => {
  const uid = req.session.usuario.id;
  db.query(
    `DELETE p FROM pedidos p
     JOIN servicios s ON s.id = p.servicio_id
     WHERE p.id=? AND (p.comprador_id=? OR s.artista_id=?)`,
    [req.params.id, uid, uid],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar pedido' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Pedido no encontrado' });
      res.json({ mensaje: 'Pedido eliminado' });
    }
  );
});

module.exports = router;
