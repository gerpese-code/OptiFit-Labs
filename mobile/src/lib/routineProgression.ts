import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkingSetItem } from '@/components/workout/InteractiveSetRow';

export interface ProgressionSetItem {
  routine_exercise_set_id?: string | null;
  set_number: number;
  target_reps: number;
  target_weight_kg: number;
  target_rpe: number | null;
  rest_seconds: number;
  is_extra?: boolean;
}

export interface ExerciseProgressionOverride {
  exerciseId: string;
  exerciseName?: string;
  lastUpdated: string;
  sets: ProgressionSetItem[];
}

export type DayProgressionOverrides = Record<string, ExerciseProgressionOverride>;

/**
 * Genera la clave de almacenamiento para las progresiones de un día de rutina específico
 */
export function getProgressionStorageKey(userId: string, dayId: string): string {
  const cleanUser = userId || 'guest';
  const cleanDay = dayId || 'default-day';
  return `@fitnesspro_routine_progression_${cleanUser}_${cleanDay}`;
}

/**
 * Obtiene los overrides de progresión guardados para un alumno en un día de rutina
 */
export async function getProgressionOverrides(
  userId: string,
  dayId: string
): Promise<DayProgressionOverrides> {
  const key = getProgressionStorageKey(userId, dayId);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Error al leer progresiones de rutina:', e);
    return {};
  }
}

/**
 * Guarda los overrides de progresión en AsyncStorage
 */
export async function saveProgressionOverrides(
  userId: string,
  dayId: string,
  overrides: DayProgressionOverrides
): Promise<void> {
  const key = getProgressionStorageKey(userId, dayId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(overrides));
  } catch (e) {
    console.warn('Error al guardar progresiones de rutina:', e);
  }
}

/**
 * Recupera la progresión de la última sesión completada desde la base de datos (Supabase)
 * como respaldo si el alumno cambió de dispositivo o no tiene datos en caché local.
 */
export async function fetchLastCompletedSessionProgression(
  userId: string,
  dayId: string,
  supabaseClient: any
): Promise<DayProgressionOverrides | null> {
  if (!userId || !dayId || !supabaseClient) return null;
  try {
    const { data: lastSession } = await supabaseClient
      .from('workout_sessions')
      .select('id, notes, completed_at, status, created_at')
      .eq('client_id', userId)
      .eq('routine_day_id', dayId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!lastSession) return null;

    if (lastSession.notes) {
      try {
        const parsed = typeof lastSession.notes === 'string' ? JSON.parse(lastSession.notes) : lastSession.notes;
        if (parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
          const overrides: DayProgressionOverrides = {};
          parsed.exercises.forEach((ex: any) => {
            if (ex.exercise_id && Array.isArray(ex.sets)) {
              overrides[ex.exercise_id] = {
                exerciseId: ex.exercise_id,
                exerciseName: ex.name,
                lastUpdated: lastSession.completed_at || lastSession.created_at || new Date().toISOString(),
                sets: ex.sets.map((s: any, idx: number) => ({
                  routine_exercise_set_id: s.routine_exercise_set_id || null,
                  set_number: s.set_number || idx + 1,
                  target_reps: s.reps || 10,
                  target_weight_kg: Math.round(s.weight_kg ?? (s.weight || 0)),
                  target_rpe: s.rpe || null,
                  rest_seconds: s.rest_seconds || 90,
                  is_extra: s.is_extra || false,
                })),
              };
            }
          });
          return overrides;
        }
      } catch (e) {
        // Fallback
      }
    }

    // Respaldo robusto: si notes no contenía el array JSON de exercises, consultar workout_log_sets
    const { data: logSets } = await supabaseClient
      .from('workout_log_sets')
      .select('id, routine_exercise_set_id, set_number, reps_completed, weight_kg, rpe, is_completed')
      .eq('session_id', lastSession.id)
      .order('set_number', { ascending: true });

    if (logSets && logSets.length > 0) {
      const setIds = logSets.map((s: any) => s.routine_exercise_set_id).filter(Boolean);
      const setExerciseMap: Record<string, { exerciseId: string; name: string }> = {};

      if (setIds.length > 0) {
        const { data: rxSets } = await supabaseClient
          .from('routine_exercise_sets')
          .select('id, routine_exercises ( id, exercise_id, exercise:exercise_id ( id, name ) )')
          .in('id', setIds);

        (rxSets || []).forEach((item: any) => {
          const ex = item.routine_exercises?.exercise;
          const exId = item.routine_exercises?.exercise_id;
          if (exId) {
            setExerciseMap[item.id] = {
              exerciseId: exId,
              name: ex?.name || 'Ejercicio',
            };
          }
        });
      }

      const overrides: DayProgressionOverrides = {};
      logSets.forEach((ls: any) => {
        const matched = ls.routine_exercise_set_id ? setExerciseMap[ls.routine_exercise_set_id] : null;
        const exId = matched?.exerciseId;
        if (!exId) return;
        const exName = matched?.name || 'Ejercicio';

        if (!overrides[exId]) {
          overrides[exId] = {
            exerciseId: exId,
            exerciseName: exName,
            lastUpdated: lastSession.completed_at || lastSession.created_at || new Date().toISOString(),
            sets: [],
          };
        }

        overrides[exId].sets.push({
          routine_exercise_set_id: ls.routine_exercise_set_id || null,
          set_number: ls.set_number,
          target_reps: ls.reps_completed || 10,
          target_weight_kg: Math.round(ls.weight_kg || 0),
          target_rpe: ls.rpe || null,
          rest_seconds: 90,
          is_extra: false,
        });
      });

      if (Object.keys(overrides).length > 0) {
        return overrides;
      }
    }

    return null;
  } catch (err) {
    console.warn('Aviso al recuperar progresión de última sesión en Supabase:', err);
    return null;
  }
}

/**
 * Registra la progresión real del alumno al finalizar una sesión para precargarla en la próxima
 */
export async function recordSessionProgression(
  userId: string,
  dayId: string,
  workingExercises: {
    id: string;
    exercise_id: string;
    exercise?: { name?: string };
    sets: WorkingSetItem[];
  }[],
  completedSets: Record<string, { reps: number; weight: number; completed: boolean }>,
  unit: 'kg' | 'lbs',
  toStandardKg: (weight: number, unit: 'kg' | 'lbs') => number
): Promise<DayProgressionOverrides> {
  const currentOverrides = await getProgressionOverrides(userId, dayId);
  const updatedOverrides: DayProgressionOverrides = { ...currentOverrides };
  const nowStr = new Date().toISOString();

  workingExercises.forEach((rx) => {
    const exId = rx.exercise_id || rx.id;
    if (!exId) return;

    // Verificar si el alumno realizó o modificó series en este ejercicio
    const hasAnyActivity = rx.sets.some((s) => completedSets[s.id]?.completed || s.is_extra);

    if (hasAnyActivity) {
      // Mapear cada serie con el peso y repeticiones reales realizadas
      const adaptedSets: ProgressionSetItem[] = rx.sets.map((s, idx) => {
        const logged = completedSets[s.id];
        let finalReps = s.target_reps;
        let finalWeightKg = s.target_weight_kg || 0;

        if (logged && logged.completed) {
          finalReps = logged.reps;
          finalWeightKg = toStandardKg(logged.weight, unit);
        } else {
          finalWeightKg = s.target_weight_kg || 0;
        }

        return {
          routine_exercise_set_id: s.routine_exercise_set_id || null,
          set_number: idx + 1,
          target_reps: Math.max(1, finalReps),
          target_weight_kg: Math.max(0, Math.round(finalWeightKg)),
          target_rpe: s.target_rpe || null,
          rest_seconds: s.rest_seconds || 90,
          is_extra: s.is_extra || false,
        };
      });

      updatedOverrides[exId] = {
        exerciseId: exId,
        exerciseName: rx.exercise?.name || 'Ejercicio',
        lastUpdated: nowStr,
        sets: adaptedSets,
      };
    }
  });

  await saveProgressionOverrides(userId, dayId, updatedOverrides);
  return updatedOverrides;
}

/**
 * Elimina las modificaciones de progresión para volver a la rutina original del Coach
 * Si se pasa exerciseId, solo restaura ese ejercicio. Si no, restaura todo el día.
 */
export async function clearProgressionOverrides(
  userId: string,
  dayId: string,
  exerciseId?: string
): Promise<DayProgressionOverrides> {
  const key = getProgressionStorageKey(userId, dayId);
  try {
    if (exerciseId) {
      const current = await getProgressionOverrides(userId, dayId);
      delete current[exerciseId];
      await AsyncStorage.setItem(key, JSON.stringify(current));
      return current;
    } else {
      await AsyncStorage.removeItem(key);
      return {};
    }
  } catch (e) {
    console.warn('Error al limpiar progresiones:', e);
    return {};
  }
}
