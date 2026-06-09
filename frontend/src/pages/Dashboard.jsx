import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiFilm, FiMonitor, FiStar, FiArrowRight } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { MediaRow } from '../components/MediaRow';
import api from '../services/api';

function HeroSection() {
  const { usuario } = useAuth();

  return (
    <section className="relative min-h-[70vh] flex items-center overflow-hidden">
      <div className="absolute inset-0 hero-gradient opacity-80" />
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-jf-verde/5 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-jf-verde-oscuro/5 rounded-full blur-[120px] animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 w-full">
        <div className="max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="chip bg-jf-verde/10 text-jf-verde border-jf-verde/20">
                <FiStar size={12} className="mr-1" />
                {usuario?.monedas || 0} JFC disponibles
              </span>
              {usuario?.es_admin && (
                <span className="chip bg-purple-500/10 text-purple-400 border-purple-500/20">
                  Administrador
                </span>
              )}
            </div>

            <h1 className="text-hero text-white tracking-tight">
              ¿Qué quieres
              <br />
              <span className="text-gradient">ver hoy?</span>
            </h1>

            <p className="text-lg text-jf-muted mt-4 max-w-xl leading-relaxed">
              Explora, solicita y disfruta de tu contenido favorito.
              Cada petición te cuesta{' '}
              <span className="text-jf-verde font-semibold">1 JFC</span>.
            </p>

            <div className="flex items-center gap-3 mt-8">
              <Link to="/movies" className="btn-primary gap-2">
                <FiFilm size={18} />
                Explorar películas
              </Link>
              <Link to="/series" className="btn-secondary gap-2">
                <FiMonitor size={18} />
                Explorar series
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function TrendingPreview({ titulo, items, tipo, link }) {
  if (!items || items.length === 0) return null;
  const top = items.slice(0, 5);

  return (
    <section className="mb-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-yellow-500/20 to-orange-500/20">
              <FiTrendingUp className="text-yellow-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">{titulo}</h2>
              <p className="text-xs text-jf-muted">Lo más popular ahora</p>
            </div>
          </div>
          {link && (
            <Link to={link} className="text-sm text-jf-verde hover:text-jf-verde-claro transition-colors font-medium flex items-center gap-1">
              Ver más <FiArrowRight size={14} />
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {top.map((item, i) => {
            const poster = item.poster_path
              ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
              : null;
            const tituloItem = item.title || item.name;
            return (
              <Link key={item.id} to={`/media/${tipo}/${item.id}`} className="group">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="relative"
                >
                  <div className="aspect-[2/3] bg-jf-hover rounded-2xl overflow-hidden relative">
                    {poster ? (
                      <img
                        src={poster}
                        alt={tituloItem}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FiFilm className="text-jf-muted/20" size={32} />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <div className="absolute top-2 left-2">
                      <span className="chip bg-black/60 text-white text-[10px] font-bold border-white/10">
                        #{i + 1}
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                      <p className="text-white text-xs font-semibold drop-shadow-lg truncate">
                        {tituloItem}
                      </p>
                    </div>
                  </div>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </motion.div>
    </section>
  );
}

export default function Dashboard() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [popularMovies, setPopularMovies] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [trendMov, trendSerie, pop, top] = await Promise.all([
          api.get('/media/trending?tipo=movie&tiempo=week'),
          api.get('/media/trending?tipo=tv&tiempo=week'),
          api.get('/media/popular?tipo=movie'),
          api.get('/media/top-rated?tipo=movie'),
        ]);
        setTrendingMovies(trendMov.data.results || []);
        setTrendingSeries(trendSerie.data.results || []);
        setPopularMovies(pop.data.results || []);
        setTopRated(top.data.results || []);
      } catch {
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div>
        <div className="h-[70vh] skeleton rounded-none" />
        <div className="max-w-7xl mx-auto px-4 -mt-20 relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroSection />

      <div className="-mt-20 relative z-10">
        <TrendingPreview
          titulo="Tendencias de la semana"
          items={trendingMovies}
          tipo="movie"
          link="/movies"
        />
      </div>

      <div className="max-w-7xl mx-auto">
        <MediaRow
          titulo="Películas populares"
          subtitulo="Las más populares del momento en TMDB"
          icon={FiFilm}
          items={popularMovies}
          tipo="movie"
          link="/movies"
        />

        <MediaRow
          titulo="Series en tendencia"
          subtitulo="No te pierdas lo que todos están viendo"
          icon={FiMonitor}
          items={trendingSeries}
          tipo="tv"
          link="/series"
        />

        <MediaRow
          titulo="Mejor valoradas"
          subtitulo="Las películas con mejores críticas"
          icon={FiStar}
          items={topRated}
          tipo="movie"
        />
      </div>
    </div>
  );
}
