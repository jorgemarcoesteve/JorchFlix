import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFilm, FiMonitor, FiExternalLink } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Library() {
  const [vista, setVista] = useState('movies');
  const [items, setItems] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    const endpoint = vista === 'movies' ? '/media/biblioteca/peliculas' : '/media/biblioteca/series';
    api.get(endpoint)
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setCargando(false));
  }, [vista]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20">
          {vista === 'movies' ? <FiFilm className="text-emerald-400" size={22} /> : <FiMonitor className="text-teal-400" size={22} />}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Biblioteca</h1>
          <p className="text-sm text-jf-muted">Contenido disponible en Jellyfin</p>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setVista('movies')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'movies' ? 'bg-jf-verde text-black' : 'bg-jf-tarjeta text-jf-muted hover:text-white'}`}>
          Películas
        </button>
        <button onClick={() => setVista('series')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${vista === 'series' ? 'bg-jf-verde text-black' : 'bg-jf-tarjeta text-jf-muted hover:text-white'}`}>
          Series
        </button>
      </div>

      {cargando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-jf-muted">
          <FiFilm size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay contenido en la biblioteca</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {items.map((item) => {
            const titulo = item.Name || item.Name;
            const year = item.PremiereDate?.slice(0, 4);
            const img = item.ImageTags?.Primary
              ? `${api.defaults.baseURL?.replace('/api', '') || ''}/Items/${item.Id}/Images/Primary`
              : null;
            return (
              <div key={item.Id} className="media-card group">
                <div className="aspect-[2/3] bg-jf-hover rounded-2xl overflow-hidden relative">
                  {img ? (
                    <img src={img} alt={titulo} className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <FiFilm className="text-jf-muted/20" size={36} />
                    </div>
                  )}
                  <div className="media-overlay" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                    <p className="text-white font-semibold text-sm truncate drop-shadow-lg">{titulo}</p>
                    {year && <p className="text-white/60 text-xs mt-1">{year}</p>}
                  </div>
                  <a href={`/media/${vista === 'movies' ? 'movie' : 'tv'}/${item.ProviderIds?.TmdbId || item.Id}`}
                    className="absolute inset-0 z-10" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
