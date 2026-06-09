import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiPlay, FiPause, FiMaximize, FiVolume2, FiVolumeX } from 'react-icons/fi';
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

  useEffect(() => {
    api.get(`/media/player-info/${id}`)
      .then(({ data }) => { setInfo(data); setCargando(false); })
      .catch(() => { setCargando(false); });
  }, [id]);

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
        <div className="min-w-0">
          <h1 className="text-white font-semibold text-sm truncate">{info.nombre}</h1>
          {info.seriesName && (
            <p className="text-white/50 text-xs truncate">
              {info.seriesName}
              {info.seasonNumber != null && info.episodeNumber != null && ` - T${info.seasonNumber} E${info.episodeNumber}`}
            </p>
          )}
        </div>
      </div>

      <div className="flex-1 relative flex items-center justify-center bg-black">
        <video
          ref={videoRef}
          src={info.streamUrl || info.hlsUrl}
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
          }}
          onEnded={() => setPlaying(false)}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          controls={false}
          playsInline
        />

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
