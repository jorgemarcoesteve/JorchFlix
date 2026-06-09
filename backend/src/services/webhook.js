const axios = require('axios');
const SettingsService = require('./settings');

async function enviarWebhook(evento, datos) {
  const webhookUrl = SettingsService.get('webhook_url');
  const webhookActivo = SettingsService.get('webhook_activo');

  if (!webhookUrl || webhookActivo !== 'true') {
    return;
  }

  const payload = {
    evento,
    timestamp: new Date().toISOString(),
    datos,
  };

  try {
    await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 5000,
    });
  } catch (err) {
    console.error('Error al enviar webhook:', err.message);
  }
}

module.exports = { enviarWebhook };
