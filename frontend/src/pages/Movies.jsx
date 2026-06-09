import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiSearch, FiFilm } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Movies() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (query.length < 2) return;
    const timer = setTimeout(async () => {
      setCargando(true);
      try {
        const { data } = await api.get('/media/search', {
          params: { q: query, tipo: 'movie' },
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
        <h1 className="text-3xl font-extrabold text-white mb-4">Películas</h1>
        <div className="relative max-w-xl">
          <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-jf-muted" size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar películas..."
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
          <FiFilm size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No se encontraron películas para "{query}"</p>
        </div>
      )}

      {!cargando && resultados.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {resultados.map((movie) => (
            <Link key={movie.id} to={`/media/movie/${movie.id}`}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="card group cursor-pointer"
              >
                <div className="aspect-[2/3] bg-jf-hover overflow-hidden">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-jf-muted">
                      <FiFilm size={32} />
                    </div>
                  )}
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium truncate">{movie.title}</p>
                  <p className="text-xs text-jf-muted mt-1">
                    {movie.release_date?.slice(0, 4)} · ★ {movie.vote_average?.toFixed(1)}
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
