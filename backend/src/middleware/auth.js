const jwt = require('jsonwebtoken');
const config = require('../config');
const { getDatabase } = require('../config/database');

function autenticar(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  const token = header.split(' ')[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const db = getDatabase();
    const usuario = db.prepare('SELECT * FROM usuarios WHERE id = ?').get(decoded.id);

    if (!usuario) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    req.usuario = usuario;
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function esAdmin(req, res, next) {
  if (!req.usuario || !req.usuario.es_admin) {
    return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador' });
  }
  next();
}

module.exports = { autenticar, esAdmin };
