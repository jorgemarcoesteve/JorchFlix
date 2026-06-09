import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { FiFilm, FiStar, FiClock } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';

const badgeEstilos = {
  movie: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tv: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  anime: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
};

const etiquetaTipo = {
  movie: 'Película',
  tv: 'Serie',
  anime: 'Anime',
};

export function MediaCard({ item, tipo, index = 0 }) {
  const poster = item.poster_path
    ? `https://image.tmdb.org/t/p/w342${item.poster_path}`
    : null;

  const backdrop = item.backdrop_path
    ? `https://image.tmdb.org/t/p/w780${item.backdrop_path}`
    : null;

  const titulo = item.title || item.name;
  const year = (item.release_date || item.first_air_date || '').slice(0, 4);
  const badgeClass = badgeEstilos[tipo] || badgeEstilos.movie;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/media/${tipo}/${item.id}`} className="block group">
        <div className="media-card w-44 sm:w-48">
          <div className="aspect-[2/3] bg-jf-hover relative overflow-hidden rounded-2xl">
            {poster ? (
              <img
                src={poster}
                alt={titulo}
                className="w-full h-full object-cover transition-all duration-700 ease-out"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-jf-muted/30">
                  <FiFilm size={40} />
                </div>
              </div>
            )}

            <div className="media-overlay" />

            <div className="absolute top-2 left-2 z-10 flex gap-1.5">
              <span className={`chip text-[10px] uppercase tracking-wider font-bold ${badgeClass}`}>
                {etiquetaTipo[tipo] || tipo}
              </span>
            </div>

            {item.vote_average > 0 && (
              <div className="absolute top-2 right-2 z-10">
                <div className="chip bg-black/60 text-white border-white/10 gap-1 text-xs">
                  <FiStar className="text-yellow-400" size={12} />
                  {item.vote_average.toFixed(1)}
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-0 p-3 z-10 translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <p className="text-white font-semibold text-sm leading-tight line-clamp-2 drop-shadow-lg">
                {titulo}
              </p>
              {year && (
                <p className="text-white/60 text-xs mt-1 flex items-center gap-1">
                  <FiClock size={10} />
                  {year}
                </p>
              )}
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}


