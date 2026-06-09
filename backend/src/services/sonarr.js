const axios = require('axios');
const config = require('../config');
const SettingsService = require('./settings');

async function obtenerTvdbId(tmdbId) {
  const apiKey = SettingsService.getWithFallback('tmdb_api_key', config.tmdb.apiKey);
  if (!apiKey) {
    throw new Error('TMDB API Key no configurada');
  }

  const { data } = await axios.get(`https://api.themoviedb.org/3/tv/${tmdbId}/external_ids`, {
    params: { api_key: apiKey },
  });

  if (!data.tvdb_id) {
    throw new Error(`No se encontró TVDB ID para TMDB ID: ${tmdbId}`);
  }

  return data.tvdb_id;
}

async function enviarASerie(tmdbId, titulo, temporadasSeleccionadas = null) {
  const url = SettingsService.getWithFallback('sonarr_url', config.sonarr.url);
  const apiKey = SettingsService.getWithFallback('sonarr_api_key', config.sonarr.apiKey);
  const rootPath = SettingsService.getWithFallback('sonarr_root_path', config.sonarr.rootPath);
  const qualityProfileId = parseInt(
    SettingsService.getWithFallback('sonarr_quality_profile_id', config.sonarr.qualityProfileId),
    10
  );

  if (!url || !apiKey || !rootPath) {
    throw new Error('Sonarr no está configurado. Revisa la configuración.');
  }

  const tvdbId = await obtenerTvdbId(tmdbId);

  const busqueda = await axios.get(`${url}/api/v3/series/lookup`, {
    params: { term: `tvdb:${tvdbId}` },
    headers: { 'X-Api-Key': apiKey },
  });

  if (!busqueda.data || busqueda.data.length === 0) {
    throw new Error(`No se encontró la serie con TVDB ID: ${tvdbId}`);
  }

  const seriesData = busqueda.data[0];

  const todasSeasons = seriesData.seasons || [];
  const seasonsAmonitorear = temporadasSeleccionadas && temporadasSeleccionadas.length > 0
    ? todasSeasons.map(s => ({
        seasonNumber: s.seasonNumber,
        monitored: temporadasSeleccionadas.includes(s.seasonNumber),
      }))
    : todasSeasons.map(s => ({
        seasonNumber: s.seasonNumber,
        monitored: s.seasonNumber > 0,
      }));

  const payload = {
    tvdbId,
    title: seriesData.title || titulo,
    qualityProfileId,
    rootFolderPath: rootPath,
    monitored: true,
    seasons: seasonsAmonitorear,
    addOptions: {
      searchForMissingEpisodes: true,
    },
  };

  const respuesta = await axios.post(`${url}/api/v3/series`, payload, {
    headers: { 'X-Api-Key': apiKey },
  });

  return respuesta.data;
}

module.exports = { enviarASerie };
