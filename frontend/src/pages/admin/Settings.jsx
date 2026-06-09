import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSave, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';

function SeccionServicio({ titulo, prefijo, settings, onChange, opciones, cargandoOpciones, onRefresh }) {
  const url = settings[`${prefijo}_url`] || '';
  const apiKey = settings[`${prefijo}_api_key`] || '';

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{titulo}</h3>
        {url && apiKey && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={cargandoOpciones}
            className="text-jf-verde hover:text-jf-verde-oscuro text-sm flex items-center gap-1"
          >
            <FiRefreshCw size={14} className={cargandoOpciones ? 'animate-spin' : ''} />
            Cargar opciones
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">URL</label>
          <input
            type="text"
            value={url}
            onChange={(e) => onChange(`${prefijo}_url`, e.target.value)}
            placeholder={`http://192.168.1.x:${prefijo === 'radarr' ? '7878' : '8989'}`}
            className="input text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => onChange(`${prefijo}_api_key`, e.target.value)}
            placeholder="Clave de API"
            className="input text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">Ruta de descargas</label>
          {opciones?.rootFolders?.length > 0 ? (
            <select
              value={settings[`${prefijo}_root_path`] || ''}
              onChange={(e) => onChange(`${prefijo}_root_path`, e.target.value)}
              className="input text-sm"
            >
              <option value="">Seleccionar ruta...</option>
              {opciones.rootFolders.map((f) => (
                <option key={f.id} value={f.path}>{f.path}</option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={settings[`${prefijo}_root_path`] || ''}
              onChange={(e) => onChange(`${prefijo}_root_path`, e.target.value)}
              placeholder="/mnt/media/..."
              className="input text-sm"
            />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">Perfil de calidad</label>
          {opciones?.qualityProfiles?.length > 0 ? (
            <select
              value={settings[`${prefijo}_quality_profile_id`] || ''}
              onChange={(e) => onChange(`${prefijo}_quality_profile_id`, e.target.value)}
              className="input text-sm"
            >
              <option value="">Seleccionar perfil...</option>
              {opciones.qualityProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <input
              type="number"
              value={settings[`${prefijo}_quality_profile_id`] || ''}
              onChange={(e) => onChange(`${prefijo}_quality_profile_id`, e.target.value)}
              placeholder="1"
              className="input text-sm"
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminSettings() {
  const [settings, setSettings] = useState({});
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [radarrOps, setRadarrOps] = useState(null);
  const [sonarrOps, setSonarrOps] = useState(null);
  const [cargandoRadarr, setCargandoRadarr] = useState(false);
  const [cargandoSonarr, setCargandoSonarr] = useState(false);

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

  const cargarOpcionesRadarr = useCallback(async () => {
    setCargandoRadarr(true);
    try {
      const { data } = await api.get('/configuracion/radarr-opciones');
      setRadarrOps(data);
    } catch {}
    setCargandoRadarr(false);
  }, []);

  const cargarOpcionesSonarr = useCallback(async () => {
    setCargandoSonarr(true);
    try {
      const { data } = await api.get('/configuracion/sonarr-opciones');
      setSonarrOps(data);
    } catch {}
    setCargandoSonarr(false);
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
    <div className="max-w-4xl mx-auto px-4">
      <h1 className="text-3xl font-extrabold text-white mb-2">Configuración</h1>
      <p className="text-jf-muted text-sm mb-8">
        Cambios en caliente, sin reiniciar. Pulsa "Cargar opciones" tras rellenar URL y API Key para ver las rutas y perfiles disponibles.
      </p>

      {cargando ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-32 rounded-xl" />
          ))}
        </div>
      ) : (
        <form onSubmit={guardar} className="space-y-4">
          <SeccionServicio
            titulo="Radarr (Películas)"
            prefijo="radarr"
            settings={settings}
            onChange={actualizar}
            opciones={radarrOps}
            cargandoOpciones={cargandoRadarr}
            onRefresh={cargarOpcionesRadarr}
          />

          <SeccionServicio
            titulo="Sonarr (Series)"
            prefijo="sonarr"
            settings={settings}
            onChange={actualizar}
            opciones={sonarrOps}
            cargandoOpciones={cargandoSonarr}
            onRefresh={cargarOpcionesSonarr}
          />

          <div className="card p-5 mb-4">
            <h3 className="text-lg font-bold text-white mb-4">TMDB (The Movie Database)</h3>
            <div className="max-w-sm">
              <label className="block text-xs font-medium text-jf-muted mb-1">API Key</label>
              <input
                type="password"
                value={settings.tmdb_api_key || ''}
                onChange={(e) => actualizar('tmdb_api_key', e.target.value)}
                placeholder="Clave de API de TMDB"
                className="input text-sm"
              />
            </div>
          </div>

          <div className="card p-5 mb-4">
            <h3 className="text-lg font-bold text-white mb-4">Webhooks</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-jf-muted mb-1">URL del webhook</label>
                <input
                  type="text"
                  value={settings.webhook_url || ''}
                  onChange={(e) => actualizar('webhook_url', e.target.value)}
                  placeholder="https://hooks.example.com/..."
                  className="input text-sm"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.webhook_activo === 'true'}
                    onChange={(e) => actualizar('webhook_activo', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-jf-borde bg-jf-fondo text-jf-verde focus:ring-jf-verde"
                  />
                  <span className="text-sm text-jf-texto">Activar webhooks</span>
                </label>
              </div>
            </div>
          </div>

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
