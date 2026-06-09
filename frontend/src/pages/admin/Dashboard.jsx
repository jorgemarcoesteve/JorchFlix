import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUsers, FiList, FiSettings, FiDollarSign, FiAlertCircle } from 'react-icons/fi';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats, setStats] = useState({ pendientes: 0, usuarios: 0, totalJFC: 0 });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [peticiones, usuarios] = await Promise.all([
          api.get('/peticiones'),
          api.get('/usuarios'),
        ]);
        const pendientes = peticiones.data.filter((p) => p.estado === 'pending').length;
        const totalJFC = usuarios.data.reduce((sum, u) => sum + u.monedas, 0);
        setStats({ pendientes, usuarios: usuarios.data.length, totalJFC });
      } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  const cards = [
    {
      titulo: 'Peticiones pendientes',
      valor: stats.pendientes,
      icon: FiAlertCircle,
      color: 'text-yellow-500 bg-yellow-500/10',
      link: '/admin/requests',
    },
    {
      titulo: 'Usuarios',
      valor: stats.usuarios,
      icon: FiUsers,
      color: 'text-blue-500 bg-blue-500/10',
      link: '/admin/users',
    },
    {
      titulo: 'JFC en circulación',
      valor: stats.totalJFC,
      icon: FiDollarSign,
      color: 'text-jf-verde bg-jf-verde/10',
      link: '/admin/users',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-8">Panel de administración</h1>

      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {cargando ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-xl" />
          ))
        ) : (
          cards.map((card, i) => (
            <Link key={i} to={card.link}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="card p-6 hover:border-jf-verde/30 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className={`p-3 rounded-lg ${card.color}`}>
                    <card.icon size={24} />
                  </span>
                </div>
                <p className="text-3xl font-extrabold text-white">{card.valor}</p>
                <p className="text-sm text-jf-muted mt-1">{card.titulo}</p>
              </motion.div>
            </Link>
          ))
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Link to="/admin/requests">
          <motion.div
            whileHover={{ y: -4 }}
            className="card p-6 text-center hover:border-jf-verde/30"
          >
            <FiList size={32} className="mx-auto mb-3 text-jf-verde" />
            <h3 className="font-semibold text-white">Gestionar peticiones</h3>
            <p className="text-sm text-jf-muted mt-1">Aprueba o rechaza solicitudes</p>
          </motion.div>
        </Link>
        <Link to="/admin/users">
          <motion.div
            whileHover={{ y: -4 }}
            className="card p-6 text-center hover:border-jf-verde/30"
          >
            <FiUsers size={32} className="mx-auto mb-3 text-jf-verde" />
            <h3 className="font-semibold text-white">Usuarios</h3>
            <p className="text-sm text-jf-muted mt-1">Gestiona usuarios y JFC</p>
          </motion.div>
        </Link>
        <Link to="/admin/settings">
          <motion.div
            whileHover={{ y: -4 }}
            className="card p-6 text-center hover:border-jf-verde/30"
          >
            <FiSettings size={32} className="mx-auto mb-3 text-jf-verde" />
            <h3 className="font-semibold text-white">Configuración</h3>
            <p className="text-sm text-jf-muted mt-1">API Keys, webhooks, rutas</p>
          </motion.div>
        </Link>
      </div>
    </div>
  );
}
