import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFilm, FiMonitor, FiFolder, FiExternalLink, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import api from '../services/api';

const iconosTipo = {
  Movies: FiFilm,
  Series: FiMonitor,
  Shows: FiMonitor,
  default: FiFolder,
};

const coloresTipo = {
  Movies: 'from-blue-500/20 to-purple-500/20 text-blue-400',
  Series: 'from-purple-500/20 to-pink-500/20 text-purple-400',
  Shows: 'from-purple-500/20 to-pink-500/20 text-purple-400',
  default: 'from-emerald-500/20 to-teal-500/20 text-emerald-400',
};

export default function Library() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargandoCarpetas, setCargandoCarpetas] = useState(true);
  const [cargandoItems, setCargandoItems] = useState(false);
  const [pagina, setPagina] = useState(0);
  const porPagina = 50;

  useEffect(() => {
    api.get('/media/biblioteca/carpetas')
      .then(({ data }) => {
        setCarpetas(data);
        if (data.length > 0) setCarpetaActiva(data[0].Id);
      })
      .catch(() => {})
      .finally(() => setCargandoCarpetas(false));
  }, []);

  useEffect(() => {
    if (!carpetaActiva) return;
    setCargandoItems(true);
    api.get('/media/biblioteca/items', {
      params: { parentId: carpetaActiva, limit: porPagina, startIndex: pagina * porPagina },
    })
      .then(({ data }) => {
        setItems(data.items || []);
        setTotal(data.total || 0);
      })
      .catch(() => { setItems([]); setTotal(0); })
      .finally(() => setCargandoItems(false));
  }, [carpetaActiva, pagina]);

  const totalPaginas = Math.ceil(total / porPagina);
  const carpetaActual = carpetas.find((c) => c.Id === carpetaActiva);
  const Icono = iconosTipo[carpetaActual?.CollectionType] || iconosTipo.default;
  const color = coloresTipo[carpetaActual?.CollectionType] || coloresTipo.default;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
          <Icono size={22} />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Biblioteca</h1>
          <p className="text-sm text-jf-muted">Todo el contenido disponible en Jellyfin</p>
        </div>
      </div>

      {cargandoCarpetas ? (
        <div className="flex gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 w-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {carpetas.map((c) => {
            const Icon = iconosTipo[c.CollectionType] || iconosTipo.default;
            return (
              <button key={c.Id} onClick={() => { setCarpetaActiva(c.Id); setPagina(0); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                  carpetaActiva === c.Id
                    ? 'bg-jf-verde text-black shadow-glow'
                    : 'bg-jf-tarjeta text-jf-muted hover:text-white hover:border-jf-verde/30 border border-transparent'
                }`}>
                <Icon size={16} />
                {c.Name}
              </button>
            );
          })}
        </div>
      )}

      {cargandoItems ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {Array.from({ length: 12 }).map((_, i) => <div key={i} className="skeleton aspect-[2/3] rounded-2xl" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-jf-muted">
          <FiFolder size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">Esta biblioteca está vacía</p>
        </div>
      ) : (
        <>
          <p className="text-sm text-jf-muted mb-4">{total} items en {carpetaActual?.Name || 'biblioteca'}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => {
              const titulo = item.Name || item.Name;
              const year = item.PremiereDate?.slice(0, 4) || item.ProductionYear;
              const tmdbId = item.ProviderIds?.TmdbId;
              const img = item.ImageTags?.Primary
                ? `${api.defaults.baseURL?.replace('/api', '') || ''}/Items/${item.Id}/Images/Primary`
                : null;
              return (
                <div key={item.Id} className="media-card group">
                  <div className="aspect-[2/3] bg-jf-hover rounded-2xl overflow-hidden relative">
                    {img ? (
                      <img src={img} alt={titulo}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icono className="text-jf-muted/20" size={36} />
                      </div>
                    )}
                    <div className="media-overlay" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                      <p className="text-white font-semibold text-sm truncate drop-shadow-lg">{titulo}</p>
                      {year && <p className="text-white/60 text-xs mt-1">{year}</p>}
                    </div>
                    {tmdbId ? (
                      <a href={`/media/${item.Type === 'Series' || item.Type === 'Season' ? 'tv' : 'movie'}/${tmdbId}`}
                        className="absolute inset-0 z-10" />
                    ) : (
                      <a href={`${api.defaults.baseURL?.replace('/api', '') || ''}/web/#/details?id=${item.Id}`}
                        target="_blank" rel="noopener noreferrer"
                        className="absolute bottom-2 right-2 z-20 p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition-colors">
                        <FiExternalLink size={14} className="text-white/70" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {totalPaginas > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8 pb-8">
              <button onClick={() => setPagina(Math.max(0, pagina - 1))} disabled={pagina <= 0}
                className="btn-secondary !p-2.5">
                <FiChevronLeft size={18} />
              </button>
              <span className="text-sm text-jf-muted">Página {pagina + 1} de {totalPaginas}</span>
              <button onClick={() => setPagina(Math.min(totalPaginas - 1, pagina + 1))} disabled={pagina >= totalPaginas - 1}
                className="btn-secondary !p-2.5">
                <FiChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
