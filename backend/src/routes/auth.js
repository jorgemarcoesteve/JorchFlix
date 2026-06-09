const { Router } = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const config = require('../config');
const { getDatabase } = require('../config/database');
const { autenticar } = require('../middleware/auth');

const router = Router();

router.post('/login', async (req, res) => {
  const { usuario, contrasena } = req.body;

  if (!usuario || !contrasena) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
  }

  try {
    const jfUrl = config.jellyfin.url?.replace(/\/+$/, '');

    console.log(`Autenticando en Jellyfin: ${jfUrl}/Users/AuthenticateByName`);

    const respuesta = await axios.post(`${jfUrl}/Users/AuthenticateByName`, {
      Username: usuario,
      Pw: contrasena,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    if (!respuesta.data?.User?.Id) {
      console.error('Respuesta inesperada de Jellyfin:', JSON.stringify(respuesta.data).slice(0, 500));
      return res.status(500).json({
        error: 'Respuesta inesperada de Jellyfin. Revisa que la URL y API Key sean correctas.',
      });
    }

    const jellyfinId = respuesta.data.User.Id;
    const db = getDatabase();

    let user = db.get('SELECT * FROM usuarios WHERE jellyfin_id = ?', [jellyfinId]);

    if (!user) {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();
      const totalUsuarios = db.get('SELECT COUNT(*) as count FROM usuarios');
      const esAdmin = totalUsuarios.count === 0 ? 1 : 0;
      db.run('INSERT INTO usuarios (id, jellyfin_id, nombre_usuario, es_admin) VALUES (?, ?, ?, ?)',
        [id, jellyfinId, usuario, esAdmin]);
      user = db.get('SELECT * FROM usuarios WHERE id = ?', [id]);
    }

    if (!user.es_admin) {
      const hayAdmin = db.get('SELECT COUNT(*) as count FROM usuarios WHERE es_admin = 1');
      if (hayAdmin.count === 0) {
        db.run('UPDATE usuarios SET es_admin = 1 WHERE id = ?', [user.id]);
        user.es_admin = 1;
      }
    }

    const token = jwt.sign(
      { id: user.id, jellyfin_id: user.jellyfin_id },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      usuario: {
        id: user.id,
        nombre_usuario: user.nombre_usuario,
        es_admin: Boolean(user.es_admin),
        monedas: user.monedas,
      },
    });
  } catch (err) {
    if (err.response?.status === 401) {
      return res.status(401).json({ error: 'Credenciales inválidas en Jellyfin' });
    }
    console.error('Error en login Jellyfin:', err.message, err.response?.data ? JSON.stringify(err.response.data).slice(0, 1000) : '');
    res.status(500).json({ error: 'Error al conectar con el servidor de autenticación' });
  }
});

router.get('/me', autenticar, (req, res) => {
  res.json({
    id: req.usuario.id,
    nombre_usuario: req.usuario.nombre_usuario,
    es_admin: Boolean(req.usuario.es_admin),
    monedas: req.usuario.monedas,
  });
});

router.post('/refresh', autenticar, (req, res) => {
  const token = jwt.sign(
    { id: req.usuario.id, jellyfin_id: req.usuario.jellyfin_id },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
  res.json({ token });
});

module.exports = router;
