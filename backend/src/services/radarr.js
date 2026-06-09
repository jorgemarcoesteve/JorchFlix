const axios = require('axios');
const config = require('../config');
const SettingsService = require('./settings');

async function enviarAPelicula(tmdbId, titulo) {
  const url = SettingsService.getWithFallback('radarr_url', config.radarr.url);
  const apiKey = SettingsService.getWithFallback('radarr_api_key', config.radarr.apiKey);
  const rootPath = SettingsService.getWithFallback('radarr_root_path', config.radarr.rootPath);
  const qualityProfileId = parseInt(
    SettingsService.getWithFallback('radarr_quality_profile_id', config.radarr.qualityProfileId),
    10
  );

  if (!url || !apiKey || !rootPath) {
    throw new Error('Radarr no está configurado. Revisa la configuración.');
  }

  const busqueda = await axios.get(`${url}/api/v3/movie/lookup`, {
    params: { term: `tmdb:${tmdbId}` },
    headers: { 'X-Api-Key': apiKey },
  });

  if (!busqueda.data || busqueda.data.length === 0) {
    throw new Error(`No se encontró la película con TMDB ID: ${tmdbId}`);
  }

  const movieData = busqueda.data[0];

  const payload = {
    tmdbId: parseInt(tmdbId, 10),
    title: movieData.title || titulo,
    qualityProfileId,
    rootFolderPath: rootPath,
    monitored: true,
    minimumAvailability: 'announced',
    addOptions: {
      searchForMovie: true,
    },
  };

  const respuesta = await axios.post(`${url}/api/v3/movie`, payload, {
    headers: { 'X-Api-Key': apiKey },
  });

  return respuesta.data;
}

module.exports = { enviarAPelicula };
