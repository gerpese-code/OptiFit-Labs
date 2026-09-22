import { Profile, WorkoutSession } from '@/types/database';

export interface ClientActivityInfo {
  status: 'online' | 'today' | 'yesterday' | 'recent' | 'inactive';
  label: string;
  badgeClass: string;
  dotColor: string;
  isOnline: boolean;
  lastActiveFormatted: string;
  registeredFormatted: string;
}

/**
 * Calcula el estado de actividad en vivo y la última conexión de un alumno en la app.
 * Utiliza la mayor marca de tiempo entre su perfil actualizado y sus sesiones de entrenamiento.
 */
export function getClientActivityInfo(
  profile: Profile,
  latestSession?: { updated_at?: string; created_at?: string; scheduled_date?: string } | null
): ClientActivityInfo {
  const registeredTime = new Date(profile.created_at).getTime();
  const profileUpdatedTime = profile.updated_at ? new Date(profile.updated_at).getTime() : 0;

  const sessionTime = latestSession
    ? Math.max(
        latestSession.updated_at ? new Date(latestSession.updated_at).getTime() : 0,
        latestSession.created_at ? new Date(latestSession.created_at).getTime() : 0,
        latestSession.scheduled_date ? new Date(latestSession.scheduled_date + 'T12:00:00').getTime() : 0
      )
    : 0;

  // Si profileUpdatedTime es prácticamente igual al de registro (menos de 2 segundos de diferencia) y no hay sesión,
  // significa que solo se registró y no ha interactuado
  const isOnlyRegistered = !sessionTime && Math.abs(profileUpdatedTime - registeredTime) < 2000;
  const lastActiveTimestamp = isOnlyRegistered ? registeredTime : Math.max(profileUpdatedTime, sessionTime, registeredTime);

  const registeredFormatted = new Date(profile.created_at).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  if (isOnlyRegistered) {
    return {
      status: 'inactive',
      label: 'Registrado (Sin actividad aún)',
      badgeClass: 'bg-gray-800 text-gray-400 border-gray-700/60',
      dotColor: 'bg-gray-500',
      isOnline: false,
      lastActiveFormatted: 'Nunca ha iniciado sesión',
      registeredFormatted,
    };
  }

  const now = Date.now();
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

  // En línea si tuvo actividad en los últimos 15 minutos
  if (diffMin <= 15) {
    return {
      status: 'online',
      label: 'En línea ahora',
      badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-600/40',
      dotColor: 'bg-emerald-400',
      isOnline: true,
      lastActiveFormatted: `Activo hace ${Math.max(1, diffMin)} min`,
      registeredFormatted,
    };
  }

  if (isSameDay) {
    return {
      status: 'today',
      label: `Hoy a las ${timeStr}`,
      badgeClass: 'bg-amber-950/80 text-amber-300 border-amber-600/40',
      dotColor: 'bg-amber-400',
      isOnline: false,
      lastActiveFormatted: `Hoy a las ${timeStr} (hace ${diffHours}h)`,
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
    lastActiveFormatted: `El ${activeDate.toLocaleDateString()} a las ${timeStr}`,
    registeredFormatted,
  };
}
