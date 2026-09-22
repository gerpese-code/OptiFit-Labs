-- ==============================================================================
-- FITNESS-PRO: ADD IS_ACTIVE TO PROFILES & MEMBERSHIP ACCESS CONTROL
-- Permite al Coach habilitar o pausar el acceso a las funciones del alumno
-- ==============================================================================

-- 1. Agregar columna is_active con valor por defecto true
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

-- 2. Índice de alto rendimiento para filtros
CREATE INDEX IF NOT EXISTS idx_profiles_is_active 
ON public.profiles(is_active) 
WHERE deleted_at IS NULL;

COMMENT ON COLUMN public.profiles.is_active IS 'Estado de membresía del alumno. Si es false, puede ingresar a la app pero tiene funciones limitadas (rutinas y progreso bloqueados).';
