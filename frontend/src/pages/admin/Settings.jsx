import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiSave, FiRefreshCw, FiCheck, FiX } from 'react-icons/fi';
import api from '../../services/api';

function Indicador({ estado }) {
  if (!estado) return null;
  if (estado.estado === 'ok') return <span className="text-jf-verde flex items-center gap-1 text-xs"><FiCheck size={12} /> Conectado</span>;
  if (estado.estado === 'no configurado') return <span className="text-jf-muted flex items-center gap-1 text-xs"><FiX size={12} /> No configurado</span>;
  return <span className="text-red-400 flex items-center gap-1 text-xs" title={estado.error}><FiX size={12} /> Error</span>;
}

function SeccionServicio({ titulo, prefijo, settings, onChange, opciones, cargandoOpciones, onRefresh, health }) {
  const url = settings[`${prefijo}_url`] || '';
  const apiKey = settings[`${prefijo}_api_key`] || '';

  return (
    <div className="card p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-bold text-white">{titulo}</h3>
          {health && <Indicador estado={health} />}
        </div>
        {url && apiKey && (
          <button type="button" onClick={onRefresh} disabled={cargandoOpciones}
            className="text-jf-verde hover:text-jf-verde-oscuro text-sm flex items-center gap-1">
            <FiRefreshCw size={14} className={cargandoOpciones ? 'animate-spin' : ''} />
            Cargar opciones
          </button>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">URL</label>
          <input type="text" value={url}
            onChange={(e) => onChange(`${prefijo}_url`, e.target.value)}
            placeholder={`http://192.168.1.x:${prefijo === 'radarr' ? '7878' : '8989'}`}
            className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">API Key</label>
          <input type="password" value={apiKey}
            onChange={(e) => onChange(`${prefijo}_api_key`, e.target.value)}
            placeholder="Clave de API" className="input text-sm" />
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">Ruta de descargas</label>
          {opciones?.rootFolders?.length > 0 ? (
            <select value={settings[`${prefijo}_root_path`] || ''}
              onChange={(e) => onChange(`${prefijo}_root_path`, e.target.value)}
              className="input text-sm">
              <option value="">Seleccionar ruta...</option>
              {opciones.rootFolders.map((f) => (
                <option key={f.id} value={f.path}>{f.path}</option>
              ))}
            </select>
          ) : (
            <input type="text" value={settings[`${prefijo}_root_path`] || ''}
              onChange={(e) => onChange(`${prefijo}_root_path`, e.target.value)}
              placeholder="/mnt/media/..." className="input text-sm" />
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-jf-muted mb-1">Perfil de calidad</label>
          {opciones?.qualityProfiles?.length > 0 ? (
            <select value={settings[`${prefijo}_quality_profile_id`] || ''}
              onChange={(e) => onChange(`${prefijo}_quality_profile_id`, e.target.value)}
              className="input text-sm">
              <option value="">Seleccionar perfil...</option>
              {opciones.qualityProfiles.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          ) : (
            <input type="number" value={settings[`${prefijo}_quality_profile_id`] || ''}
              onChange={(e) => onChange(`${prefijo}_quality_profile_id`, e.target.value)}
              placeholder="1" className="input text-sm" />
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
  const [health, setHealth] = useState(null);
  const [probando, setProbando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      try {
        const [conf, h] = await Promise.all([
          api.get('/configuracion'),
          api.get('/admin/health'),
        ]);
        setSettings(conf.data);
        setHealth(h.data);
      } catch {}
      setCargando(false);
    };
    cargar();
  }, []);

  const probarConexion = async () => {
    setProbando(true);
    try {
      const { data } = await api.get('/admin/health');
      setHealth(data);
      const todosOk = Object.values(data).every((s) => s.estado === 'ok');
      toast.success(todosOk ? 'Todos los servicios funcionan correctamente' : 'Algunos servicios tienen errores');
    } catch {
      toast.error('Error al probar conexiones');
    } finally {
      setProbando(false);
    }
  };

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
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-3xl font-extrabold text-white">Configuración</h1>
        <button onClick={probarConexion} disabled={probando}
          className="btn-secondary text-sm flex items-center gap-1">
          <FiRefreshCw size={14} className={probando ? 'animate-spin' : ''} />
          {probando ? 'Probando...' : 'Probar conexiones'}
        </button>
      </div>
      <p className="text-jf-muted text-sm mb-8">
        Cambios en caliente, sin reiniciar. Usa "Probar conexiones" para verificar el estado de los servicios.
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
            titulo="Radarr (Películas)" prefijo="radarr"
            settings={settings} onChange={actualizar}
            opciones={radarrOps} cargandoOpciones={cargandoRadarr}
            onRefresh={cargarOpcionesRadarr}
            health={health?.radarr}
          />

          <SeccionServicio
            titulo="Sonarr (Series)" prefijo="sonarr"
            settings={settings} onChange={actualizar}
            opciones={sonarrOps} cargandoOpciones={cargandoSonarr}
            onRefresh={cargarOpcionesSonarr}
            health={health?.sonarr}
          />

          <div className="card p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">TMDB</h3>
              {health?.tmdb && <Indicador estado={health.tmdb} />}
            </div>
            <div className="max-w-sm">
              <label className="block text-xs font-medium text-jf-muted mb-1">API Key</label>
              <input type="password" value={settings.tmdb_api_key || ''}
                onChange={(e) => actualizar('tmdb_api_key', e.target.value)}
                placeholder="Clave de API de TMDB" className="input text-sm" />
            </div>
          </div>

          <div className="card p-5 mb-4">
            <h3 className="text-lg font-bold text-white mb-4">Auto-aprobación</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox"
                  checked={settings.auto_approve === 'true'}
                  onChange={(e) => actualizar('auto_approve', e.target.checked ? 'true' : 'false')}
                  className="w-5 h-5 rounded border-jf-borde bg-jf-fondo text-jf-verde focus:ring-jf-verde" />
                <span className="text-sm text-jf-texto">Auto-aprobar peticiones</span>
              </label>
              <div>
                <label className="block text-xs font-medium text-jf-muted mb-1">
                  Mínimo de peticiones completadas
                </label>
                <input type="number" min="0" value={settings.auto_approve_min_completadas || '3'}
                  onChange={(e) => actualizar('auto_approve_min_completadas', e.target.value)}
                  className="input text-sm w-32" />
              </div>
            </div>
            <p className="text-xs text-jf-muted mt-2">
              Si se activa, los usuarios con al menos N peticiones completadas serán auto-aprobados.
            </p>
          </div>

          <div className="card p-5 mb-4">
            <h3 className="text-lg font-bold text-white mb-4">Webhooks</h3>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-jf-muted mb-1">URL del webhook</label>
                <input type="text" value={settings.webhook_url || ''}
                  onChange={(e) => actualizar('webhook_url', e.target.value)}
                  placeholder="https://hooks.example.com/..." className="input text-sm" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox"
                    checked={settings.webhook_activo === 'true'}
                    onChange={(e) => actualizar('webhook_activo', e.target.checked ? 'true' : 'false')}
                    className="w-5 h-5 rounded border-jf-borde bg-jf-fondo text-jf-verde focus:ring-jf-verde" />
                  <span className="text-sm text-jf-texto">Activar webhooks</span>
                </label>
              </div>
            </div>
          </div>

          <button type="submit" disabled={guardando} className="btn-primary flex items-center gap-2">
            <FiSave size={18} />
            {guardando ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </form>
      )}
    </div>
  );
}
