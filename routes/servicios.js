// ─── routes/servicios.js ──────────────────────────────────────────────────────
const express = require('express');
const router  = express.Router();
const db      = require('../db');
const multer  = require('multer');
const path    = require('path');
const crypto  = require('crypto');
const fs      = require('fs');

// ── Directorios de subida ─────────────────────────────────────────────────────
const baseUploads = path.join(__dirname, '..', 'public', 'uploads');
fs.mkdirSync(path.join(baseUploads, 'previews'), { recursive: true });
fs.mkdirSync(path.join(baseUploads, 'assets'),   { recursive: true });

// ── Configuracion de multer ───────────────────────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dest = file.fieldname === 'preview' ? 'previews' : 'assets';
    cb(null, path.join(baseUploads, dest));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uid = crypto.randomBytes(12).toString('hex');
    if (file.fieldname === 'archivo') {
      const base = path.basename(file.originalname, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40);
      cb(null, `${base}_${uid}${ext}`);
    } else {
      cb(null, `${uid}${ext}`);
    }
  }
});

const IMAGENES_PERMITIDAS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'preview') {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!IMAGENES_PERMITIDAS.includes(ext))
        return cb(new Error('La vista previa solo acepta JPG, PNG, GIF o WEBP'));
    }
    cb(null, true);
  }
}).fields([
  { name: 'preview', maxCount: 1 },
  { name: 'archivo', maxCount: 1 }
]);

// ── Auth ──────────────────────────────────────────────────────────────────────
function requireAuth(req, res, next) {
  if (!req.session || !req.session.usuario)
    return res.status(401).json({ error: 'No autorizado' });
  next();
}

// ── GET /api/servicios/stats — publico ────────────────────────────────────────
router.get('/stats', (req, res) => {
  const qServicios = `SELECT COUNT(*) AS total FROM servicios WHERE estado = 'activo'`;
  const qArtistas  = `SELECT COUNT(DISTINCT artista_id) AS total FROM servicios WHERE estado = 'activo'`;
  const qPedidos   = `SELECT COUNT(*) AS total FROM pedidos`;

  db.query(qServicios, (e1, r1) => {
    if (e1) return res.status(500).json({ error: 'Error stats' });
    db.query(qArtistas, (e2, r2) => {
      if (e2) return res.status(500).json({ error: 'Error stats' });
      db.query(qPedidos, (e3, r3) => {
        if (e3) return res.status(500).json({ error: 'Error stats' });
        res.json({
          totalServicios: r1[0].total,
          totalArtistas:  r2[0].total,
          totalPedidos:   r3[0].total
        });
      });
    });
  });
});

// ── GET /api/servicios/propios — servicios del artista autenticado ─────────────
router.get('/propios', requireAuth, (req, res) => {
  const artista_id = req.session.usuario.id;
  db.query(
    `SELECT s.*, u.nombre AS artista_nombre
     FROM servicios s JOIN usuarios u ON u.id = s.artista_id
     WHERE s.artista_id = ? ORDER BY s.id DESC`,
    [artista_id],
    (err, results) => {
      if (err) return res.status(500).json({ error: 'Error al obtener servicios' });
      res.json(results);
    }
  );
});

// ── GET /api/servicios — publico ──────────────────────────────────────────────
router.get('/', (req, res) => {
  const q = `
    SELECT s.id, s.titulo, s.descripcion, s.precio, s.estilo,
           s.imagen_url, s.archivo_url, s.nombre_archivo, s.estado, s.created_at,
           u.id AS artista_id, u.nombre AS artista_nombre
    FROM servicios s
    JOIN usuarios u ON u.id = s.artista_id
    WHERE s.estado = 'activo'
    ORDER BY s.id DESC
  `;
  db.query(q, (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener servicios' });
    res.json(results);
  });
});

// ── GET /api/servicios/:id — publico ──────────────────────────────────────────
router.get('/:id', (req, res) => {
  const q = `
    SELECT s.*, u.nombre AS artista_nombre
    FROM servicios s
    JOIN usuarios u ON u.id = s.artista_id
    WHERE s.id = ?
  `;
  db.query(q, [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: 'Error al obtener servicio' });
    if (results.length === 0) return res.status(404).json({ error: 'Servicio no encontrado' });
    res.json(results[0]);
  });
});

// ── GET /api/servicios/:id/descargar — requiere autenticacion ─────────────────
router.get('/:id/descargar', requireAuth, (req, res) => {
  db.query(
    'SELECT archivo_url, nombre_archivo, titulo FROM servicios WHERE id = ?',
    [req.params.id],
    (err, results) => {
      if (err || results.length === 0)
        return res.status(404).json({ error: 'Servicio no encontrado' });

      const { archivo_url, nombre_archivo, titulo } = results[0];
      if (!archivo_url)
        return res.status(404).json({ error: 'Este servicio no tiene archivo adjunto' });

      const filePath = path.join(__dirname, '..', 'public', archivo_url);
      if (!fs.existsSync(filePath))
        return res.status(404).json({ error: 'Archivo no encontrado en el servidor' });

      const descargaNombre = nombre_archivo || path.basename(archivo_url);
      res.download(filePath, descargaNombre);
    }
  );
});

// ── POST /api/servicios — requiere autenticacion ──────────────────────────────
router.post('/', requireAuth, (req, res) => {
  upload(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const { titulo, descripcion, precio, estilo } = req.body;
    const artista_id = req.session.usuario.id;

    if (!titulo || !descripcion || !precio)
      return res.status(400).json({ error: 'Titulo, descripcion y precio son obligatorios' });

    const imagen_url     = req.files?.preview?.[0]
      ? `/uploads/previews/${req.files.preview[0].filename}` : null;
    const archivo_url    = req.files?.archivo?.[0]
      ? `/uploads/assets/${req.files.archivo[0].filename}`   : null;
    const nombre_archivo = req.files?.archivo?.[0]?.originalname || null;

    db.query(
      `INSERT INTO servicios
         (titulo, descripcion, precio, estilo, artista_id, imagen_url, archivo_url, nombre_archivo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, parseFloat(precio), estilo || 'Pixel Art',
       artista_id, imagen_url, archivo_url, nombre_archivo],
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al crear servicio' });
        res.status(201).json({ mensaje: 'Servicio creado', id: result.insertId });
      }
    );
  });
});

// ── PUT /api/servicios/:id — requiere autenticacion ───────────────────────────
router.put('/:id', requireAuth, (req, res) => {
  upload(req, res, (uploadErr) => {
    if (uploadErr) return res.status(400).json({ error: uploadErr.message });

    const { titulo, descripcion, precio, estilo, estado } = req.body;

    if (!titulo || !descripcion || !precio)
      return res.status(400).json({ error: 'Titulo, descripcion y precio son obligatorios' });

    const sets   = ['titulo=?', 'descripcion=?', 'precio=?', 'estilo=?', 'estado=?'];
    const values = [titulo, descripcion, parseFloat(precio),
                    estilo || 'Pixel Art', estado || 'activo'];

    if (req.files?.preview?.[0]) {
      sets.push('imagen_url=?');
      values.push(`/uploads/previews/${req.files.preview[0].filename}`);
    }
    if (req.files?.archivo?.[0]) {
      sets.push('archivo_url=?', 'nombre_archivo=?');
      values.push(
        `/uploads/assets/${req.files.archivo[0].filename}`,
        req.files.archivo[0].originalname
      );
    }

    values.push(req.params.id, req.session.usuario.id);

    db.query(
      `UPDATE servicios SET ${sets.join(',')} WHERE id=? AND artista_id=?`,
      values,
      (err, result) => {
        if (err) return res.status(500).json({ error: 'Error al actualizar servicio' });
        if (result.affectedRows === 0)
          return res.status(404).json({ error: 'Servicio no encontrado' });
        res.json({ mensaje: 'Servicio actualizado' });
      }
    );
  });
});

// ── DELETE /api/servicios/:id — requiere autenticacion ───────────────────────
router.delete('/:id', requireAuth, (req, res) => {
  db.query(
    'DELETE FROM servicios WHERE id=? AND artista_id=?',
    [req.params.id, req.session.usuario.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Error al eliminar servicio' });
      if (result.affectedRows === 0)
        return res.status(404).json({ error: 'Servicio no encontrado' });
      res.json({ mensaje: 'Servicio eliminado' });
    }
  );
});

module.exports = router;
