-- ==============================================================================
-- FITNESS-PRO: EJERCICIOS PROPIOS DE ALUMNOS & GESTIÓN DE RUTINAS POR ALUMNOS
-- 1. Permite a los alumnos crear ejercicios propios en la base de datos.
-- 2. Privacidad estricta: Solo el alumno creador y el Coach (admin) pueden verlos.
-- 3. Todos los alumnos pueden ver el catálogo predeterminado oficial.
-- 4. Permite a los alumnos agregar, modificar o eliminar ejercicios de sus rutinas
--    y crear rutinas personalizadas.
-- ==============================================================================

-- 1. COLUMNAS NUEVAS EN EXERCISES
ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE DEFAULT NULL;

ALTER TABLE public.exercises 
ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_exercises_created_by ON public.exercises(created_by);
CREATE INDEX IF NOT EXISTS idx_exercises_is_custom ON public.exercises(is_custom);

COMMENT ON COLUMN public.exercises.created_by IS 'ID del alumno o usuario que creó este ejercicio. NULL si es un ejercicio oficial del Coach/Sistema.';
COMMENT ON COLUMN public.exercises.is_custom IS 'Indica si es un ejercicio personalizado creado por un alumno (true) o predeterminado del Coach (false).';

-- ------------------------------------------------------------------------------
-- 2. POLÍTICAS RLS EN PUBLIC.EXERCISES (PRIVACIDAD ESTRICTA)
-- ------------------------------------------------------------------------------

-- Eliminar políticas previas para evitar conflictos
DROP POLICY IF EXISTS "Authenticated users view exercises" ON public.exercises;
DROP POLICY IF EXISTS "Admin full access on exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users view default and own exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users insert own custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users update own custom exercises" ON public.exercises;
DROP POLICY IF EXISTS "Users delete own custom exercises" ON public.exercises;

-- Admin tiene acceso completo a todos los ejercicios
CREATE POLICY "Admin full access on exercises"
    ON public.exercises FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- SELECT: Alumnos solo ven ejercicios predeterminados (created_by IS NULL) O sus propios ejercicios creados (created_by = auth.uid()).
-- Ningún alumno puede ver los ejercicios creados por otros alumnos.
CREATE POLICY "Users view default and own exercises"
    ON public.exercises FOR SELECT
    TO authenticated
    USING (
        created_by IS NULL 
        OR created_by = auth.uid() 
        OR public.is_admin()
    );

-- INSERT: Un usuario autenticado solo puede insertar ejercicios donde él sea el autor (created_by = auth.uid()).
CREATE POLICY "Users insert own custom exercises"
    ON public.exercises FOR INSERT
    TO authenticated
    WITH CHECK (
        (auth.uid() IS NOT NULL AND created_by = auth.uid() AND is_custom = true)
        OR public.is_admin()
    );

-- UPDATE: Un usuario solo puede actualizar sus propios ejercicios (o admin cualquiera).
CREATE POLICY "Users update own custom exercises"
    ON public.exercises FOR UPDATE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin())
    WITH CHECK (created_by = auth.uid() OR public.is_admin());

-- DELETE: Un usuario solo puede eliminar sus propios ejercicios (o admin cualquiera).
CREATE POLICY "Users delete own custom exercises"
    ON public.exercises FOR DELETE
    TO authenticated
    USING (created_by = auth.uid() OR public.is_admin());

-- ------------------------------------------------------------------------------
-- 3. POLÍTICAS RLS PARA GESTIÓN DE RUTINAS POR PARTE DE ALUMNOS
-- Permite que los alumnos creen rutinas propias y agreguen/eliminen/modifiquen ejercicios
-- ------------------------------------------------------------------------------

-- routines: Alumnos pueden insertar, actualizar y eliminar sus propias rutinas
DROP POLICY IF EXISTS "Clients can insert own routines" ON public.routines;
CREATE POLICY "Clients can insert own routines"
    ON public.routines FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can update own routines" ON public.routines;
CREATE POLICY "Clients can update own routines"
    ON public.routines FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

DROP POLICY IF EXISTS "Clients can delete own routines" ON public.routines;
CREATE POLICY "Clients can delete own routines"
    ON public.routines FOR DELETE
    TO authenticated
    USING (client_id = auth.uid());

-- routine_days: Alumnos pueden gestionar días de sus propias rutinas
DROP POLICY IF EXISTS "Clients can manage own routine days" ON public.routine_days;
CREATE POLICY "Clients can manage own routine days"
    ON public.routine_days FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routines r 
            WHERE r.id = routine_days.routine_id 
              AND r.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.routines r 
            WHERE r.id = routine_days.routine_id 
              AND r.client_id = auth.uid()
        )
    );

-- routine_exercises: Alumnos pueden gestionar ejercicios de sus propias rutinas
DROP POLICY IF EXISTS "Clients can manage own routine exercises" ON public.routine_exercises;
CREATE POLICY "Clients can manage own routine exercises"
    ON public.routine_exercises FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routine_days rd
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE rd.id = routine_exercises.routine_day_id 
              AND r.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.routine_days rd
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE rd.id = routine_exercises.routine_day_id 
              AND r.client_id = auth.uid()
        )
    );

-- routine_exercise_sets: Alumnos pueden gestionar series de sus propios ejercicios de rutina
DROP POLICY IF EXISTS "Clients can manage own routine exercise sets" ON public.routine_exercise_sets;
CREATE POLICY "Clients can manage own routine exercise sets"
    ON public.routine_exercise_sets FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routine_exercises re
            JOIN public.routine_days rd ON rd.id = re.routine_day_id
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE re.id = routine_exercise_sets.routine_exercise_id 
              AND r.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.routine_exercises re
            JOIN public.routine_days rd ON rd.id = re.routine_day_id
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE re.id = routine_exercise_sets.routine_exercise_id 
              AND r.client_id = auth.uid()
        )
    );
