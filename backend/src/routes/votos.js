const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar } = require('../middleware/auth');

const router = Router();

router.post('/:peticionId/votar', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.peticionId]);
    if (!peticion) return res.status(404).json({ error: 'Petición no encontrada' });

    const existente = db.get('SELECT * FROM votos WHERE usuario_id = ? AND peticion_id = ?',
      [req.usuario.id, req.params.peticionId]);

    if (existente) {
      db.run('DELETE FROM votos WHERE id = ?', [existente.id]);
      return res.json({ votado: false, mensaje: 'Voto eliminado' });
    }

    db.run('INSERT INTO votos (id, usuario_id, peticion_id) VALUES (?, ?, ?)',
      [uuidv4(), req.usuario.id, req.params.peticionId]);

    res.json({ votado: true, mensaje: 'Voto registrado' });
  } catch (err) {
    console.error('Error al votar:', err.message);
    res.status(500).json({ error: 'Error al votar' });
  }
});

router.get('/:peticionId/votos', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const total = db.get('SELECT COUNT(*) as count FROM votos WHERE peticion_id = ?',
      [req.params.peticionId])?.count || 0;
    const yaVoto = db.get('SELECT id FROM votos WHERE usuario_id = ? AND peticion_id = ?',
      [req.usuario.id, req.params.peticionId]);
    res.json({ total, ya_voto: !!yaVoto });
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener votos' });
  }
});

module.exports = router;
