const { getDatabase } = require('../config/database');

const SettingsService = {
  get(clave) {
    const db = getDatabase();
    const row = db.get('SELECT valor FROM configuracion WHERE clave = ?', [clave]);
    return row ? row.valor : null;
  },

  set(clave, valor) {
    const db = getDatabase();
    const existe = db.get('SELECT clave FROM configuracion WHERE clave = ?', [clave]);
    if (existe) {
      db.run('UPDATE configuracion SET valor = ? WHERE clave = ?', [valor, clave]);
    } else {
      db.run('INSERT INTO configuracion (clave, valor) VALUES (?, ?)', [clave, valor]);
    }
  },

  getWithFallback(clave, fallback) {
    return this.get(clave) || fallback;
  },
};

module.exports = SettingsService;
