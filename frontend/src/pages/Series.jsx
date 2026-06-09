import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiMonitor } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Series() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const { data } = await api.get('/media/search', {
          params: { q: query, tipo: 'tv' },
        });
        setResultados(data);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-white mb-4">Series</h1>
        <div className="relative max-w-xl">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-jf-muted" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar series..."
            className="input pl-12 py-3 text-lg"
            autoFocus
          />
        </div>
      </div>

      {cargando && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      )}

      {!cargando && resultados.length === 0 && query.length >= 2 && (
        <div className="text-center py-20 text-jf-muted">
          <FiMonitor size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No se encontraron series para "{query}"</p>
        </div>
      )}

      {!cargando && resultados.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {resultados.map((serie) => (
            <Link key={serie.id} to={`/media/tv/${serie.id}`}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="card group cursor-pointer"
              >
                <div className="aspect-[2/3] bg-jf-hover overflow-hidden">
                  {serie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${serie.poster_path}`}
                      alt={serie.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-jf-muted">
                      <FiMonitor size={32} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium truncate">{serie.name}</p>
                  <p className="text-xs text-jf-muted mt-1">
                    {serie.first_air_date?.slice(0, 4)} · ★ {serie.vote_average?.toFixed(1)}
                  </p>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
