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
    tipo_medicion TEXT DEFAULT 'horas' CHECK (tipo_medicion IN ('horas', 'km')),
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
    lectura NUMERIC,
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

-- Función helper para verificar si el usuario es admin (SECURITY DEFINER evita recursión)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM perfiles WHERE user_id = auth.uid() AND rol = 'admin'
  );
END;
$$;

-- Políticas de escritura/borrado solo para admins (usan is_admin() para evitar recursión)
CREATE POLICY "Admins can insert centros_operativos" ON centros_operativos FOR INSERT TO authenticated
  WITH CHECK (is_admin());
CREATE POLICY "Admins can update centros_operativos" ON centros_operativos FOR UPDATE TO authenticated
  USING (is_admin());
CREATE POLICY "Admins can delete centros_operativos" ON centros_operativos FOR DELETE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can update maquinaria" ON maquinaria FOR UPDATE TO authenticated
  USING (is_admin());
CREATE POLICY "Admins can delete maquinaria" ON maquinaria FOR DELETE TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can delete registros_consumo" ON registros_consumo FOR DELETE TO authenticated
  USING (is_admin());

-- Política para el backend (Service Role)
-- El backend usa la Service Role Key, que inherentemente bypassa RLS o podemos ser explicitos:
-- Nota: La Service Role Key bypassa RLS por defecto en Supabase.
-- Añadimos la clave foranea a auth.users para trazabilidad.

-- 3. Datos de prueba iniciales (Semillas)
INSERT INTO centros_operativos (nombre, ubicacion) VALUES ('Centro Móstoles', 'Madrid') RETURNING id;
-- (Nota: Para asignar una máquina a este centro, necesitarías copiar el ID generado).

-- 4. Migraciones para bases de datos existentes
-- ALTER TABLE maquinaria ADD COLUMN tipo_medicion TEXT DEFAULT 'horas' CHECK (tipo_medicion IN ('horas', 'km'));
-- ALTER TABLE registros_consumo ADD COLUMN lectura NUMERIC;

-- 5. Tabla de perfiles (roles de usuario)
CREATE TABLE perfiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  rol TEXT NOT NULL DEFAULT 'operario' CHECK (rol IN ('admin', 'operario')),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE perfiles ENABLE ROW LEVEL SECURITY;

-- Cada usuario puede leer su propio perfil
CREATE POLICY "Users can read own profile" ON perfiles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Los admins pueden leer todos los perfiles
CREATE POLICY "Admins can read all profiles" ON perfiles
  FOR SELECT TO authenticated
  USING ((SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin');

-- Los admins pueden actualizar roles
CREATE POLICY "Admins can update profiles" ON perfiles
  FOR UPDATE TO authenticated
  USING ((SELECT rol FROM perfiles WHERE user_id = auth.uid()) = 'admin');

-- IMPORTANTE: Insertar tu primer admin manualmente después de registrarte:
-- INSERT INTO perfiles (user_id, rol) VALUES ('<tu-user-id>', 'admin');
-- El user_id lo puedes encontrar en Supabase > Authentication > Users
