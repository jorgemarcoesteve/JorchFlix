import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilm, FiMonitor } from 'react-icons/fi';
import api from '../services/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!query) return;
    const buscar = async () => {
      setCargando(true);
      try {
        const [movies, series] = await Promise.all([
          api.get('/media/search', { params: { q: query, tipo: 'movie' } }),
          api.get('/media/search', { params: { q: query, tipo: 'tv' } }),
        ]);
        setResultados([
          ...movies.data.map((m) => ({ ...m, _tipo: 'movie', _titulo: m.title })),
          ...series.data.map((s) => ({ ...s, _tipo: 'tv', _titulo: s.name })),
        ]);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    };
    buscar();
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl font-bold text-white mb-6">
        Resultados para <span className="text-jf-verde">"{query}"</span>
      </h1>

      {cargando && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      )}

      {!cargando && resultados.length === 0 && (
        <div className="text-center py-20 text-jf-muted">
          <FiSearch size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No se encontraron resultados para "{query}"</p>
        </div>
      )}

      {!cargando && resultados.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {resultados.map((item) => (
            <Link key={`${item._tipo}-${item.id}`} to={`/media/${item._tipo}/${item.id}`}>
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                className="card group cursor-pointer"
              >
                <div className="aspect-[2/3] bg-jf-hover overflow-hidden relative">
                  {item.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                      alt={item._titulo}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-jf-muted">
                      {item._tipo === 'movie' ? <FiFilm size={32} /> : <FiMonitor size={32} />}
                    </div>
                  )}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-xs rounded-full text-white">
                    {item._tipo === 'movie' ? 'Película' : 'Serie'}
                  </span>
                </div>
                <div className="p-2.5">
                  <p className="text-sm font-medium truncate">{item._titulo}</p>
                  <p className="text-xs text-jf-muted mt-1">★ {item.vote_average?.toFixed(1)}</p>
                </div>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}
    </div>
  );
}
