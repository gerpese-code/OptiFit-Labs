import { Profile, WorkoutSession } from '@/types/database';

export interface ClientActivityInfo {
  status: 'online' | 'today' | 'yesterday' | 'recent' | 'inactive';
  label: string;
  badgeClass: string;
  dotColor: string;
  isOnline: boolean;
  isTraining: boolean;
  lastActiveFormatted: string;
  registeredFormatted: string;
}

export interface ActivitySessionInput {
  updated_at?: string;
  created_at?: string;
  scheduled_date?: string;
  completed_at?: string | null;
  status?: string;
}

export interface ActivityEvaluationOptions {
  activeSession?: ActivitySessionInput | null;
  latestCompletedSession?: ActivitySessionInput | null;
  isRealtimeOnline?: boolean;
  isRealtimeTraining?: boolean;
}

/**
 * Determina si una sesión de entrenamiento está ACTIVAMENTE en curso ("en medio de una sesión").
 * Requisitos:
 * 1. No debe estar completada (completed_at == null).
 * 2. Estado 'partial' (en curso en la app).
 * 3. Es reciente (hoy o creada/actualizada hace menos de 3.5 horas).
 */
export function isRecentActiveWorkout(session?: ActivitySessionInput | null): boolean {
  if (!session) return false;
  // Debe NO estar completada
  if (session.completed_at) return false;
  // El estado de sesión en curso en la app móvil es 'partial'
  if (session.status !== 'partial') return false;

  const now = Date.now();
  const sessionTime = Math.max(
    session.updated_at ? new Date(session.updated_at).getTime() : 0,
    session.created_at ? new Date(session.created_at).getTime() : 0
  );

  // Sesión en curso si se actualizó/creó en las últimas 3.5 horas
  const isWithinWorkoutWindow = sessionTime > 0 && (now - sessionTime) < 3.5 * 60 * 60 * 1000;

  const todayStr = new Date().toISOString().split('T')[0];
  const isScheduledToday = session.scheduled_date === todayStr;

  return isWithinWorkoutWindow || isScheduledToday;
}

/**
 * Calcula el estado de actividad en vivo y la última conexión de un alumno.
 * 
 * Regla de negocio estricta:
 * El alumno figura "En línea" ÚNICAMENTE si:
 * 1. Tiene la pantalla de la app abierta en primer plano (Realtime Presence activo o heartbeat reciente <= 75 segundos).
 * 2. O está en medio de una sesión de entrenamiento activa.
 * 
 * En cualquier otro caso, figura desconectado con su última conexión real (sin trucos de scheduled_date).
 */
export function getClientActivityInfo(
  profile: Profile,
  optionsOrSession?: ActivityEvaluationOptions | ActivitySessionInput | null,
  isRealtimeOnlineOverride?: boolean
): ClientActivityInfo {
  let activeSession: ActivitySessionInput | null = null;
  let latestCompletedSession: ActivitySessionInput | null = null;
  let isRealtimeOnline = Boolean(isRealtimeOnlineOverride);
  let isRealtimeTraining = false;

  if (optionsOrSession) {
    if (
      'activeSession' in optionsOrSession ||
      'latestCompletedSession' in optionsOrSession ||
      'isRealtimeOnline' in optionsOrSession
    ) {
      const opts = optionsOrSession as ActivityEvaluationOptions;
      activeSession = opts.activeSession || null;
      latestCompletedSession = opts.latestCompletedSession || null;
      if (opts.isRealtimeOnline !== undefined) isRealtimeOnline = opts.isRealtimeOnline;
      if (opts.isRealtimeTraining !== undefined) isRealtimeTraining = opts.isRealtimeTraining;
    } else {
      const sess = optionsOrSession as ActivitySessionInput;
      if (isRecentActiveWorkout(sess)) {
        activeSession = sess;
      } else if (sess.completed_at || sess.status === 'completed') {
        latestCompletedSession = sess;
      }
    }
  }

  const registeredFormatted = new Date(profile.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const now = Date.now();
  const registeredTime = new Date(profile.created_at).getTime();
  const profileUpdatedTime = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;

  // 1. CONDICIÓN B: ¿Está en medio de una sesión de entrenamiento?
  const inActiveWorkout = isRealtimeTraining || isRecentActiveWorkout(activeSession);
  if (inActiveWorkout) {
    return {
      status: 'online',
      label: 'Entrenando ahora',
      badgeClass: 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-950',
      dotColor: 'bg-emerald-400 animate-pulse',
      isOnline: true,
      isTraining: true,
      lastActiveFormatted: 'Entrenando ahora (Sesión activa)',
      registeredFormatted,
    };
  }

  // 2. CONDICIÓN A: ¿Tiene abierta la pantalla de la app?
  // a) Presencia en tiempo real confirmada por WebSocket
  // b) O latido en base de datos en los últimos 75 segundos (el heartbeat envía ping cada 25s mientras la pantalla está activa)
  const diffFromHeartbeatMs = Math.max(0, now - profileUpdatedTime);
  const hasRecentHeartbeat = profileUpdatedTime > 0 && diffFromHeartbeatMs <= 75 * 1000;

  const isScreenOpen = isRealtimeOnline || hasRecentHeartbeat;
  if (isScreenOpen) {
    return {
      status: 'online',
      label: 'En línea ahora',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40',
      dotColor: 'bg-emerald-400',
      isOnline: true,
      isTraining: false,
      lastActiveFormatted: 'En la app ahora',
      registeredFormatted,
    };
  }

  // 3. NO ESTÁ EN LÍNEA -> Calcular fecha y hora de última conexión real
  const completedSessionTime = latestCompletedSession
    ? Math.max(
        latestCompletedSession.completed_at ? new Date(latestCompletedSession.completed_at).getTime() : 0,
        latestCompletedSession.updated_at ? new Date(latestCompletedSession.updated_at).getTime() : 0
      )
    : 0;

  // Si solo se registró y nunca ha interactuado
  const isOnlyRegistered =
    !completedSessionTime && (!profileUpdatedTime || Math.abs(profileUpdatedTime - registeredTime) < 2000);

  if (isOnlyRegistered) {
    return {
      status: 'inactive',
      label: 'Registrado (Sin actividad aún)',
      badgeClass: 'bg-gray-800 text-gray-400 border-gray-700/60',
      dotColor: 'bg-gray-500',
      isOnline: false,
      isTraining: false,
      lastActiveFormatted: 'Nunca ha iniciado sesión',
      registeredFormatted,
    };
  }

  const lastActiveTimestamp = Math.max(profileUpdatedTime, completedSessionTime, registeredTime);
  const diffMs = Math.max(0, now - lastActiveTimestamp);
  const diffMin = Math.floor(diffMs / (60 * 1000));
  const diffHours = Math.floor(diffMs / (60 * 60 * 1000));
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));

  const activeDate = new Date(lastActiveTimestamp);
  const nowDate = new Date();
  const isSameDay =
    activeDate.getDate() === nowDate.getDate() &&
    activeDate.getMonth() === nowDate.getMonth() &&
    activeDate.getFullYear() === nowDate.getFullYear();

  const timeStr = activeDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isSameDay) {
    const elapsedText = diffHours > 0 ? `hace ${diffHours}h` : `hace ${Math.max(1, diffMin)} min`;
    return {
      status: 'today',
      label: `Hoy a las ${timeStr}`,
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/40',
      dotColor: 'bg-amber-400',
      isOnline: false,
      isTraining: false,
      lastActiveFormatted: `Hoy a las ${timeStr} (${elapsedText})`,
      registeredFormatted,
    };
  }

  const yesterdayDate = new Date(nowDate);
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const isYesterday =
    activeDate.getDate() === yesterdayDate.getDate() &&
    activeDate.getMonth() === yesterdayDate.getMonth() &&
    activeDate.getFullYear() === yesterdayDate.getFullYear();

  if (isYesterday) {
    return {
      status: 'yesterday',
      label: `Ayer a las ${timeStr}`,
      badgeClass: 'bg-sky-950/80 text-sky-300 border-sky-600/40',
      dotColor: 'bg-sky-400',
      isOnline: false,
      isTraining: false,
      lastActiveFormatted: `Ayer a las ${timeStr}`,
      registeredFormatted,
    };
  }

  if (diffDays <= 7) {
    return {
      status: 'recent',
      label: `Hace ${diffDays} días`,
      badgeClass: 'bg-gray-800 text-gray-300 border-gray-700/60',
      dotColor: 'bg-gray-400',
      isOnline: false,
      isTraining: false,
      lastActiveFormatted: `Hace ${diffDays} días (${activeDate.toLocaleDateString()})`,
      registeredFormatted,
    };
  }

  return {
    status: 'inactive',
    label: `Inactivo (${activeDate.toLocaleDateString()})`,
    badgeClass: 'bg-red-950/50 text-red-300 border-red-800/40',
    dotColor: 'bg-red-400',
    isOnline: false,
    isTraining: false,
    lastActiveFormatted: `El ${activeDate.toLocaleDateString()} a las ${timeStr}`,
    registeredFormatted,
  };
}
