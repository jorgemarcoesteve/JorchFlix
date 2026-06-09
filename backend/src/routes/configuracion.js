const { Router } = require('express');
const SettingsService = require('../services/settings');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', autenticar, esAdmin, (_req, res) => {
  const clavesPermitidas = [
    'radarr_url', 'radarr_api_key', 'radarr_root_path', 'radarr_quality_profile_id',
    'sonarr_url', 'sonarr_api_key', 'sonarr_root_path', 'sonarr_quality_profile_id',
    'tmdb_api_key',
    'webhook_url', 'webhook_activo',
  ];

  const settings = {};
  for (const clave of clavesPermitidas) {
    const valor = SettingsService.get(clave);
    if (valor !== null) {
      settings[clave] = valor;
    }
  }

  res.json(settings);
});

router.put('/', autenticar, esAdmin, (req, res) => {
  const clavesPermitidas = [
    'radarr_url', 'radarr_api_key', 'radarr_root_path', 'radarr_quality_profile_id',
    'sonarr_url', 'sonarr_api_key', 'sonarr_root_path', 'sonarr_quality_profile_id',
    'tmdb_api_key',
    'webhook_url', 'webhook_activo',
  ];

  for (const [clave, valor] of Object.entries(req.body)) {
    if (clavesPermitidas.includes(clave)) {
      SettingsService.set(clave, String(valor));
    }
  }

  res.json({ mensaje: 'Configuración guardada correctamente' });
});

module.exports = router;
