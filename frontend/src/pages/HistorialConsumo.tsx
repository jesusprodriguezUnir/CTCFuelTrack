import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { ClipboardList, Trash2, Check, AlertCircle, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface Registro {
  id: string;
  litros_repostados: number;
  lectura: number | null;
  fecha_repostaje: string;
  tipo_registro: string;
  maquina: { codigo_interno: string; tipo_medicion: string };
  surtidor?: { codigo_surtidor: string };
}

interface Maquina { id: string; codigo_interno: string; }

const PAGE_SIZE = 20;

export default function HistorialConsumo() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);

  const [filtros, setFiltros] = useState({ maquina_id: '', desde: '', hasta: '' });
  const [confirmDelete, setConfirmDelete] = useState<Registro | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3500);
  };

  const loadRegistros = useCallback(async (p = 0) => {
    setLoading(true);
    let query = supabase
      .from('registros_consumo')
      .select('id, litros_repostados, lectura, fecha_repostaje, tipo_registro, maquina:maquinaria(codigo_interno, tipo_medicion), surtidor:surtidores_config(codigo_surtidor)', { count: 'exact' })
      .order('fecha_repostaje', { ascending: false })
      .range(p * PAGE_SIZE, (p + 1) * PAGE_SIZE - 1);

    if (filtros.maquina_id) query = query.eq('maquina_id', filtros.maquina_id);
    if (filtros.desde) query = query.gte('fecha_repostaje', filtros.desde);
    if (filtros.hasta) query = query.lte('fecha_repostaje', filtros.hasta + 'T23:59:59');

    const { data, count, error } = await query;
    if (!error && data) { setRegistros(data as any); setTotal(count ?? 0); }
    setLoading(false);
  }, [filtros]);

  const loadFiltros = useCallback(async () => {
    const { data: maqData } = await supabase
      .from('maquinaria').select('id, codigo_interno').order('codigo_interno');
    if (maqData) setMaquinas(maqData);
  }, []);

  useEffect(() => { loadFiltros(); }, [loadFiltros]);
  useEffect(() => { loadRegistros(page); }, [page, filtros, loadRegistros]);

  const handleDelete = async () => {
    if (!confirmDelete || deleting) return;
    setDeleting(true);
    console.log('[HistorialConsumo] Attempting to delete record:', confirmDelete.id);
    const { error } = await supabase.from('registros_consumo').delete().eq('id', confirmDelete.id);
    setDeleting(false);
    
    if (error) {
      console.error('[HistorialConsumo] Delete error:', error);
      showToast('error', `Error al eliminar: ${error.message}`);
      return;
    }
    
    console.log('[HistorialConsumo] Delete successful');
    showToast('success', 'Registro eliminado correctamente.');
    setConfirmDelete(null);
    loadRegistros(page);
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <ClipboardList size={28} className="text-veolia-600" />
        <h2 className="text-3xl font-bold text-gray-800">Historial de Consumo</h2>
        <span className="ml-auto text-sm text-gray-500">{total} registros</span>
      </div>

      {toast && (
        <div className={`mb-4 p-4 rounded-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-veolia-50 text-veolia-800 border border-veolia-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
          {toast.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          {toast.msg}
        </div>
      )}

      {/* Filtros */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter size={16} className="text-gray-500" />
          <span className="font-medium text-gray-700">Filtros</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Máquina</label>
            <select className="input-field py-2 text-sm" value={filtros.maquina_id} onChange={e => { setFiltros({ ...filtros, maquina_id: e.target.value }); setPage(0); }}>
              <option value="">Todas</option>
              {maquinas.map(m => <option key={m.id} value={m.id}>{m.codigo_interno}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Desde</label>
            <input type="date" className="input-field py-2 text-sm" value={filtros.desde} onChange={e => { setFiltros({ ...filtros, desde: e.target.value }); setPage(0); }} />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Hasta</label>
            <input type="date" className="input-field py-2 text-sm" value={filtros.hasta} onChange={e => { setFiltros({ ...filtros, hasta: e.target.value }); setPage(0); }} />
          </div>
        </div>
        {(filtros.maquina_id || filtros.desde || filtros.hasta) && (
          <button onClick={() => { setFiltros({ maquina_id: '', desde: '', hasta: '' }); setPage(0); }} className="mt-3 text-sm text-blue-600 hover:underline">
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Máquina</th>
                <th className="px-6 py-4">Lectura</th>
                <th className="px-6 py-4">Litros</th>
                <th className="px-6 py-4">Tipo</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Cargando...</td></tr>
              ) : registros.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay registros.</td></tr>
              ) : registros.map(r => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{new Date(r.fecha_repostaje).toLocaleString('es-ES')}</td>
                  <td className="px-6 py-4 font-medium text-gray-900">{r.maquina?.codigo_interno || 'N/A'}</td>
                  <td className="px-6 py-4 text-gray-600">{r.lectura ?? '—'} {r.lectura ? r.maquina?.tipo_medicion : ''}</td>
                  <td className="px-6 py-4 font-semibold text-blue-600">{r.litros_repostados} L</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${r.tipo_registro === 'automatico' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                      {r.tipo_registro}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => setConfirmDelete(r)} className="text-red-400 hover:text-red-600 transition-colors" title="Eliminar registro"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <span className="text-sm text-gray-500">Página {page + 1} de {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 0} onClick={() => setPage(p => p - 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronLeft size={16} /></button>
              <button disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"><ChevronRight size={16} /></button>
            </div>
          </div>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-100 p-3 rounded-full"><Trash2 size={22} className="text-red-600" /></div>
              <div>
                <h3 className="font-bold text-gray-900">Eliminar Registro</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>
            <p className="text-gray-700 mb-1">Máquina: <strong>{confirmDelete.maquina?.codigo_interno}</strong></p>
            <p className="text-gray-700 mb-4">Litros: <strong>{confirmDelete.litros_repostados} L</strong> — {new Date(confirmDelete.fecha_repostaje).toLocaleString('es-ES')}</p>
            <div className="flex gap-3">
              <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-lg font-medium transition-colors">
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 py-2.5 rounded-lg font-medium transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
