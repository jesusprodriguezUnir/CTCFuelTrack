import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Fuel, Lock, Mail, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorStatus(null);

    const { error } = isRegistering 
      ? await supabase.auth.signUp({ email, password })
      : await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);

    if (error) {
       setErrorStatus(error.message);
    } else if (isRegistering) {
       setErrorStatus("Registro exitoso. Revisa tu email (o inicia sesión directamente si desactivaste la confirmación).");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="bg-veolia-900 p-8 flex flex-col items-center justify-center text-white">
          <Fuel size={48} className="text-veolia-500 mb-4" />
          <h1 className="text-2xl font-bold tracking-tight">CTCFuelTrack</h1>
          <p className="text-veolia-100 text-center mt-2 text-sm">
            Gestión de Inventario de Gasoil y Monitoreo
          </p>
        </div>
        
        <div className="p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
            {isRegistering ? 'Crear nueva cuenta' : 'Iniciar Sesión'}
          </h2>

          {errorStatus && (
            <div className={`p-4 mb-6 rounded-lg flex items-start gap-3 text-sm ${
              errorStatus.includes('exitoso') ? 'bg-veolia-50 text-veolia-800 border-veolia-200' : 'bg-red-50 text-red-800 border-red-200'
            } border`}>
              <AlertCircle size={18} className="mt-0.5 shrink-0" />
              <span>{errorStatus}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  className="input-field pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operario@veolia.com"
                />
                <Mail className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  className="input-field pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <Lock className="absolute left-3 top-2.5 text-gray-400" size={18} />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 text-base mt-2"
            >
              {loading ? 'Procesando...' : (isRegistering ? 'Registrarse' : 'Entrar al Sistema')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button 
              onClick={() => { setIsRegistering(!isRegistering); setErrorStatus(null); }}
              className="text-sm text-veolia-600 hover:text-veolia-800 font-medium transition-colors"
            >
              {isRegistering ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate aquí'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
