import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiFilm, FiMonitor, FiFolder, FiExternalLink, FiChevronLeft, FiChevronRight, FiEye, FiArrowLeft, FiPlay } from 'react-icons/fi';
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

function BarraProgreso({ pct }) {
  if (!pct || pct <= 0) return null;
  return (
    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-1.5">
      <div className="h-full bg-jf-verde rounded-full transition-all duration-500" style={{ width: `${Math.min(pct, 100)}%` }} />
    </div>
  );
}

function BadgeProgreso({ item }) {
  const ud = item.UserData;
  if (!ud) return null;

  if (item.Type === 'Series' || item.Type === 'Season') {
    if (ud.Played) return <span className="chip bg-jf-verde/20 text-jf-verde border-jf-verde/30 text-[10px]"><FiEye size={10} /> Completada</span>;
    if (ud.UnplayedItemCount > 0) return <span className="chip bg-blue-500/20 text-blue-400 border-blue-500/30 text-[10px]">{ud.PlayedCount || 0}/{ud.UnplayedItemCount + (ud.PlayedCount || 0)} eps</span>;
    return null;
  }

  if (ud.Played) return <span className="chip bg-jf-verde/20 text-jf-verde border-jf-verde/30 text-[10px]"><FiEye size={10} /> Visto</span>;
  if (ud.PlayedPercentage > 0 && ud.PlayedPercentage < 100) return <span className="chip bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-[10px]">{Math.round(ud.PlayedPercentage)}%</span>;
  return null;
}

export default function Library() {
  const [carpetas, setCarpetas] = useState([]);
  const [carpetaActiva, setCarpetaActiva] = useState(null);
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargandoCarpetas, setCargandoCarpetas] = useState(true);
  const [cargandoItems, setCargandoItems] = useState(false);
  const [pagina, setPagina] = useState(0);
  const porPagina = 50;

  const [navegacion, setNavegacion] = useState([]);
  const [parentActual, setParentActual] = useState(null);

  useEffect(() => {
    api.get('/media/biblioteca/carpetas')
      .then(({ data }) => {
        setCarpetas(data);
        if (data.length > 0 && !carpetaActiva) setCarpetaActiva(data[0].Id);
      })
      .catch(() => {})
      .finally(() => setCargandoCarpetas(false));
  }, []);

  const cargarItems = async (parentId, esHijoDe) => {
    setCargandoItems(true);
    try {
      const params = { limit: porPagina, startIndex: pagina * porPagina };
      if (esHijoDe) {
        params.hijosDe = parentId;
      } else {
        params.parentId = parentId;
      }
      const { data } = await api.get('/media/biblioteca/items', { params });
      setItems(data.items || []);
      setTotal(data.total || 0);
    } catch {
      setItems([]);
      setTotal(0);
    }
    setCargandoItems(false);
  };

  useEffect(() => {
    if (!carpetaActiva) return;
    if (navegacion.length > 0 && parentActual) {
      cargarItems(parentActual, true);
    } else {
      cargarItems(carpetaActiva, false);
    }
  }, [carpetaActiva, pagina, parentActual, navegacion.length]);

  const abrirItem = async (item) => {
    if (item.Type === 'Series') {
      setNavegacion([...navegacion, { id: item.Id, nombre: item.Name, tipo: 'Series' }]);
      setParentActual(item.Id);
      setPagina(0);
    } else if (item.Type === 'Season') {
      setNavegacion([...navegacion, { id: item.Id, nombre: `Temporada ${item.IndexNumber || ''}`, tipo: 'Season' }]);
      setParentActual(item.Id);
      setPagina(0);
    } else if (item.Type === 'Episode') {
      try {
        const { data } = await api.get(`/media/reproducir-directo/${item.Id}`);
        window.open(data.url, '_blank');
      } catch {}
    }
  };

  const retroceder = () => {
    if (navegacion.length === 0) return;
    const nueva = navegacion.slice(0, -1);
    setNavegacion(nueva);
    setParentActual(nueva.length > 0 ? nueva[nueva.length - 1].id : null);
    setPagina(0);
  };

  const totalPaginas = Math.ceil(total / porPagina);
  const carpetaActual = carpetas.find((c) => c.Id === carpetaActiva);
  const Icono = iconosTipo[carpetaActual?.CollectionType] || iconosTipo.default;
  const color = coloresTipo[carpetaActual?.CollectionType] || coloresTipo.default;

  return (
    <div className="max-w-7xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-6">
        {navegacion.length > 0 && (
          <button onClick={retroceder} className="btn-secondary p-2.5"><FiArrowLeft size={18} /></button>
        )}
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color}`}>
          <Icono size={22} />
        </div>
        <div>
          <div className="flex items-center gap-2 text-sm text-jf-muted">
            <span>Biblioteca</span>
            {navegacion.map((n, i) => (
              <span key={i} className="flex items-center gap-1">
                <span className="text-white/30">/</span>
                <span className={i === navegacion.length - 1 ? 'text-white' : ''}>{n.nombre}</span>
              </span>
            ))}
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            {navegacion.length > 0 ? navegacion[navegacion.length - 1].nombre : (carpetaActual?.Name || 'Biblioteca')}
          </h1>
        </div>
      </div>

      {navegacion.length === 0 && (cargandoCarpetas ? (
        <div className="flex gap-3 mb-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-10 w-28 rounded-xl" />)}
        </div>
      ) : (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {carpetas.map((c) => {
            const Icon = iconosTipo[c.CollectionType] || iconosTipo.default;
            return (
              <button key={c.Id} onClick={() => { setCarpetaActiva(c.Id); setPagina(0); setNavegacion([]); }}
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
      ))}

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
          <p className="text-sm text-jf-muted mb-4">{total} items</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {items.map((item) => {
              const titulo = item.Name;
              const year = item.PremiereDate?.slice(0, 4) || item.ProductionYear;
              const tmdbId = item.ProviderIds?.TmdbId;
              const img = item.ImageTags?.Primary
                ? `/api/media/imagen/${item.Id}`
                : null;
              const badge = BadgeProgreso({ item });
              const pct = item.UserData?.PlayedPercentage;
              const esSerie = item.Type === 'Series';
              const esSeason = item.Type === 'Season';
              const esEpisode = item.Type === 'Episode';

              return (
                <div key={item.Id} className="media-card group cursor-pointer" onClick={() => abrirItem(item)}>
                  <div className="aspect-[2/3] bg-jf-hover rounded-2xl overflow-hidden relative">
                    {badge && (
                      <div className="absolute top-2 left-2 z-20">{badge}</div>
                    )}
                    {item.UserData?.Played && (
                      <div className="absolute inset-0 z-10 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <FiEye className="text-white/80" size={32} />
                      </div>
                    )}
                    {img ? (
                      <img src={img} alt={titulo}
                        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                        loading="lazy" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icono className="text-jf-muted/20" size={36} />
                      </div>
                    )}
                    {esSeason && item.IndexNumber && (
                      <div className="absolute top-2 right-2 z-20 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded-lg">
                        T{item.IndexNumber}
                      </div>
                    )}
                    {esEpisode && item.IndexNumber && (
                      <div className="absolute top-2 right-2 z-20 bg-black/70 text-jf-verde text-xs font-bold px-2 py-1 rounded-lg">
                        E{item.IndexNumber}
                      </div>
                    )}
                    <BarraProgreso pct={pct} />
                    <div className="media-overlay" />
                    <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 transition-transform duration-300 z-10">
                      <p className="text-white font-semibold text-sm truncate drop-shadow-lg">{titulo}</p>
                      {year && <p className="text-white/60 text-xs mt-1">{year}</p>}
                      {esEpisode && item.SeriesName && (
                        <p className="text-white/40 text-[10px] truncate mt-0.5">{item.SeriesName}</p>
                      )}
                    </div>
                    <div className="absolute inset-0 z-10" />
                    {!esSerie && !esSeason && !esEpisode && tmdbId && (
                      <Link to={`/media/${item.Type === 'Series' || item.Type === 'Season' ? 'tv' : 'movie'}/${tmdbId}`}
                        className="absolute inset-0 z-20" onClick={(e) => e.stopPropagation()} />
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
