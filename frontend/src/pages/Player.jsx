import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlay, FiPause, FiMaximize, FiVolume2, FiVolumeX, FiChevronDown } from 'react-icons/fi';
import api from '../services/api';

export default function Player() {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [info, setInfo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [reanudando, setReanudando] = useState(false);
  const [audioSel, setAudioSel] = useState(null);
  const [subSel, setSubSel] = useState(null);
  const [mostrarPistas, setMostrarPistas] = useState(false);
  const playSessionIdRef = useRef(null);
  const ultimoReporteRef = useRef(0);

  useEffect(() => {
    api.get(`/media/player-info/${id}`)
      .then(({ data }) => {
        setInfo(data);
        setCargando(false);
        if (data.pistas?.audio?.length > 0) {
          const def = data.pistas.audio.find((a) => a.isDefault) || data.pistas.audio[0];
          setAudioSel(def.index);
        }
        if (data.pistas?.subtitulos?.length > 0) {
          const def = data.pistas.subtitulos.find((s) => s.isDefault) || null;
          setSubSel(def ? def.index : -1);
        }
      })
      .catch(() => { setCargando(false); });
  }, [id]);

  const reportarProgreso = useCallback(async (forzar) => {
    if (!videoRef.current || !id) return;
    const ahora = Date.now();
    if (!forzar && ahora - ultimoReporteRef.current < 15000) return;
    ultimoReporteRef.current = ahora;
    const posTicks = Math.floor(videoRef.current.currentTime * 10000000);
    try {
      const { data } = await api.post(`/media/reportar-progreso/${id}`, {
        positionTicks: posTicks,
        isPaused: videoRef.current.paused,
        playSessionId: playSessionIdRef.current || undefined,
      });
      if (!playSessionIdRef.current && data.playSessionId) {
        playSessionIdRef.current = data.playSessionId;
      }
    } catch {}
  }, [id]);

  const marcarVisto = useCallback(async () => {
    if (!id) return;
    try { await api.post(`/media/marcar-visto/${id}`); } catch {}
  }, [id]);

  useEffect(() => {
    if (!info) return;
    const interval = setInterval(() => reportarProgreso(false), 15000);
    const onBefore = () => { reportarProgreso(true); };
    window.addEventListener('beforeunload', onBefore);
    window.addEventListener('popstate', onBefore);
    return () => {
      clearInterval(interval);
      reportarProgreso(true);
      window.removeEventListener('beforeunload', onBefore);
      window.removeEventListener('popstate', onBefore);
    };
  }, [info, reportarProgreso]);

  const token = localStorage.getItem('jf_token');

  const construirUrlStream = () => {
    const params = new URLSearchParams();
    if (audioSel != null) params.set('AudioStreamIndex', audioSel);
    if (token) params.set('token', token);
    return `/api/media/stream/${id}?${params.toString()}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e) => {
    const t = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.currentTime = t;
    setCurrentTime(t);
    reportarProgreso(true);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
    }
  };

  const handleVolume = (e) => {
    const v = parseFloat(e.target.value);
    if (videoRef.current) videoRef.current.volume = v;
    setVolume(v);
    if (v > 0 && muted) { setMuted(false); if (videoRef.current) videoRef.current.muted = false; }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  const cambiarAudio = (idx) => {
    setAudioSel(idx);
    if (videoRef.current) {
      videoRef.current.currentTime = videoRef.current.currentTime;
    }
  };

  const cambiarSub = (idx) => {
    setSubSel(idx);
    if (videoRef.current) {
      for (let i = 0; i < videoRef.current.textTracks.length; i++) {
        videoRef.current.textTracks[i].mode = 'hidden';
      }
      if (idx >= 0 && idx < videoRef.current.textTracks.length) {
        videoRef.current.textTracks[idx].mode = 'showing';
      }
    }
  };

  const fmt = (s) => {
    if (!s || !isFinite(s)) return '0:00';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (cargando) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-jf-verde border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex items-center justify-center text-white flex-col gap-4">
        <p className="text-xl">No se pudo cargar el reproductor</p>
        <button onClick={() => navigate(-1)} className="btn-primary">Volver</button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      <div className="flex items-center gap-3 px-4 py-3 bg-black/80 z-10">
        <button onClick={() => navigate(-1)} className="text-white/70 hover:text-white transition-colors">
          <FiArrowLeft size={22} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="text-white font-semibold text-sm truncate">{info.nombre}</h1>
          {info.seriesName && (
            <p className="text-white/50 text-xs truncate">
              {info.seriesName}
              {info.seasonNumber != null && info.episodeNumber != null && ` - T${info.seasonNumber} E${info.episodeNumber}`}
            </p>
          )}
        </div>
        {(info.pistas?.audio?.length > 1 || info.pistas?.subtitulos?.length > 0) && (
          <button onClick={() => setMostrarPistas(!mostrarPistas)}
            className="text-white/60 hover:text-white text-xs flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-colors">
            <FiChevronDown size={14} />
            {mostrarPistas ? 'Ocultar' : 'Audio / Subs'}
          </button>
        )}
      </div>

      {mostrarPistas && (
        <div className="px-4 py-3 bg-black/90 border-b border-white/10">
          {info.pistas?.audio?.length > 1 && (
            <div className="mb-3">
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Audio</p>
              <div className="flex flex-wrap gap-1.5">
                {info.pistas.audio.map((a) => (
                  <button key={a.index} onClick={() => cambiarAudio(a.index)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      audioSel === a.index
                        ? 'bg-jf-verde text-black border-jf-verde font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                    }`}>
                    {a.title}
                  </button>
                ))}
              </div>
            </div>
          )}
          {info.pistas?.subtitulos?.length > 0 && (
            <div>
              <p className="text-white/50 text-[10px] uppercase tracking-wider mb-1.5">Subtítulos</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => cambiarSub(-1)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                    subSel === -1
                      ? 'bg-jf-verde text-black border-jf-verde font-bold'
                      : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                  }`}>
                  Off
                </button>
                {info.pistas.subtitulos.map((s, i) => (
                  <button key={s.index} onClick={() => cambiarSub(i)}
                    className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
                      subSel === i
                        ? 'bg-jf-verde text-black border-jf-verde font-bold'
                        : 'bg-white/5 text-white/70 border-white/10 hover:border-white/30'
                    }`}>
                    {s.language}{s.isForced ? ' (forzado)' : ''}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          key={audioSel ?? 'default'}
          src={construirUrlStream()}
          className="w-full h-full object-contain"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={() => {
            const v = videoRef.current;
            if (!v) return;
            setDuration(v.duration || 0);
            if (info?.resumeSeconds > 1) {
              v.currentTime = info.resumeSeconds;
              setReanudando(true);
              setTimeout(() => setReanudando(false), 3000);
            }
            if (subSel != null && subSel >= 0 && v.textTracks[subSel]) {
              v.textTracks[subSel].mode = 'showing';
            }
          }}
          onEnded={() => { setPlaying(false); marcarVisto(); reportarProgreso(true); }}
          onPlay={() => setPlaying(true)}
          onPause={() => { setPlaying(false); reportarProgreso(true); }}
          controls={false}
          playsInline
        >
          {info.pistas?.subtitulos?.map((s, i) => (
            s.deliveryUrl || s.index != null ? (
              <track key={s.index} kind="subtitles"
                src={`/api/media/subtitulos/${id}/${s.index}?token=${token}`}
                srcLang={s.language || 'und'} label={s.title || s.language}
                default={s.isDefault && subSel === i} />
            ) : null
          ))}
        </video>

        {!playing && (
          <button onClick={togglePlay}
            className="absolute inset-0 flex items-center justify-center bg-black/30 group">
            <div className="w-20 h-20 rounded-full bg-jf-verde/90 flex items-center justify-center shadow-2xl shadow-jf-verde/30 transition-transform group-hover:scale-110">
              <FiPlay size={36} className="text-black ml-1" />
            </div>
          </button>
        )}

        {reanudando && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-jf-verde/90 text-black text-xs font-bold px-4 py-2 rounded-xl shadow-lg animate-pulse">
            Reanudando desde {fmt(info?.resumeSeconds)}
          </div>
        )}
      </div>

      <div className="px-4 py-3 bg-black/90">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-white/60 text-xs font-mono min-w-[4rem]">{fmt(currentTime)}</span>
          <input type="range" min="0" max={duration || 1} step="0.1" value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 appearance-none bg-white/20 rounded-full cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
              [&::-webkit-slider-thumb]:bg-jf-verde [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md" />
          <span className="text-white/60 text-xs font-mono min-w-[4rem] text-right">{fmt(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white hover:text-jf-verde transition-colors">
              {playing ? <FiPause size={20} /> : <FiPlay size={20} />}
            </button>
            <button onClick={toggleMute} className="text-white/60 hover:text-white transition-colors">
              {muted ? <FiVolumeX size={18} /> : <FiVolume2 size={18} />}
            </button>
            <input type="range" min="0" max="1" step="0.05" value={muted ? 0 : volume}
              onChange={handleVolume}
              className="w-20 h-1 appearance-none bg-white/20 rounded-full cursor-pointer
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
                [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full" />
          </div>
          <button onClick={toggleFullscreen} className="text-white/60 hover:text-white transition-colors">
            <FiMaximize size={18} />
          </button>
        </div>
      </div>

      {info.overview && (
        <div className="px-4 py-2 bg-black/80 border-t border-white/5">
          <p className="text-white/40 text-xs line-clamp-2">{info.overview}</p>
        </div>
      )}
    </div>
  );
}
