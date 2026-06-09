const { Router } = require('express');
const axios = require('axios');
const SettingsService = require('../services/settings');
const config = require('../config');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

const CLAVES_PERMITIDAS = [
  'radarr_url', 'radarr_api_key', 'radarr_root_path', 'radarr_quality_profile_id',
  'sonarr_url', 'sonarr_api_key', 'sonarr_root_path', 'sonarr_quality_profile_id',
  'tmdb_api_key',
  'webhook_url', 'webhook_activo',
];

router.get('/', autenticar, esAdmin, (_req, res) => {
  const settings = {};
  for (const clave of CLAVES_PERMITIDAS) {
    const valor = SettingsService.get(clave);
    if (valor !== null) {
      settings[clave] = valor;
    }
  }
  res.json(settings);
});

router.put('/', autenticar, esAdmin, (req, res) => {
  for (const [clave, valor] of Object.entries(req.body)) {
    if (CLAVES_PERMITIDAS.includes(clave)) {
      SettingsService.set(clave, String(valor));
    }
  }
  res.json({ mensaje: 'Configuración guardada correctamente' });
});

router.get('/radarr-opciones', autenticar, esAdmin, async (_req, res) => {
  const url = SettingsService.getWithFallback('radarr_url', config.radarr.url);
  const apiKey = SettingsService.getWithFallback('radarr_api_key', config.radarr.apiKey);

  if (!url || !apiKey) {
    return res.json({ rootFolders: [], qualityProfiles: [] });
  }

  try {
    const [rootFolders, qualityProfiles] = await Promise.all([
      axios.get(`${url}/api/v3/rootFolder`, { headers: { 'X-Api-Key': apiKey } }),
      axios.get(`${url}/api/v3/qualityProfile`, { headers: { 'X-Api-Key': apiKey } }),
    ]);

    res.json({
      rootFolders: rootFolders.data.map((f) => ({ id: f.id, path: f.path })),
      qualityProfiles: qualityProfiles.data.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (err) {
    console.error('Error al obtener opciones de Radarr:', err.message);
    res.json({ rootFolders: [], qualityProfiles: [] });
  }
});

router.get('/sonarr-opciones', autenticar, esAdmin, async (_req, res) => {
  const url = SettingsService.getWithFallback('sonarr_url', config.sonarr.url);
  const apiKey = SettingsService.getWithFallback('sonarr_api_key', config.sonarr.apiKey);

  if (!url || !apiKey) {
    return res.json({ rootFolders: [], qualityProfiles: [] });
  }

  try {
    const [rootFolders, qualityProfiles] = await Promise.all([
      axios.get(`${url}/api/v3/rootFolder`, { headers: { 'X-Api-Key': apiKey } }),
      axios.get(`${url}/api/v3/qualityProfile`, { headers: { 'X-Api-Key': apiKey } }),
    ]);

    res.json({
      rootFolders: rootFolders.data.map((f) => ({ id: f.id, path: f.path })),
      qualityProfiles: qualityProfiles.data.map((p) => ({ id: p.id, name: p.name })),
    });
  } catch (err) {
    console.error('Error al obtener opciones de Sonarr:', err.message);
    res.json({ rootFolders: [], qualityProfiles: [] });
  }
});

module.exports = router;
