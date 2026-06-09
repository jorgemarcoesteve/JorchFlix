const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

router.post('/', autenticar, (req, res) => {
  try {
    const { peticion_id, tipo, descripcion } = req.body;
    if (!tipo || !descripcion) return res.status(400).json({ error: 'Faltan campos requeridos' });
    if (!['playback', 'metadata', 'other'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo debe ser playback, metadata o other' });
    }

    const db = getDatabase();
    db.run(
      'INSERT INTO issues (id, usuario_id, peticion_id, tipo, descripcion) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.usuario.id, peticion_id || null, tipo, descripcion]
    );

    res.status(201).json({ mensaje: 'Reporte enviado' });
  } catch (err) {
    console.error('Error al crear issue:', err.message);
    res.status(500).json({ error: 'Error al reportar' });
  }
});

router.get('/', autenticar, esAdmin, (req, res) => {
  try {
    const db = getDatabase();
    const issues = db.all(
      'SELECT i.*, u.nombre_usuario FROM issues i JOIN usuarios u ON i.usuario_id = u.id ORDER BY i.creado_en DESC'
    );
    res.json(issues);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener issues' });
  }
});

router.put('/:id/resolver', autenticar, esAdmin, (req, res) => {
  try {
    const db = getDatabase();
    db.run('UPDATE issues SET resuelto = 1 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Issue marcado como resuelto' });
  } catch (err) {
    res.status(500).json({ error: 'Error al resolver issue' });
  }
});

module.exports = router;
