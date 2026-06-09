import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function ProtectedRoute({ children }) {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jf-fondo">
        <div className="animate-spin h-10 w-10 border-4 border-jf-verde border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  return children;
}

export function AdminRoute({ children }) {
  const { usuario, cargando, esAdmin } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-jf-fondo">
        <div className="animate-spin h-10 w-10 border-4 border-jf-verde border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!usuario) return <Navigate to="/login" replace />;
  if (!esAdmin) return <Navigate to="/" replace />;
  return children;
}
