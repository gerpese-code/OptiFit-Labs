import { AppState, AppStateStatus, Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

let activeUserId: string | null = null;
let presenceChannel: RealtimeChannel | null = null;
let heartbeatInterval: any = null;
let isCurrentlyTraining = false;
let lastHeartbeatTime = 0;
const HEARTBEAT_INTERVAL_MS = 25 * 1000; // Latido cada 25 segundos mientras la pantalla esté abierta

/**
 * Envía latido a Supabase indicando que la pantalla de la app está abierta y activa.
 * 100% resiliente: nunca propaga errores ni interrumpe la ejecución.
 */
async function sendScreenOpenHeartbeat(userId: string, isTraining: boolean) {
  if (!userId) return;
  const now = Date.now();
  // Evitar envíos duplicados con menos de 8 segundos de diferencia
  if (now - lastHeartbeatTime < 8000) return;
  lastHeartbeatTime = now;

  try {
    const timestamp = new Date().toISOString();
    // 1. Actualizar DB fallback para el panel del coach
    await supabase
      .from('profiles')
      .update({ updated_at: timestamp })
      .eq('id', userId);

    // 2. Track en Realtime Presence
    if (presenceChannel) {
      presenceChannel
        .track({
          client_id: userId,
          screen_open: true,
          is_training: isTraining,
          timestamp: now,
        })
        .catch(() => {});
    }
  } catch (err) {
    // Silencioso en caso de pérdida temporal de conexión
  }
}

/**
 * Notifica que la app ha pasado a segundo plano o se ha cerrado la pantalla.
 * 100% resiliente: nunca propaga errores.
 */
async function sendScreenClosed(userId: string) {
  if (!userId) return;
  try {
    // Untrack en Realtime Presence
    if (presenceChannel) {
      presenceChannel.untrack().catch(() => {});
    }
    // Si no está en medio de un entrenamiento, ajustar updated_at a 2 minutos atrás
    // para que el DB fallback refleje de inmediato que el usuario cerró la app.
    if (!isCurrentlyTraining) {
      const twoMinAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
      await supabase
        .from('profiles')
        .update({ updated_at: twoMinAgo })
        .eq('id', userId);
    }
  } catch (err) {
    // Silencioso
  }
}

/**
 * Inicia el rastreador de presencia global de la app del alumno.
 * Mantiene la conexión Realtime y los latidos únicamente mientras la pantalla está abierta en primer plano.
 */
export function startPresenceTracker(userId: string): () => void {
  if (!userId) return () => {};

  // Si ya está activo para este mismo usuario con canal funcionando, no recrear
  if (activeUserId === userId && presenceChannel) {
    return () => {
      // No desconectar innecesariamente en re-renderizados
    };
  }

  activeUserId = userId;

  // Limpiar cualquier intervalo o canal previo
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
    heartbeatInterval = null;
  }
  if (presenceChannel) {
    try {
      supabase.removeChannel(presenceChannel);
    } catch {}
    presenceChannel = null;
  }

  try {
    // 1. Crear canal de Realtime Presence
    presenceChannel = supabase.channel(`online-presence-${userId}`, {
      config: {
        presence: {
          key: userId,
        },
      },
    });

    presenceChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        const isScreenActive =
          AppState.currentState === 'active' &&
          (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible');
        if (isScreenActive) {
          sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
        }
      }
    });
  } catch (chanErr) {
    console.warn('[ActivityTracker] Aviso al inicializar canal:', chanErr);
  }

  // 2. Manejador de estado de la pantalla en primer plano / segundo plano
  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    try {
      if (nextAppState === 'active') {
        // Pantalla abierta: reanudar latidos de inmediato
        sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
        if (!heartbeatInterval) {
          heartbeatInterval = setInterval(() => {
            sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
          }, HEARTBEAT_INTERVAL_MS);
        }
      } else {
        // Pantalla cerrada o app en segundo plano: detener latidos
        if (heartbeatInterval) {
          clearInterval(heartbeatInterval);
          heartbeatInterval = null;
        }
        sendScreenClosed(userId);
      }
    } catch {}
  };

  const appStateSub = AppState.addEventListener('change', handleAppStateChange);

  // 3. Soporte para navegador Web / PWA
  let handleVisibilityChange: (() => void) | null = null;
  let handleBeforeUnload: (() => void) | null = null;
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    handleVisibilityChange = () => {
      try {
        if (document.visibilityState === 'visible') {
          sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
          if (!heartbeatInterval) {
            heartbeatInterval = setInterval(() => {
              sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
            }, HEARTBEAT_INTERVAL_MS);
          }
        } else {
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          sendScreenClosed(userId);
        }
      } catch {}
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    handleBeforeUnload = () => {
      try {
        sendScreenClosed(userId);
      } catch {}
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
  }

  // Iniciar latidos si la pantalla ya está activa
  const isInitialActive =
    AppState.currentState === 'active' &&
    (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible');

  if (isInitialActive) {
    sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
    heartbeatInterval = setInterval(() => {
      sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
    }, HEARTBEAT_INTERVAL_MS);
  }

  // Función de limpieza al desmontar o cerrar sesión
  return () => {
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    try {
      appStateSub?.remove?.();
    } catch {}
    if (handleVisibilityChange && typeof document !== 'undefined') {
      try {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      } catch {}
    }
    if (handleBeforeUnload && typeof window !== 'undefined') {
      try {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      } catch {}
    }
    if (presenceChannel) {
      try {
        presenceChannel.untrack().catch(() => {});
        supabase.removeChannel(presenceChannel);
      } catch {}
      presenceChannel = null;
    }
    activeUserId = null;
  };
}

/**
 * Notifica si el alumno ha iniciado o terminado una sesión de entrenamiento.
 */
export function notifySessionStatus(userId: string | undefined | null, isTraining: boolean) {
  isCurrentlyTraining = isTraining;
  if (!userId) return;

  try {
    const isScreenActive =
      AppState.currentState === 'active' &&
      (Platform.OS !== 'web' || typeof document === 'undefined' || document.visibilityState === 'visible');

    if (presenceChannel && isScreenActive) {
      presenceChannel
        .track({
          client_id: userId,
          screen_open: true,
          is_training: isTraining,
          timestamp: Date.now(),
        })
        .catch(() => {});
    }
  } catch {}
}

/**
 * Función compatible para interactuaciones puntuales
 */
export async function touchUserActivity(userId: string | undefined | null): Promise<void> {
  if (!userId) return;
  try {
    sendScreenOpenHeartbeat(userId, isCurrentlyTraining);
  } catch {}
}
