import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { supabase } from './supabase';

const QUEUE_STORAGE_KEY = '@fitnesspro_offline_queue';
export const EXERCISES_CACHE_KEY = '@fitnesspro_cached_exercises';
export const ROUTINES_CACHE_KEY = '@fitnesspro_cached_assigned_routines';
export const ROUTINE_DAYS_CACHE_KEY = '@fitnesspro_cached_routine_days';
export const COMPLETIONS_CACHE_KEY = '@fitnesspro_cached_completions';

export interface OfflineAction {
  id: string;
  type:
    | 'LOG_SET'
    | 'START_SESSION'
    | 'COMPLETE_SESSION'
    | 'CREATE_EXERCISE'
    | 'UPDATE_EXERCISE'
    | 'DELETE_EXERCISE';
  payload: any;
  timestamp: number;
}

export interface SyncStatusEvent {
  isSyncing: boolean;
  isOnline: boolean;
  pendingCount: number;
  lastSyncAt?: number;
}

export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function isValidUUID(str: string | null | undefined): boolean {
  if (!str) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

type SyncListener = (status: SyncStatusEvent) => void;

class OfflineQueueManager {
  private isSyncing = false;
  private isOnlineState = true;
  private listeners: Set<SyncListener> = new Set();
  private lastSyncTime = 0;

  constructor() {
    // Escuchar automáticamente el estado de la red
    NetInfo.addEventListener((state) => {
      const isOnline = Boolean(state.isConnected && state.isInternetReachable !== false);
      const changed = this.isOnlineState !== isOnline;
      this.isOnlineState = isOnline;

      if (changed) {
        this.notifyListeners();
      }

      if (isOnline) {
        this.syncQueue();
      }
    });

    // Comprobar estado inicial de conexión
    NetInfo.fetch().then((state) => {
      this.isOnlineState = Boolean(state.isConnected && state.isInternetReachable !== false);
      this.notifyListeners();
    });
  }

  // Suscribirse a cambios en el estado de red y sincronización
  subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    // Notificar inmediatamente el estado actual al nuevo suscriptor
    this.getQueue().then((q) => {
      listener({
        isSyncing: this.isSyncing,
        isOnline: this.isOnlineState,
        pendingCount: q.length,
        lastSyncAt: this.lastSyncTime || undefined,
      });
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private async notifyListeners() {
    try {
      const q = await this.getQueue();
      const event: SyncStatusEvent = {
        isSyncing: this.isSyncing,
        isOnline: this.isOnlineState,
        pendingCount: q.length,
        lastSyncAt: this.lastSyncTime || undefined,
      };
      this.listeners.forEach((l) => {
        try {
          l(event);
        } catch (e) {}
      });
    } catch (e) {}
  }

  // Obtener acciones en cola
  async getQueue(): Promise<OfflineAction[]> {
    try {
      const data = await AsyncStorage.getItem(QUEUE_STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (err) {
      console.error('Error al leer cola offline:', err);
      return [];
    }
  }

  // Encolar una acción si falló la red o no hay conexión
  async enqueue(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const current = await this.getQueue();
      const newAction: OfflineAction = {
        ...action,
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        timestamp: Date.now(),
      };
      current.push(newAction);
      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(current));
      this.notifyListeners();
    } catch (err) {
      console.error('Error al encolar acción offline:', err);
    }
  }

  // Comprobar si hay conexión activa
  async isOnline(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      const online = Boolean(state.isConnected && state.isInternetReachable !== false);
      this.isOnlineState = online;
      return online;
    } catch (e) {
      return false;
    }
  }

  // --------------------------------------------------------------------------
  // AYUDANTES DE CACHÉ LOCAL (OFFLINE-FIRST)
  // --------------------------------------------------------------------------

  // Catálogo completo de ejercicios (Predeterminados del Coach + Propios del alumno)
  async cacheExercises(exercises: any[]): Promise<void> {
    try {
      if (Array.isArray(exercises) && exercises.length > 0) {
        await AsyncStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(exercises));
      }
    } catch (e) {
      console.warn('Error al guardar caché de ejercicios:', e);
    }
  }

  async getCachedExercises(): Promise<any[]> {
    try {
      const str = await AsyncStorage.getItem(EXERCISES_CACHE_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  async upsertCachedExercise(exercise: any): Promise<void> {
    try {
      const list = await this.getCachedExercises();
      const idx = list.findIndex((e: any) => e.id === exercise.id);
      if (idx >= 0) {
        list[idx] = exercise;
      } else {
        list.unshift(exercise);
      }
      await AsyncStorage.setItem(EXERCISES_CACHE_KEY, JSON.stringify(list));
    } catch (e) {
      console.warn('Error al actualizar ejercicio en caché:', e);
    }
  }

  // Rutinas asignadas activas
  async cacheAssignedRoutines(routines: any[]): Promise<void> {
    try {
      if (Array.isArray(routines)) {
        await AsyncStorage.setItem(ROUTINES_CACHE_KEY, JSON.stringify(routines));
      }
    } catch (e) {
      console.warn('Error al guardar caché de rutinas:', e);
    }
  }

  async getCachedAssignedRoutines(): Promise<any[]> {
    try {
      const str = await AsyncStorage.getItem(ROUTINES_CACHE_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  // Días y ejercicios de rutina
  async cacheRoutineDays(days: any[]): Promise<void> {
    try {
      if (Array.isArray(days)) {
        await AsyncStorage.setItem(ROUTINE_DAYS_CACHE_KEY, JSON.stringify(days));
      }
    } catch (e) {
      console.warn('Error al guardar caché de días de rutina:', e);
    }
  }

  async getCachedRoutineDays(): Promise<any[]> {
    try {
      const str = await AsyncStorage.getItem(ROUTINE_DAYS_CACHE_KEY);
      return str ? JSON.parse(str) : [];
    } catch (e) {
      return [];
    }
  }

  // Historial de cumplimientos y contadores
  async cacheCompletions(data: {
    counts: Record<string, number>;
    dates: Record<string, string>;
    total: number;
  }): Promise<void> {
    try {
      await AsyncStorage.setItem(COMPLETIONS_CACHE_KEY, JSON.stringify(data));
    } catch (e) {}
  }

  async getCachedCompletions(): Promise<{
    counts: Record<string, number>;
    dates: Record<string, string>;
    total: number;
  } | null> {
    try {
      const str = await AsyncStorage.getItem(COMPLETIONS_CACHE_KEY);
      return str ? JSON.parse(str) : null;
    } catch (e) {
      return null;
    }
  }

  // --------------------------------------------------------------------------
  // SINCRONIZACIÓN AUTOMÁTICA EN SEGUNDO PLANO
  // --------------------------------------------------------------------------

  // Sincronizar cola con Supabase al recuperar red
  async syncQueue(): Promise<{ syncedCount: number; errors: number }> {
    if (this.isSyncing) return { syncedCount: 0, errors: 0 };
    this.isSyncing = true;
    this.notifyListeners();

    let syncedCount = 0;
    let errors = 0;

    try {
      const queue = await this.getQueue();
      if (queue.length === 0) {
        this.isSyncing = false;
        this.notifyListeners();
        return { syncedCount: 0, errors: 0 };
      }

      const remainingQueue: OfflineAction[] = [];
      let latestValidSessionId: string | null = null;

      // Obtener el usuario autenticado actual para garantizar que client_id coincida con auth.uid()
      const { data: authData } = await supabase.auth.getUser();
      const currentAuthId = authData?.user?.id;

      for (const item of queue) {
        try {
          if (item.type === 'START_SESSION') {
            const payload = { ...item.payload };
            if (!isValidUUID(payload.id)) payload.id = generateUUID();
            if (!isValidUUID(payload.routine_day_id)) payload.routine_day_id = null;
            if (currentAuthId) payload.client_id = currentAuthId;
            latestValidSessionId = payload.id;

            const { data: existingSession } = await supabase
              .from('workout_sessions')
              .select('id')
              .eq('id', payload.id)
              .maybeSingle();

            if (existingSession) {
              const { error } = await supabase
                .from('workout_sessions')
                .update({
                  duration_minutes: payload.duration_minutes,
                  completion_rate: payload.completion_rate,
                  status: payload.status,
                })
                .eq('id', payload.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('workout_sessions')
                .insert(payload);
              if (error) throw error;
            }
            syncedCount++;
          } else if (item.type === 'LOG_SET') {
            const payload = { ...item.payload };
            if (!isValidUUID(payload.id)) payload.id = generateUUID();
            if (!isValidUUID(payload.routine_exercise_set_id)) payload.routine_exercise_set_id = null;

            // Si session_id no era un UUID válido, reasignar a la sesión válida conocida
            if (!isValidUUID(payload.session_id)) {
              if (latestValidSessionId) {
                payload.session_id = latestValidSessionId;
              } else {
                const todayStr = new Date().toISOString().split('T')[0];
                const { data: sData } = await supabase
                  .from('workout_sessions')
                  .select('id')
                  .eq('scheduled_date', todayStr)
                  .order('created_at', { ascending: false })
                  .limit(1)
                  .maybeSingle();
                if (sData?.id) {
                  payload.session_id = sData.id;
                  latestValidSessionId = sData.id;
                }
              }
            }

            if (!isValidUUID(payload.session_id)) {
              continue;
            }

            const { data: existingSet } = await supabase
              .from('workout_log_sets')
              .select('id')
              .eq('id', payload.id)
              .maybeSingle();

            if (existingSet) {
              const { error } = await supabase
                .from('workout_log_sets')
                .update({
                  reps_completed: payload.reps_completed,
                  weight_logged: payload.weight_logged,
                  weight_kg: payload.weight_kg,
                  is_completed: payload.is_completed,
                })
                .eq('id', payload.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('workout_log_sets')
                .insert(payload);
              if (error) throw error;
            }
            syncedCount++;
          } else if (item.type === 'COMPLETE_SESSION') {
            const { session_id, ...updates } = item.payload;
            const targetSessionId = isValidUUID(session_id) ? session_id : latestValidSessionId;
            if (targetSessionId) {
              const { error } = await supabase
                .from('workout_sessions')
                .update(updates)
                .eq('id', targetSessionId);
              if (error) throw error;
              syncedCount++;
            }
          } else if (item.type === 'CREATE_EXERCISE') {
            const payload = { ...item.payload };
            if (!isValidUUID(payload.id)) payload.id = generateUUID();
            if (currentAuthId && !payload.created_by) payload.created_by = currentAuthId;
            payload.is_custom = true;

            const { data: existingEx } = await supabase
              .from('exercises')
              .select('id')
              .eq('id', payload.id)
              .maybeSingle();

            if (existingEx) {
              const { error } = await supabase
                .from('exercises')
                .update(payload)
                .eq('id', payload.id);
              if (error) throw error;
            } else {
              const { error } = await supabase
                .from('exercises')
                .insert(payload);
              if (error) throw error;
            }
            syncedCount++;
          } else if (item.type === 'UPDATE_EXERCISE') {
            const payload = { ...item.payload };
            if (isValidUUID(payload.id)) {
              const { error } = await supabase
                .from('exercises')
                .update(payload)
                .eq('id', payload.id);
              if (error) throw error;
              syncedCount++;
            }
          } else if (item.type === 'DELETE_EXERCISE') {
            const { id } = item.payload;
            if (isValidUUID(id)) {
              const { error } = await supabase
                .from('exercises')
                .delete()
                .eq('id', id);
              if (error) throw error;
              syncedCount++;
            }
          }
        } catch (itemErr) {
          console.warn(`Error al sincronizar item ${item.type}:`, itemErr);
          remainingQueue.push(item);
          errors++;
        }
      }

      await AsyncStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(remainingQueue));
      if (syncedCount > 0) {
        this.lastSyncTime = Date.now();
      }
    } catch (err) {
      console.error('Error general en sincronización offline:', err);
    } finally {
      this.isSyncing = false;
      this.notifyListeners();
    }

    return { syncedCount, errors };
  }
}

export const offlineQueue = new OfflineQueueManager();
