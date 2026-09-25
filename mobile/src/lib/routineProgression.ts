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
  is_superset?: boolean;
  superset_count?: number;
  superset_reps?: number[];
  superset_weights_kg?: number[];
}

export interface ExerciseProgressionOverride {
  exerciseId: string;
  exerciseName?: string;
  lastUpdated: string;
  sets: ProgressionSetItem[];
}

export interface SavedDayExerciseItem {
  id: string;
  exercise_id: string;
  exercise: {
    id: string;
    name: string;
    muscle_group?: string;
    image_urls?: string[];
    gif_url?: string | null;
    is_custom?: boolean;
    created_by?: string | null;
  };
  notes?: string | null;
  order_index?: number;
  sets: {
    id: string;
    routine_exercise_set_id?: string | null;
    set_number: number;
    target_reps: number;
    target_weight_kg: number;
    target_rpe?: number | null;
    rest_seconds: number;
    is_extra?: boolean;
    is_superset?: boolean;
    superset_count?: number;
    superset_reps?: number[];
    superset_weights_kg?: number[];
  }[];
}

export interface WorkingExerciseItem {
  id: string;
  exercise_id: string;
  exercise?: any;
  notes: string | null;
  sets: WorkingSetItem[];
}

export interface DayWorkoutSnapshot {
  userId: string;
  dayId: string;
  dayName?: string;
  lastUpdated: string;
  exercises: SavedDayExerciseItem[];
}

export type DayProgressionOverrides = Record<string, ExerciseProgressionOverride>;

/**
 * Clave de almacenamiento para la estructura completa personalizada del día
 */
export function getDaySnapshotStorageKey(userId: string, dayId: string): string {
  const cleanUser = userId || 'guest';
  const cleanDay = dayId || 'default-day';
  return `@fitnesspro_day_workout_snapshot_${cleanUser}_${cleanDay}`;
}

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

/**
 * Guarda el snapshot completo de ejercicios (incluyendo agregados/eliminados) para un día
 */
export async function saveDayWorkoutSnapshot(
  userId: string,
  dayId: string,
  workingExercises: {
    id: string;
    exercise_id: string;
    exercise?: any;
    notes?: string | null;
    sets: WorkingSetItem[];
  }[],
  completedSets: Record<string, { reps: number; weight: number; completed: boolean }>,
  unit: 'kg' | 'lbs',
  toStandardKg: (w: number, u: 'kg' | 'lbs') => number,
  dayName?: string
): Promise<DayWorkoutSnapshot> {
  const nowStr = new Date().toISOString();

  const savedExercises: SavedDayExerciseItem[] = workingExercises.map((rx, exIdx) => {
    const exInfo = rx.exercise || {};
    const sets = rx.sets.map((s, sIdx) => {
      const logged = completedSets[s.id];
      let finalReps = s.target_reps;
      let finalWeightKg = s.target_weight_kg || 0;

      if (logged && logged.completed) {
        finalReps = logged.reps;
        finalWeightKg = toStandardKg(logged.weight, unit);
      }

      return {
        id: `snap-${rx.exercise_id || rx.id}-${sIdx + 1}-${Date.now()}`,
        routine_exercise_set_id: s.routine_exercise_set_id || null,
        set_number: sIdx + 1,
        target_reps: Math.max(1, finalReps),
        target_weight_kg: Math.max(0, Math.round(finalWeightKg * 10) / 10),
        target_rpe: s.target_rpe || null,
        rest_seconds: s.rest_seconds || 90,
        is_extra: s.is_extra || false,
        is_superset: !!s.is_superset,
        superset_count: s.superset_count || (s.superset_reps ? s.superset_reps.length : 1),
        superset_reps: s.superset_reps || undefined,
        superset_weights_kg: s.superset_weights_kg || undefined,
      };
    });

    return {
      id: rx.id || `rx-snap-${exIdx}-${Date.now()}`,
      exercise_id: rx.exercise_id || rx.id,
      exercise: {
        id: exInfo.id || rx.exercise_id || rx.id,
        name: exInfo.name || 'Ejercicio',
        muscle_group: exInfo.muscle_group || 'General',
        image_urls: exInfo.image_urls || [],
        gif_url: exInfo.gif_url || null,
        is_custom: !!exInfo.is_custom,
        created_by: exInfo.created_by || null,
      },
      notes: rx.notes || null,
      order_index: exIdx,
      sets,
    };
  });

  const snapshot: DayWorkoutSnapshot = {
    userId,
    dayId,
    dayName,
    lastUpdated: nowStr,
    exercises: savedExercises,
  };

  const key = getDaySnapshotStorageKey(userId, dayId);
  try {
    await AsyncStorage.setItem(key, JSON.stringify(snapshot));
  } catch (e) {
    console.warn('Error al guardar snapshot del día:', e);
  }

  return snapshot;
}

/**
 * Carga el snapshot personalizado de la última rutina realizada para un día.
 * La rutina modificada por el alumno o coach se preserva siempre como su última sesión ejecutada
 * hasta que el usuario decida explícitamente presionar "Restaurar rutina original".
 */
export async function loadDayWorkoutSnapshot(
  userId: string,
  dayId: string,
  supabaseClient?: any,
  routineUpdatedAt?: string | null
): Promise<DayWorkoutSnapshot | null> {
  if (!userId || !dayId) return null;
  const key = getDaySnapshotStorageKey(userId, dayId);

  let localSnapshot: DayWorkoutSnapshot | null = null;
  try {
    const raw = await AsyncStorage.getItem(key);
    if (raw) {
      const parsed: DayWorkoutSnapshot = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
        localSnapshot = parsed;
      }
    }
  } catch (e) {
    console.warn('Error leyendo snapshot local:', e);
  }

  // Respaldo remoto prioritario desde Supabase (última sesión completada en workout_sessions)
  if (supabaseClient) {
    try {
      const { data: lastSession } = await supabaseClient
        .from('workout_sessions')
        .select('id, notes, completed_at, status, created_at')
        .eq('client_id', userId)
        .eq('routine_day_id', dayId)
        .in('status', ['completed', 'partial'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastSession?.notes) {
        const sessionTimeStr = lastSession.completed_at || lastSession.created_at;
        const sessionTime = sessionTimeStr ? new Date(sessionTimeStr).getTime() : 0;
        const localTime = localSnapshot?.lastUpdated ? new Date(localSnapshot.lastUpdated).getTime() : 0;

        // Si la sesión en Supabase es más reciente o igual que el snapshot local (o no hay snapshot local),
        // reconstruimos el snapshot a partir de la sesión real ejecutada por el alumno
        if (!localSnapshot || sessionTime >= localTime) {
          let parsed: any = null;
          try {
            parsed = typeof lastSession.notes === 'string' ? JSON.parse(lastSession.notes) : lastSession.notes;
          } catch (parseErr) {
            console.warn('Error al parsear notes de la última sesión:', parseErr);
          }

          if (parsed) {
            if (parsed.working_exercises_snapshot && Array.isArray(parsed.working_exercises_snapshot) && parsed.working_exercises_snapshot.length > 0) {
              const snapshot: DayWorkoutSnapshot = {
                userId,
                dayId,
                dayName: parsed.dayName,
                lastUpdated: sessionTimeStr || new Date().toISOString(),
                exercises: parsed.working_exercises_snapshot,
              };
              AsyncStorage.setItem(key, JSON.stringify(snapshot)).catch(() => {});
              return snapshot;
            }

            if (parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
              const reconstructed: SavedDayExerciseItem[] = parsed.exercises.map((ex: any, idx: number) => ({
                id: `snap-remote-${idx}-${Date.now()}`,
                exercise_id: ex.exercise_id,
                exercise: {
                  id: ex.exercise_id,
                  name: ex.name,
                  muscle_group: ex.muscle_group || 'General',
                  image_urls: ex.image_url ? [ex.image_url] : [],
                  gif_url: ex.image_url || null,
                },
                notes: null,
                order_index: idx,
                sets: (ex.sets || []).map((s: any, sIdx: number) => ({
                  id: `snap-remote-set-${sIdx}-${Date.now()}`,
                  routine_exercise_set_id: s.routine_exercise_set_id || null,
                  set_number: s.set_number || sIdx + 1,
                  target_reps: s.reps || s.target_reps || 10,
                  target_weight_kg: Math.max(0, Math.round((s.weight_kg ?? (s.weight || 0)) * 10) / 10),
                  target_rpe: s.rpe || null,
                  rest_seconds: s.rest_seconds || 90,
                  is_extra: s.is_extra || false,
                  is_superset: !!s.is_superset,
                  superset_count: s.superset_count || (s.superset_reps ? s.superset_reps.length : 1),
                  superset_reps: s.superset_reps || undefined,
                  superset_weights_kg: s.superset_weights_kg || undefined,
                })),
              }));

              const snapshot: DayWorkoutSnapshot = {
                userId,
                dayId,
                dayName: parsed.dayName,
                lastUpdated: sessionTimeStr || new Date().toISOString(),
                exercises: reconstructed,
              };
              AsyncStorage.setItem(key, JSON.stringify(snapshot)).catch(() => {});
              return snapshot;
            }
          }
        }
      }
    } catch (remoteErr) {
      console.warn('Error recuperando snapshot remoto de Supabase:', remoteErr);
    }
  }

  if (localSnapshot) {
    return localSnapshot;
  }

  return null;
}

/**
 * Elimina el snapshot para que el alumno vuelva a la plantilla original prescrita por el coach
 */
export async function clearDayWorkoutSnapshot(
  userId: string,
  dayId: string
): Promise<void> {
  const key = getDaySnapshotStorageKey(userId, dayId);
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.warn('Error al limpiar snapshot:', e);
  }
}

/**
 * Sincroniza workingExercises directamente con routine_exercises y routine_exercise_sets en Supabase
 * para que las modificaciones de la rutina (ejercicios agregados/eliminados, series, supersets)
 * queden guardadas permanentemente en la base de datos para este día.
 */
export async function syncRoutineExercisesToSupabase(
  supabaseClient: any,
  dayId: string,
  workingExercises: {
    id: string;
    exercise_id: string;
    exercise?: any;
    notes?: string | null;
    sets: WorkingSetItem[];
  }[]
): Promise<boolean> {
  if (!supabaseClient || !dayId || !Array.isArray(workingExercises) || workingExercises.length === 0) {
    return false;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(dayId)) {
    return false;
  }

  try {
    // 1. Obtener los routine_exercises actuales en Supabase para este día
    const { data: existingRx, error: rxErr } = await supabaseClient
      .from('routine_exercises')
      .select('id, exercise_id, order_index')
      .eq('routine_day_id', dayId)
      .order('order_index', { ascending: true });

    if (rxErr) {
      console.warn('Aviso al consultar routine_exercises en Supabase:', rxErr);
      return false;
    }

    const existingList = existingRx || [];
    const existingIds = new Set(existingList.map((r: any) => r.id));
    const keptRxIds = new Set<string>();

    // 2. Anti-colisión en order_index para respetar la restricción uq_routine_exercise_order
    for (const [i, erx] of existingList.entries()) {
      await supabaseClient
        .from('routine_exercises')
        .update({ order_index: -2000 - i })
        .eq('id', erx.id);
    }

    // 3. Procesar cada ejercicio de workingExercises
    for (const [exIdx, wx] of workingExercises.entries()) {
      const exId = wx.exercise_id || (wx.exercise && wx.exercise.id);
      if (!exId || !uuidRegex.test(exId)) continue;

      let rxId: string | null = null;
      if (wx.id && uuidRegex.test(wx.id) && existingIds.has(wx.id)) {
        rxId = wx.id;
      } else {
        const matchByExId = existingList.find((r: any) => r.exercise_id === exId && !keptRxIds.has(r.id));
        if (matchByExId) {
          rxId = matchByExId.id;
        }
      }

      // Preparar metadatos de superset en el campo notes
      const supersetMeta = (wx.sets || [])
        .filter((s) => s.is_superset)
        .map((s, idx) => ({
          set_number: s.set_number || idx + 1,
          is_superset: true,
          superset_count: s.superset_count || s.superset_reps?.length || 2,
          superset_reps: s.superset_reps || [],
          superset_weights_kg: s.superset_weights_kg || [],
        }));

      let cleanNotes = (wx.notes || '').replace(/\[SUPERSET_CONFIG:.*?\]/g, '').trim();
      let notesToSave = cleanNotes || null;
      if (supersetMeta.length > 0) {
        const metaStr = `[SUPERSET_CONFIG:${JSON.stringify(supersetMeta)}]`;
        notesToSave = notesToSave ? `${notesToSave} ${metaStr}` : metaStr;
      }

      const rxPayload = {
        routine_day_id: dayId,
        exercise_id: exId,
        order_index: exIdx,
        notes: notesToSave,
      };

      if (rxId) {
        await supabaseClient
          .from('routine_exercises')
          .update(rxPayload)
          .eq('id', rxId);
        keptRxIds.add(rxId);
      } else {
        const { data: newRx, error: insErr } = await supabaseClient
          .from('routine_exercises')
          .insert(rxPayload)
          .select('id')
          .single();

        if (insErr || !newRx) {
          console.warn('Aviso al insertar routine_exercise:', insErr);
          continue;
        }
        rxId = newRx.id;
      }

      if (!rxId) continue;
      wx.id = rxId;
      keptRxIds.add(rxId);

      // 4. Sincronizar routine_exercise_sets
      const { data: existingSets } = await supabaseClient
        .from('routine_exercise_sets')
        .select('id, set_number')
        .eq('routine_exercise_id', rxId)
        .order('set_number', { ascending: true });

      const existingSetList = existingSets || [];
      const existingSetIds = new Set(existingSetList.map((s: any) => s.id));
      const keptSetIds = new Set<string>();

      // Anti-colisión en set_number
      for (const [sIdx, es] of existingSetList.entries()) {
        await supabaseClient
          .from('routine_exercise_sets')
          .update({ set_number: -2000 - sIdx })
          .eq('id', es.id);
      }

      for (const [sIdx, s] of (wx.sets || []).entries()) {
        const setNum = sIdx + 1;
        let setId: string | null = null;
        if (s.routine_exercise_set_id && uuidRegex.test(s.routine_exercise_set_id) && existingSetIds.has(s.routine_exercise_set_id)) {
          setId = s.routine_exercise_set_id;
        } else if (s.id && uuidRegex.test(s.id) && existingSetIds.has(s.id)) {
          setId = s.id;
        } else {
          const matchSet = existingSetList.find((es: any) => !keptSetIds.has(es.id));
          if (matchSet) {
            setId = matchSet.id;
          }
        }

        const setPayload = {
          routine_exercise_id: rxId,
          set_number: setNum,
          target_reps: Math.max(1, s.target_reps || 10),
          target_weight_kg: Math.max(0, Math.round((s.target_weight_kg || 0) * 10) / 10),
          target_rpe: s.target_rpe || null,
          rest_seconds: s.rest_seconds || 90,
        };

        if (setId) {
          await supabaseClient
            .from('routine_exercise_sets')
            .update(setPayload)
            .eq('id', setId);
          keptSetIds.add(setId);
        } else {
          const { data: insSet, error: insSetErr } = await supabaseClient
            .from('routine_exercise_sets')
            .insert(setPayload)
            .select('id')
            .single();

          if (insSet) {
            s.routine_exercise_set_id = insSet.id;
            s.id = insSet.id;
            keptSetIds.add(insSet.id);
          } else if (insSetErr) {
            console.warn('Aviso al insertar routine_exercise_set:', insSetErr);
          }
        }
      }

      // Eliminar series sobrantes
      const setsToDelete = existingSetList
        .filter((s: any) => !keptSetIds.has(s.id))
        .map((s: any) => s.id);
      if (setsToDelete.length > 0) {
        await supabaseClient
          .from('routine_exercise_sets')
          .delete()
          .in('id', setsToDelete);
      }
    }

    // 5. Eliminar ejercicios de routine_exercises que ya no están en workingExercises
    const rxToDelete = existingList
      .filter((r: any) => !keptRxIds.has(r.id))
      .map((r: any) => r.id);
    if (rxToDelete.length > 0) {
      await supabaseClient
        .from('routine_exercises')
        .delete()
        .in('id', rxToDelete);
    }

    // 6. Actualizar timestamp de routine_days para invalidar cachés remotas
    await supabaseClient
      .from('routine_days')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', dayId);

    return true;
  } catch (err) {
    console.warn('Error general en syncRoutineExercisesToSupabase:', err);
    return false;
  }
}


