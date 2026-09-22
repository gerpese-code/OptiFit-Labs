-- ==============================================================================
-- FITNESS-PRO: INITIAL DATABASE SCHEMA MIGRATION
-- Platform: Supabase (PostgreSQL 15+)
-- Architecture: Multi-role (Admin / Client), Realtime, Storage & RLS
-- ==============================================================================

-- 0. EXTENSIONS & SETUP
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLES DEFINITION
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Table: profiles
-- Extends auth.users with app-specific metadata and Apple soft-delete compliance
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    weight_unit_preference TEXT NOT NULL DEFAULT 'kg' CHECK (weight_unit_preference IN ('kg', 'lbs')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deleted_at TIMESTAMPTZ DEFAULT NULL
);

COMMENT ON TABLE public.profiles IS 'Perfil de usuario vinculado a auth.users con soporte de roles y borrado suave.';
COMMENT ON COLUMN public.profiles.deleted_at IS 'Marca de tiempo para soft-delete exigido por las pautas de revisión de Apple App Store.';

-- ------------------------------------------------------------------------------
-- Table: exercises
-- Master catalog of exercises created and managed by administrators
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    muscle_group TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    gif_url TEXT,
    image_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.exercises IS 'Catálogo maestro de ejercicios multimedia.';

-- ------------------------------------------------------------------------------
-- Table: routines
-- Training routines/programs assigned to clients (or reusable templates)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_template BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.routines IS 'Rutinas maestras asignadas a clientes o guardadas como plantillas.';

-- ------------------------------------------------------------------------------
-- Table: routine_days
-- Days or sessions that make up a routine (e.g., "Day 1 - Push", "Day 2 - Pull")
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routine_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_id UUID NOT NULL REFERENCES public.routines(id) ON DELETE CASCADE,
    day_number INT NOT NULL,
    name TEXT NOT NULL,
    order_index INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_routine_day_order UNIQUE (routine_id, order_index)
);

-- ------------------------------------------------------------------------------
-- Table: routine_exercises
-- Association between a routine day and an exercise
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routine_exercises (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_day_id UUID NOT NULL REFERENCES public.routine_days(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE RESTRICT,
    order_index INT NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_routine_exercise_order UNIQUE (routine_day_id, order_index)
);

-- ------------------------------------------------------------------------------
-- Table: routine_exercise_sets
-- Prescription of sets, reps, weight targets, RPE, and rest for an exercise
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.routine_exercise_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    routine_exercise_id UUID NOT NULL REFERENCES public.routine_exercises(id) ON DELETE CASCADE,
    set_number INT NOT NULL,
    target_reps INT NOT NULL,
    target_weight_kg NUMERIC(6,2),
    target_rpe NUMERIC(3,1) CHECK (target_rpe >= 1 AND target_rpe <= 10),
    rest_seconds INT NOT NULL DEFAULT 90,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_routine_set_number UNIQUE (routine_exercise_id, set_number)
);

-- ------------------------------------------------------------------------------
-- Table: workout_sessions
-- Live or recorded workout sessions executed by a client
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    routine_day_id UUID REFERENCES public.routine_days(id) ON DELETE SET NULL,
    scheduled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'missed' CHECK (status IN ('completed', 'partial', 'missed')),
    duration_minutes INT NOT NULL DEFAULT 0,
    completion_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (completion_rate >= 0.00 AND completion_rate <= 100.00),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Table: workout_log_sets
-- Actual completed sets recorded during a workout session
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.workout_log_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.workout_sessions(id) ON DELETE CASCADE,
    routine_exercise_set_id UUID REFERENCES public.routine_exercise_sets(id) ON DELETE SET NULL,
    set_number INT NOT NULL,
    reps_completed INT NOT NULL DEFAULT 0,
    weight_logged NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    unit_logged TEXT NOT NULL DEFAULT 'kg' CHECK (unit_logged IN ('kg', 'lbs')),
    weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    is_completed BOOLEAN NOT NULL DEFAULT false,
    rpe NUMERIC(3,1) CHECK (rpe >= 1 AND rpe <= 10),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON COLUMN public.workout_log_sets.weight_logged IS 'Peso tal cual lo ingresó el alumno según unit_logged.';
COMMENT ON COLUMN public.workout_log_sets.weight_kg IS 'Peso estandarizado siempre a kilogramos vía trigger backend.';

-- ------------------------------------------------------------------------------
-- Table: nutrition_plans
-- Nutritional programs and macro targets assigned to clients
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.nutrition_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    pdf_url TEXT,
    macros_json JSONB NOT NULL DEFAULT '{"calories": 0, "protein_g": 0, "carbs_g": 0, "fats_g": 0}'::jsonb,
    active BOOLEAN NOT NULL DEFAULT true,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- Table: client_metrics
-- Physical progress tracking (body weight, body fat %, progress photos)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.client_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    weight_logged NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    unit_logged TEXT NOT NULL DEFAULT 'kg' CHECK (unit_logged IN ('kg', 'lbs')),
    weight_kg NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    body_fat NUMERIC(4,2) CHECK (body_fat >= 0.00 AND body_fat <= 100.00),
    photos_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_client_metric_daily UNIQUE (client_id, date)
);

-- ==============================================================================
-- 2. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_routines_client_id ON public.routines(client_id);
CREATE INDEX IF NOT EXISTS idx_routine_days_routine_id ON public.routine_days(routine_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercises_day_id ON public.routine_exercises(routine_day_id);
CREATE INDEX IF NOT EXISTS idx_routine_exercise_sets_exercise_id ON public.routine_exercise_sets(routine_exercise_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_client_date ON public.workout_sessions(client_id, scheduled_date DESC);
CREATE INDEX IF NOT EXISTS idx_workout_log_sets_session_id ON public.workout_log_sets(session_id);
CREATE INDEX IF NOT EXISTS idx_nutrition_plans_client_active ON public.nutrition_plans(client_id) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_client_metrics_client_date ON public.client_metrics(client_id, date DESC);

-- ==============================================================================
-- 3. HELPER FUNCTIONS & TRIGGERS
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- Function: is_admin()
-- Helper to evaluate admin role securely without RLS recursive loops
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
          AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ------------------------------------------------------------------------------
-- Function & Trigger: Auto-insert profile on user registration
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    v_full_name TEXT;
    v_weight_pref TEXT;
BEGIN
    v_full_name := COALESCE(
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'name',
        split_part(NEW.email, '@', 1)
    );
    
    v_weight_pref := COALESCE(
        NEW.raw_user_meta_data->>'weight_unit_preference',
        'kg'
    );
    IF v_weight_pref NOT IN ('kg', 'lbs') THEN
        v_weight_pref := 'kg';
    END IF;

    INSERT INTO public.profiles (id, full_name, role, weight_unit_preference)
    VALUES (
        NEW.id,
        v_full_name,
        'client',
        v_weight_pref
    )
    ON CONFLICT (id) DO NOTHING;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- Function & Trigger: Standardize weight to KG (1 lb = 0.453592 kg)
-- Handles both direct inserts and updates with precision rounding to 2 decimals
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.standardize_weight_kg()
RETURNS TRIGGER AS $$
BEGIN
    -- Fallback si solo se envía weight_kg o weight_logged
    IF NEW.weight_logged = 0.00 AND NEW.weight_kg > 0.00 THEN
        NEW.weight_logged := NEW.weight_kg;
    END IF;

    IF NEW.unit_logged = 'lbs' THEN
        NEW.weight_kg := ROUND((NEW.weight_logged * 0.45359237)::numeric, 2);
    ELSE
        NEW.weight_kg := ROUND(NEW.weight_logged::numeric, 2);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_standardize_log_set_weight ON public.workout_log_sets;
CREATE TRIGGER trg_standardize_log_set_weight
    BEFORE INSERT OR UPDATE OF weight_logged, unit_logged, weight_kg
    ON public.workout_log_sets
    FOR EACH ROW
    EXECUTE FUNCTION public.standardize_weight_kg();

DROP TRIGGER IF EXISTS trg_standardize_client_metrics_weight ON public.client_metrics;
CREATE TRIGGER trg_standardize_client_metrics_weight
    BEFORE INSERT OR UPDATE OF weight_logged, unit_logged, weight_kg
    ON public.client_metrics
    FOR EACH ROW
    EXECUTE FUNCTION public.standardize_weight_kg();

-- ------------------------------------------------------------------------------
-- Function & Trigger: Updated_at auto-refresh
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_exercises_updated_at BEFORE UPDATE ON public.exercises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_routines_updated_at BEFORE UPDATE ON public.routines FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_routine_days_updated_at BEFORE UPDATE ON public.routine_days FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_routine_exercises_updated_at BEFORE UPDATE ON public.routine_exercises FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_routine_exercise_sets_updated_at BEFORE UPDATE ON public.routine_exercise_sets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_workout_sessions_updated_at BEFORE UPDATE ON public.workout_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE OR REPLACE TRIGGER trg_nutrition_plans_updated_at BEFORE UPDATE ON public.nutrition_plans FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==============================================================================
-- 4. STORAGE CONFIGURATION & POLICIES
-- ==============================================================================

-- Create buckets if they do not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
    ('exercise-media', 'exercise-media', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/quicktime']),
    ('nutrition-files', 'nutrition-files', false, 10485760, ARRAY['application/pdf']),
    ('progress-photos', 'progress-photos', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies for 'exercise-media' (Public read, admin write)
CREATE POLICY "Public read for exercise-media"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'exercise-media');

CREATE POLICY "Admin full access for exercise-media"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'exercise-media' AND public.is_admin())
    WITH CHECK (bucket_id = 'exercise-media' AND public.is_admin());

-- Storage Policies for 'nutrition-files' (Private: admin full, client read own files)
CREATE POLICY "Admin full access for nutrition-files"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'nutrition-files' AND public.is_admin())
    WITH CHECK (bucket_id = 'nutrition-files' AND public.is_admin());

CREATE POLICY "Client read own nutrition-files"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'nutrition-files'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policies for 'progress-photos' (Private: client own folder, admin view all)
CREATE POLICY "Admin full access for progress-photos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (bucket_id = 'progress-photos' AND public.is_admin())
    WITH CHECK (bucket_id = 'progress-photos' AND public.is_admin());

CREATE POLICY "Client manage own progress-photos"
    ON storage.objects FOR ALL
    TO authenticated
    USING (
        bucket_id = 'progress-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    )
    WITH CHECK (
        bucket_id = 'progress-photos'
        AND (storage.foldername(name))[1] = auth.uid()::text
    );

-- ==============================================================================
-- 5. REALTIME PUBLICATION
-- ==============================================================================
ALTER TABLE public.workout_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.workout_log_sets REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'workout_sessions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_sessions;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'workout_log_sets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.workout_log_sets;
    END IF;
END $$;

-- ==============================================================================
-- 6. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routine_exercise_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_log_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nutrition_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_metrics ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- Policies: profiles
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on profiles"
    ON public.profiles FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own profile"
    ON public.profiles FOR SELECT
    TO authenticated
    USING (auth.uid() = id AND deleted_at IS NULL);

CREATE POLICY "Client update own profile"
    ON public.profiles FOR UPDATE
    TO authenticated
    USING (auth.uid() = id AND deleted_at IS NULL)
    WITH CHECK (
        auth.uid() = id
        AND role = 'client' -- Prevents privilege escalation
    );

-- ------------------------------------------------------------------------------
-- Policies: exercises
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on exercises"
    ON public.exercises FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Authenticated users view exercises"
    ON public.exercises FOR SELECT
    TO authenticated
    USING (true);

-- ------------------------------------------------------------------------------
-- Policies: routines
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on routines"
    ON public.routines FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own routines"
    ON public.routines FOR SELECT
    TO authenticated
    USING (client_id = auth.uid() AND is_active = true);

-- ------------------------------------------------------------------------------
-- Policies: routine_days
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on routine_days"
    ON public.routine_days FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own routine days"
    ON public.routine_days FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routines r
            WHERE r.id = routine_days.routine_id
              AND r.client_id = auth.uid()
              AND r.is_active = true
        )
    );

-- ------------------------------------------------------------------------------
-- Policies: routine_exercises
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on routine_exercises"
    ON public.routine_exercises FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own routine exercises"
    ON public.routine_exercises FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routine_days rd
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE rd.id = routine_exercises.routine_day_id
              AND r.client_id = auth.uid()
              AND r.is_active = true
        )
    );

-- ------------------------------------------------------------------------------
-- Policies: routine_exercise_sets
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on routine_exercise_sets"
    ON public.routine_exercise_sets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own routine sets"
    ON public.routine_exercise_sets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.routine_exercises re
            JOIN public.routine_days rd ON rd.id = re.routine_day_id
            JOIN public.routines r ON r.id = rd.routine_id
            WHERE re.id = routine_exercise_sets.routine_exercise_id
              AND r.client_id = auth.uid()
              AND r.is_active = true
        )
    );

-- ------------------------------------------------------------------------------
-- Policies: workout_sessions
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on workout_sessions"
    ON public.workout_sessions FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own workout sessions"
    ON public.workout_sessions FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

CREATE POLICY "Client insert own workout sessions"
    ON public.workout_sessions FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "Client update own workout sessions"
    ON public.workout_sessions FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());

-- ------------------------------------------------------------------------------
-- Policies: workout_log_sets
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on workout_log_sets"
    ON public.workout_log_sets FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own workout log sets"
    ON public.workout_log_sets FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_log_sets.session_id
              AND s.client_id = auth.uid()
        )
    );

CREATE POLICY "Client insert own workout log sets"
    ON public.workout_log_sets FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_log_sets.session_id
              AND s.client_id = auth.uid()
        )
    );

CREATE POLICY "Client update own workout log sets"
    ON public.workout_log_sets FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_log_sets.session_id
              AND s.client_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_log_sets.session_id
              AND s.client_id = auth.uid()
        )
    );

CREATE POLICY "Client delete own workout log sets"
    ON public.workout_log_sets FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.workout_sessions s
            WHERE s.id = workout_log_sets.session_id
              AND s.client_id = auth.uid()
        )
    );

-- ------------------------------------------------------------------------------
-- Policies: nutrition_plans
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on nutrition_plans"
    ON public.nutrition_plans FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own active nutrition plan"
    ON public.nutrition_plans FOR SELECT
    TO authenticated
    USING (client_id = auth.uid() AND active = true);

-- ------------------------------------------------------------------------------
-- Policies: client_metrics
-- ------------------------------------------------------------------------------
CREATE POLICY "Admin full access on client_metrics"
    ON public.client_metrics FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Client view own metrics"
    ON public.client_metrics FOR SELECT
    TO authenticated
    USING (client_id = auth.uid());

CREATE POLICY "Client insert own metrics"
    ON public.client_metrics FOR INSERT
    TO authenticated
    WITH CHECK (client_id = auth.uid());

CREATE POLICY "Client update own metrics"
    ON public.client_metrics FOR UPDATE
    TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());
