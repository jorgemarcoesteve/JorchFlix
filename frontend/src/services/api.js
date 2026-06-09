import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jf_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refrescando = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      try {
        if (!refrescando) {
          refrescando = api.post('/auth/refresh').then(({ data }) => {
            localStorage.setItem('jf_token', data.token);
            return data.token;
          });
        }
        const token = await refrescando;
        refrescando = null;
        error.config.headers.Authorization = `Bearer ${token}`;
        return api(error.config);
      } catch {
        refrescando = null;
        localStorage.removeItem('jf_token');
        localStorage.removeItem('jf_usuario');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
