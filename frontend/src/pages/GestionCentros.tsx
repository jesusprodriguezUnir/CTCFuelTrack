import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Factory, Plus, Pencil, Trash2, Check, X, AlertCircle } from 'lucide-react';

interface Centro {
  id: string;
  nombre: string;
  ubicacion: string;
  num_maquinas?: number;
}

interface ModalEdicion {
  id: string;
  nombre: string;
  ubicacion: string;
}

export default function GestionCentros() {
  const [centros, setCentros] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [newCentro, setNewCentro] = useState({ nombre: '', ubicacion: '' });
  const [savingNew, setSavingNew] = useState(false);

  const [editando, setEditando] = useState<ModalEdicion | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<Centro | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  async function loadCentros() {
    setLoading(true);
    const { data, error } = await supabase
      .from('centros_operativos')
      .select('id, nombre, ubicacion, maquinaria(count)')
      .order('nombre');
    if (error) { setError(error.message); setLoading(false); return; }
    const mapped = (data as any[]).map(c => ({
      ...c,
      num_maquinas: c.maquinaria?.[0]?.count ?? 0
    }));
    setCentros(mapped);
    setLoading(false);
  }

  useEffect(() => { loadCentros(); }, []);

  const handleCreate = async () => {
    if (!newCentro.nombre.trim()) return;
    setSavingNew(true);
    const { error } = await supabase.from('centros_operativos').insert([newCentro]);
    setSavingNew(false);
    if (error) { showToast('error', error.message); return; }
    showToast('success', 'Centro creado correctamente.');
    setNewCentro({ nombre: '', ubicacion: '' });
    setShowForm(false);
    loadCentros();
  };

  const handleEdit = async () => {
    if (!editando) return;
    setSavingEdit(true);
    const { error } = await supabase.from('centros_operativos')
      .update({ nombre: editando.nombre, ubicacion: editando.ubicacion })
      .eq('id', editando.id);
    setSavingEdit(false);
    if (error) { showToast('error', error.message); return; }
    showToast('success', 'Centro actualizado.');
    setEditando(null);
    loadCentros();
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    console.log('[GestionCentros] Attempting to delete center:', confirmDelete.id);
    const { error } = await supabase.from('centros_operativos').delete().eq('id', confirmDelete.id);
    setDeleting(false);
    
    if (error) {
      console.error('[GestionCentros] Delete error:', error);
      showToast('error', `Error al eliminar: ${error.message}`);
      return;
    }
    
    console.log('[GestionCentros] Delete successful');
    showToast('success', 'Centro eliminado correctamente.');
    setConfirmDelete(null);
    loadCentros();
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Factory size={28} className="text-veolia-600" />
          <h2 className="text-3xl font-bold text-gray-800">Centros Operativos</h2>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Centro
        </button>
      </div>

      {toast && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-veolia-50 text-veolia-800 border border-veolia-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {showForm && (
        <div className="card p-6 mb-6">
          <h3 className="font-semibold text-gray-800 mb-4">Nuevo Centro Operativo</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" className="input-field" value={newCentro.nombre} onChange={e => setNewCentro({ ...newCentro, nombre: e.target.value })} placeholder="Ej. Centro Alcorcón" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ubicación</label>
              <input type="text" className="input-field" value={newCentro.ubicacion} onChange={e => setNewCentro({ ...newCentro, ubicacion: e.target.value })} placeholder="Ej. Madrid" />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={handleCreate} disabled={savingNew || !newCentro.nombre.trim()} className="btn-primary">
              {savingNew ? 'Guardando...' : <><Check size={16} /> Guardar</>}
            </button>
            <button onClick={() => setShowForm(false)} className="btn-secondary">
              <X size={16} /> Cancelar
            </button>
          </div>
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Centro</th>
                <th className="px-6 py-4">Ubicación</th>
                <th className="px-6 py-4">Máquinas</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : error ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-red-500">{error}</td></tr>
              ) : centros.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay centros registrados.</td></tr>
              ) : centros.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  {editando?.id === c.id ? (
                    <>
                      <td className="px-6 py-4"><input type="text" className="input-field py-1.5 text-sm" value={editando.nombre} onChange={e => setEditando({ ...editando, nombre: e.target.value })} /></td>
                      <td className="px-6 py-4"><input type="text" className="input-field py-1.5 text-sm" value={editando.ubicacion} onChange={e => setEditando({ ...editando, ubicacion: e.target.value })} /></td>
                      <td className="px-6 py-4 text-gray-500">{c.num_maquinas}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2">
                          <button onClick={handleEdit} disabled={savingEdit} className="text-veolia-600 hover:text-veolia-800 font-medium text-sm flex items-center gap-1"><Check size={14} /> Guardar</button>
                          <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{c.nombre}</td>
                      <td className="px-6 py-4 text-gray-600">{c.ubicacion || '—'}</td>
                      <td className="px-6 py-4">
                        <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-1 rounded-full">{c.num_maquinas} máqs.</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => setEditando({ id: c.id, nombre: c.nombre, ubicacion: c.ubicacion || '' })} className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => setConfirmDelete(c)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal confirmación borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full"><Trash2 size={22} className="text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar Centro</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-2">Vas a eliminar el centro <strong>{confirmDelete.nombre}</strong>.</p>
            {confirmDelete.num_maquinas! > 0 && (
              <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-4">
                ⚠️ Este centro tiene <strong>{confirmDelete.num_maquinas} máquina(s)</strong> asociada(s). Se eliminarán también todos sus registros.
              </p>
            )}
            <div className="flex gap-3 mt-4">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
