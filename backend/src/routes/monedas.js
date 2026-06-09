const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

router.get('/saldo', autenticar, (req, res) => {
  const db = getDatabase();
  const usuario = db.get('SELECT monedas FROM usuarios WHERE id = ?', [req.usuario.id]);
  res.json({ monedas: usuario.monedas });
});

router.get('/historial', autenticar, (req, res) => {
  const db = getDatabase();
  const transacciones = db.all(
    'SELECT * FROM transacciones WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 100', [req.usuario.id]
  );
  res.json(transacciones);
});

router.post('/otorgar', autenticar, esAdmin, (req, res) => {
  const { usuario_id, cantidad, descripcion } = req.body;

  if (!usuario_id || !cantidad || cantidad <= 0) {
    return res.status(400).json({ error: 'Usuario y cantidad positiva requeridos' });
  }

  const db = getDatabase();
  const usuario = db.get('SELECT * FROM usuarios WHERE id = ?', [usuario_id]);
  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  db.run('UPDATE usuarios SET monedas = monedas + ? WHERE id = ?', [cantidad, usuario_id]);

  db.run(
    'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), usuario_id, cantidad, 'grant', descripcion || 'Otorgado por administrador']
  );

  const actualizado = db.get('SELECT id, nombre_usuario, monedas FROM usuarios WHERE id = ?', [usuario_id]);
  res.json(actualizado);
});

router.get('/clasificacion', autenticar, (req, res) => {
  const db = getDatabase();
  const clasificacion = db.all(
    'SELECT id, nombre_usuario, monedas FROM usuarios ORDER BY monedas DESC LIMIT 20'
  );
  res.json(clasificacion);
});

module.exports = router;
