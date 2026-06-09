import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('jf_token');
    const datos = localStorage.getItem('jf_usuario');
    if (token && datos) {
      setUsuario(JSON.parse(datos));
      api.get('/auth/me')
        .then((res) => {
          setUsuario(res.data);
          localStorage.setItem('jf_usuario', JSON.stringify(res.data));
        })
        .catch(() => {
          localStorage.removeItem('jf_token');
          localStorage.removeItem('jf_usuario');
          setUsuario(null);
        })
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (usuario, contrasena) => {
    const { data } = await api.post('/auth/login', { usuario, contrasena });
    localStorage.setItem('jf_token', data.token);
    localStorage.setItem('jf_usuario', JSON.stringify(data.usuario));
    setUsuario(data.usuario);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('jf_token');
    localStorage.removeItem('jf_usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, esAdmin: usuario?.es_admin }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
