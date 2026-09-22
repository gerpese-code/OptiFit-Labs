import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkingSetItem } from '@/components/workout/InteractiveSetRow';

export interface ProgressionSetItem {
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
