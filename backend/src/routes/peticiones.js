const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');
const SettingsService = require('../services/settings');

const router = Router();

router.get('/', autenticar, (req, res) => {
  const db = getDatabase();
  const peticiones = db.all(
    'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.creado_en DESC'
  );
  res.json(peticiones);
});

router.get('/mis-peticiones', autenticar, (req, res) => {
  const db = getDatabase();
  const peticiones = db.all(
    'SELECT * FROM peticiones WHERE usuario_id = ? ORDER BY creado_en DESC', [req.usuario.id]
  );
  res.json(peticiones);
});

router.post('/', autenticar, (req, res) => {
  const { tipo, tmdb_id, titulo, descripcion, poster_path } = req.body;

  if (!tipo || !tmdb_id || !titulo) {
    return res.status(400).json({ error: 'Faltan campos requeridos (tipo, tmdb_id, titulo)' });
  }

  if (!['movie', 'series', 'anime'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo debe ser movie, series o anime' });
  }

  const db = getDatabase();

  if (req.usuario.monedas < 1) {
    return res.status(403).json({ error: 'No tienes suficientes JFC. Solicita al administrador que te otorgue más.' });
  }

  const id = uuidv4();
  const peticionId = id;

  db.run(
    'INSERT INTO peticiones (id, usuario_id, tipo, tmdb_id, titulo, descripcion, poster_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, req.usuario.id, tipo, tmdb_id, titulo, descripcion || '', poster_path || '']
  );

  db.run('UPDATE usuarios SET monedas = monedas - 1 WHERE id = ?', [req.usuario.id]);

  db.run(
    'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), req.usuario.id, -1, 'request', `Petición: ${titulo}`, peticionId]
  );

  const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [peticionId]);
  res.status(201).json(peticion);
});

router.put('/:id/aprobar', autenticar, esAdmin, async (req, res) => {
  const db = getDatabase();
  const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.id]);

  if (!peticion) {
    return res.status(404).json({ error: 'Petición no encontrada' });
  }

  if (peticion.estado !== 'pending') {
    return res.status(400).json({ error: 'La petición ya ha sido procesada' });
  }

  db.run(
    "UPDATE peticiones SET estado = 'approved', admin_id = ?, actualizado_en = datetime('now') WHERE id = ?",
    [req.usuario.id, peticion.id]
  );

  const actualizada = db.get(
    'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
    [peticion.id]
  );

  res.json(actualizada);
});

router.put('/:id/rechazar', autenticar, esAdmin, (req, res) => {
  const { nota_admin } = req.body;
  const db = getDatabase();
  const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.id]);

  if (!peticion) {
    return res.status(404).json({ error: 'Petición no encontrada' });
  }

  if (peticion.estado !== 'pending') {
    return res.status(400).json({ error: 'La petición ya ha sido procesada' });
  }

  db.run(
    "UPDATE peticiones SET estado = 'rejected', admin_id = ?, nota_admin = ?, actualizado_en = datetime('now') WHERE id = ?",
    [req.usuario.id, nota_admin || '', peticion.id]
  );

  db.run('UPDATE usuarios SET monedas = monedas + 1 WHERE id = ?', [peticion.usuario_id]);

  db.run(
    'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), peticion.usuario_id, 1, 'refund', `Reembolso por rechazo: ${peticion.titulo}`, peticion.id]
  );

  const actualizada = db.get(
    'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
    [peticion.id]
  );

  res.json(actualizada);
});

module.exports = router;
