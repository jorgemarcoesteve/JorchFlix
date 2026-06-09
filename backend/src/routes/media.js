const { Router } = require('express');
const axios = require('axios');
const config = require('../config');
const SettingsService = require('../services/settings');
const { autenticar } = require('../middleware/auth');

const router = Router();

router.get('/search', autenticar, async (req, res) => {
  const { q, tipo } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
  }

  const apiKey = SettingsService.getWithFallback('tmdb_api_key', config.tmdb.apiKey);
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key de TMDB no configurada' });
  }

  try {
    const tipoValido = tipo === 'tv' ? 'tv' : 'movie';
    const { data } = await axios.get('https://api.themoviedb.org/3/search/' + tipoValido, {
      params: {
        api_key: apiKey,
        query: q,
        language: 'es-ES',
        page: 1,
      },
    });

    res.json(data.results || []);
  } catch (err) {
    console.error('Error en búsqueda TMDB:', err.message);
    res.status(500).json({ error: 'Error al buscar contenido' });
  }
});

router.get('/:tipo/:tmdbId', autenticar, async (req, res) => {
  const { tipo, tmdbId } = req.params;

  if (!['movie', 'tv'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo debe ser movie o tv' });
  }

  const apiKey = SettingsService.getWithFallback('tmdb_api_key', config.tmdb.apiKey);
  if (!apiKey) {
    return res.status(500).json({ error: 'API Key de TMDB no configurada' });
  }

  try {
    const { data } = await axios.get(`https://api.themoviedb.org/3/${tipo}/${tmdbId}`, {
      params: {
        api_key: apiKey,
        language: 'es-ES',
        append_to_response: 'videos,credits,similar',
      },
    });

    res.json(data);
  } catch (err) {
    console.error('Error al obtener detalle de TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener detalles del contenido' });
  }
});

router.get('/biblioteca/peliculas', autenticar, async (req, res) => {
  try {
    const { data } = await axios.get(`${config.jellyfin.url}/Items`, {
      params: {
        IncludeItemTypes: 'Movie',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,Overview,PremiereDate,CommunityRating',
        Limit: 50,
      },
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
    });

    res.json(data.Items || []);
  } catch (err) {
    console.error('Error al obtener biblioteca de Jellyfin:', err.message);
    res.status(500).json({ error: 'Error al obtener la biblioteca' });
  }
});

router.get('/biblioteca/series', autenticar, async (req, res) => {
  try {
    const { data } = await axios.get(`${config.jellyfin.url}/Items`, {
      params: {
        IncludeItemTypes: 'Series',
        Recursive: true,
        Fields: 'PrimaryImageAspectRatio,Overview,PremiereDate,CommunityRating',
        Limit: 50,
      },
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
    });

    res.json(data.Items || []);
  } catch (err) {
    console.error('Error al obtener biblioteca de Jellyfin:', err.message);
    res.status(500).json({ error: 'Error al obtener la biblioteca' });
  }
});

module.exports = router;
