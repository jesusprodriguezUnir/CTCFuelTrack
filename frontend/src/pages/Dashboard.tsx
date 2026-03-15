import { useEffect, useState, useMemo } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Beaker, Truck, AlertCircle, Filter } from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart,
  Area
} from 'recharts';

interface Registro {
  id: string;
  litros_repostados: number;
  lectura: number;
  fecha_repostaje: string;
  tipo_registro: string;
  maquina: { 
    id: string;
    codigo_interno: string,
    tipo_medicion: 'horas' | 'km',
    centro_id: string
  };
  surtidor?: { codigo_surtidor: string };
  consumo?: string;
  consumoValor?: number;
}

interface Centro {
  id: string;
  nombre: string;
}

export default function Dashboard() {
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [centros, setCentros] = useState<Centro[]>([]);
  const [filtroCentro, setFiltroCentro] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);

  useEffect(() => {
    async function fetchInitialData() {
      const { data: centrosData } = await supabase.from('centros_operativos').select('id, nombre').order('nombre');
      if (centrosData) setCentros(centrosData);
    }
    fetchInitialData();
  }, []);

  useEffect(() => {
    async function fetchRegistros() {
      setLoading(true);
      try {
        let query = supabase
          .from('registros_consumo')
          .select(`
            id, litros_repostados, lectura, fecha_repostaje, tipo_registro,
            maquina:maquinaria(id, codigo_interno, tipo_medicion, centro_id),
            surtidor:surtidores_config(codigo_surtidor)
          `)
          .order('fecha_repostaje', { ascending: false });

        // Note: For filtering by centro_id, we need a join or filter on the nested object
        // Supabase allows filtering on joined tables using dot notation
        
        const { data, error } = await query;
        if (error) throw error;
        
        if (data) {
          // Filtrar por centro si hay uno seleccionado (hacemos el filtro en cliente para simplificar la lógica de join compleja)
          let filteredData = data;
          if (filtroCentro) {
            filteredData = data.filter((reg: any) => {
              const maquina = Array.isArray(reg.maquina) ? reg.maquina[0] : reg.maquina;
              return maquina?.centro_id === filtroCentro;
            });
          }

          // Calcular consumos comparando con el registro anterior de la misma máquina
          // Necesitamos más de los 10 registros limitados para calcular consumos correctamente
          const sortedData = [...filteredData].sort((a, b) => 
            new Date(a.fecha_repostaje).getTime() - new Date(b.fecha_repostaje).getTime()
          );

          const processedData = sortedData.map((reg: any, index: number) => {
            const maquina = Array.isArray(reg.maquina) ? reg.maquina[0] : reg.maquina;
            const prevReg = sortedData.slice(0, index).reverse().find((r: any) => {
              const rMaquina = Array.isArray(r.maquina) ? r.maquina[0] : r.maquina;
              return rMaquina?.id === maquina?.id;
            });
            
            let consumo = '---';
            let consumoValor = 0;
            if (prevReg && reg.lectura && prevReg.lectura) {
              const diffLectura = reg.lectura - prevReg.lectura;
              if (diffLectura > 0) {
                consumoValor = reg.litros_repostados / diffLectura;
                const unidad = maquina?.tipo_medicion === 'km' ? 'L/km' : 'L/h';
                consumo = `${consumoValor.toFixed(2)} ${unidad}`;
              }
            }
            return { ...reg, maquina, consumo, consumoValor };
          });

          setRegistros(processedData.reverse() as any);
        }
      } catch (err: any) {
         setErrorStatus(err.message || "Error al cargar los datos.");
      } finally {
        setLoading(false);
      }
    }
    fetchRegistros();
  }, [filtroCentro]);

  const chartData = useMemo(() => {
    // Agrupar consumos por día para el gráfico
    const last15Days = [...new Array(15)].map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last15Days.map(date => {
      const dailyRegs = registros.filter(r => r.fecha_repostaje.startsWith(date));
      const totalLitros = dailyRegs.reduce((sum, r) => sum + Number(r.litros_repostados), 0);
      return {
        fecha: date.split('-').slice(1).reverse().join('/'),
        litros: Math.round(totalLitros * 100) / 100
      };
    });
  }, [registros]);

  const stats = useMemo(() => {
    const totalLitros = registros.slice(0, 10).reduce((acc, r) => acc + Number(r.litros_repostados), 0);
    const machinesCount = new Set(registros.map(r => r.maquina?.codigo_interno)).size;
    return { totalLitros, machinesCount };
  }, [registros]);

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h2 className="text-3xl font-bold text-gray-800">Dashboard General</h2>
        
        <div className="flex items-center gap-3 bg-white p-2 rounded-xl shadow-sm border border-gray-100 min-w-[200px]">
          <Filter size={18} className="text-gray-400 ml-2" />
          <select 
            className="bg-transparent border-none text-sm font-medium focus:ring-0 w-full cursor-pointer"
            value={filtroCentro}
            onChange={(e) => setFiltroCentro(e.target.value)}
          >
            <option value="">Todos los Centros</option>
            {centros.map(c => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </div>
      </div>
      
      {errorStatus && (
          <div className="p-4 mb-6 rounded-lg flex items-center gap-3 bg-red-50 text-red-800 border border-red-200">
            <AlertCircle className="text-red-500 flex-shrink-0" />
            <span className="font-medium">{errorStatus}</span>
          </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="card p-6 border-l-4 border-veolia-500 hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Volumen Repostado (Últimos 10)</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.totalLitros.toFixed(1)} L</h3>
            </div>
            <div className="bg-veolia-100 p-3 rounded-full text-veolia-600">
              <Beaker size={24} />
            </div>
          </div>
        </div>
        
        <div className="card p-6 border-l-4 border-blue-500 hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Máquinas Activas</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.machinesCount}</h3>
            </div>
            <div className="bg-blue-100 p-3 rounded-full text-blue-600">
              <Truck size={24} />
            </div>
          </div>
        </div>

        <div className="card p-6 border-l-4 border-purple-500 hover:translate-y-[-2px] transition-transform duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">Registros Recientes</p>
              <h3 className="text-2xl font-bold text-gray-900">{registros.length > 0 ? Math.min(registros.length, 10) : 0}</h3>
            </div>
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
              <Activity size={24} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Gráfico de Tendencia */}
        <div className="lg:col-span-2 card p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-6">Tendencia de Repostajes (Últimos 15 días)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLitros" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="fecha" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#9ca3af', fontSize: 12}}
                  unit=" L"
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="litros" 
                  stroke="#22c55e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorLitros)" 
                  name="Litros totales"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Info lateral o Alertas */}
        <div className="card p-6 flex flex-col justify-center">
          <div className="text-center">
            <div className="inline-flex p-4 rounded-full bg-veolia-50 text-veolia-600 mb-4">
              <Activity size={32} />
            </div>
            <h4 className="text-xl font-bold text-gray-800 mb-2">Estado del Sistema</h4>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Monitoreando {stats.machinesCount} máquinas en {filtroCentro ? 'el centro seleccionado' : 'todos los centros'}.
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600">Eficiencia Promedio</span>
                <span className="font-bold text-gray-900">Normal</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg text-sm">
                <span className="text-gray-600">Alertas de Consumo</span>
                <span className="font-bold text-green-600">Ninguna</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800">Últimos Registros de Consumo</h3>
          <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-1 rounded">Últimos 10 registros</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Fecha</th>
                <th className="px-6 py-4">Máquina</th>
                <th className="px-6 py-4">Lectura</th>
                <th className="px-6 py-4">Litros</th>
                <th className="px-6 py-4">Consumo</th>
                <th className="px-6 py-4">Tipo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    Cargando registros...
                  </td>
                </tr>
              ) : registros.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    No hay registros de consumo todavía.
                  </td>
                </tr>
              ) : (
                registros.slice(0, 10).map((registro) => (
                  <tr key={registro.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {new Date(registro.fecha_repostaje).toLocaleString('es-ES')}
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-900">
                      {registro.maquina?.codigo_interno || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      {registro.lectura || '---'} {registro.maquina?.tipo_medicion || ''}
                    </td>
                    <td className="px-6 py-4 font-semibold text-blue-600">
                      {registro.litros_repostados} L
                    </td>
                    <td className="px-6 py-4 font-bold text-veolia-600">
                      {registro.consumo}
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
