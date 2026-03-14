import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function AltaMaquina() {
  const [centros, setCentros] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);

  const [formData, setFormData] = useState({
    codigo_interno: '',
    capacidad_deposito: '',
    centro_id: ''
  });

  useEffect(() => {
    async function loadCentros() {
      const { data } = await supabase.from('centros_operativos').select('id, nombre');
      if (data) setCentros(data);
    }
    loadCentros();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    const { error } = await supabase.from('maquinaria').insert([
      {
        codigo_interno: formData.codigo_interno,
        capacidad_deposito: Number(formData.capacidad_deposito),
        centro_id: formData.centro_id
      }
    ]);

    setLoading(false);

    if (error) {
      setStatus({ type: 'error', msg: error.message || 'Error al guardar la máquina.' });
    } else {
      setStatus({ type: 'success', msg: 'Máquina registrada correctamente.' });
      setFormData({ codigo_interno: '', capacidad_deposito: '', centro_id: '' });
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Alta de Nueva Máquina</h2>
      
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
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código Interno (ej. EXC-001)
            </label>
            <input
              type="text"
              required
              className="input-field"
              value={formData.codigo_interno}
              onChange={(e) => setFormData({...formData, codigo_interno: e.target.value})}
              placeholder="Identificador único"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Capacidad del Depósito (Litros)
            </label>
            <input
              type="number"
              required
              min="1"
              step="0.01"
              className="input-field"
              value={formData.capacidad_deposito}
              onChange={(e) => setFormData({...formData, capacidad_deposito: e.target.value})}
              placeholder="Ej. 250"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Centro Operativo Asignado
            </label>
            <select
              required
              className="input-field"
              value={formData.centro_id}
              onChange={(e) => setFormData({...formData, centro_id: e.target.value})}
            >
              <option value="">Selecciona un centro...</option>
              {centros.map((c) => (
                <option key={c.id} value={c.id}>{c.nombre}</option>
              ))}
            </select>
            {centros.length === 0 && (
              <p className="mt-2 text-sm text-amber-600 flex items-center gap-1">
                <AlertCircle size={14} /> 
                Aún no hay centros operativos (o no has ejecutado el script SQL que incluye el centro semilla).
              </p>
            )}
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button
              type="submit"
              disabled={loading || centros.length === 0}
              className="btn-primary"
            >
              {loading ? 'Guardando...' : <><Save size={18} /> Guardar Máquina</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
