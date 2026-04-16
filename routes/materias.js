// ─── routes/materias.js ───────────────────────────────────────────────────────
// Responsabilidad única: catálogo de materias (SOLID - S)
const express = require('express');
const router  = express.Router();
const db      = require('../db');

// GET /api/materias
router.get('/', (req, res) => {
  db.query('SELECT * FROM materias ORDER BY nombre', (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener materias' });
    res.json(results);
  });
});

module.exports = router;
