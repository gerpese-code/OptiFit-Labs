import { supabase } from '@/lib/supabase';

let lastTouchTime = 0;
const THROTTLE_MS = 60 * 1000; // Máximo una actualización a Supabase por minuto para eficiencia

/**
 * Actualiza la marca de tiempo de última actividad del alumno en la base de datos de Supabase.
 * Permite que el entrenador vea en tiempo real cuándo el alumno estuvo activo por última vez en la app.
 */
export async function touchUserActivity(userId: string | undefined | null): Promise<void> {
  if (!userId) return;

  const now = Date.now();
  // Evitar llamadas excesivas si el usuario realiza múltiples toques seguidos
  if (now - lastTouchTime < THROTTLE_MS) {
    return;
  }
  lastTouchTime = now;

  try {
    const timestamp = new Date().toISOString();
    await supabase
      .from('profiles')
      .update({
        updated_at: timestamp,
      })
      .eq('id', userId);
  } catch (err) {
    // Falla silenciosa sin interrumpir la experiencia del alumno si está offline
    console.warn('[ActivityTracker] Aviso al registrar actividad:', err);
  }
}
