const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const config = require('./config');
const { inicializar } = require('./config/database');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiadas solicitudes. Intenta de nuevo en 15 minutos.' },
});
app.use('/api/', limiter);

app.get('/api/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'JorchFlix API' });
});

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const mediaRoutes = require('./routes/media');
const peticionesRoutes = require('./routes/peticiones');
const monedasRoutes = require('./routes/monedas');
const configRoutes = require('./routes/configuracion');
const notificacionesRoutes = require('./routes/notificaciones');
const adminRoutes = require('./routes/admin');
const votosRoutes = require('./routes/votos');
const issuesRoutes = require('./routes/issues');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/peticiones', peticionesRoutes);
app.use('/api/monedas', monedasRoutes);
app.use('/api/configuracion', configRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/votos', votosRoutes);
app.use('/api/issues', issuesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

async function main() {
  await inicializar();
  app.listen(config.port, () => {
    console.log(`🟢 JorchFlix API funcionando en puerto ${config.port}`);
  });
}

main();
