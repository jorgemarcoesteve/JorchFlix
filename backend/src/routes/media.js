const { Router } = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const http = require('http');
const https = require('https');
const { URL } = require('url');
const config = require('../config');
const SettingsService = require('../services/settings');
const { getDatabase } = require('../config/database');
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
      params: { Fields: 'Path,Overview,ProviderIds,MediaSources,UserData' },
      headers: { 'X-MediaBrowser-Token': apiKey },
      timeout: 5000,
    });

    const db = getDatabase();
    const progresoLocal = db.get('SELECT position_ticks FROM progreso WHERE usuario_id = ? AND item_id = ?', [req.usuario.id, req.params.itemId]);
    const ticks = progresoLocal?.position_ticks || data.UserData?.PlaybackPositionTicks || 0;
    const resumeSeconds = Math.floor(ticks / 10000000);

    const mediaSource = data.MediaSources?.[0];
    const played = data.UserData?.Played || false;

    const pistas = {
      audio: (mediaSource?.MediaStreams || []).filter((s) => s.Type === 'Audio').map((s) => ({
        index: s.Index,
        language: s.Language || 'desconocido',
        title: s.DisplayTitle || s.Language || `Pista ${s.Index}`,
        codec: s.Codec,
        isDefault: s.IsDefault,
      })),
      subtitulos: (mediaSource?.MediaStreams || []).filter((s) => s.Type === 'Subtitle').map((s) => ({
        index: s.Index,
        language: s.Language || 'desconocido',
        title: s.DisplayTitle || s.Language || `Subtítulo ${s.Index}`,
        codec: s.Codec,
        isDefault: s.IsDefault,
        isForced: s.IsForced,
        isExternal: s.IsExternal,
        deliveryUrl: s.DeliveryUrl,
      })),
    };

    res.json({
      id: data.Id,
      nombre: data.Name,
      seriesName: data.SeriesName,
      seasonNumber: data.ParentIndexNumber,
      episodeNumber: data.IndexNumber,
      overview: data.Overview,
      year: data.ProductionYear || data.PremiereDate?.slice(0, 4),
      image: `${baseUrl}/Items/${data.Id}/Images/Primary?api_key=${apiKey}&width=400`,
      resumeSeconds,
      played,
      streamUrl: `/api/media/stream/${req.params.itemId}`,
      runtimeTicks: data.RunTimeTicks,
      container: mediaSource?.Container,
      mediaSourceId: mediaSource?.Id,
      pistas,
    });
  } catch (err) {
    console.error('Error al obtener info del item:', err.response?.status, err.message);
    res.status(404).json({ error: 'Item no encontrado' });
  }
});

function verificarTokenDesdeQuery(req, res, next) {
  const token = req.query.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (!token) return res.status(401).json({ error: 'Token requerido' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDatabase();
    const usuario = db.get('SELECT * FROM usuarios WHERE id = ?', [decoded.id]);
    if (!usuario) return res.status(401).json({ error: 'Usuario no encontrado' });
    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
}

router.get('/stream/:itemId', verificarTokenDesdeQuery, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });

    const jfUrl = new URL(`${baseUrl}/Videos/${req.params.itemId}/stream`);
    jfUrl.searchParams.set('api_key', apiKey);
    jfUrl.searchParams.set('Static', 'true');
    if (req.query.AudioStreamIndex) jfUrl.searchParams.set('AudioStreamIndex', req.query.AudioStreamIndex);

    const transport = jfUrl.protocol === 'https:' ? https : http;
    const opts = {
      hostname: jfUrl.hostname,
      port: jfUrl.port || (jfUrl.protocol === 'https:' ? 443 : 80),
      path: jfUrl.pathname + jfUrl.search,
      method: 'GET',
      headers: { 'X-MediaBrowser-Token': apiKey },
    };

    if (req.headers.range) opts.headers['Range'] = req.headers.range;

    const proxyReq = transport.request(opts, (proxyRes) => {
      const h = proxyRes.headers;
      if (h['content-type']) res.setHeader('Content-Type', h['content-type']);
      if (h['content-length']) res.setHeader('Content-Length', h['content-length']);
      if (h['content-range']) res.setHeader('Content-Range', h['content-range']);
      if (h['accept-ranges']) res.setHeader('Accept-Ranges', h['accept-ranges']);
      res.writeHead(proxyRes.statusCode);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Error en proxy stream:', err.message);
      if (!res.headersSent) res.status(502).json({ error: 'Error al conectar con Jellyfin' });
    });

    proxyReq.end();
  } catch (err) {
    console.error('Error en stream:', err.message);
    res.status(500).json({ error: 'Error en stream' });
  }
});

router.get('/subtitulos/:itemId/:subIndex', verificarTokenDesdeQuery, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });
    if (!req.usuario?.jellyfin_id) return res.status(400).json({ error: 'Usuario no vinculado a Jellyfin' });

    const jfUrl = new URL(`${baseUrl}/Videos/${req.params.itemId}/${req.params.itemId}/Subtitles/${req.params.subIndex}/Stream`);
    jfUrl.searchParams.set('api_key', apiKey);

    const transport = jfUrl.protocol === 'https:' ? https : http;
    const opts = {
      hostname: jfUrl.hostname,
      port: jfUrl.port || (jfUrl.protocol === 'https:' ? 443 : 80),
      path: jfUrl.pathname + jfUrl.search,
      method: 'GET',
      headers: { 'X-MediaBrowser-Token': apiKey },
    };

    const proxyReq = transport.request(opts, (proxyRes) => {
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'text/plain');
      res.setHeader('Cache-Control', 'public, max-age=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.writeHead(proxyRes.statusCode);
      proxyRes.pipe(res);
    });

    proxyReq.on('error', (err) => {
      console.error('Error en proxy subtítulos:', err.message);
      if (!res.headersSent) res.status(404).json({ error: 'Subtítulo no encontrado' });
    });

    proxyReq.end();
  } catch (err) {
    console.error('Error al obtener subtítulo:', err.message);
    res.status(404).json({ error: 'Subtítulo no encontrado' });
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

router.post('/reportar-progreso/:itemId', autenticar, async (req, res) => {
  try {
    const { positionTicks } = req.body;
    if (positionTicks == null) return res.status(400).json({ error: 'positionTicks requerido' });

    const db = getDatabase();
    const existe = db.get('SELECT id FROM progreso WHERE usuario_id = ? AND item_id = ?', [req.usuario.id, req.params.itemId]);
    if (existe) {
      db.run('UPDATE progreso SET position_ticks = ?, actualizado_en = datetime(\'now\') WHERE usuario_id = ? AND item_id = ?',
        [positionTicks, req.usuario.id, req.params.itemId]);
    } else {
      db.run('INSERT INTO progreso (usuario_id, item_id, position_ticks) VALUES (?, ?, ?)',
        [req.usuario.id, req.params.itemId, positionTicks]);
    }

    res.json({ ok: true });
  } catch (err) {
    console.error('Error al guardar progreso:', err.message);
    res.status(500).json({ error: 'Error al guardar progreso' });
  }
});

router.post('/marcar-visto/:itemId', autenticar, async (req, res) => {
  try {
    const baseUrl = SettingsService.getWithFallback('jellyfin_url', config.jellyfin.url)?.replace(/\/+$/, '');
    const apiKey = SettingsService.getWithFallback('jellyfin_api_key', config.jellyfin.apiKey);
    if (!baseUrl || !apiKey) return res.status(400).json({ error: 'Jellyfin no configurado' });
    if (!req.usuario?.jellyfin_id) return res.status(400).json({ error: 'Usuario no vinculado a Jellyfin' });

    await axios.post(
      `${baseUrl}/Users/${req.usuario.jellyfin_id}/PlayedItems/${req.params.itemId}`,
      { DatePlayed: new Date().toISOString().split('T')[0] },
      {
        headers: {
          'X-MediaBrowser-Token': apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 5000,
      }
    );

    res.json({ ok: true, marcado: true });
  } catch (err) {
    console.error('Error al marcar como visto:', err.message);
    res.status(500).json({ error: 'Error al marcar como visto' });
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
