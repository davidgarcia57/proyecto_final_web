// ─── routes/alumnos.js ────────────────────────────────────────────────────────
// Responsabilidad única: CRUD de alumnos + CSV export + estadísticas (SOLID - S)
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/alumnos/stats — estadísticas del dashboard
router.get('/stats', (req, res) => {
  const qEsteMes   = `SELECT COUNT(*) AS cnt FROM alumnos
                      WHERE MONTH(created_at)=MONTH(CURDATE())
                        AND YEAR(created_at)=YEAR(CURDATE())`;
  const qPromedio  = `SELECT ROUND(AVG(calificacion),1) AS prom FROM calificaciones`;

  db.query(qEsteMes, (e1, r1) => {
    if (e1) return res.status(500).json({ error: 'Error stats' });
    db.query(qPromedio, (e2, r2) => {
      if (e2) return res.status(500).json({ error: 'Error stats' });
      res.json({
        alumnosEsteMes:  r1[0].cnt,
        promedioGeneral: r2[0].prom !== null ? parseFloat(r2[0].prom) : null
      });
    });
  });
});

// GET /api/alumnos/export/csv — descarga CSV
router.get('/export/csv', (req, res) => {
  db.query('SELECT * FROM alumnos ORDER BY nombre', (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al exportar' });

    const esc  = (v) => `"${String(v || '').replace(/"/g, '""')}"`;
    const head = ['ID', 'Nombre', 'Grupo', 'Email', 'Teléfono', 'Fecha de registro'];
    const body = rows.map(a => [
      a.id,
      esc(a.nombre),
      esc(a.grupo),
      a.email    || '',
      a.telefono || '',
      new Date(a.created_at).toLocaleDateString('es-MX')
    ].join(','));

    const csv = [head.join(','), ...body].join('\r\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="alumnos.csv"');
    res.send('\uFEFF' + csv); // BOM para Excel
  });
});

// GET /api/alumnos
router.get('/', (req, res) => {
  db.query('SELECT * FROM alumnos ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener alumnos' });
    res.json(results);
  });
});

// GET /api/alumnos/:id
router.get('/:id', (req, res) => {
  db.query('SELECT * FROM alumnos WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener alumno' });
    if (results.length === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json(results[0]);
  });
});

// POST /api/alumnos
router.post('/', (req, res) => {
  const { nombre, grupo, email, telefono } = req.body;
  if (!nombre || !grupo)
    return res.status(400).json({ error: 'Nombre y grupo son obligatorios' });

  db.query(
    'INSERT INTO alumnos (nombre, grupo, email, telefono) VALUES (?, ?, ?, ?)',
    [nombre, grupo, email || null, telefono || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al crear alumno' });
      res.status(201).json({ mensaje: 'Alumno creado', id: result.insertId });
    }
  );
});

// PUT /api/alumnos/:id
router.put('/:id', (req, res) => {
  const { nombre, grupo, email, telefono } = req.body;
  if (!nombre || !grupo)
    return res.status(400).json({ error: 'Nombre y grupo son obligatorios' });

  db.query(
    'UPDATE alumnos SET nombre=?, grupo=?, email=?, telefono=? WHERE id=?',
    [nombre, grupo, email || null, telefono || null, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar alumno' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
      res.json({ mensaje: 'Alumno actualizado' });
    }
  );
});

// DELETE /api/alumnos/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM alumnos WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar alumno' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Alumno no encontrado' });
    res.json({ mensaje: 'Alumno eliminado' });
  });
});

module.exports = router;
