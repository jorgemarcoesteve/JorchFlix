const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const config = {
  port: parseInt(process.env.PORT, 10) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'cambiame_en_produccion',
  jellyfin: {
    url: process.env.JELLYFIN_URL || '',
    apiKey: process.env.JELLYFIN_API_KEY || '',
  },
  radarr: {
    url: process.env.RADARR_URL || '',
    apiKey: process.env.RADARR_API_KEY || '',
    rootPath: process.env.RADARR_ROOT_PATH || '',
    qualityProfileId: parseInt(process.env.RADARR_QUALITY_PROFILE_ID, 10) || 1,
  },
  sonarr: {
    url: process.env.SONARR_URL || '',
    apiKey: process.env.SONARR_API_KEY || '',
    rootPath: process.env.SONARR_ROOT_PATH || '',
    qualityProfileId: parseInt(process.env.SONARR_QUALITY_PROFILE_ID, 10) || 1,
  },
  tmdb: {
    apiKey: process.env.TMDB_API_KEY || '',
  },
};

module.exports = config;
