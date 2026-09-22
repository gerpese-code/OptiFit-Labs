-- ==============================================================================
-- FITNESS-PRO: RUTINAS POR GRUPO MUSCULAR & CONTADORES DE FINALIZACIÓN (+1)
-- 1. Agrega columnas completion_count y last_completed_at a routine_days.
-- 2. Sincroniza conteos históricos a partir de workout_sessions completadas.
-- ==============================================================================

-- 1. Columnas nuevas en routine_days
ALTER TABLE public.routine_days
ADD COLUMN IF NOT EXISTS completion_count INT NOT NULL DEFAULT 0;

ALTER TABLE public.routine_days
ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_routine_days_routine_id ON public.routine_days(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_days_last_completed ON public.routine_days(last_completed_at);

COMMENT ON COLUMN public.routine_days.completion_count IS 'Cantidad de veces que el alumno ha completado esta rutina / grupo muscular.';
COMMENT ON COLUMN public.routine_days.last_completed_at IS 'Fecha y hora de la última vez que el alumno completó esta rutina.';

-- 3. Sincronización inicial desde workout_sessions
UPDATE public.routine_days rd
SET 
  completion_count = COALESCE((
    SELECT COUNT(*) 
    FROM public.workout_sessions ws 
    WHERE ws.routine_day_id = rd.id 
      AND ws.status = 'completed'
  ), 0),
  last_completed_at = (
    SELECT MAX(COALESCE(ws.completed_at, ws.created_at))
    FROM public.workout_sessions ws
    WHERE ws.routine_day_id = rd.id
      AND ws.status = 'completed'
  );
