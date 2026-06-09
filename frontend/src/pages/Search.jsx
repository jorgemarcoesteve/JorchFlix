import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiFilm, FiMonitor, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';

export default function Search() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);

  useEffect(() => {
    if (!query) return;
    setCargando(true);
    const buscar = async () => {
      try {
        const { data } = await api.get('/media/search', { params: { q: query, tipo: 'multi', page: pagina } });
        const filtrados = (data.results || []).filter((r) => r.media_type === 'movie' || r.media_type === 'tv');
        setResultados(filtrados);
        setTotalPaginas(data.total_pages || 0);
      } catch {
        setResultados([]);
      } finally {
        setCargando(false);
      }
    };
    buscar();
  }, [query, pagina]);

  useEffect(() => { setPagina(1); }, [query]);

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
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {resultados.map((item) => {
              const tipo = item.media_type === 'tv' ? 'tv' : 'movie';
              const titulo = item.title || item.name;
              return (
                <Link key={`${tipo}-${item.id}`} to={`/media/${tipo}/${item.id}`}>
                  <motion.div whileHover={{ y: -6, scale: 1.02 }} className="card group cursor-pointer">
                    <div className="aspect-[2/3] bg-jf-hover overflow-hidden relative">
                      {item.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w342${item.poster_path}`}
                          alt={titulo}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-jf-muted">
                          {tipo === 'movie' ? <FiFilm size={32} /> : <FiMonitor size={32} />}
                        </div>
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 bg-black/60 text-xs rounded-full text-white">
                        {tipo === 'movie' ? 'Película' : 'Serie'}
                      </span>
                    </div>
                    <div className="p-2.5">
                      <p className="text-sm font-medium truncate">{titulo}</p>
                      <p className="text-xs text-jf-muted mt-1">★ {item.vote_average?.toFixed(1)}</p>
                    </div>
                  </motion.div>
                </Link>
              );
            })}
          </motion.div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pb-8">
              <button
                onClick={() => setPagina(Math.max(1, pagina - 1))}
                disabled={pagina <= 1}
                className="btn-secondary !p-2.5"
              >
                <FiChevronLeft size={18} />
              </button>
              <span className="text-sm text-jf-muted">
                Página {pagina} de {totalPaginas}
              </span>
              <button
                onClick={() => setPagina(Math.min(totalPaginas, pagina + 1))}
                disabled={pagina >= totalPaginas}
                className="btn-secondary !p-2.5"
              >
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
