import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Wrench, Pencil, Trash2, Check, X, AlertCircle, Filter } from 'lucide-react';

interface Maquina {
  id: string;
  codigo_interno: string;
  capacidad_deposito: number;
  tipo_medicion: string;
  centro_id: string;
  centro?: { nombre: string };
}

interface Centro {
  id: string;
  nombre: string;
}

export default function GestionMaquinas() {
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtrosCentro, setFiltroCentro] = useState('');

  const [editando, setEditando] = useState<Maquina | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Maquina | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  async function loadData() {
    setLoading(true);
    const [maqRes, centRes] = await Promise.all([
      supabase.from('maquinaria').select('id, codigo_interno, capacidad_deposito, tipo_medicion, centro_id, centros_operativos(nombre)').order('codigo_interno'),
      supabase.from('centros_operativos').select('id, nombre').order('nombre')
    ]);
    if (maqRes.data) {
      setMaquinas((maqRes.data as any[]).map(m => ({ ...m, centro: Array.isArray(m.centros_operativos) ? m.centros_operativos[0] : m.centros_operativos })));
    }
    if (centRes.data) setCentros(centRes.data);
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);

  const handleSaveEdit = async () => {
    if (!editando) return;
    setSavingEdit(true);
    const { error } = await supabase.from('maquinaria').update({
      codigo_interno: editando.codigo_interno,
      capacidad_deposito: editando.capacidad_deposito,
      tipo_medicion: editando.tipo_medicion,
      centro_id: editando.centro_id
    }).eq('id', editando.id);
    setSavingEdit(false);
    if (error) { showToast('error', error.message); return; }
    showToast('success', 'Máquina actualizada.');
    setEditando(null);
    loadData();
  };

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    console.log('[GestionMaquinas] Attempting to delete machine:', confirmDelete.id);
    const { error } = await supabase.from('maquinaria').delete().eq('id', confirmDelete.id);
    
    if (error) {
      console.error('[GestionMaquinas] Delete error:', error);
      showToast('error', `Error al eliminar: ${error.message}`);
      setDeleting(false);
      return;
    }
    
    console.log('[GestionMaquinas] Delete successful for id:', confirmDelete.id);
    showToast('success', 'Máquina eliminada correctamente.');
    setConfirmDelete(null);
    setDeleting(false);
    await loadData();
  };

  const maquinasFiltradas = filtrosCentro
    ? maquinas.filter(m => m.centro_id === filtrosCentro)
    : maquinas;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Wrench size={28} className="text-veolia-600" />
          <h2 className="text-3xl font-bold text-gray-800">Mantenimiento de Máquinas</h2>
        </div>
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select className="input-field py-2 text-sm" value={filtrosCentro} onChange={e => setFiltroCentro(e.target.value)}>
            <option value="">Todos los centros</option>
            {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-veolia-50 text-veolia-800 border border-veolia-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Código</th>
                <th className="px-6 py-4">Capacidad</th>
                <th className="px-6 py-4">Medición</th>
                <th className="px-6 py-4">Centro</th>
                <th className="px-6 py-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : maquinasFiltradas.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No hay máquinas.</td></tr>
              ) : maquinasFiltradas.map(m => (
                <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                  {editando?.id === m.id ? (
                    <>
                      <td className="px-6 py-3"><input type="text" className="input-field py-1.5 text-sm" value={editando.codigo_interno} onChange={e => setEditando({ ...editando, codigo_interno: e.target.value })} /></td>
                      <td className="px-6 py-3"><input type="number" className="input-field py-1.5 text-sm w-24" value={editando.capacidad_deposito} onChange={e => setEditando({ ...editando, capacidad_deposito: Number(e.target.value) })} /></td>
                      <td className="px-6 py-3">
                        <select className="input-field py-1.5 text-sm" value={editando.tipo_medicion} onChange={e => setEditando({ ...editando, tipo_medicion: e.target.value })}>
                          <option value="horas">Horas</option>
                          <option value="km">Km</option>
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <select className="input-field py-1.5 text-sm" value={editando.centro_id} onChange={e => setEditando({ ...editando, centro_id: e.target.value })}>
                          {centros.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button onClick={handleSaveEdit} disabled={savingEdit} className="text-veolia-600 hover:text-veolia-800 font-medium text-sm flex items-center gap-1"><Check size={14} /> Guardar</button>
                          <button onClick={() => setEditando(null)} className="text-gray-400 hover:text-gray-600 font-medium text-sm flex items-center gap-1"><X size={14} /> Cancelar</button>
                        </div>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="px-6 py-4 font-medium text-gray-900">{m.codigo_interno}</td>
                      <td className="px-6 py-4 text-gray-700">{m.capacidad_deposito} L</td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${m.tipo_medicion === 'km' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                          {m.tipo_medicion === 'km' ? 'Kilómetros' : 'Horas'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{m.centro?.nombre || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-3">
                          <button onClick={() => setEditando({ ...m })} className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar"><Pencil size={16} /></button>
                          <button onClick={() => setConfirmDelete(m)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar"><Trash2 size={16} /></button>
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

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full"><Trash2 size={22} className="text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar Máquina</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-3">Vas a eliminar la máquina <strong>{confirmDelete.codigo_interno}</strong>.</p>
            <p className="text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm mb-4">
              ⚠️ Se eliminarán en cascada <strong>todos los registros de consumo</strong> de esta máquina.
            </p>
            <div className="flex gap-3 mt-4">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                {deleting ? 'Eliminando...' : 'Sí, eliminar todo'}
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
