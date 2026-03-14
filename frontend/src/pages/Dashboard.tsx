import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Beaker, Truck, AlertCircle } from 'lucide-react';

interface Registro {
  id: string;
  litros_repostados: number;
  fecha_repostaje: string;
  tipo_registro: string;
  maquina: { codigo_interno: string };
  surtidor?: { codigo_surtidor: string };
}

export default function Dashboard() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRegistros() {
      try {
        const { data, error } = await supabase
          .from('registros_consumo')
          .select(`
            id, litros_repostados, fecha_repostaje, tipo_registro,
            maquina:maquinaria(codigo_interno),
            surtidor:surtidores_config(codigo_surtidor)
          `)
          .order('fecha_repostaje', { ascending: false })
          .limit(10);
        
        if (error) throw error;
        
        if (data) {
          setRegistros(data as any);
        }
      } catch (err: any) {
         setErrorStatus(err.message || "Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    }
    fetchRegistros();
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-800 mb-8">Dashboard General</h2>
      
      {errorStatus && (
          <div className="p-4 mb-6 rounded-lg flex items-center gap-3 bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="text-red-500" />
            <span className="font-medium">{errorStatus}. Asegúrate de haber ejecutado el script SQL en Supabase.</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-veolia-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Volumen Repostado (Últimos 10)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {registros.reduce((acc, r) => acc + Number(r.litros_repostados), 0).toFixed(2)} L
              </h3>
            </div>
            <div className="bg-veolia-100 p-3 rounded-full text-veolia-600">
              <Beaker size={24} />
            </div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Máquinas Activas (Historial)</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {new Set(registros.map(r => r.maquina?.codigo_interno)).size}
              </h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registros Recientes</p>
              <h3 className="text-2xl font-bold text-gray-900">{registros.length}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800">Últimos Registros de Consumo</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Máquina</th>
                <th className="px-6 py-4">Surtidor</th>
                <th className="px-6 py-4">Litros</th>
                <th className="px-6 py-4">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    No hay registros de consumo todavía.
                  </td>
                </tr>
              ) : (
                registros.map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(registro.fecha_repostaje).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {registro.maquina?.codigo_interno || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {registro.surtidor?.codigo_surtidor || 'Manual'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-veolia-600">
                      {registro.litros_repostados} L
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        registro.tipo_registro === 'automatico' 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {registro.tipo_registro}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
