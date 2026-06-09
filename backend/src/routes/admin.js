const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');
const config = require('../config');
const SettingsService = require('../services/settings');

const router = Router();

function auditLog(db, adminId, accion, detalle, usuarioAfectado) {
  db.run(
    'INSERT INTO audit_log (id, admin_id, accion, detalle, usuario_afectado) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), adminId, accion, detalle || '', usuarioAfectado || '']
  );
}

router.get('/stats', autenticar, esAdmin, (req, res) => {
  try {
    const db = getDatabase();
    const pendientes = db.get("SELECT COUNT(*) as count FROM peticiones WHERE estado = 'pending'")?.count || 0;
    const usuarios = db.get('SELECT COUNT(*) as count FROM usuarios')?.count || 0;
    const totalJFC = db.get('SELECT COALESCE(SUM(monedas), 0) as total FROM usuarios')?.total || 0;
    const completadas = db.get("SELECT COUNT(*) as count FROM peticiones WHERE estado = 'completed'")?.count || 0;
    const rechazadas = db.get("SELECT COUNT(*) as count FROM peticiones WHERE estado = 'rejected'")?.count || 0;
    const totalPeticiones = db.get('SELECT COUNT(*) as count FROM peticiones')?.count || 0;
    const peticionesHoy = db.get("SELECT COUNT(*) as count FROM peticiones WHERE date(creado_en) = date('now')")?.count || 0;
    const notisNoLeidas = db.get('SELECT COUNT(*) as count FROM notificaciones WHERE leida = 0')?.count || 0;

    res.json({ pendientes, usuarios, totalJFC, completadas, rechazadas, totalPeticiones, peticionesHoy, notisNoLeidas });
  } catch (err) {
    console.error('Error al obtener stats:', err.message);
    res.status(500).json({ error: 'Error al obtener estadísticas' });
  }
});

router.get('/health', autenticar, esAdmin, async (req, res) => {
  const resultados = {};

  const checkService = async (nombre, url, apiKey, headerName) => {
    if (!url || !apiKey) return { estado: 'no configurado', url };
    try {
      await axios.get(`${url}/api/v3/system/status`, {
        headers: { [headerName]: apiKey },
        timeout: 5000,
      });
      return { estado: 'ok', url };
    } catch (err) {
      return { estado: 'error', url, error: err.message };
    }
  };

  const [jellyfin, radarr, sonarr, tmdb] = await Promise.all([
    (async () => {
      if (!config.jellyfin.url || !config.jellyfin.apiKey) return { estado: 'no configurado' };
      try {
        await axios.get(`${config.jellyfin.url}/System/Info`, {
          headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
          timeout: 5000,
        });
        return { estado: 'ok' };
      } catch (err) {
        return { estado: 'error', error: err.message };
      }
    })(),
    checkService('radarr',
      SettingsService.getWithFallback('radarr_url', config.radarr.url),
      SettingsService.getWithFallback('radarr_api_key', config.radarr.apiKey),
      'X-Api-Key'),
    checkService('sonarr',
      SettingsService.getWithFallback('sonarr_url', config.sonarr.url),
      SettingsService.getWithFallback('sonarr_api_key', config.sonarr.apiKey),
      'X-Api-Key'),
    (async () => {
      const key = SettingsService.getWithFallback('tmdb_api_key', config.tmdb.apiKey);
      if (!key) return { estado: 'no configurado' };
      try {
        await axios.get('https://api.themoviedb.org/3/configuration', {
          params: { api_key: key },
          timeout: 5000,
        });
        return { estado: 'ok' };
      } catch (err) {
        return { estado: 'error', error: err.message };
      }
    })(),
  ]);

  res.json({ jellyfin, radarr, sonarr, tmdb });
});

router.put('/usuarios/:id/rol', autenticar, esAdmin, (req, res) => {
  try {
    const { es_admin } = req.body;
    const db = getDatabase();
    const usuario = db.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);

    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    if (usuario.id === req.usuario.id) return res.status(400).json({ error: 'No puedes cambiarte el rol a ti mismo' });

    db.run('UPDATE usuarios SET es_admin = ? WHERE id = ?', [es_admin ? 1 : 0, usuario.id]);
    auditLog(db, req.usuario.id, es_admin ? 'promover' : 'degradar', `Usuario: ${usuario.nombre_usuario}`, usuario.id);

    res.json({ mensaje: `Usuario ${es_admin ? 'promovido a' : 'degradado de'} admin correctamente` });
  } catch (err) {
    console.error('Error al cambiar rol:', err.message);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
});

router.get('/audit-log', autenticar, esAdmin, (req, res) => {
  try {
    const db = getDatabase();
    const logs = db.all(
      'SELECT a.*, u.nombre_usuario as admin_nombre FROM audit_log a LEFT JOIN usuarios u ON a.admin_id = u.id ORDER BY a.creado_en DESC LIMIT 100'
    );
    res.json(logs);
  } catch (err) {
    console.error('Error al obtener audit log:', err.message);
    res.status(500).json({ error: 'Error al obtener registro de actividades' });
  }
});

module.exports = router;
