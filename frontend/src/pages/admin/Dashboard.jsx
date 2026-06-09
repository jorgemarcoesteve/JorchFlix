import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiList, FiSettings, FiDollarSign, FiAlertCircle, FiCheckCircle, FiActivity, FiWifi } from 'react-icons/fi';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [health, setHealth] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/admin/stats'),
      api.get('/admin/health'),
    ]).then(([s, h]) => {
      setStats(s.data);
      setHealth(h.data);
    }).catch(() => {})
    .finally(() => setCargando(false));
  }, []);

  const serviciosConfigurados = health
    ? Object.values(health).filter((s) => s.estado !== 'no configurado').length
    : 0;
  const mostrarWizard = serviciosConfigurados === 0;

  const cards = [
    { titulo: 'Pendientes', valor: stats?.pendientes || 0, icon: FiAlertCircle, color: 'text-yellow-500 bg-yellow-500/10', link: '/admin/requests' },
    { titulo: 'Usuarios', valor: stats?.usuarios || 0, icon: FiUsers, color: 'text-blue-500 bg-blue-500/10', link: '/admin/users' },
    { titulo: 'JFC en circulación', valor: stats?.totalJFC || 0, icon: FiDollarSign, color: 'text-jf-verde bg-jf-verde/10', link: '/admin/users' },
    { titulo: 'Completadas', valor: stats?.completadas || 0, icon: FiCheckCircle, color: 'text-green-500 bg-green-500/10', link: '/admin/requests' },
    { titulo: 'Rechazadas', valor: stats?.rechazadas || 0, icon: FiAlertCircle, color: 'text-red-500 bg-red-500/10', link: '/admin/requests' },
    { titulo: 'Hoy', valor: stats?.peticionesHoy || 0, icon: FiActivity, color: 'text-purple-500 bg-purple-500/10', link: '/admin/requests' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-8">Panel de administración</h1>

      {mostrarWizard && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="card p-6 mb-6 border-jf-verde/30 bg-gradient-to-r from-jf-verde/5 to-transparent">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-jf-verde/20">
              <FiWifi className="text-jf-verde" size={24} />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-white">¡Bienvenido a JorchFlix!</h2>
              <p className="text-sm text-jf-muted mt-1">Configura los servicios para empezar a funcionar. Necesitas al menos TMDB + Radarr o Sonarr.</p>
            </div>
            <button onClick={() => navigate('/admin/settings')} className="btn-primary">
              Ir a configuración
            </button>
          </div>
        </motion.div>
      )}

      <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {cargando ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))
        ) : (
          cards.map((card, i) => (
            <Link key={i} to={card.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-5 hover:border-jf-verde/30 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`p-2.5 rounded-lg ${card.color}`}>
                    <card.icon size={20} />
                  </span>
                </div>
                <p className="text-2xl font-extrabold text-white">{card.valor}</p>
                <p className="text-xs text-jf-muted mt-0.5">{card.titulo}</p>
              </motion.div>
            </Link>
          ))
        )}
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        <Link to="/admin/requests">
          <motion.div whileHover={{ y: -4 }} className="card p-5 text-center hover:border-jf-verde/30">
            <FiList size={28} className="mx-auto mb-2 text-jf-verde" />
            <h3 className="font-semibold text-white text-sm">Gestionar peticiones</h3>
            <p className="text-xs text-jf-muted mt-1">Aprueba o rechaza solicitudes</p>
          </motion.div>
        </Link>
        <Link to="/admin/users">
          <motion.div whileHover={{ y: -4 }} className="card p-5 text-center hover:border-jf-verde/30">
            <FiUsers size={28} className="mx-auto mb-2 text-jf-verde" />
            <h3 className="font-semibold text-white text-sm">Usuarios</h3>
            <p className="text-xs text-jf-muted mt-1">Gestiona usuarios y JFC</p>
          </motion.div>
        </Link>
        <Link to="/admin/settings">
          <motion.div whileHover={{ y: -4 }} className="card p-5 text-center hover:border-jf-verde/30">
            <FiSettings size={28} className="mx-auto mb-2 text-jf-verde" />
            <h3 className="font-semibold text-white text-sm">Configuración</h3>
            <p className="text-xs text-jf-muted mt-1">API Keys, webhooks, rutas</p>
          </motion.div>
        </Link>
        <a href="/admin/health" onClick={(e) => { e.preventDefault(); }}>
          <motion.div whileHover={{ y: -4 }} className="card p-5 text-center hover:border-jf-verde/30">
            <FiActivity size={28} className="mx-auto mb-2 text-jf-verde" />
            <h3 className="font-semibold text-white text-sm">Estado servicios</h3>
            <p className="text-xs text-jf-muted mt-1">Ver health check</p>
          </motion.div>
        </a>
      </div>
    </div>
  );
}
