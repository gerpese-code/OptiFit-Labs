-- ==============================================================================
-- OPTIFIT LABS: SISTEMA DE NOTIFICACIONES DE REGISTRO DE ALUMNOS
-- Alertas enviadas a: gerpese.fitness@gmail.com
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.registration_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    birth_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    email_sent BOOLEAN NOT NULL DEFAULT false,
    sent_at TIMESTAMPTZ,
    error_message TEXT
);

COMMENT ON TABLE public.registration_notifications IS 'Cola y registro de auditoría de alertas de nuevos alumnos registrados en OptiFit Labs.';

ALTER TABLE public.registration_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Permitir insertar notificaciones a usuarios" ON public.registration_notifications;
CREATE POLICY "Permitir insertar notificaciones a usuarios"
    ON public.registration_notifications
    FOR INSERT
    TO authenticated, anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins pueden ver y gestionar notificaciones" ON public.registration_notifications;
CREATE POLICY "Admins pueden ver y gestionar notificaciones"
    ON public.registration_notifications
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );
