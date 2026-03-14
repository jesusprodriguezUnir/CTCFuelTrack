import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Droplet, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function RegistroManual() {
  const [maquinas, setMaquinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const [formData, setFormData] = useState({
    maquina_id: '',
    litros_repostados: ''
  });

  useEffect(() => {
    async function loadMaquinas() {
      const { data } = await supabase.from('maquinaria').select('id, codigo_interno, capacidad_deposito');
      if (data) setMaquinas(data);
    }
    loadMaquinas();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const maquina = maquinas.find(m => m.id === formData.maquina_id);
    if (maquina && Number(formData.litros_repostados) > maquina.capacidad_deposito) {
      setStatus({ type: 'error', msg: `Superaste la capacidad máxima de ${maquina.capacidad_deposito} L.` });
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;

    const { error } = await supabase.from('registros_consumo').insert([
      {
        maquina_id: formData.maquina_id,
        litros_repostados: Number(formData.litros_repostados),
        tipo_registro: 'manual',
        usuario_id: user?.id || null
      }
    ]);

    setLoading(false);

    if (error) {
      setStatus({ type: 'error', msg: error.message || 'Error al guardar el registro.' });
    } else {
      setStatus({ type: 'success', msg: 'Repostaje manual registrado precticando en la base de datos.' });
      setFormData({ maquina_id: '', litros_repostados: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Registro Manual TPV</h2>
      
      <div className="card p-8">
        {status && (
          <div className={`p-4 mb-6 rounded-lg flex items-center gap-3 ${
            status.type === 'success' ? 'bg-veolia-50 text-veolia-800 border border-veolia-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="text-veolia-500" /> : <AlertCircle className="text-red-500" />}
            <span className="font-medium">{status.msg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="maquina_id" className="block text-sm font-medium text-gray-700 mb-2">
              Seleccionar Máquina
            </label>
            <select
              id="maquina_id"
              required
              className="input-field"
              value={formData.maquina_id}
              onChange={(e) => setFormData({...formData, maquina_id: e.target.value})}
            >
              <option value="">Buscar por código de máquina...</option>
              {maquinas.map((m) => (
                <option key={m.id} value={m.id}>{m.codigo_interno} (Max: {m.capacidad_deposito} L)</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="litros_repostados" className="block text-sm font-medium text-gray-700 mb-2">
              Litros Repostados
            </label>
            <div className="relative">
              <input
                id="litros_repostados"
                type="number"
                required
                min="0.1"
                step="0.01"
                className="input-field pl-10"
                value={formData.litros_repostados}
                onChange={(e) => setFormData({...formData, litros_repostados: e.target.value})}
                placeholder="Ej. 50.5"
              />
              <Droplet className="absolute left-3 top-2.5 text-gray-400" size={18} />
            </div>
            
            {formData.maquina_id && (
              <p className="mt-2 text-sm text-gray-500">
                Límite físico: <span className="font-medium">
                  {maquinas.find(m => m.id === formData.maquina_id)?.capacidad_deposito} L
                </span>
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || !formData.maquina_id}
              className="btn-primary"
            >
              {loading ? 'Registrando...' : <><Droplet size={18} /> Confirmar Repostaje</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
