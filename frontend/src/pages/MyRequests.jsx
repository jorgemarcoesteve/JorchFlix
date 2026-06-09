import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiClock, FiCheck, FiX, FiLoader } from 'react-icons/fi';
import api from '../services/api';

const badgeEstado = {
  pending: { icon: FiClock, text: 'Pendiente', color: 'text-yellow-500 bg-yellow-500/10' },
  approved: { icon: FiLoader, text: 'Aprobada', color: 'text-blue-500 bg-blue-500/10' },
  rejected: { icon: FiX, text: 'Rechazada', color: 'text-red-500 bg-red-500/10' },
  completed: { icon: FiCheck, text: 'Completada', color: 'text-jf-verde bg-jf-verde/10' },
};

export default function MyRequests() {
  const [peticiones, setPeticiones] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/peticiones/mis-peticiones')
      .then(({ data }) => setPeticiones(data))
      .catch(() => {})
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-8">Mis peticiones</h1>

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-20 rounded-xl" />
          ))}
        </div>
      ) : peticiones.length === 0 ? (
        <div className="text-center py-20 text-jf-muted">
          <FiClock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No has realizado ninguna petición aún</p>
          <p className="text-sm mt-1">Busca contenido y solicítalo desde el detalle</p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {peticiones.map((p) => {
            const badge = badgeEstado[p.estado] || badgeEstado.pending;
            const BadgeIcon = badge.icon;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4 flex items-center gap-4"
              >
                <div className="w-12 h-16 rounded bg-jf-hover overflow-hidden flex-shrink-0">
                  {p.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w92${p.poster_path}`}
                      alt={p.titulo}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-jf-muted text-xs">
                      ?
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-white truncate">{p.titulo}</h3>
                  <p className="text-xs text-jf-muted">
                    {p.tipo === 'movie' ? 'Película' : p.tipo === 'series' ? 'Serie' : 'Anime'}
                    {' · '}
                    {new Date(p.creado_en).toLocaleDateString('es-ES')}
                  </p>
                </div>
                <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${badge.color}`}>
                  <BadgeIcon size={14} />
                  {badge.text}
                </span>
                {p.nota_admin && (
                  <p className="text-xs text-jf-muted hidden md:block max-w-xs truncate">
                    "{p.nota_admin}"
                  </p>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
