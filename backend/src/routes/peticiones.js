const { Router } = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');
const radarrService = require('../services/radarr');
const sonarrService = require('../services/sonarr');
const { enviarWebhook } = require('../services/webhook');

const router = Router();

function crearNotificacion(db, usuarioId, tipo, mensaje, peticionId) {
  db.run(
    'INSERT INTO notificaciones (id, usuario_id, tipo, mensaje, peticion_id) VALUES (?, ?, ?, ?, ?)',
    [uuidv4(), usuarioId, tipo, mensaje, peticionId || null]
  );
}

router.get('/', autenticar, esAdmin, (req, res) => {
  try {
    const db = getDatabase();
    const peticiones = db.all(
      'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id ORDER BY p.creado_en DESC'
    );
    res.json(peticiones);
  } catch (err) {
    console.error('Error al listar peticiones:', err.message);
    res.status(500).json({ error: 'Error al obtener peticiones' });
  }
});

router.get('/mis-peticiones', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const peticiones = db.all(
      'SELECT * FROM peticiones WHERE usuario_id = ? ORDER BY creado_en DESC', [req.usuario.id]
    );
    res.json(peticiones);
  } catch (err) {
    console.error('Error al listar mis peticiones:', err.message);
    res.status(500).json({ error: 'Error al obtener peticiones' });
  }
});

router.post('/', autenticar, async (req, res) => {
  const { tipo, tmdb_id, titulo, descripcion, poster_path, temporadas } = req.body;

  if (!tipo || !tmdb_id || !titulo) {
    return res.status(400).json({ error: 'Faltan campos requeridos (tipo, tmdb_id, titulo)' });
  }

  if (!['movie', 'series', 'anime'].includes(tipo)) {
    return res.status(400).json({ error: 'Tipo debe ser movie, series o anime' });
  }

  const db = getDatabase();

  const costo = parseInt(db.get("SELECT valor FROM configuracion WHERE clave = 'jfc_costo'")?.valor || '1');
  const maxPendientes = parseInt(db.get("SELECT valor FROM configuracion WHERE clave = 'max_peticiones_pendientes'")?.valor || '0');
  const pendientesActuales = db.get("SELECT COUNT(*) as count FROM peticiones WHERE usuario_id = ? AND estado = 'pending'", [req.usuario.id])?.count || 0;

  if (maxPendientes > 0 && pendientesActuales >= maxPendientes) {
    return res.status(403).json({ error: `Límite de ${maxPendientes} peticiones pendientes alcanzado. Espera a que el admin procese algunas.` });
  }

  const duplicado = db.get(
    'SELECT id, estado FROM peticiones WHERE tmdb_id = ? AND tipo = ? AND usuario_id = ? AND estado != ?',
    [tmdb_id, tipo, req.usuario.id, 'rejected']
  );

  if (duplicado) {
    return res.status(409).json({
      error: 'Ya solicitaste este contenido',
      peticion_id: duplicado.id,
      estado: duplicado.estado,
    });
  }

  if (req.usuario.monedas < costo) {
    return res.status(403).json({ error: `Necesitas ${costo} JFC. Solicita al administrador que te otorgue más.` });
  }

  const id = uuidv4();
  const peticionId = id;

  db.run(
    'INSERT INTO peticiones (id, usuario_id, tipo, tmdb_id, titulo, descripcion, poster_path, temporadas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, req.usuario.id, tipo, tmdb_id, titulo, descripcion || '', poster_path || '', temporadas ? JSON.stringify(temporadas) : null]
  );

  db.run('UPDATE usuarios SET monedas = monedas - ? WHERE id = ?', [costo, req.usuario.id]);

  db.run(
    'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
    [uuidv4(), req.usuario.id, -costo, 'request', `Petición: ${titulo}`, peticionId]
  );

  const admins = db.all('SELECT id FROM usuarios WHERE es_admin = 1');
  for (const admin of admins) {
    crearNotificacion(db, admin.id, 'nueva_peticion', `${req.usuario.nombre_usuario} solicitó "${titulo}"`, peticionId);
  }

  const autoApprove = db.get("SELECT valor FROM configuracion WHERE clave = 'auto_approve'")?.valor;
  const autoApproveMin = parseInt(db.get("SELECT valor FROM configuracion WHERE clave = 'auto_approve_min_completadas'")?.valor || '3');
  const completadas = db.get("SELECT COUNT(*) as count FROM peticiones WHERE usuario_id = ? AND estado = 'completed'", [req.usuario.id])?.count || 0;

  if (autoApprove === 'true' && completadas >= autoApproveMin) {
    try {
      let resultado;
      if (tipo === 'movie') {
        resultado = await radarrService.enviarAPelicula(tmdb_id, titulo);
      } else {
        resultado = await sonarrService.enviarASerie(tmdb_id, titulo, temporadas);
      }
      db.run("UPDATE peticiones SET estado = 'completed', actualizado_en = datetime('now') WHERE id = ?", [peticionId]);
      db.run(
        'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), req.usuario.id, 0, 'grant', `Auto-aprobada: ${titulo}`, peticionId]
      );
      crearNotificacion(db, req.usuario.id, 'aprobada', `"${titulo}" fue auto-aprobada y enviada a descarga`, peticionId);
    } catch {}
  }

  const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [peticionId]);
  res.status(201).json(peticion);
});

router.delete('/:id', autenticar, (req, res) => {
  try {
    const db = getDatabase();
    const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.id]);

    if (!peticion) {
      return res.status(404).json({ error: 'Petición no encontrada' });
    }

    if (peticion.usuario_id !== req.usuario.id && !req.usuario.es_admin) {
      return res.status(403).json({ error: 'No puedes cancelar esta petición' });
    }

    if (peticion.estado !== 'pending') {
      return res.status(400).json({ error: 'Solo se pueden cancelar peticiones pendientes' });
    }

    db.run('DELETE FROM peticiones WHERE id = ?', [peticion.id]);
    db.run('UPDATE usuarios SET monedas = monedas + 1 WHERE id = ?', [peticion.usuario_id]);

    db.run(
      'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), peticion.usuario_id, 1, 'refund', `Cancelación: ${peticion.titulo}`, peticion.id]
    );

    res.json({ mensaje: 'Petición cancelada correctamente' });
  } catch (err) {
    console.error('Error al cancelar petición:', err.message);
    res.status(500).json({ error: 'Error al cancelar petición' });
  }
});

router.put('/:id/aprobar', autenticar, esAdmin, async (req, res) => {
  const db = getDatabase();
  const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.id]);

  if (!peticion) return res.status(404).json({ error: 'Petición no encontrada' });
  if (peticion.estado !== 'pending') return res.status(400).json({ error: 'La petición ya ha sido procesada' });

  try {
    let resultado;
    let temporadas = null;
    try { temporadas = JSON.parse(peticion.temporadas); } catch {}

    if (peticion.tipo === 'movie') {
      resultado = await radarrService.enviarAPelicula(peticion.tmdb_id, peticion.titulo);
    } else {
      resultado = await sonarrService.enviarASerie(peticion.tmdb_id, peticion.titulo, temporadas);
    }

    db.run(
      "UPDATE peticiones SET estado = 'completed', admin_id = ?, actualizado_en = datetime('now') WHERE id = ?",
      [req.usuario.id, peticion.id]
    );

    const actualizada = db.get(
      'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
      [peticion.id]
    );

    crearNotificacion(db, peticion.usuario_id, 'aprobada', `"${peticion.titulo}" fue aprobada y enviada a descarga`, peticion.id);

    await enviarWebhook('peticion_aprobada', {
      peticion_id: peticion.id, titulo: peticion.titulo, tipo: peticion.tipo, usuario: peticion.nombre_usuario || req.usuario.nombre_usuario,
    });

    res.json(actualizada);
  } catch (err) {
    console.error('Error al procesar petición:', err.message);

    try {
      await enviarWebhook('peticion_error', { peticion_id: peticion.id, titulo: peticion.titulo, error: err.message });
    } catch {}

    res.status(500).json({ error: `Error al enviar a descarga: ${err.message}` });
  }
});

router.put('/:id/rechazar', autenticar, esAdmin, (req, res) => {
  try {
    const { nota_admin } = req.body;
    const db = getDatabase();
    const peticion = db.get('SELECT * FROM peticiones WHERE id = ?', [req.params.id]);

    if (!peticion) return res.status(404).json({ error: 'Petición no encontrada' });
    if (peticion.estado !== 'pending') return res.status(400).json({ error: 'La petición ya ha sido procesada' });

    db.run(
      "UPDATE peticiones SET estado = 'rejected', admin_id = ?, nota_admin = ?, actualizado_en = datetime('now') WHERE id = ?",
      [req.usuario.id, nota_admin || '', peticion.id]
    );

    db.run('UPDATE usuarios SET monedas = monedas + 1 WHERE id = ?', [peticion.usuario_id]);

    db.run(
      'INSERT INTO transacciones (id, usuario_id, cantidad, tipo, descripcion, peticion_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), peticion.usuario_id, 1, 'refund', `Reembolso por rechazo: ${peticion.titulo}`, peticion.id]
    );

    const actualizada = db.get(
      'SELECT p.*, u.nombre_usuario FROM peticiones p JOIN usuarios u ON p.usuario_id = u.id WHERE p.id = ?',
      [peticion.id]
    );

    crearNotificacion(db, peticion.usuario_id, 'rechazada', `"${peticion.titulo}" fue rechazada${nota_admin ? `: ${nota_admin}` : ''}`, peticion.id);

    enviarWebhook('peticion_rechazada', { peticion_id: peticion.id, titulo: peticion.titulo, tipo: peticion.tipo, nota: nota_admin });

    res.json(actualizada);
  } catch (err) {
    console.error('Error al rechazar petición:', err.message);
    res.status(500).json({ error: 'Error al rechazar petición' });
  }
});

module.exports = router;
