import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Movies from './pages/Movies';
import Series from './pages/Series';
import Detail from './pages/Detail';
import Search from './pages/Search';
import MyRequests from './pages/MyRequests';
import Profile from './pages/Profile';
import Library from './pages/Library';
import Issues from './pages/Issues';
import Player from './pages/Player';
import AdminDashboard from './pages/admin/Dashboard';
import AdminRequests from './pages/admin/Requests';
import AdminUsers from './pages/admin/Users';
import AdminSettings from './pages/admin/Settings';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/player/:id" element={<ProtectedRoute><Player /></ProtectedRoute>} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-jf-fondo">
              <Navbar />
              <main className="pt-20 pb-12">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/movies" element={<Movies />} />
                  <Route path="/series" element={<Series />} />
                  <Route path="/media/:tipo/:id" element={<Detail />} />
                  <Route path="/search" element={<Search />} />
                  <Route path="/my-requests" element={<MyRequests />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/library" element={<Library />} />
                  <Route path="/issues" element={<Issues />} />

                  <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                  <Route path="/admin/requests" element={<AdminRoute><AdminRequests /></AdminRoute>} />
                  <Route path="/admin/users" element={<AdminRoute><AdminUsers /></AdminRoute>} />
                  <Route path="/admin/settings" element={<AdminRoute><AdminSettings /></AdminRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
