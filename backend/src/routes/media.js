const { Router } = require('express');
const axios = require('axios');
const config = require('../config');
const { autenticar } = require('../middleware/auth');
const tmdb = require('../services/tmdb');

const router = Router();

router.get('/search', autenticar, async (req, res) => {
  try {
    const { q, tipo, page } = req.query;
    if (!q) return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });

    if (tipo === 'multi') {
      const data = await tmdb.multiSearch(q, Math.max(1, parseInt(page) || 1));
      return res.json(data);
    }

    const tipoValido = tipo === 'tv' ? 'tv' : 'movie';
    const data = await tmdb.search(tipoValido, q, Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en búsqueda TMDB:', err.message);
    res.status(500).json({ error: 'Error al buscar contenido' });
  }
});

router.get('/trending', autenticar, async (req, res) => {
  try {
    const { tipo, tiempo } = req.query;
    const data = await tmdb.trending(tipo || 'movie', tiempo || 'week');
    res.json(data);
  } catch (err) {
    console.error('Error en trending TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener tendencias' });
  }
});

router.get('/popular', autenticar, async (req, res) => {
  try {
    const { tipo, page } = req.query;
    const data = await tmdb.popular(tipo || 'movie', Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en popular TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener populares' });
  }
});

router.get('/top-rated', autenticar, async (req, res) => {
  try {
    const { tipo, page } = req.query;
    const data = await tmdb.topRated(tipo || 'movie', Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en top-rated TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener mejor valorados' });
  }
});

router.get('/upcoming', autenticar, async (req, res) => {
  try {
    const { page } = req.query;
    const data = await tmdb.upcoming(Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en upcoming TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener próximos estrenos' });
  }
});

router.get('/now-playing', autenticar, async (req, res) => {
  try {
    const { page } = req.query;
    const data = await tmdb.nowPlaying(Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en now-playing TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener en cartelera' });
  }
});

router.get('/on-the-air', autenticar, async (req, res) => {
  try {
    const { page } = req.query;
    const data = await tmdb.onTheAir(Math.max(1, parseInt(page) || 1));
    res.json(data);
  } catch (err) {
    console.error('Error en on-the-air TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener series al aire' });
  }
});

router.get('/discover', autenticar, async (req, res) => {
  try {
    const { tipo, ...params } = req.query;
    const data = await tmdb.discover(tipo || 'movie', params);
    res.json(data);
  } catch (err) {
    console.error('Error en discover TMDB:', err.message);
    res.status(500).json({ error: 'Error al descubrir contenido' });
  }
});

router.get('/reproducir', autenticar, async (req, res) => {
  try {
    const { tmdb_id, tipo } = req.query;
    if (!tmdb_id || !tipo) return res.status(400).json({ error: 'tmdb_id y tipo requeridos' });

    const filtro = tipo === 'tv' ? 'Series' : 'Movie';
    const { data } = await axios.get(`${config.jellyfin.url}/Items`, {
      params: {
        IncludeItemTypes: filtro,
        Recursive: true,
        Limit: 1,
        Fields: 'ProviderIds,Path',
      },
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
      timeout: 5000,
    });

    const item = (data.Items || []).find((i) => {
      const ids = i.ProviderIds || {};
      return String(ids.TmdbId) === String(tmdb_id);
    });

    if (!item) return res.json({ disponible: false });

    res.json({
      disponible: true,
      url: `${config.jellyfin.url}/web/#/details?id=${item.Id}`,
      item_id: item.Id,
      nombre: item.Name,
    });
  } catch (err) {
    res.json({ disponible: false });
  }
});

router.get('/generos', autenticar, async (req, res) => {
  try {
    const { tipo } = req.query;
    const data = await tmdb.generos(tipo || 'movie');
    res.json(data);
  } catch (err) {
    console.error('Error al obtener géneros TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener géneros' });
  }
});

router.get('/en-jellyfin', autenticar, async (req, res) => {
  try {
    const { tmdb_id, tipo } = req.query;
    if (!tmdb_id || !tipo) return res.json({ existe: false });

    const filtro = tipo === 'tv' ? 'Series' : 'Movie';
    const provedores = tipo === 'tv'
      ? 'TvdbId,ImdbId'
      : 'TmdbId,ImdbId';

    const { data } = await axios.get(`${config.jellyfin.url}/Items`, {
      params: {
        IncludeItemTypes: filtro,
        Recursive: true,
        Limit: 1,
        SearchTerm: tmdb_id,
        Fields: 'ProviderIds',
      },
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
      timeout: 5000,
    });

    const existe = (data.Items || []).some((item) => {
      const ids = item.ProviderIds || {};
      return String(ids.TmdbId) === String(tmdb_id);
    });

    res.json({ existe, items: existe ? data.Items : [] });
  } catch (err) {
    res.json({ existe: false });
  }
});

router.get('/:tipo/:tmdbId', autenticar, async (req, res) => {
  try {
    const { tipo, tmdbId } = req.params;
    if (!['movie', 'tv'].includes(tipo)) {
      return res.status(400).json({ error: 'Tipo debe ser movie o tv' });
    }
    const data = await tmdb.detail(tipo, tmdbId);
    res.json(data);
  } catch (err) {
    console.error('Error al obtener detalle TMDB:', err.message);
    res.status(500).json({ error: 'Error al obtener detalles del contenido' });
  }
});

router.get('/biblioteca/carpetas', autenticar, async (req, res) => {
  try {
    const { data } = await axios.get(`${config.jellyfin.url}/Library/MediaFolders`, {
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
      timeout: 5000,
    });
    res.json(data.Items || []);
  } catch (err) {
    console.error('Error al obtener carpetas Jellyfin:', err.message);
    res.status(500).json({ error: 'Error al obtener las bibliotecas' });
  }
});

router.get('/biblioteca/items', autenticar, async (req, res) => {
  try {
    const { parentId, tipo, limit, startIndex } = req.query;
    const params = {
      Recursive: true,
      Fields: 'PrimaryImageAspectRatio,Overview,PremiereDate,CommunityRating,ProviderIds',
      Limit: parseInt(limit) || 50,
      startIndex: parseInt(startIndex) || 0,
    };
    if (parentId) params.ParentId = parentId;
    if (tipo) params.IncludeItemTypes = tipo;

    const { data } = await axios.get(`${config.jellyfin.url}/Items`, {
      params,
      headers: { 'X-MediaBrowser-Token': config.jellyfin.apiKey },
      timeout: 8000,
    });
    res.json({ items: data.Items || [], total: data.TotalRecordCount || 0 });
  } catch (err) {
    console.error('Error al obtener items de Jellyfin:', err.message);
    res.status(500).json({ error: 'Error al obtener contenido' });
  }
});

module.exports = router;
