const axios = require('axios');
const config = require('../config');
const SettingsService = require('./settings');

const BASE = 'https://api.themoviedb.org/3';

function apiKey() {
  const key = SettingsService.getWithFallback('tmdb_api_key', config.tmdb.apiKey);
  if (!key) throw new Error('TMDB API Key no configurada');
  return key;
}

async function get(endpoint, params = {}) {
  const { data } = await axios.get(`${BASE}${endpoint}`, {
    params: { api_key: apiKey(), language: 'es-ES', ...params },
  });
  return data;
}

async function search(tipo, query, page = 1) {
  const tipoValido = tipo === 'tv' ? 'tv' : 'movie';
  return get(`/search/${tipoValido}`, { query, page });
}

async function detail(tipo, tmdbId) {
  return get(`/${tipo}/${tmdbId}`, { append_to_response: 'videos,credits,similar' });
}

async function trending(tipo, tiempo = 'week') {
  return get(`/trending/${tipo}/${tiempo}`);
}

async function popular(tipo, page = 1) {
  return get(`/${tipo}/popular`, { page });
}

async function topRated(tipo, page = 1) {
  return get(`/${tipo}/top_rated`, { page });
}

async function upcoming(page = 1) {
  return get('/movie/upcoming', { page });
}

async function nowPlaying(page = 1) {
  return get('/movie/now_playing', { page });
}

async function onTheAir(page = 1) {
  return get('/tv/on_the_air', { page });
}

async function airingToday(page = 1) {
  return get('/tv/airing_today', { page });
}

async function discover(tipo, params = {}) {
  return get(`/discover/${tipo}`, params);
}

async function generos(tipo) {
  return get(`/genre/${tipo}/list`);
}

async function multiSearch(query, page = 1) {
  return get('/search/multi', { query, page });
}

module.exports = {
  search,
  detail,
  trending,
  popular,
  topRated,
  upcoming,
  nowPlaying,
  onTheAir,
  airingToday,
  discover,
  generos,
  multiSearch,
};
