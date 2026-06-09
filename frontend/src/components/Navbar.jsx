import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSearch, FiChevronDown, FiBell } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Logo() {
  return (
    <div className="flex items-center gap-2 h-10">
      <svg viewBox="0 0 100 100" className="h-10">
        <defs>
          <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#558B2F" />
            <stop offset="100%" stopColor="#00E676" />
          </linearGradient>
        </defs>
        <ellipse cx="50" cy="55" rx="38" ry="32" fill="url(#logoGrad)" />
        <ellipse cx="50" cy="62" rx="24" ry="20" fill="#1B5E20" />
        <circle cx="50" cy="55" r="6" fill="#00E676" />
      </svg>
      <span className="font-extrabold text-xl tracking-tight text-white">
        Jorch<span className="text-jf-verde">Flix</span>
      </span>
    </div>
  );
}

function SearchBar() {
  const [q, setQ] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (q.trim()) {
      navigate(`/search?q=${encodeURIComponent(q.trim())}`);
      setQ('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative">
      <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-jf-muted" />
      <input
        type="text"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Buscar películas, series..."
        className="w-64 pl-10 pr-4 py-2 bg-jf-tarjeta border border-jf-borde rounded-full
                   text-sm text-jf-texto placeholder-jf-muted
                   focus:outline-none focus:border-jf-verde/50 transition-colors"
      />
    </form>
  );
}

function Notificaciones() {
  const [abierto, setAbierto] = useState(false);
  const [notificaciones, setNotificaciones] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    if (!abierto) return;
    api.get('/notificaciones').then(({ data }) => {
      setNotificaciones(data.notificaciones || []);
      setNoLeidas(data.no_leidas || 0);
    }).catch(() => {});
  }, [abierto]);

  const marcarLeida = async (id) => {
    await api.put(`/notificaciones/${id}/leer`);
    setNotificaciones((prev) => prev.map((n) => n.id === id ? { ...n, leida: 1 } : n));
    setNoLeidas((prev) => Math.max(0, prev - 1));
  };

  const marcarTodasLeidas = async () => {
    await api.put('/notificaciones/leer-todas');
    setNotificaciones((prev) => prev.map((n) => ({ ...n, leida: 1 })));
    setNoLeidas(0);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative p-2 rounded-lg hover:bg-jf-tarjeta transition-colors"
      >
        <FiBell className="text-jf-muted" size={20} />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {noLeidas > 9 ? '9+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-full mt-2 w-80 bg-jf-tarjeta border border-jf-borde rounded-xl shadow-2xl z-20 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-jf-borde flex items-center justify-between">
              <p className="font-medium text-sm text-white">Notificaciones</p>
              {noLeidas > 0 && (
                <button onClick={marcarTodasLeidas} className="text-xs text-jf-verde hover:underline">
                  Marcar todas leídas
                </button>
              )}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="text-center text-jf-muted text-sm py-8">Sin notificaciones</p>
              ) : (
                notificaciones.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => marcarLeida(n.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-jf-hover transition-colors border-b border-jf-borde/50 last:border-0 ${
                      !n.leida ? 'bg-jf-verde/5' : ''
                    }`}
                  >
                    <p className={`text-sm ${!n.leida ? 'text-white font-medium' : 'text-jf-muted'}`}>
                      {n.mensaje}
                    </p>
                    <p className="text-[10px] text-jf-muted/50 mt-0.5">
                      {new Date(n.creado_en).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

function UserMenu() {
  const { usuario, logout, esAdmin } = useAuth();
  const [abierto, setAbierto] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setAbierto(!abierto)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-jf-tarjeta transition-colors"
      >
        <div className="w-8 h-8 rounded-full bg-jf-verde/20 flex items-center justify-center">
          <span className="text-jf-verde font-semibold text-sm">
            {usuario?.nombre_usuario?.charAt(0).toUpperCase()}
          </span>
        </div>
        <FiChevronDown className={`text-jf-muted transition-transform ${abierto ? 'rotate-180' : ''}`} />
      </button>

      {abierto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAbierto(false)} />
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute right-0 top-full mt-2 w-56 bg-jf-tarjeta border border-jf-borde rounded-xl shadow-2xl z-20 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-jf-borde">
              <p className="font-medium text-sm">{usuario?.nombre_usuario}</p>
              <p className="text-jf-verde text-xs font-semibold">
                {usuario?.monedas} JFC
                {esAdmin && ' · Admin'}
              </p>
            </div>
            <div className="py-1">
              <Link to="/my-requests" onClick={() => setAbierto(false)}
                className="block px-4 py-2 text-sm hover:bg-jf-hover transition-colors">
                Mis peticiones
              </Link>
              <Link to="/profile" onClick={() => setAbierto(false)}
                className="block px-4 py-2 text-sm hover:bg-jf-hover transition-colors">
                Mi perfil
              </Link>
              {esAdmin && (
                <Link to="/admin" onClick={() => setAbierto(false)}
                  className="block px-4 py-2 text-sm text-jf-verde hover:bg-jf-hover transition-colors">
                  Panel admin
                </Link>
              )}
            </div>
            <div className="border-t border-jf-borde py-1">
              <button
                onClick={() => { setAbierto(false); logout(); }}
                className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-jf-hover transition-colors"
              >
                Cerrar sesión
              </button>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      className="fixed top-0 left-0 right-0 z-50 bg-jf-fondo/80 backdrop-blur-xl border-b border-jf-borde"
    >
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <Logo />
        </Link>
        <div className="flex items-center gap-2">
          <SearchBar />
          <Notificaciones />
          <UserMenu />
        </div>
      </div>
    </motion.nav>
  );
}
