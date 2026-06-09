const { Router } = require('express');
const axios = require('axios');
const config = require('../config');
const { getDatabase } = require('../config/database');
const { autenticar, esAdmin } = require('../middleware/auth');

const router = Router();

router.get('/', autenticar, esAdmin, (req, res) => {
  const db = getDatabase();
  const usuarios = db.all('SELECT id, nombre_usuario, es_admin, monedas, creado_en FROM usuarios');
  res.json(usuarios);
});

router.post('/', autenticar, esAdmin, async (req, res) => {
  const { nombre_usuario, contrasena } = req.body;

  if (!nombre_usuario || !contrasena) {
    return res.status(400).json({ error: 'Nombre de usuario y contraseña requeridos' });
  }

  const db = getDatabase();
  const existe = db.get('SELECT id FROM usuarios WHERE nombre_usuario = ?', [nombre_usuario]);
  if (existe) {
    return res.status(409).json({ error: 'El nombre de usuario ya existe' });
  }

  try {
    const jfUrl = config.jellyfin.url?.replace(/\/+$/, '');
    const jfKey = config.jellyfin.apiKey;

    const respuesta = await axios.post(`${jfUrl}/Users/New`, {
      Name: nombre_usuario,
      Password: contrasena,
    }, {
      headers: { 'X-MediaBrowser-Token': jfKey },
    });

    const { v4: uuidv4 } = require('uuid');
    const id = uuidv4();
    db.run('INSERT INTO usuarios (id, jellyfin_id, nombre_usuario) VALUES (?, ?, ?)',
      [id, respuesta.data.Id, nombre_usuario]);

    const usuario = db.get('SELECT id, nombre_usuario, es_admin, monedas, creado_en FROM usuarios WHERE id = ?', [id]);
    res.status(201).json(usuario);
  } catch (err) {
    console.error('Error al crear usuario en Jellyfin:', err.message);
    res.status(500).json({ error: 'Error al crear el usuario en Jellyfin' });
  }
});

router.delete('/:id', autenticar, esAdmin, async (req, res) => {
  const db = getDatabase();
  const usuario = db.get('SELECT * FROM usuarios WHERE id = ?', [req.params.id]);

  if (!usuario) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  try {
    const jfUrl = config.jellyfin.url?.replace(/\/+$/, '');
    const jfKey = config.jellyfin.apiKey;
    await axios.delete(`${jfUrl}/Users/${usuario.jellyfin_id}`, {
      headers: { 'X-MediaBrowser-Token': jfKey },
    });
  } catch (err) {
    console.error('Error al borrar usuario en Jellyfin:', err.message);
  }

  db.run('DELETE FROM transacciones WHERE usuario_id = ?', [usuario.id]);
  db.run('DELETE FROM peticiones WHERE usuario_id = ?', [usuario.id]);
  db.run('DELETE FROM usuarios WHERE id = ?', [usuario.id]);

  res.json({ mensaje: 'Usuario eliminado correctamente' });
});

module.exports = router;
