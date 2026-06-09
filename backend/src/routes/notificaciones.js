const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const notis = db.all(
      'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY creado_en DESC LIMIT 50',
      [req.usuario.id]
    );
    const noLeidas = db.get(
      'SELECT COUNT(*) as count FROM notificaciones WHERE usuario_id = ? AND leida = 0',
      [req.usuario.id]
    );
    res.json({ notificaciones: notis, no_leidas: noLeidas.count });
  } catch (err) {
    console.error('Error al obtener notificaciones:', err.message);
    res.status(500).json({ error: 'Error al obtener notificaciones' });
  }
});

router.put('/leer-todas', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    db.run('UPDATE notificaciones SET leida = 1 WHERE usuario_id = ? AND leida = 0', [req.usuario.id]);
    res.json({ mensaje: 'Todas las notificaciones marcadas como leídas' });
  } catch (err) {
    console.error('Error al marcar notificaciones:', err.message);
    res.status(500).json({ error: 'Error al actualizar notificaciones' });
  }
});

router.put('/:id/leer', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const noti = db.get('SELECT * FROM notificaciones WHERE id = ?', [req.params.id]);
    if (!noti) return res.status(404).json({ error: 'Notificación no encontrada' });
    if (noti.usuario_id !== req.usuario.id) return res.status(403).json({ error: 'No autorizado' });

    db.run('UPDATE notificaciones SET leida = 1 WHERE id = ?', [req.params.id]);
    res.json({ mensaje: 'Notificación marcada como leída' });
  } catch (err) {
    console.error('Error al marcar notificación:', err.message);
    res.status(500).json({ error: 'Error al actualizar notificación' });
  }
});

module.exports = router;
