import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFlag, FiCheck } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Issues() {
  const { esAdmin } = useAuth();
  const [issues, setIssues] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!esAdmin) return;
    api.get('/issues').then(({ data }) => setIssues(data)).catch(() => {}).finally(() => setCargando(false));
  }, [esAdmin]);

  const resolver = async (id) => {
    try {
      await api.put(`/issues/${id}/resolver`);
      setIssues((prev) => prev.map((i) => i.id === id ? { ...i, resuelto: 1 } : i));
    } catch {}
  };

  if (!esAdmin) {
    return (
      <div className="max-w-4xl mx-auto px-4 text-center py-20">
        <FiFlag size={48} className="mx-auto mb-4 text-jf-muted/50" />
        <p className="text-lg text-jf-muted">Puedes reportar problemas desde la página de detalle de cada contenido.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-8">Reportes de usuarios</h1>

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-20 rounded-xl" />)}
        </div>
      ) : issues.length === 0 ? (
        <div className="text-center py-20 text-jf-muted">
          <FiFlag size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">No hay reportes</p>
        </div>
      ) : (
        <div className="space-y-3">
          {issues.map((i) => (
            <motion.div key={i.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`card p-4 ${i.resuelto ? 'opacity-60' : ''}`}>
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${i.resuelto ? 'bg-jf-verde/10' : 'bg-red-500/10'}`}>
                  <FiFlag className={i.resuelto ? 'text-jf-verde' : 'text-red-400'} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{i.nombre_usuario}</p>
                  <p className="text-xs text-jf-muted mb-1">
                    {i.tipo === 'playback' ? 'Reproducción' : i.tipo === 'metadata' ? 'Metadatos' : 'Otro'}
                    {' · '}{new Date(i.creado_en).toLocaleDateString('es-ES')}
                  </p>
                  <p className="text-sm text-jf-texto">{i.descripcion}</p>
                </div>
                {!i.resuelto && (
                  <button onClick={() => resolver(i.id)}
                    className="text-jf-verde hover:bg-jf-verde/10 p-2 rounded-lg transition-colors" title="Marcar resuelto">
                    <FiCheck size={18} />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
