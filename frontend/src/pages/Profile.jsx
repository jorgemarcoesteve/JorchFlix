import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiClock } from 'react-icons/fi';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { usuario } = useAuth();
  const [historial, setHistorial] = useState([]);
  const [clasificacion, setClasificacion] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [hist, clasif] = await Promise.all([
          api.get('/monedas/historial'),
          api.get('/monedas/clasificacion'),
        ]);
        setHistorial(hist.data);
        setClasificacion(clasif.data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-8 mb-8 text-center"
      >
        <div className="w-20 h-20 rounded-full bg-jf-verde/20 flex items-center justify-center mx-auto mb-4">
          <span className="text-3xl font-bold text-jf-verde">
            {usuario?.nombre_usuario?.charAt(0).toUpperCase()}
          </span>
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">{usuario?.nombre_usuario}</h1>
        {usuario?.es_admin && (
          <span className="inline-block px-3 py-1 bg-jf-verde/10 text-jf-verde text-xs rounded-full font-medium mb-4">
            Administrador
          </span>
        )}
        <div className="flex items-center justify-center gap-2 mt-4">
          <FiDollarSign className="text-yellow-500" size={24} />
          <span className="text-3xl font-extrabold text-white">{usuario?.monedas}</span>
          <span className="text-jf-muted">JFC</span>
        </div>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiClock size={18} className="text-jf-verde" />
            Últimas transacciones
          </h2>
          {cargando ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : historial.length === 0 ? (
            <p className="text-jf-muted text-sm">Sin transacciones</p>
          ) : (
            <div className="space-y-2">
              {historial.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-jf-borde last:border-0">
                  <div>
                    <p className="text-sm text-jf-texto">{t.descripcion}</p>
                    <p className="text-xs text-jf-muted">{new Date(t.creado_en).toLocaleDateString('es-ES')}</p>
                  </div>
                  <span className={`font-semibold ${t.cantidad > 0 ? 'text-jf-verde' : 'text-red-400'}`}>
                    {t.cantidad > 0 ? '+' : ''}{t.cantidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="card p-6"
        >
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <FiTrendingUp size={18} className="text-jf-verde" />
            Clasificación
          </h2>
          {cargando ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="skeleton h-10 rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {clasificacion.map((u, i) => (
                <div
                  key={u.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${
                    u.id === usuario?.id ? 'bg-jf-verde/10 border border-jf-verde/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      i === 0 ? 'bg-yellow-500 text-black' :
                      i === 1 ? 'bg-gray-400 text-black' :
                      i === 2 ? 'bg-amber-700 text-white' :
                      'bg-jf-hover text-jf-muted'
                    }`}>
                      {i + 1}
                    </span>
                    <span className="text-sm text-jf-texto">{u.nombre_usuario}</span>
                  </div>
                  <span className="text-sm font-semibold text-jf-verde">{u.monedas} JFC</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
