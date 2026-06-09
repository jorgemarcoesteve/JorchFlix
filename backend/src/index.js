const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const { inicializar } = require('./config/database');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ estado: 'ok', servicio: 'JorchFlix API' });
});

const authRoutes = require('./routes/auth');
const usuarioRoutes = require('./routes/usuarios');
const mediaRoutes = require('./routes/media');
const peticionesRoutes = require('./routes/peticiones');
const monedasRoutes = require('./routes/monedas');
const configRoutes = require('./routes/configuracion');

app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/peticiones', peticionesRoutes);
app.use('/api/monedas', monedasRoutes);
app.use('/api/configuracion', configRoutes);

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
