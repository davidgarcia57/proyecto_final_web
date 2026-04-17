// ─── routes/calificaciones.js ─────────────────────────────────────────────────
// Responsabilidad única: CRUD de calificaciones (SOLID - S)
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/calificaciones/alumno/:alumnoId/export/csv
router.get('/alumno/:alumnoId/export/csv', (req, res) => {
  const { alumnoId } = req.params;

  db.query('SELECT * FROM alumnos WHERE id = ?', [alumnoId], (err, alumnos) => {
    if (err || !alumnos.length)
      return res.status(404).json({ error: 'Alumno no encontrado' });

    const a = alumnos[0];

    const sql = `
      SELECT c.calificacion, c.periodo, m.nombre AS materia
      FROM   calificaciones c
      JOIN   materias m ON m.id = c.materia_id
      WHERE  c.alumno_id = ?
      ORDER  BY m.nombre, c.periodo
    `;
    db.query(sql, [alumnoId], (err2, cals) => {
      if (err2) return res.status(500).json({ error: 'Error al exportar' });

      const fecha    = new Date().toLocaleDateString('es-MX');
      const filename = `boletin_${a.nombre.replace(/\s+/g, '_')}.csv`;

      const rows = [
        `Boletín de Calificaciones - EduGest`,
        `Alumno,${a.nombre}`,
        `Grupo,${a.grupo}`,
        `Email,${a.email || ''}`,
        `Teléfono,${a.telefono || ''}`,
        `Fecha de exportación,${fecha}`,
        ``,
        `Materia,Calificación,Periodo`,
        ...cals.map(c => `${c.materia},${parseFloat(c.calificacion).toFixed(1)},${c.periodo}`),
      ];

      if (cals.length) {
        const prom = (cals.reduce((s, c) => s + parseFloat(c.calificacion), 0) / cals.length).toFixed(1);
        rows.push(``, `Promedio General,${prom},`);
      }

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send('\uFEFF' + rows.join('\r\n')); // BOM para compatibilidad con Excel
    });
  });
});

// GET /api/calificaciones/alumno/:alumnoId
router.get('/alumno/:alumnoId', (req, res) => {
  const sql = `
    SELECT c.id, c.calificacion, c.periodo, c.created_at,
           m.id AS materia_id, m.nombre AS materia
    FROM   calificaciones c
    JOIN   materias m ON m.id = c.materia_id
    WHERE  c.alumno_id = ?
    ORDER  BY m.nombre, c.periodo
  `;
  db.query(sql, [req.params.alumnoId], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener calificaciones' });
    res.json(results);
  });
});

// POST /api/calificaciones
router.post('/', (req, res) => {
  const { alumno_id, materia_id, calificacion, periodo } = req.body;

  if (!alumno_id || !materia_id || calificacion == null || !periodo)
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });

  const cal = parseFloat(calificacion);
  if (isNaN(cal) || cal < 0 || cal > 10)
    return res.status(400).json({ error: 'La calificación debe estar entre 0 y 10' });

  // Verificar duplicado alumno+materia+periodo
  db.query(
    'SELECT id FROM calificaciones WHERE alumno_id=? AND materia_id=? AND periodo=?',
    [alumno_id, materia_id, periodo],
    (err, existing) => {
      if (err) return res.status(500).json({ error: 'Error de base de datos' });
      if (existing.length > 0)
        return res.status(400).json({ error: 'Ya existe una calificación para esa materia y periodo' });

      db.query(
        'INSERT INTO calificaciones (alumno_id, materia_id, calificacion, periodo) VALUES (?,?,?,?)',
        [alumno_id, materia_id, cal, periodo],
        (err2, result) => {
          if (err2) return res.status(500).json({ error: 'Error al guardar calificación' });
          res.status(201).json({ mensaje: 'Calificación guardada', id: result.insertId });
        }
      );
    }
  );
});

// PUT /api/calificaciones/:id
router.put('/:id', (req, res) => {
  const { calificacion, periodo } = req.body;

  if (calificacion == null || !periodo)
    return res.status(400).json({ error: 'Calificación y periodo son obligatorios' });

  const cal = parseFloat(calificacion);
  if (isNaN(cal) || cal < 0 || cal > 10)
    return res.status(400).json({ error: 'La calificación debe estar entre 0 y 10' });

  db.query(
    'UPDATE calificaciones SET calificacion=?, periodo=? WHERE id=?',
    [cal, periodo, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al actualizar calificación' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Calificación no encontrada' });
      res.json({ mensaje: 'Calificación actualizada' });
    }
  );
});

// DELETE /api/calificaciones/:id
router.delete('/:id', (req, res) => {
  db.query('DELETE FROM calificaciones WHERE id=?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: 'Error al eliminar calificación' });
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Calificación no encontrada' });
    res.json({ mensaje: 'Calificación eliminada' });
  });
});

module.exports = router;
