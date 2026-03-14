-- CTCFuelTrack Supabase Migration
-- 1. Creación de Tablas

CREATE TABLE centros_operativos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    ubicacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE maquinaria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo_interno TEXT UNIQUE NOT NULL,
    capacidad_deposito NUMERIC NOT NULL,
    centro_id UUID REFERENCES centros_operativos(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE surtidores_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    centro_id UUID REFERENCES centros_operativos(id) ON DELETE CASCADE,
    codigo_surtidor TEXT UNIQUE NOT NULL,
    api_endpoint TEXT,
    estado TEXT DEFAULT 'activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE registros_consumo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    maquina_id UUID REFERENCES maquinaria(id) ON DELETE CASCADE,
    surtidor_id UUID REFERENCES surtidores_config(id) ON DELETE SET NULL,
    litros_repostados NUMERIC NOT NULL,
    tipo_registro TEXT CHECK (tipo_registro IN ('manual', 'automatico')),
    fecha_repostaje TIMESTAMPTZ DEFAULT now() NOT NULL,
    usuario_id UUID REFERENCES auth.users(id), -- Opcional, quien registra manualmente
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Row Level Security (RLS)

ALTER TABLE centros_operativos ENABLE ROW LEVEL SECURITY;
ALTER TABLE maquinaria ENABLE ROW LEVEL SECURITY;
ALTER TABLE surtidores_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE registros_consumo ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura para usuarios autenticados
CREATE POLICY "Authenticated users can read centros_operativos" ON centros_operativos FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read maquinaria" ON maquinaria FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read surtidores_config" ON surtidores_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can read registros_consumo" ON registros_consumo FOR SELECT TO authenticated USING (true);

-- Políticas de escritura para usuarios autenticados
CREATE POLICY "Authenticated users can insert maquinaria" ON maquinaria FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can insert registros_consumo" ON registros_consumo FOR INSERT TO authenticated WITH CHECK (true);

-- Política para el backend (Service Role)
-- El backend usa la Service Role Key, que inherentemente bypassa RLS o podemos ser explicitos:
-- Nota: La Service Role Key bypassa RLS por defecto en Supabase.
-- Añadimos la clave foranea a auth.users para trazabilidad.

-- 3. Datos de prueba iniciales (Semillas)
INSERT INTO centros_operativos (nombre, ubicacion) VALUES ('Centro Móstoles', 'Madrid') RETURNING id;
-- (Nota: Para asignar una máquina a este centro, necesitarías copiar el ID generado).
