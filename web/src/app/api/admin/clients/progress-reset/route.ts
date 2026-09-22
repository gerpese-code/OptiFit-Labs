import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId } = body;

    if (!clientId || typeof clientId !== 'string') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'El ID del alumno es obligatorio.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'Configuración de administrador no disponible (SUPABASE_SERVICE_ROLE_KEY faltante).' },
        { status: 500 }
      );
    }

    // 1. Verificar que el alumno exista
    const { data: clientProfile, error: profileErr } = await admin
      .from('profiles')
      .select('id, full_name, role')
      .eq('id', clientId)
      .single();

    if (profileErr || !clientProfile) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Alumno no encontrado en el sistema.' },
        { status: 404 }
      );
    }

    // 2. Obtener todas las sesiones del alumno para eliminar sus logs de series
    const { data: clientSessions } = await admin
      .from('workout_sessions')
      .select('id')
      .eq('client_id', clientId);

    const sessionIds = (clientSessions || []).map((s) => s.id);

    // 3. Eliminar workout_log_sets si existen sesiones
    if (sessionIds.length > 0) {
      const { error: logErr } = await admin
        .from('workout_log_sets')
        .delete()
        .in('session_id', sessionIds);

      if (logErr) {
        console.warn('Nota eliminando workout_log_sets:', logErr.message);
      }
    }

    // 4. Eliminar las sesiones de entrenamiento
    const { error: sessionsErr } = await admin
      .from('workout_sessions')
      .delete()
      .eq('client_id', clientId);

    if (sessionsErr) {
      throw new Error(`Error al eliminar sesiones: ${sessionsErr.message}`);
    }

    // 5. Eliminar métricas de peso corporal registradas
    const { error: metricsErr } = await admin
      .from('client_metrics')
      .delete()
      .eq('client_id', clientId);

    if (metricsErr) {
      console.warn('Nota eliminando client_metrics:', metricsErr.message);
    }

    // 6. Restablecer contadores de las rutinas del alumno
    const { data: clientRoutines } = await admin
      .from('routines')
      .select('id')
      .eq('client_id', clientId);

    const routineIds = (clientRoutines || []).map((r) => r.id);

    if (routineIds.length > 0) {
      const { error: daysResetErr } = await admin
        .from('routine_days')
        .update({
          completion_count: 0,
          last_completed_at: null,
        })
        .in('routine_id', routineIds);

      if (daysResetErr) {
        console.warn('Nota reseteando routine_days:', daysResetErr.message);
      }
    }

    return NextResponse.json({
      success: true,
      message: `El progreso y registros de "${clientProfile.full_name}" han sido reseteados exitosamente.`,
      resetDetails: {
        deletedSessionsCount: sessionIds.length,
        resetRoutinesCount: routineIds.length,
      },
    });
  } catch (err: any) {
    console.error('Error al resetear progreso del alumno:', err);
    return NextResponse.json(
      { error: 'SERVER_ERROR', message: err.message || 'Error inesperado al resetear el progreso.' },
      { status: 500 }
    );
  }
}
