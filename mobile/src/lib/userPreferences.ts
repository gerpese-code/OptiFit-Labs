import AsyncStorage from '@react-native-async-storage/async-storage';
import { Vibration } from 'react-native';

export interface UserPreferences {
  hapticsEnabled: boolean;
  keepAwakeEnabled: boolean;
  barbellCalcEnabled: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  hapticsEnabled: true,
  keepAwakeEnabled: true,
  barbellCalcEnabled: true,
};

const STORAGE_KEY = '@fitnesspro_user_preferences';

let cachedPreferences: UserPreferences = { ...DEFAULT_PREFERENCES };
let isLoaded = false;

// Cargar preferencias del almacenamiento local
export async function getUserPreferences(): Promise<UserPreferences> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      cachedPreferences = { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
    }
    isLoaded = true;
    return cachedPreferences;
  } catch (err) {
    console.warn('Error loading user preferences:', err);
    return DEFAULT_PREFERENCES;
  }
}

// Guardar preferencias del usuario
export async function saveUserPreferences(prefs: UserPreferences): Promise<void> {
  try {
    cachedPreferences = { ...prefs };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.warn('Error saving user preferences:', err);
  }
}

// Obtener preferencias cacheadas sincrónicamente
export function getCachedPreferences(): UserPreferences {
  return cachedPreferences;
}

// Ejecutar vibración háptica respetando la preferencia del alumno
export function triggerHaptic(type: 'success' | 'timer' | 'tap' = 'tap') {
  if (!cachedPreferences.hapticsEnabled) return;

  try {
    // Intentar usar expo-haptics si está disponible
    // @ts-ignore
    const Haptics = require('expo-haptics');
    if (type === 'success') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else if (type === 'timer') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
      // Doble vibración para fin de descanso
      setTimeout(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }, 300);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  } catch (e) {
    // Fallback nativo con Vibration de react-native
    try {
      if (type === 'timer') {
        Vibration.vibrate([0, 200, 150, 300]);
      } else {
        Vibration.vibrate(60);
      }
    } catch (vErr) {}
  }
}
