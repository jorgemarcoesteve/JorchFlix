const path = require('path');
const fs = require('fs');
const initSqlJs = require('sql.js');

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_PATH = path.join(DATA_DIR, 'jorchflix.db');

let db = null;

async function inicializar() {
  const SQL = await initSqlJs();

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buffer);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
  inicializarEsquema();
  guardar();
}

function inicializarEsquema() {
  db.run(`CREATE TABLE IF NOT EXISTS usuarios (
    id TEXT PRIMARY KEY,
    jellyfin_id TEXT UNIQUE,
    nombre_usuario TEXT UNIQUE NOT NULL,
    es_admin INTEGER NOT NULL DEFAULT 0,
    monedas INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now'))
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS peticiones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('movie', 'series', 'anime')),
    tmdb_id TEXT NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    poster_path TEXT,
    estado TEXT NOT NULL DEFAULT 'pending' CHECK(estado IN ('pending', 'approved', 'rejected', 'completed')),
    admin_id TEXT,
    nota_admin TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    actualizado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (admin_id) REFERENCES usuarios(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS transacciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    cantidad INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK(tipo IN ('grant', 'request', 'refund')),
    descripcion TEXT,
    peticion_id TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (peticion_id) REFERENCES peticiones(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS configuracion (
    clave TEXT PRIMARY KEY,
    valor TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS notificaciones (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    tipo TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    peticion_id TEXT,
    leida INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (peticion_id) REFERENCES peticiones(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    accion TEXT NOT NULL,
    detalle TEXT,
    usuario_afectado TEXT,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (admin_id) REFERENCES usuarios(id)
  )`);

  try {
    db.run("ALTER TABLE peticiones ADD COLUMN temporadas TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE peticiones ADD COLUMN jellyfin_id TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE peticiones ADD COLUMN tvdb_id TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE notificaciones ADD COLUMN leida INTEGER NOT NULL DEFAULT 0");
  } catch (e) {}

  try {
    db.run("ALTER TABLE usuarios ADD COLUMN ultimo_login TEXT");
  } catch (e) {}

  try {
    db.run("ALTER TABLE usuarios ADD COLUMN email TEXT");
  } catch (e) {}

  db.run(`CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    peticion_id TEXT,
    tipo TEXT NOT NULL CHECK(tipo IN ('playback', 'metadata', 'other')),
    descripcion TEXT NOT NULL,
    resuelto INTEGER NOT NULL DEFAULT 0,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (peticion_id) REFERENCES peticiones(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS votos (
    id TEXT PRIMARY KEY,
    usuario_id TEXT NOT NULL,
    peticion_id TEXT NOT NULL,
    creado_en TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(usuario_id, peticion_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (peticion_id) REFERENCES peticiones(id)
  )`);

  try {
    db.run("ALTER TABLE usuarios ADD COLUMN peticiones_maximas INTEGER NOT NULL DEFAULT 0");
  } catch (e) {}

  try {
    db.run("ALTER TABLE configuracion ADD COLUMN defecto TEXT");
  } catch (e) {}

  if (!db.get("SELECT valor FROM configuracion WHERE clave = 'jfc_costo'")) {
    db.run("INSERT INTO configuracion (clave, valor) VALUES ('jfc_costo', '1')");
  }
  if (!db.get("SELECT valor FROM configuracion WHERE clave = 'max_peticiones_pendientes'")) {
    db.run("INSERT INTO configuracion (clave, valor) VALUES ('max_peticiones_pendientes', '0')");
  }
}

function guardar() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

const dbApi = {
  run(sql, params = []) {
    db.run(sql, params);
    guardar();
  },
  get(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    if (stmt.step()) {
      const row = stmt.getAsObject();
      stmt.free();
      return row;
    }
    stmt.free();
    return null;
  },
  all(sql, params = []) {
    const stmt = db.prepare(sql);
    stmt.bind(params);
    const rows = [];
    while (stmt.step()) {
      rows.push(stmt.getAsObject());
    }
    stmt.free();
    return rows;
  },
  exec(sql) {
    db.exec(sql);
    guardar();
  },
};

function getDatabase() {
  if (!db) throw new Error('BD no inicializada');
  return dbApi;
}

function cerrar() {
  if (db) {
    guardar();
    db.close();
    db = null;
  }
}

module.exports = { inicializar, getDatabase, cerrar };
