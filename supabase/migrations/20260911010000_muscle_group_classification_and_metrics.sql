-- ==============================================================================
-- FITNESS-PRO: CLASIFICACIÓN ESTRICTA POR GRUPO MUSCULAR & MÉTRICAS INDEPENDIENTES (+1)
-- 1. Agrega columna muscle_group a routine_days (bloques de rutina asignados).
-- 2. Agrega columna muscle_group a workout_sessions (logs de entrenamiento).
-- 3. Índices de consulta rápida por cliente y grupo muscular.
-- ==============================================================================

-- 1. Agregar muscle_group a routine_days
ALTER TABLE public.routine_days
ADD COLUMN IF NOT EXISTS muscle_group VARCHAR(100) DEFAULT NULL;

-- 2. Agregar muscle_group a workout_sessions
ALTER TABLE public.workout_sessions
ADD COLUMN IF NOT EXISTS muscle_group VARCHAR(100) DEFAULT NULL;

-- 3. Índices para optimizar reportes y conteos
CREATE INDEX IF NOT EXISTS idx_routine_days_muscle_group ON public.routine_days(muscle_group);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_client_muscle ON public.workout_sessions(client_id, muscle_group);

COMMENT ON COLUMN public.routine_days.muscle_group IS 'Grupo muscular asignado a este bloque de rutina (ej. Pecho, Espalda, Cuádriceps, Glúteos, Tríceps, etc.)';
COMMENT ON COLUMN public.workout_sessions.muscle_group IS 'Grupo muscular entrenado en esta sesión específica para cómputo de métricas +1 independientes.';
