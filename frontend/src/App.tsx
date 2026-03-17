import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, Droplet, Fuel, LogOut, Shield, Factory, Wrench, ClipboardList, Users } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import RegistroManual from './pages/RegistroManual';
import Login from './pages/Login';
import GestionCentros from './pages/GestionCentros';
import GestionMaquinas from './pages/GestionMaquinas';
import HistorialConsumo from './pages/HistorialConsumo';
import GestionUsuarios from './pages/GestionUsuarios';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function Sidebar() {
  const location = useLocation();
  const { signOut, user, isAdmin, rol } = useAuth();

  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/registro-manual', label: 'Registro Manual', icon: <Droplet size={20} /> },
  ];

  const adminItems = [
    { path: '/admin/centros', label: 'Centros', icon: <Factory size={20} /> },
    { path: '/admin/maquinas', label: 'Máquinas', icon: <Wrench size={20} /> },
    { path: '/admin/historial', label: 'Historial', icon: <ClipboardList size={20} /> },
    { path: '/admin/usuarios', label: 'Usuarios', icon: <Users size={20} /> },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="w-64 bg-veolia-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-veolia-700">
        <Fuel size={28} className="text-veolia-500" />
        <h1 className="text-xl font-bold tracking-tight">CTCFuelTrack</h1>
      </div>

      <div className="px-6 py-3 border-b border-veolia-800 text-sm">
        <span className="text-gray-400">Usuario:</span><br />
        <span className="font-medium truncate block">{user?.email}</span>
        {rol && (
          <span className={`mt-1 inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
            isAdmin ? 'bg-amber-500/20 text-amber-300' : 'bg-gray-500/20 text-gray-300'
          }`}>
            <Shield size={10} />
            {isAdmin ? 'Admin' : 'Operario'}
          </span>
        )}
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-1 overflow-y-auto">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              isActive(item.path)
                ? 'bg-veolia-700 text-white font-medium'
                : 'text-gray-300 hover:bg-veolia-800 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="mt-4 mb-2 px-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Administración
            </div>
            {adminItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname.startsWith(item.path)
                    ? 'bg-amber-700 text-white font-medium'
                    : 'text-gray-300 hover:bg-veolia-800 hover:text-white'
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      <div className="p-4 border-t border-veolia-800">
        <button
          onClick={signOut}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors w-full px-4 py-2"
        >
          <LogOut size={18} />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }

  return (
    <div className="flex bg-gray-50 min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/registro-manual" element={<ProtectedRoute><RegistroManual /></ProtectedRoute>} />
          <Route path="/admin/centros" element={<AdminRoute><GestionCentros /></AdminRoute>} />
          <Route path="/admin/maquinas" element={<AdminRoute><GestionMaquinas /></AdminRoute>} />
          <Route path="/admin/historial" element={<AdminRoute><HistorialConsumo /></AdminRoute>} />
          <Route path="/admin/usuarios" element={<AdminRoute><GestionUsuarios /></AdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
