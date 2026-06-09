import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiClock, FiCalendar, FiStar, FiThumbsUp, FiPlay } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Detail() {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [media, setMedia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitando, setSolicitando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      try {
        const { data } = await api.get(`/media/${tipo}/${id}`);
        setMedia(data);
      } catch {
        toast.error('Error al cargar la información');
        navigate('/');
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [tipo, id, navigate]);

  const solicitar = async () => {
    setSolicitando(true);
    try {
      const tipoPeticion = tipo === 'movie' ? 'movie' : 'series';
      await api.post('/peticiones', {
        tipo: tipoPeticion,
        tmdb_id: String(id),
        titulo: media.title || media.name,
        descripcion: media.overview,
        poster_path: media.poster_path,
      });
      toast.success('¡Petición enviada! Espera la aprobación del admin.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al solicitar');
    } finally {
      setSolicitando(false);
    }
  };

  if (cargando) {
    return (
      <div className="max-w-5xl mx-auto px-4">
        <div className="skeleton h-96 rounded-xl mb-6" />
        <div className="skeleton h-8 w-2/3 mb-3" />
        <div className="skeleton h-4 w-1/3 mb-6" />
        <div className="skeleton h-24 w-full" />
      </div>
    );
  }

  if (!media) return null;

  const backdrop = media.backdrop_path
    ? `https://image.tmdb.org/t/p/original${media.backdrop_path}`
    : null;

  const poster = media.poster_path
    ? `https://image.tmdb.org/t/p/w342${media.poster_path}`
    : null;

  const titulo = media.title || media.name;
  const fecha = media.release_date || media.first_air_date;
  const year = fecha?.slice(0, 4);
  const generos = media.genres?.map((g) => g.name) || [];
  const duracion = media.runtime || media.episode_run_time?.[0];

  const trailer = media.videos?.results?.find(
    (v) => v.type === 'Trailer' && v.site === 'YouTube'
  );
  const reparto = media.credits?.cast?.slice(0, 8) || [];
  const similares = media.similar?.results?.slice(0, 6) || [];

  return (
    <div className="min-h-screen">
      {backdrop && (
        <div className="absolute top-0 left-0 right-0 h-[70vh] -z-10">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-jf-fondo/70 to-jf-fondo z-10" />
          <img
            src={backdrop}
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pt-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8"
        >
          <div className="flex-shrink-0">
            {poster ? (
              <img
                src={poster}
                alt={titulo}
                className="w-64 rounded-xl shadow-2xl"
              />
            ) : (
              <div className="w-64 aspect-[2/3] bg-jf-tarjeta rounded-xl flex items-center justify-center text-jf-muted">
                Sin imagen
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-4xl font-extrabold text-white mb-2">{titulo}</h1>
                <div className="flex flex-wrap items-center gap-3 text-sm text-jf-muted mb-4">
                  {year && <span>{year}</span>}
                  {duracion && (
                    <span className="flex items-center gap-1">
                      <FiClock size={14} /> {duracion} min
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <FiStar className="text-yellow-500" /> {media.vote_average?.toFixed(1)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {generos.map((g) => (
                    <span key={g} className="px-3 py-1 bg-jf-verde/10 text-jf-verde text-xs rounded-full font-medium">
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <p className="text-jf-texto leading-relaxed mb-6">
              {media.overview || 'Sin descripción disponible'}
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={solicitar}
                disabled={solicitando}
                className="btn-primary flex items-center gap-2"
              >
                <FiThumbsUp size={18} />
                {solicitando ? 'Solicitando...' : `Solicitar (${usuario?.monedas} JFC)`}
              </button>

              {trailer && (
                <a
                  href={`https://youtube.com/watch?v=${trailer.key}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary flex items-center gap-2"
                >
                  <FiPlay size={18} /> Ver tráiler
                </a>
              )}
            </div>

            {reparto.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-bold text-white mb-3">Reparto principal</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                  {reparto.map((actor) => (
                    <div key={actor.id} className="flex-shrink-0 text-center w-20">
                      <div className="w-16 h-16 rounded-full bg-jf-hover mx-auto mb-1 overflow-hidden">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-jf-muted text-xs">
                            ?
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-jf-texto truncate">{actor.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {similares.length > 0 && (
          <div className="mt-12 mb-8">
            <h3 className="text-lg font-bold text-white mb-4">Contenido similar</h3>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {similares.map((item) => {
                const img = item.poster_path
                  ? `https://image.tmdb.org/t/p/w185${item.poster_path}`
                  : null;
                return (
                  <div
                    key={item.id}
                    onClick={() => navigate(`/media/${tipo}/${item.id}`)}
                    className="flex-shrink-0 w-28 cursor-pointer group"
                  >
                    <div className="aspect-[2/3] bg-jf-hover rounded-lg overflow-hidden mb-1">
                      {img ? (
                        <img
                          src={img}
                          alt={item.title || item.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-jf-muted text-xs">
                          Sin img
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-jf-texto truncate">{item.title || item.name}</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
