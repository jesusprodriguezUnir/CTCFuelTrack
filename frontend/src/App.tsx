import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home, PlusCircle, Droplet, Fuel, LogOut } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import AltaMaquina from './pages/AltaMaquina';
import RegistroManual from './pages/RegistroManual';
import Login from './pages/Login';
import { AuthProvider, useAuth } from './contexts/AuthContext';

function Sidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  
  const menuItems = [
    { path: '/', label: 'Dashboard', icon: <Home size={20} /> },
    { path: '/alta-maquina', label: 'Alta Máquina', icon: <PlusCircle size={20} /> },
    { path: '/registro-manual', label: 'Registro Manual', icon: <Droplet size={20} /> },
  ];

  return (
    <div className="w-64 bg-veolia-900 text-white min-h-screen flex flex-col shadow-xl">
      <div className="p-6 flex items-center gap-3 border-b border-veolia-700">
        <Fuel size={28} className="text-veolia-500" />
        <h1 className="text-xl font-bold tracking-tight">CTCFuelTrack</h1>
      </div>
      
      <div className="px-6 py-4 border-b border-veolia-800 text-sm object-contain truncate">
         <span className="text-gray-400">Usuario:</span><br/>
         <span className="font-medium">{user?.email}</span>
      </div>

      <nav className="flex-1 py-6 px-4 flex flex-col gap-2">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              location.pathname === item.path
                ? 'bg-veolia-700 text-white font-medium'
                : 'text-gray-300 hover:bg-veolia-800 hover:text-white'
            }`}
          >
            {item.icon}
            {item.label}
          </Link>
        ))}
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
  if (!user) {
    return <Navigate to="/login" replace />;
  }
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
          <Route path="/alta-maquina" element={<ProtectedRoute><AltaMaquina /></ProtectedRoute>} />
          <Route path="/registro-manual" element={<ProtectedRoute><RegistroManual /></ProtectedRoute>} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;
