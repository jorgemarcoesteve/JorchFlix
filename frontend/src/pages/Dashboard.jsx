import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiTrendingUp, FiFilm, FiMonitor, FiStar } from 'react-icons/fi';
import api from '../services/api';

function MediaCard({ item, tipo }) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  return (
    <motion.div
      whileHover={{ y: -8, scale: 1.02 }}
      className="card group cursor-pointer flex-shrink-0 w-44"
    >
      <Link to={`/media/${tipo}/${item.id}`}>
        <div className="aspect-[2/3] bg-jf-hover relative overflow-hidden">
          {poster ? (
            <img
              src={poster}
              alt={item.title || item.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-jf-muted">
              <FiFilm size={32} />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="p-2.5">
          <p className="text-sm font-medium truncate">{item.title || item.name}</p>
          <div className="flex items-center gap-1 text-xs text-jf-muted mt-1">
            <FiStar className="text-yellow-500" size={12} />
            <span>{item.vote_average?.toFixed(1)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function MediaRow({ titulo, icon: Icon, items, tipo, link }) {
  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-4">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="text-jf-verde" size={20} />}
          <h2 className="text-xl font-bold text-white">{titulo}</h2>
        </div>
        {link && (
          <Link to={link} className="text-jf-verde text-sm hover:underline">
            Ver todo
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto pb-2 px-4 scrollbar-none">
        {items.slice(0, 12).map((item) => (
          <MediaCard key={item.id} item={item} tipo={tipo} />
        ))}
      </div>
    </section>
  );
}

export default function Dashboard() {
  const [trendingMovies, setTrendingMovies] = useState([]);
  const [trendingSeries, setTrendingSeries] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [movies, series, now] = await Promise.all([
          api.get('/api/media/search?q=avengers&tipo=movie'), // fallback
          api.get('/api/media/search?q=breaking&tipo=tv'),
          api.get('/api/media/search?q=2024&tipo=movie'),
        ]);
        setTrendingMovies(movies.data || []);
        setTrendingSeries(series.data || []);
        setNowPlaying(now.data || []);
      } catch (err) {
        console.error('Error cargando dashboard:', err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, []);

  if (cargando) {
    return (
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[2/3] rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="px-4 mb-8">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-3xl font-extrabold text-white"
        >
          ¿Qué quieres ver hoy?
        </motion.h1>
        <p className="text-jf-muted mt-1">Explora, pide y disfruta</p>
      </div>

      <MediaRow
        titulo="Películas populares"
        icon={FiFilm}
        items={trendingMovies}
        tipo="movie"
        link="/movies"
      />
      <MediaRow
        titulo="Series destacadas"
        icon={FiMonitor}
        items={trendingSeries}
        tipo="tv"
        link="/series"
      />
      <MediaRow
        titulo="Tendencias"
        icon={FiTrendingUp}
        items={nowPlaying}
        tipo="movie"
      />
    </div>
  );
}
