import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiCheck, FiX, FiClock, FiSearch } from 'react-icons/fi';
import api from '../../services/api';

const badgeEstado = {
  pending: { text: 'Pendiente', class: 'text-yellow-500 bg-yellow-500/10' },
  approved: { text: 'Aprobada', class: 'text-blue-500 bg-blue-500/10' },
  rejected: { text: 'Rechazada', class: 'text-red-500 bg-red-500/10' },
  completed: { text: 'Completada', class: 'text-jf-verde bg-jf-verde/10' },
};

export default function AdminRequests() {
  const [peticiones, setPeticiones] = useState([]);
  const [filtro, setFiltro] = useState('pending');
  const [cargando, setCargando] = useState(true);
  const [nota, setNota] = useState({});

  const cargar = async () => {
    try {
      const { data } = await api.get('/peticiones');
      setPeticiones(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const aprobar = async (id) => {
    try {
      await api.put(`/peticiones/${id}/aprobar`);
      toast.success('Petición aprobada y enviada a descarga');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al aprobar');
    }
  };

  const rechazar = async (id) => {
    try {
      await api.put(`/peticiones/${id}/rechazar`, { nota_admin: nota[id] || '' });
      toast.success('Petición rechazada');
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al rechazar');
    }
  };

  const filtradas = filtro === 'all' ? peticiones : peticiones.filter((p) => p.estado === filtro);

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-6">Gestionar peticiones</h1>

      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { key: 'pending', label: 'Pendientes' },
          { key: 'approved', label: 'Aprobadas' },
          { key: 'completed', label: 'Completadas' },
          { key: 'rejected', label: 'Rechazadas' },
          { key: 'all', label: 'Todas' },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFiltro(f.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filtro === f.key
                ? 'bg-jf-verde text-black'
                : 'bg-jf-tarjeta text-jf-muted hover:text-white'
            }`}
          >
            {f.label}
            {f.key !== 'all' && (
              <span className="ml-1.5 opacity-70">
                ({peticiones.filter((p) => p.estado === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-24 rounded-xl" />
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="text-center py-20 text-jf-muted">
          <FiClock size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay peticiones {filtro !== 'all' ? 'en este estado' : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((p) => {
            const badge = badgeEstado[p.estado] || badgeEstado.pending;
            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="card p-4"
              >
                <div className="flex items-start gap-4">
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
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white truncate">{p.titulo}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${badge.class}`}>
                        {badge.text}
                      </span>
                    </div>
                    <p className="text-xs text-jf-muted">
                      {p.nombre_usuario} · {p.tipo === 'movie' ? 'Película' : p.tipo === 'series' ? 'Serie' : 'Anime'}
                      {' · '}
                      {new Date(p.creado_en).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                </div>

                {p.estado === 'pending' && (
                  <div className="mt-4 pt-3 border-t border-jf-borde flex items-center gap-3">
                    <input
                      type="text"
                      placeholder="Nota (opcional)..."
                      value={nota[p.id] || ''}
                      onChange={(e) => setNota({ ...nota, [p.id]: e.target.value })}
                      className="input text-sm flex-1"
                    />
                    <button
                      onClick={() => aprobar(p.id)}
                      className="btn-primary !py-1.5 !px-4 text-sm flex items-center gap-1"
                    >
                      <FiCheck size={16} /> Aprobar
                    </button>
                    <button
                      onClick={() => rechazar(p.id)}
                      className="btn-danger !py-1.5 !px-4 text-sm flex items-center gap-1"
                    >
                      <FiX size={16} /> Rechazar
                    </button>
                  </div>
                )}

                {p.nota_admin && (
                  <p className="mt-2 text-xs text-jf-muted italic">Nota: "{p.nota_admin}"</p>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
