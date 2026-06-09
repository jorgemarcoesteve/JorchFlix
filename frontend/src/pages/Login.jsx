import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function Login() {
  const [usuario, setUsuario] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const inputRef = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!usuario || !contrasena) {
      toast.error('Completa todos los campos');
      return;
    }
    setCargando(true);
    try {
      await login(usuario, contrasena);
      toast.success('¡Bienvenido a JorchFlix!');
      navigate('/');
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Error al iniciar sesión';
      toast.error(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen bg-jf-fondo flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-jf-verde rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-jf-verde-oscuro rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="card p-8">
          <div className="flex flex-col items-center mb-8">
            <svg viewBox="0 0 100 100" className="h-16 w-16 mb-3">
              <defs>
                <linearGradient id="loginGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#558B2F" />
                  <stop offset="100%" stopColor="#00E676" />
                </linearGradient>
              </defs>
              <ellipse cx="50" cy="55" rx="38" ry="32" fill="url(#loginGrad)" />
              <ellipse cx="50" cy="62" rx="24" ry="20" fill="#1B5E20" />
              <circle cx="50" cy="55" r="6" fill="#00E676" />
            </svg>
            <h1 className="text-2xl font-extrabold text-white">
              Jorch<span className="text-jf-verde">Flix</span>
            </h1>
            <p className="text-jf-muted text-sm mt-1">Inicia sesión con tu cuenta de Jellyfin</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-jf-muted mb-1.5">Usuario</label>
              <input
                ref={inputRef}
                type="text"
                value={usuario}
                onChange={(e) => setUsuario(e.target.value)}
                className="input"
                placeholder="Tu usuario de Jellyfin"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-jf-muted mb-1.5">Contraseña</label>
              <div className="relative">
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="input pr-10"
                  placeholder="Tu contraseña"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass(!mostrarPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-jf-muted hover:text-jf-texto"
                >
                  {mostrarPass ? <FiEyeOff size={18} /> : <FiEye size={18} />}
                </button>
              </div>
            </div>
            <button
              type="submit"
              disabled={cargando}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {cargando ? (
                <div className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
              ) : (
                'Iniciar sesión'
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
