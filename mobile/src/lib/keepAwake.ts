import { getCachedPreferences } from './userPreferences';

let activateKeepAwakeAsync: any = null;
let deactivateKeepAwakeAsync: any = null;

try {
  // @ts-ignore
  const KeepAwake = require('expo-keep-awake');
  if (KeepAwake) {
    activateKeepAwakeAsync = KeepAwake.activateKeepAwakeAsync;
    deactivateKeepAwakeAsync = KeepAwake.deactivateKeepAwakeAsync;
  }
} catch (e) {
  // Fallback si expo-keep-awake aún no está enlazado localmente
}

export async function setKeepScreenAwake(enable: boolean) {
  const prefs = getCachedPreferences();
  
  // Si el usuario desactivó la opción en ajustes, nunca forzar pantalla activa
  if (enable && !prefs.keepAwakeEnabled) {
    if (deactivateKeepAwakeAsync) {
      try {
        await deactivateKeepAwakeAsync();
      } catch (err) {}
    }
    return;
  }

  try {
    if (enable && activateKeepAwakeAsync) {
      await activateKeepAwakeAsync();
    } else if (!enable && deactivateKeepAwakeAsync) {
      await deactivateKeepAwakeAsync();
    }
  } catch (err) {
    console.warn('Keep screen awake warning:', err);
  }
}
