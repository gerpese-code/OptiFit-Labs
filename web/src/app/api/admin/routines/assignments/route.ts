import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';

// GET: Obtener la rutina activa asignada a un cliente
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'clientId es requerido.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'No hay conexión de administrador configurada.' },
        { status: 500 }
      );
    }

    const { data: routines, error } = await admin
      .from('routines')
      .select(`
        id,
        title,
        description,
        is_active,
        created_at,
        routine_days (
          *,
          routine_exercises (
            id,
            exercise_id,
            notes,
            routine_exercise_sets (
              id,
              set_number,
              target_reps,
              target_weight_kg,
              target_rpe
            )
          )
        )
      `)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const list = routines || [];
    const activeRoutine = list.find((r) => r.is_active) || (list.length > 0 ? list[0] : null);

    return NextResponse.json({
      success: true,
      routines: list,
      activeRoutine,
    });
  } catch (err: any) {
    console.error('Error al obtener rutina del cliente:', err);
    return NextResponse.json(
      { error: 'FETCH_ERROR', message: err.message || 'Error al obtener la rutina del cliente.' },
      { status: 500 }
    );
  }
}

// POST: Asignar o Modificar rutinas activas de un cliente (soporte individual y múltiple por lotes de clientes y rutinas)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, clientIds, routineId, routineIds, startDate, replaceExisting } = body;

    // Normalizar a lista de IDs de clientes únicos
    const rawClientIds = Array.isArray(clientIds)
      ? clientIds
      : clientId
      ? [clientId]
      : [];
    const targetClientIds = Array.from(
      new Set(
        rawClientIds.filter(
          (id: any) => typeof id === 'string' && id.trim() !== ''
        )
      )
    );

    // Normalizar a lista de IDs de rutinas únicos
    const rawRoutineIds = Array.isArray(routineIds)
      ? routineIds
      : routineId
      ? [routineId]
      : [];
    const targetRoutineIds = Array.from(
      new Set(
        rawRoutineIds.filter(
          (id: any) => typeof id === 'string' && id.trim() !== ''
        )
      )
    );

    if (targetClientIds.length === 0 || targetRoutineIds.length === 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Al menos un alumno y al menos una rutina son obligatorios para la asignación.',
        },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'No hay conexión de administrador configurada.' },
        { status: 500 }
      );
    }

    // 1. Pre-cargar las rutinas origen completas (con días, ejercicios y series) una sola vez
    const sourceRoutinesWithData: { sourceRoutine: any; sourceDays: any[] }[] = [];
    for (const rId of targetRoutineIds) {
      const { data: sourceRoutine, error: sourceErr } = await admin
        .from('routines')
        .select('*')
        .eq('id', rId)
        .single();

      if (sourceErr || !sourceRoutine) {
        console.warn(`Rutina con ID ${rId} no encontrada, omitiendo.`);
        continue;
      }

      const { data: sourceDays, error: daysErr } = await admin
        .from('routine_days')
        .select(`
          *,
          routine_exercises (
            id,
            exercise_id,
            order_index,
            notes,
            routine_exercise_sets (
              set_number,
              target_reps,
              target_weight_kg,
              target_rpe,
              rest_seconds
            )
          )
        `)
        .eq('routine_id', rId)
        .order('order_index', { ascending: true });

      if (daysErr) throw daysErr;

      sourceRoutinesWithData.push({
        sourceRoutine,
        sourceDays: sourceDays || [],
      });
    }

    if (sourceRoutinesWithData.length === 0) {
      return NextResponse.json(
        { error: 'NO_ROUTINES_FOUND', message: 'No se encontraron las rutinas especificadas.' },
        { status: 404 }
      );
    }

    const baseDate = startDate ? new Date(startDate) : new Date();
    const allCreatedRoutines: any[] = [];

    // 2. Iterar sobre cada alumno objetivo
    for (const currentClientId of targetClientIds) {
      // Si se solicitó reemplazar rutinas previas para este alumno
      if (replaceExisting === true) {
        const { error: deactErr } = await admin
          .from('routines')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('client_id', currentClientId);

        if (deactErr) {
          console.warn(`Nota al desactivar rutinas previas del alumno ${currentClientId}:`, deactErr.message);
        }
      }

      let cumulativeDayOffset = 0;

      // Iterar sobre cada rutina y clonarla para el alumno
      for (const { sourceRoutine, sourceDays } of sourceRoutinesWithData) {
        const { data: newRoutine, error: newRoutineErr } = await admin
          .from('routines')
          .insert({
            client_id: currentClientId,
            title: sourceRoutine.title,
            description: sourceRoutine.description,
            is_active: true,
            is_template: false,
          })
          .select()
          .single();

        if (newRoutineErr || !newRoutine) {
          throw newRoutineErr || new Error(`No se pudo crear la rutina "${sourceRoutine.title}" para el cliente.`);
        }

        allCreatedRoutines.push(newRoutine);

        // Replicar días, ejercicios y series
        if (sourceDays && sourceDays.length > 0) {
          for (let dIdx = 0; dIdx < sourceDays.length; dIdx++) {
            const sDay = sourceDays[dIdx];

            const dayPayload = {
              routine_id: newRoutine.id,
              name: sDay.name,
              day_number: sDay.day_number,
              order_index: sDay.order_index,
            };

            const { data: newDay, error: newDayErr } = await admin
              .from('routine_days')
              .insert(dayPayload)
              .select()
              .single();

            if (newDayErr) throw newDayErr;

            // Planificar sesión de entrenamiento inicial para este día
            const sessionDate = new Date(baseDate);
            sessionDate.setDate(sessionDate.getDate() + cumulativeDayOffset + dIdx);

            await admin.from('workout_sessions').insert({
              client_id: currentClientId,
              routine_day_id: newDay.id,
              scheduled_date: sessionDate.toISOString().split('T')[0],
              status: 'missed',
              completion_rate: 0.0,
            });

            // Insertar ejercicios y sets
            const exercises = sDay.routine_exercises || [];
            for (const sEx of exercises) {
              const { data: newEx, error: newExErr } = await admin
                .from('routine_exercises')
                .insert({
                  routine_day_id: newDay.id,
                  exercise_id: sEx.exercise_id,
                  order_index: sEx.order_index,
                  notes: sEx.notes,
                })
                .select()
                .single();

              if (newExErr) throw newExErr;

              const sets = sEx.routine_exercise_sets || [];
              if (sets.length > 0) {
                const setsPayload = sets.map((s: any) => ({
                  routine_exercise_id: newEx.id,
                  set_number: s.set_number,
                  target_reps: s.target_reps,
                  target_weight_kg: s.target_weight_kg,
                  target_rpe: s.target_rpe,
                  rest_seconds: s.rest_seconds,
                }));

                const { error: setsErr } = await admin
                  .from('routine_exercise_sets')
                  .insert(setsPayload);

                if (setsErr) throw setsErr;
              }
            }
          }
          cumulativeDayOffset += sourceDays.length;
        }
      }
    }

    if (allCreatedRoutines.length === 0) {
      return NextResponse.json(
        { error: 'NO_ROUTINES_ASSIGNED', message: 'No se pudo asignar ninguna de las rutinas seleccionadas.' },
        { status: 400 }
      );
    }

    const titles = Array.from(new Set(sourceRoutinesWithData.map((s) => `"${s.sourceRoutine.title}"`))).join(', ');
    return NextResponse.json({
      success: true,
      message: `${allCreatedRoutines.length} ${
        allCreatedRoutines.length === 1 ? 'rutina asignada' : 'rutinas asignadas'
      } con éxito (${titles}) a ${targetClientIds.length} ${
        targetClientIds.length === 1 ? 'alumno' : 'alumnos'
      }.`,
      count: allCreatedRoutines.length,
      routines: allCreatedRoutines,
      routine: allCreatedRoutines[0],
    });
  } catch (err: any) {
    console.error('Error al asignar rutina(s) al cliente:', err);
    return NextResponse.json(
      { error: 'ASSIGNMENT_ERROR', message: err.message || 'Error al procesar la asignación de rutinas.' },
      { status: 500 }
    );
  }
}

// PATCH: Alternar estado (Activa / Pausada) de una rutina asignada a un cliente
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { routineId, isActive } = body;

    if (!routineId || typeof isActive !== 'boolean') {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'routineId e isActive (boolean) son obligatorios.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'No hay conexión de administrador configurada.' },
        { status: 500 }
      );
    }

    const { error } = await admin
      .from('routines')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', routineId);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: `Rutina ${isActive ? 'activada' : 'pausada'} correctamente.`,
    });
  } catch (err: any) {
    console.error('Error al alternar estado de rutina:', err);
    return NextResponse.json(
      { error: 'UPDATE_ERROR', message: err.message || 'Error al actualizar el estado de la rutina.' },
      { status: 500 }
    );
  }
}

// DELETE: Desasignar / Eliminar una rutina específica o todas las rutinas de un cliente
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const { clientId, routineId } = body;

    if (!clientId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'clientId es requerido.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'SERVER_ERROR', message: 'No hay conexión de administrador configurada.' },
        { status: 500 }
      );
    }

    if (routineId) {
      // Eliminar únicamente la rutina específica asignada a este cliente
      const { error } = await admin
        .from('routines')
        .delete()
        .eq('id', routineId)
        .eq('client_id', clientId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Rutina eliminada correctamente del alumno.',
      });
    } else {
      // Si no se especifica routineId, eliminar todas las rutinas asignadas a este alumno
      const { error } = await admin
        .from('routines')
        .delete()
        .eq('client_id', clientId);

      if (error) throw error;

      return NextResponse.json({
        success: true,
        message: 'Todas las rutinas han sido desasignadas del alumno.',
      });
    }
  } catch (err: any) {
    console.error('Error al desasignar rutina del cliente:', err);
    return NextResponse.json(
      { error: 'UNASSIGN_ERROR', message: err.message || 'Error al desasignar la rutina.' },
      { status: 500 }
    );
  }
}
