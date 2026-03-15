import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Shield, Check, AlertCircle } from 'lucide-react';

interface Perfil {
  id: string;
  user_id: string;
  rol: 'admin' | 'operario';
  email?: string;
}

export default function GestionUsuarios() {
  const [perfiles, setPerfiles] = useState<Perfil[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadPerfiles = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('perfiles').select('id, user_id, rol').order('rol');
    if (error) { showToast('error', error.message); setLoading(false); return; }
    setPerfiles((data as Perfil[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadPerfiles(); }, [loadPerfiles]);

  const toggleRol = async (perfil: Perfil) => {
    const nuevoRol = perfil.rol === 'admin' ? 'operario' : 'admin';
    setUpdating(perfil.id);
    const { error } = await supabase.from('perfiles').update({ rol: nuevoRol }).eq('id', perfil.id);
    setUpdating(null);
    if (error) { showToast('error', error.message); return; }
    showToast('success', `Rol cambiado a ${nuevoRol}.`);
    loadPerfiles();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <Users size={28} className="text-veolia-600" />
        <h2 className="text-3xl font-bold text-gray-800">Gestión de Usuarios</h2>
      </div>

      {toast && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-veolia-50 text-veolia-800 border border-veolia-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="card p-4 mb-4 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            Los usuarios aparecen aquí una vez que se registran en la aplicación y su ID se añade a la tabla <code className="bg-amber-100 px-1 rounded">perfiles</code>. El email se gestiona desde Supabase Auth.
          </div>
        </div>
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">User ID</th>
                <th className="px-6 py-4">Rol Actual</th>
                <th className="px-6 py-4">Cambiar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : perfiles.length === 0 ? (
                <tr><td colSpan={3} className="px-6 py-8 text-center text-gray-500">No hay perfiles registrados.</td></tr>
              ) : perfiles.map(p => (
                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-mono text-xs text-gray-500">{p.user_id}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                      p.rol === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'
                    }`}>
                      <Shield size={10} />
                      {p.rol === 'admin' ? 'Admin' : 'Operario'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleRol(p)}
                      disabled={updating === p.id}
                      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                        p.rol === 'admin'
                          ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          : 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                      }`}
                    >
                      {updating === p.id ? 'Cambiando...' : p.rol === 'admin' ? '→ Operario' : '→ Admin'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
