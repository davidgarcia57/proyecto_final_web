// ─── routes/materias.js ───────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/materias — lista con conteo de calificaciones asociadas
router.get('/', (req, res) => {
  const sql = `
    SELECT m.id, m.nombre, m.created_at,
           COUNT(c.id) AS total_calificaciones
    FROM   materias m
    LEFT JOIN calificaciones c ON c.materia_id = m.id
    GROUP BY m.id
    ORDER BY m.nombre
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener materias' });
    res.json(results);
  });
});

// GET /api/materias/:id
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM materias WHERE id = ?', [req.params.id], (err, results) => {
    if (err)               return res.status(500).json({ error: 'Error al obtener materia' });
    if (!results.length)   return res.status(404).json({ error: 'Materia no encontrada' });
    res.json(results[0]);
  });
});

// POST /api/materias
router.post('/', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  db.query('INSERT INTO materias (nombre) VALUES (?)', [nombre], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al crear materia' });
    res.status(201).json({ id: result.insertId, nombre, total_calificaciones: 0 });
  });
});

// PUT /api/materias/:id
router.put('/:id', (req, res) => {
  const nombre = (req.body.nombre || '').trim();
  if (!nombre) return res.status(400).json({ error: 'El nombre es requerido' });

  db.query('UPDATE materias SET nombre = ? WHERE id = ?', [nombre, req.params.id], (err, result) => {
    if (err)                     return res.status(500).json({ error: 'Error al actualizar materia' });
    if (!result.affectedRows)    return res.status(404).json({ error: 'Materia no encontrada' });
    res.json({ id: parseInt(req.params.id), nombre });
  });
});

// DELETE /api/materias/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM materias WHERE id = ?', [req.params.id], (err, result) => {
    if (err)                  return res.status(500).json({ error: 'Error al eliminar materia' });
    if (!result.affectedRows) return res.status(404).json({ error: 'Materia no encontrada' });
    res.json({ mensaje: 'Materia eliminada correctamente' });
  });
});

module.exports = router;
