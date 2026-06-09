import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { FiUsers, FiTrash2, FiDollarSign, FiPlus, FiShield, FiShieldOff } from 'react-icons/fi';
import api from '../../services/api';

export default function AdminUsers() {
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [nuevoUsuario, setNuevoUsuario] = useState({ nombre_usuario: '', contrasena: '' });
  const [grant, setGrant] = useState({ usuario_id: '', cantidad: 1, descripcion: '' });

  const cargar = async () => {
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {}
    setCargando(false);
  };

  useEffect(() => { cargar(); }, []);

  const crearUsuario = async (e) => {
    e.preventDefault();
    try {
      await api.post('/usuarios', nuevoUsuario);
      toast.success('Usuario creado correctamente');
      setMostrarCrear(false);
      setNuevoUsuario({ nombre_usuario: '', contrasena: '' });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al crear usuario');
    }
  };

  const eliminarUsuario = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este usuario? También se eliminará de Jellyfin.')) return;
    try {
      await api.delete(`/usuarios/${id}`);
      toast.success('Usuario eliminado');
      cargar();
    } catch {
      toast.error('Error al eliminar usuario');
    }
  };

  const cambiarRol = async (id, esAdmin) => {
    const accion = esAdmin ? 'promover a admin' : 'degradar a usuario';
    if (!confirm(`¿${esAdmin ? 'Promover' : 'Degradar'} este usuario?`)) return;
    try {
      await api.put(`/admin/usuarios/${id}/rol`, { es_admin: esAdmin });
      toast.success(`Usuario ${accion} correctamente`);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar rol');
    }
  };

  const otorgarJFC = async (e) => {
    e.preventDefault();
    try {
      await api.post('/monedas/otorgar', grant);
      toast.success(`Otorgados ${grant.cantidad} JFC`);
      setGrant({ usuario_id: '', cantidad: 1, descripcion: '' });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al otorgar');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-extrabold text-white">Usuarios</h1>
        <button onClick={() => setMostrarCrear(!mostrarCrear)} className="btn-primary flex items-center gap-2">
          <FiPlus size={18} /> Nuevo usuario
        </button>
      </div>

      {mostrarCrear && (
        <motion.form
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          onSubmit={crearUsuario}
          className="card p-4 mb-6 flex flex-col sm:flex-row gap-3"
        >
          <input type="text" placeholder="Nombre de usuario" value={nuevoUsuario.nombre_usuario}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre_usuario: e.target.value })}
            className="input flex-1" required />
          <input type="password" placeholder="Contraseña" value={nuevoUsuario.contrasena}
            onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
            className="input flex-1" required />
          <button type="submit" className="btn-primary">Crear en Jellyfin + JorchFlix</button>
        </motion.form>
      )}

      {cargando ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-jf-borde">
                <th className="text-left p-4 text-sm text-jf-muted font-medium">Usuario</th>
                <th className="text-left p-4 text-sm text-jf-muted font-medium">Rol</th>
                <th className="text-center p-4 text-sm text-jf-muted font-medium">JFC</th>
                <th className="text-left p-4 text-sm text-jf-muted font-medium">Creado</th>
                <th className="text-right p-4 text-sm text-jf-muted font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-jf-borde hover:bg-jf-hover/50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-jf-verde/20 flex items-center justify-center">
                        <span className="text-jf-verde font-semibold text-sm">{u.nombre_usuario.charAt(0).toUpperCase()}</span>
                      </div>
                      <span className="text-white font-medium">{u.nombre_usuario}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {u.es_admin ? (
                      <span className="px-2.5 py-1 bg-jf-verde/10 text-jf-verde text-xs rounded-full font-medium">Admin</span>
                    ) : (
                      <span className="text-jf-muted text-sm">Usuario</span>
                    )}
                  </td>
                  <td className="p-4 text-center">
                    <span className="text-white font-semibold">{u.monedas}</span>
                  </td>
                  <td className="p-4 text-sm text-jf-muted">
                    {new Date(u.creado_en).toLocaleDateString('es-ES')}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => cambiarRol(u.id, !u.es_admin)}
                        className="p-2 text-yellow-400 hover:bg-yellow-500/10 rounded-lg transition-colors"
                        title={u.es_admin ? 'Degradar a usuario' : 'Promover a admin'}
                      >
                        {u.es_admin ? <FiShieldOff size={16} /> : <FiShield size={16} />}
                      </button>
                      <button
                        onClick={() => setGrant({ usuario_id: u.id, cantidad: 1, descripcion: '' })}
                        className="p-2 text-jf-verde hover:bg-jf-verde/10 rounded-lg transition-colors"
                        title="Otorgar JFC"
                      >
                        <FiDollarSign size={16} />
                      </button>
                      {!u.es_admin && (
                        <button
                          onClick={() => eliminarUsuario(u.id)}
                          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar usuario"
                        >
                          <FiTrash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {grant.usuario_id && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={otorgarJFC}
          className="card p-4 mt-4 flex items-center gap-3 flex-wrap"
        >
          <FiDollarSign className="text-yellow-500 flex-shrink-0" size={20} />
          <span className="text-sm text-white whitespace-nowrap">
            Otorgar a {usuarios.find((u) => u.id === grant.usuario_id)?.nombre_usuario}:
          </span>
          <input type="number" min="1" value={grant.cantidad}
            onChange={(e) => setGrant({ ...grant, cantidad: parseInt(e.target.value) || 1 })}
            className="input w-20 text-center" />
          <span className="text-jf-muted text-sm">JFC</span>
          <input type="text" placeholder="Motivo (opcional)" value={grant.descripcion}
            onChange={(e) => setGrant({ ...grant, descripcion: e.target.value })}
            className="input flex-1 text-sm" />
          <button type="submit" className="btn-primary !py-1.5 text-sm">Otorgar</button>
          <button type="button" onClick={() => setGrant({ usuario_id: '', cantidad: 1, descripcion: '' })}
            className="btn-secondary !py-1.5 text-sm">Cancelar</button>
        </motion.form>
      )}
    </div>
  );
}
