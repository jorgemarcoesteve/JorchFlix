import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiClock, FiCalendar, FiStar, FiThumbsUp, FiPlay, FiInfo, FiCheck, FiExternalLink, FiFlag } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { MediaCard } from '../components/MediaCard';

export default function Detail() {
  const { tipo, id } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [media, setMedia] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [solicitando, setSolicitando] = useState(false);
  const [estadoPeticion, setEstadoPeticion] = useState(null);
  const [enJellyfin, setEnJellyfin] = useState(false);
  const [playUrl, setPlayUrl] = useState(null);
  const [temporadasSeleccionadas, setTemporadasSeleccionadas] = useState([]);
  const [mostrarSelectorTemp, setMostrarSelectorTemp] = useState(false);
  const [mostrarIssue, setMostrarIssue] = useState(false);
  const [issueTipo, setIssueTipo] = useState('playback');
  const [issueDesc, setIssueDesc] = useState('');

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

  useEffect(() => {
    if (!media) return;
    api.get('/peticiones/mis-peticiones').then(({ data }) => {
      const encontrada = data.find(
        (p) => p.tmdb_id === String(id) && p.tipo === (tipo === 'tv' ? 'series' : 'movie') && p.estado !== 'rejected'
      );
      if (encontrada) setEstadoPeticion(encontrada.estado);
    }).catch(() => {});

    api.get('/media/en-jellyfin', { params: { tmdb_id: id, tipo } }).then(({ data }) => {
      if (data.existe) setEnJellyfin(true);
    }).catch(() => {});

    api.get('/media/reproducir', { params: { tmdb_id: id, tipo } }).then(({ data }) => {
      if (data.disponible) setPlayUrl(data.url);
    }).catch(() => {});
  }, [media, tipo, id]);

  const solicitar = async (temporadas) => {
    setSolicitando(true);
    try {
      const tipoPeticion = tipo === 'movie' ? 'movie' : 'series';
      const payload = {
        tipo: tipoPeticion,
        tmdb_id: String(id),
        titulo: media.title || media.name,
        descripcion: media.overview,
        poster_path: media.poster_path,
      };
      if (temporadas) payload.temporadas = temporadas;

      await api.post('/peticiones', payload);
      toast.success('¡Petición enviada! Espera la aprobación del admin.');
      setEstadoPeticion('pending');
    } catch (err) {
      if (err.response?.status === 409) {
        toast.error('Ya solicitaste este contenido');
        setEstadoPeticion('pending');
      } else {
        toast.error(err.response?.data?.error || 'Error al solicitar');
      }
    } finally {
      setSolicitando(false);
    }
  };

  const badgesEstado = {
    pending: { text: 'Pendiente', class: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    approved: { text: 'Procesando...', class: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    completed: { text: 'Disponible en Jellyfin', class: 'bg-jf-verde/20 text-jf-verde border-jf-verde/30' },
  };

  if (cargando) {
    return (
      <div>
        <div className="h-[60vh] skeleton rounded-none" />
        <div className="max-w-5xl mx-auto px-4 -mt-32 relative">
          <div className="flex gap-8">
            <div className="skeleton w-72 aspect-[2/3] rounded-2xl flex-shrink-0" />
            <div className="flex-1 space-y-4 pt-16">
              <div className="skeleton h-10 w-2/3" />
              <div className="skeleton h-5 w-1/3" />
              <div className="skeleton h-24 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!media) return null;

  const backdrop = media.backdrop_path ? `https://image.tmdb.org/t/p/original${media.backdrop_path}` : null;
  const poster = media.poster_path ? `https://image.tmdb.org/t/p/w342${media.poster_path}` : null;
  const titulo = media.title || media.name;
  const fecha = media.release_date || media.first_air_date;
  const year = fecha?.slice(0, 4);
  const generos = media.genres?.map((g) => g.name) || [];
  const duracion = media.runtime || media.episode_run_time?.[0];
  const trailer = media.videos?.results?.find((v) => v.type === 'Trailer' && v.site === 'YouTube');
  const reparto = media.credits?.cast?.slice(0, 10) || [];
  const similares = media.similar?.results?.slice(0, 6) || [];
  const temporadas = media.seasons?.filter((s) => s.season_number > 0) || [];

  return (
    <div className="min-h-screen pb-16">
      {backdrop && (
        <div className="relative h-[60vh] -mt-20">
          <div className="absolute inset-0">
            <img src={backdrop} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-jf-fondo via-jf-fondo/60 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-jf-fondo/40 via-transparent to-transparent" />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 -mt-48 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-8 items-start"
        >
          <div className="flex-shrink-0 w-full md:w-72">
            {poster ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
              >
                <img src={poster} alt={titulo} className="w-full object-cover" />
              </motion.div>
            ) : (
              <div className="aspect-[2/3] bg-jf-tarjeta rounded-2xl flex items-center justify-center">
                <FiInfo className="text-jf-muted/30" size={48} />
              </div>
            )}
          </div>

          <div className="flex-1 pt-4 md:pt-20">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
                  {titulo}
                </h1>
                {enJellyfin && (
                  <span className="chip text-xs bg-jf-verde/20 text-jf-verde border-jf-verde/30">
                    <FiCheck size={12} className="mr-1" />
                    En Jellyfin
                  </span>
                )}
                {estadoPeticion && !enJellyfin && (
                  <span className={`chip text-xs ${badgesEstado[estadoPeticion]?.class || ''}`}>
                    <FiCheck size={12} className="mr-1" />
                    {badgesEstado[estadoPeticion]?.text}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 mt-4 text-sm">
                {year && (
                  <span className="chip bg-white/10 text-white border-white/10 gap-1.5">
                    <FiCalendar size={12} />
                    {year}
                  </span>
                )}
                {duracion && (
                  <span className="chip bg-white/10 text-white border-white/10 gap-1.5">
                    <FiClock size={12} />
                    {duracion} min
                  </span>
                )}
                {media.vote_average > 0 && (
                  <span className="chip bg-yellow-500/20 text-yellow-400 border-yellow-500/20 gap-1.5">
                    <FiStar size={12} />
                    {media.vote_average.toFixed(1)}
                  </span>
                )}
                <span className="chip bg-jf-verde/10 text-jf-verde border-jf-verde/20 uppercase text-[10px] tracking-wider font-bold">
                  {tipo === 'movie' ? 'Película' : 'Serie'}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mt-4">
                {generos.map((g) => (
                  <span key={g} className="px-3 py-1.5 bg-jf-verde/10 text-jf-verde text-xs rounded-xl font-medium border border-jf-verde/20 hover:bg-jf-verde/20 transition-colors cursor-default">
                    {g}
                  </span>
                ))}
              </div>

              {media.tagline && (
                <p className="text-jf-muted italic text-lg mt-4 border-l-2 border-jf-verde/30 pl-4">{media.tagline}</p>
              )}

              <p className="text-jf-texto leading-relaxed mt-5 text-base max-w-2xl">
                {media.overview || 'Sin descripción disponible.'}
              </p>

              {temporadas.length > 0 && mostrarSelectorTemp && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 p-4 bg-jf-fondo-alt rounded-2xl border border-jf-borde-claro"
                >
                  <p className="text-sm font-medium text-white mb-3">Selecciona temporadas:</p>
                  <div className="flex flex-wrap gap-2">
                    {temporadas.map((s) => (
                      <button
                        key={s.season_number}
                        onClick={() => {
                          setTemporadasSeleccionadas((prev) =>
                            prev.includes(s.season_number)
                              ? prev.filter((n) => n !== s.season_number)
                              : [...prev, s.season_number]
                          );
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                          temporadasSeleccionadas.includes(s.season_number)
                            ? 'bg-jf-verde text-black border-jf-verde'
                            : 'bg-jf-tarjeta text-jf-texto border-jf-borde hover:border-jf-verde/50'
                        }`}
                      >
                        T{s.season_number} {s.name !== `Season ${s.season_number}` && s.name}
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => setTemporadasSeleccionadas(temporadas.map((s) => s.season_number))}
                      className="text-xs text-jf-verde hover:underline"
                    >
                      Seleccionar todas
                    </button>
                    <button
                      onClick={() => setTemporadasSeleccionadas([])}
                      className="text-xs text-jf-muted hover:underline"
                    >
                      Limpiar
                    </button>
                  </div>
                </motion.div>
              )}

              <div className="flex flex-wrap gap-3 mt-8">
                {playUrl ? (
                  <a href={playUrl} target="_blank" rel="noopener noreferrer"
                    className="btn-primary gap-2 text-base px-8 py-3.5">
                    <FiPlay size={20} />
                    Reproducir en Jellyfin
                  </a>
                ) : !estadoPeticion ? (
                  <button
                    onClick={() => {
                      if (temporadas.length > 0 && !mostrarSelectorTemp) {
                        setMostrarSelectorTemp(true);
                      } else {
                        solicitar(temporadasSeleccionadas.length > 0 ? temporadasSeleccionadas : undefined);
                      }
                    }}
                    disabled={solicitando}
                    className="btn-primary gap-2 text-base px-8 py-3.5"
                  >
                    <FiThumbsUp size={20} />
                    {solicitando
                      ? 'Solicitando...'
                      : mostrarSelectorTemp
                        ? `Confirmar (${usuario?.monedas || 0} JFC)`
                        : `Solicitar (${usuario?.monedas || 0} JFC)`}
                  </button>
                ) : null}

                {trailer && (
                  <a href={`https://youtube.com/watch?v=${trailer.key}`} target="_blank" rel="noopener noreferrer"
                    className="btn-secondary gap-2 text-base px-8 py-3.5">
                    <FiPlay size={20} />
                    Ver tráiler
                  </a>
                )}

                <button onClick={() => setMostrarIssue(!mostrarIssue)}
                  className="btn-secondary gap-2 text-base px-4 py-3.5">
                  <FiFlag size={18} />
                </button>
              </div>

              {mostrarIssue && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-jf-fondo-alt rounded-2xl border border-jf-borde-claro max-w-md">
                  <p className="text-sm font-medium text-white mb-3">Reportar problema</p>
                  <select value={issueTipo} onChange={(e) => setIssueTipo(e.target.value)}
                    className="input text-sm mb-2">
                    <option value="playback">Problema de reproducción</option>
                    <option value="metadata">Error en metadatos</option>
                    <option value="other">Otro</option>
                  </select>
                  <textarea value={issueDesc} onChange={(e) => setIssueDesc(e.target.value)}
                    placeholder="Describe el problema..." rows={2}
                    className="input text-sm mb-2 resize-none" />
                  <button onClick={async () => {
                    if (!issueDesc) return toast.error('Describe el problema');
                    try {
                      await api.post('/issues', { tipo: issueTipo, descripcion: issueDesc });
                      toast.success('Reporte enviado');
                      setMostrarIssue(false);
                      setIssueDesc('');
                    } catch { toast.error('Error al enviar reporte'); }
                  }} className="btn-primary !py-1.5 text-sm">Enviar reporte</button>
                </motion.div>
              )}
            </motion.div>

            {reparto.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="mt-12"
              >
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-1 h-5 bg-jf-verde rounded-full" />
                  Reparto principal
                </h3>
                <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
                  {reparto.map((actor) => (
                    <div key={actor.id} className="flex-shrink-0 text-center w-20 group">
                      <div className="w-16 h-16 mx-auto mb-2 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-jf-verde/40 transition-all duration-300">
                        {actor.profile_path ? (
                          <img src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`} alt={actor.name}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-jf-hover flex items-center justify-center text-jf-muted text-xs">?</div>
                        )}
                      </div>
                      <p className="text-xs text-jf-texto font-medium truncate">{actor.name}</p>
                      <p className="text-[10px] text-jf-muted/60 truncate">{actor.character}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>

        {similares.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-16"
          >
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-jf-verde rounded-full" />
              Contenido similar
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
              {similares.map((item, i) => (
                <div key={item.id} className="flex-shrink-0" onClick={() => navigate(`/media/${tipo}/${item.id}`)}>
                  <MediaCard item={item} tipo={tipo} index={i} />
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
