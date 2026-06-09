import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSearch, FiFilm, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Movies() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const [totalResultados, setTotalResultados] = useState(0);
  const [generos, setGeneros] = useState([]);
  const [generoSeleccionado, setGeneroSeleccionado] = useState('');
  const [misPeticiones, setMisPeticiones] = useState({});
  const inputRef = useRef(null);

  useEffect(() => {
    api.get('/media/generos?tipo=movie').then(({ data }) => {
      setGeneros(data.genres || []);
    }).catch(() => {});

    api.get('/peticiones/mis-peticiones').then(({ data }) => {
      const map = {};
      data.forEach((p) => {
        if (p.tmdb_id && (p.estado === 'pending' || p.estado === 'completed' || p.estado === 'approved')) {
          map[`movie-${p.tmdb_id}`] = p.estado;
        }
      });
      setMisPeticiones(map);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResultados([]);
      setTotalPaginas(0);
      return;
    }
    setCargando(true);
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/media/search', { params: { q: query, tipo: 'movie', page: pagina } });
        setResultados(data.results || []);
        setTotalPaginas(data.total_pages || 0);
        setTotalResultados(data.total_results || 0);
      } catch {
        setResultados([]);
        setTotalPaginas(0);
      } finally {
        setCargando(false);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [query, pagina]);

  useEffect(() => {
    setPagina(1);
  }, [query]);

  const filtrados = generoSeleccionado
    ? resultados.filter((m) => m.genre_ids?.includes(parseInt(generoSeleccionado)))
    : resultados;

  const obtenerBadge = (item) => {
    const key = `movie-${item.id}`;
    const estado = misPeticiones[key];
    if (!estado) return null;
    if (estado === 'pending') return { text: 'Pendiente', class: 'bg-yellow-500' };
    if (estado === 'approved') return { text: 'Aprobada', class: 'bg-blue-500' };
    if (estado === 'completed') return { text: 'Disponible', class: 'bg-jf-verde' };
    return null;
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 pt-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
              <FiFilm className="text-blue-400" size={22} />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Películas</h1>
              <p className="text-sm text-jf-muted">Busca y descubre nuevas películas</p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 flex-wrap">
            <div className="relative flex-1 min-w-[250px] max-w-xl">
              <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-jf-muted/50" size={20} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar películas..."
                className="w-full pl-12 pr-4 py-3.5 bg-jf-fondo-alt border border-jf-borde-claro rounded-2xl
                           text-jf-texto placeholder-jf-muted/40 text-lg
                           focus:outline-none focus:border-jf-verde/50 focus:ring-2 focus:ring-jf-verde/10
                           transition-all duration-300"
                autoFocus
              />
            </div>

            {generos.length > 0 && query.length >= 2 && (
              <select
                value={generoSeleccionado}
                onChange={(e) => setGeneroSeleccionado(e.target.value)}
                className="input w-auto min-w-[160px] text-sm"
              >
                <option value="">Todos los géneros</option>
                {generos.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            )}
          </div>

          {query.length >= 2 && !cargando && totalResultados > 0 && (
            <p className="text-sm text-jf-muted mt-3">
              {totalResultados} resultados para "<span className="text-white">{query}</span>"
              {generoSeleccionado && ` · filtrado por ${generos.find(g => g.id === parseInt(generoSeleccionado))?.name}`}
            </p>
          )}
        </motion.div>

        <div className="mt-8">
          {cargando && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
              ))}
            </div>
          )}

          {!cargando && query.length >= 2 && filtrados.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-20">
              <div className="w-20 h-20 rounded-2xl bg-jf-tarjeta flex items-center justify-center mx-auto mb-6">
                <FiFilm className="text-jf-muted/30" size={36} />
              </div>
              <p className="text-xl text-jf-muted font-medium">Sin resultados</p>
              <p className="text-jf-muted/50 mt-1">No encontramos "{query}"</p>
            </motion.div>
          )}

          {!cargando && filtrados.length > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
              >
                {filtrados.map((movie, i) => {
                  const poster = movie.poster_path
                    ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                    : null;
                  const badge = obtenerBadge(movie);
                  return (
                    <Link key={movie.id} to={`/media/movie/${movie.id}`}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="media-card group"
                      >
                        <div className="aspect-[2/3] bg-jf-hover rounded-2xl overflow-hidden relative">
                          {badge && (
                            <span className={`absolute top-2 left-2 z-20 px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${badge.class}`}>
                              {badge.text}
                            </span>
                          )}
                          {poster ? (
                            <img
                              src={poster}
                              alt={movie.title}
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <FiFilm className="text-jf-muted/20" size={36} />
                            </div>
                          )}
                          <div className="media-overlay" />
                          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                            <p className="text-white font-semibold text-sm truncate drop-shadow-lg">
                              {movie.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-white/60 text-xs">
                                {movie.release_date?.slice(0, 4)}
                              </span>
                              {movie.vote_average > 0 && (
                                <span className="text-yellow-400 text-xs flex items-center gap-1">
                                  ★ {movie.vote_average.toFixed(1)}
                                </span>
                              )}
                            </div>
                          </div>
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
            </AnimatePresence>
          )}

          {query.length < 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
              <div className="w-24 h-24 rounded-3xl bg-jf-tarjeta flex items-center justify-center mx-auto mb-6">
                <FiSearch className="text-jf-muted/20" size={44} />
              </div>
              <p className="text-lg text-jf-muted">Escribe al menos 2 caracteres para buscar</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
