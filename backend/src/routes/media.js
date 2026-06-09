const { Router } = require('express');
const axios = require('axios');
const config = require('../config');
const SettingsService = require('../services/settings');
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

    const jfUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const jfKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);

    const filtro = tipo === 'tv' ? 'Series' : 'Movie';
    const { data } = await axios.get(`${jfUrl}/Items`, {
      params: {
        IncludeItemTypes: filtro,
        Recursive: true,
        Limit: 1,
        Fields: 'ProviderIds,Path',
      },
      headers: { 'X-MediaBrowser-Token': jfKey },
      timeout: 5000,
    });

    const item = (data.Items || []).find((i) => {
      const ids = i.ProviderIds || {};
      return String(ids.TmdbId) === String(tmdb_id);
    });

    if (!item) return res.json({ disponible: false });

    res.json({
      disponible: true,
      url: `${jfUrl}/web/#/details?id=${item.Id}`,
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

    const jfUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const jfKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);

    const filtro = tipo === 'tv' ? 'Series' : 'Movie';
    const provedores = tipo === 'tv'
      ? 'TvdbId,ImdbId'
      : 'TmdbId,ImdbId';

    const { data } = await axios.get(`${jfUrl}/Items`, {
      params: {
        IncludeItemTypes: filtro,
        Recursive: true,
        Limit: 1,
        SearchTerm: tmdb_id,
        Fields: 'ProviderIds',
      },
      headers: { 'X-MediaBrowser-Token': jfKey },
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

router.get('/biblioteca/carpetas', autenticar, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl) return res.status(400).json({ error: 'JELLYFIN_URL no configurada' });
    if (!apiKey) return res.status(400).json({ error: 'JELLYFIN_API_KEY no configurada' });

    const { data } = await axios.get(`${baseUrl}/Library/MediaFolders`, {
      headers: { 'X-MediaBrowser-Token': apiKey },
      timeout: 5000,
    });
    res.json(data.Items || []);
  } catch (err) {
    const status = err.response?.status || 500;
    const detalle = err.response?.data ? JSON.stringify(err.response.data).slice(0, 200) : err.message;
    console.error('Error al obtener carpetas Jellyfin:', status, detalle);
    res.status(status === 400 ? 502 : 500).json({ error: `Error al obtener bibliotecas de Jellyfin (${status})` });
  }
});

router.get('/biblioteca/items', autenticar, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl) return res.status(400).json({ error: 'JELLYFIN_URL no configurada' });

    const jellyfinId = req.usuario.jellyfin_id;
    if (!jellyfinId) return res.status(400).json({ error: 'Usuario no vinculado a Jellyfin. Vuelve a iniciar sesión.' });

    const { parentId, tipo, limit, startIndex, hijosDe } = req.query;
    const params = {
      Fields: 'PrimaryImageAspectRatio,Overview,PremiereDate,CommunityRating,ProviderIds,UserData,Path,ImageTags',
      Limit: parseInt(limit) || 50,
      StartIndex: parseInt(startIndex) || 0,
    };

    if (hijosDe) {
      params.ParentId = hijosDe;
      params.Recursive = false;
    } else if (parentId) {
      params.ParentId = parentId;
      params.Recursive = true;
      params.ExcludeItemTypes = 'Season,Episode';
      if (tipo) params.IncludeItemTypes = tipo;
    } else {
      params.Recursive = true;
      params.ExcludeItemTypes = 'Season,Episode';
    }

    const { data } = await axios.get(`${baseUrl}/Users/${jellyfinId}/Items`, {
      params,
      headers: { 'X-MediaBrowser-Token': apiKey },
      timeout: 8000,
    });
    res.json({ items: data.Items || [], total: data.TotalRecordCount || 0 });
  } catch (err) {
    const status = err.response?.status || 500;
    console.error('Error al obtener items Jellyfin:', status, err.message);
    res.status(status === 400 ? 502 : 500).json({ error: `Error al obtener contenido de Jellyfin (${status})` });
  }
});

router.get('/player-info/:itemId', autenticar, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });
    if (!req.usuario?.jellyfin_id) return res.status(400).json({ error: 'Usuario no vinculado a Jellyfin' });

    const { data } = await axios.get(`${baseUrl}/Users/${req.usuario.jellyfin_id}/Items/${req.params.itemId}`, {
      params: { Fields: 'Path,Overview,ProviderIds,MediaSources' },
      headers: { 'X-MediaBrowser-Token': apiKey },
      timeout: 5000,
    });

    const mediaSource = data.MediaSources?.[0];
    const streamUrl = mediaSource
      ? `${baseUrl}/Videos/${req.params.itemId}/stream?api_key=${apiKey}&static=true`
      : null;

    const hlsUrl = `${baseUrl}/Videos/${req.params.itemId}/master.m3u8?api_key=${apiKey}`;

    res.json({
      id: data.Id,
      nombre: data.Name,
      seriesName: data.SeriesName,
      seasonNumber: data.ParentIndexNumber,
      episodeNumber: data.IndexNumber,
      overview: data.Overview,
      year: data.ProductionYear || data.PremiereDate?.slice(0, 4),
      image: `${baseUrl}/Items/${data.Id}/Images/Primary?api_key=${apiKey}&width=400`,
      streamUrl,
      hlsUrl,
      runtimeTicks: data.RunTimeTicks,
      container: mediaSource?.Container,
    });
  } catch (err) {
    console.error('Error al obtener info del item:', err.response?.status, err.message);
    res.status(404).json({ error: 'Item no encontrado' });
  }
});

router.get('/reproducir-directo/:itemId', autenticar, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });
    if (!req.usuario?.jellyfin_id) return res.status(400).json({ error: 'Usuario no vinculado a Jellyfin' });

    const { data } = await axios.get(`${baseUrl}/Users/${req.usuario.jellyfin_id}/Items/${req.params.itemId}`, {
      params: { Fields: 'Path' },
      headers: { 'X-MediaBrowser-Token': apiKey },
      timeout: 5000,
    });

    res.json({
      url: `${baseUrl}/web/#/details?id=${data.Id}`,
      nombre: data.Name,
    });
  } catch (err) {
    console.error('Error al buscar item para reproducir:', err.response?.status, err.message);
    res.status(404).json({ error: 'Item no encontrado' });
  }
});

router.get('/imagen/:itemId', async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });

    const { itemId } = req.params;
    const { width } = req.query;

    const headers = {
      'X-MediaBrowser-Token': apiKey,
      'Accept': 'image/webp,image/*,*/*',
    };

    if (req.usuario?.jellyfin_id) {
      headers['X-Emby-Authorization'] =
        `MediaBrowser Client="JorchFlix", Device="Server", DeviceId="JorchFlix", Version="1.0.0", UserId="${req.usuario.jellyfin_id}"`;
    }

    const response = await axios.get(`${baseUrl}/Items/${itemId}/Images/Primary`, {
      params: { width: parseInt(width) || 300, quality: 90, fillHeight: 450 },
      headers,
      responseType: 'stream',
      timeout: 5000,
    });
    res.setHeader('Content-Type', response.headers['content-type']);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    response.data.pipe(res);
  } catch (err) {
    console.error('Error al obtener imagen Jellyfin:', err.message);
    res.status(404).json({ error: 'Imagen no encontrada' });
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

module.exports = router;
