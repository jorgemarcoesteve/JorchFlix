import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSave, FiSettings } from 'react-icons/fi';
import api from '../../services/api';

const CAMPOS = [
  { clave: 'radarr_url', label: 'Radarr URL', placeholder: 'http://192.168.1.x:7878', tipo: 'text' },
  { clave: 'radarr_api_key', label: 'Radarr API Key', placeholder: 'Clave de API', tipo: 'password' },
  { clave: 'radarr_root_path', label: 'Radarr Ruta descargas', placeholder: '/media/peliculas', tipo: 'text' },
  { clave: 'radarr_quality_profile_id', label: 'Radarr Perfil calidad ID', placeholder: '1', tipo: 'number' },
  { clave: 'sonarr_url', label: 'Sonarr URL', placeholder: 'http://192.168.1.x:8989', tipo: 'text' },
  { clave: 'sonarr_api_key', label: 'Sonarr API Key', placeholder: 'Clave de API', tipo: 'password' },
  { clave: 'sonarr_root_path', label: 'Sonarr Ruta descargas', placeholder: '/media/series', tipo: 'text' },
  { clave: 'sonarr_quality_profile_id', label: 'Sonarr Perfil calidad ID', placeholder: '1', tipo: 'number' },
  { clave: 'tmdb_api_key', label: 'TMDB API Key', placeholder: 'Clave de API de TMDB', tipo: 'password' },
  { clave: 'webhook_url', label: 'Webhook URL', placeholder: 'https://hooks.example.com/...', tipo: 'text' },
  { clave: 'webhook_activo', label: 'Webhook activo', placeholder: '', tipo: 'checkbox' },
];

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const { data } = await api.get('/configuracion');
        setSettings(data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  const actualizar = (clave, valor) => {
    setSettings((prev) => ({ ...prev, [clave]: valor }));
  };

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await api.put('/configuracion', settings);
      toast.success('Configuración guardada correctamente');
    } catch {
      toast.error('Error al guardar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-6">Configuración</h1>
      <p className="text-jf-muted text-sm mb-8">
        Cambios en caliente, sin necesidad de reiniciar el servidor.
        Las API keys y URLs se guardan en la base de datos y sobrescriben las variables de entorno.
      </p>

      {cargando ? (
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          {CAMPOS.map((campo) => (
            <motion.div
              key={campo.clave}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="card p-4"
            >
              <label className="block text-sm font-medium text-jf-muted mb-1.5">
                {campo.label}
              </label>
              {campo.tipo === 'checkbox' ? (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings[campo.clave] === 'true'}
                    onChange={(e) => actualizar(campo.clave, e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-jf-borde bg-jf-fondo text-jf-verde focus:ring-jf-verde"
                  />
                  <span className="text-sm text-jf-texto">Activar envío de webhooks</span>
                </label>
              ) : (
                <input
                  type={campo.tipo}
                  value={settings[campo.clave] || ''}
                  onChange={(e) => actualizar(campo.clave, e.target.value)}
                  placeholder={campo.placeholder}
                  className="input"
                />
              )}
            </motion.div>
          ))}

          <button
            type="submit"
            disabled={guardando}
            className="btn-primary flex items-center gap-2"
          >
            <FiSave size={18} />
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </div>
  );
}
