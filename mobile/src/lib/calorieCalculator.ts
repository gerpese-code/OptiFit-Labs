import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeightUnit } from '@/types/database';

export type Gender = 'male' | 'female';
export type HeightUnit = 'cm' | 'ft_in';
export type BodyType = 'standard' | 'athletic';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'very_active';
export type CardioType =
  | 'treadmill'
  | 'stairmaster'
  | 'elliptical'
  | 'bike'
  | 'outdoor_walk'
  | 'running'
  | 'outdoor_cycling'
  | 'swimming'
  | 'football'
  | 'tennis'
  | 'golf'
  | 'basketball'
  | 'boxing'
  | 'yoga'
  | 'pilates'
  | 'sports'
  | 'other_sport';

import { calculateAgeFromBirthDate } from './birthDateUtils';

export interface UserBiometrics {
  weightKg: number;
  heightCm: number;
  heightUnit?: HeightUnit;
  age: number;
  birthDate?: string; // Formato YYYY-MM-DD
  gender: Gender;
  activityLevel: ActivityLevel;
  unitPreference: WeightUnit;
  bodyType?: BodyType;
  bodyFatPercentage?: number;
}

export interface CardioActivityItem {
  id: string;
  type: CardioType;
  title: string;
  durationMinutes: number;
  inclineDegrees?: number; // Para caminadora (0-15°)
  speedKmH?: number; // Para caminadora o running (ej. 5.5 km/h)
  resistanceLevel?: number; // Para elíptica, escalador o bici (1-15)
  caloriesBurned: number;
  completed: boolean;
  createdAt: string;
}

export interface DailyCalorieRecord {
  date: string; // YYYY-MM-DD
  strengthKcal: number;
  cardioKcal: number;
  totalKcal: number;
  totalDurationMin: number;
  volumeKg: number;
  workoutsCount: number;
}

const STORAGE_KEY_BIOMETRICS = '@fitnesspro_biometrics';
const STORAGE_KEY_CALORIE_HISTORY = '@fitnesspro_calorie_history_v2';

export const DEFAULT_BIOMETRICS: UserBiometrics = {
  weightKg: 75,
  heightCm: 175,
  heightUnit: 'cm',
  age: 28,
  birthDate: '1998-05-15',
  gender: 'male',
  activityLevel: 'moderate',
  unitPreference: 'kg',
  bodyType: 'standard',
};

/**
 * Convierte centímetros a pies y pulgadas (ej. 174 cm -> { feet: 5, inches: 8.5 })
 */
export function cmToFtIn(cm: number): { feet: number; inches: number } {
  if (!cm || cm <= 0) return { feet: 5, inches: 9 };
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Number((totalInches % 12).toFixed(1));
  return { feet, inches };
}

/**
 * Convierte pies y pulgadas a centímetros (ej. 5 ft 8.5 in -> 174 cm)
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = Math.max(0, feet) * 12 + Math.max(0, inches);
  return Math.round(totalInches * 2.54);
}

/**
 * Carga la biometría guardada del usuario con valores por defecto óptimos
 */
export async function getStoredBiometrics(): Promise<UserBiometrics> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_BIOMETRICS);
    if (!raw) return DEFAULT_BIOMETRICS;
    const parsed = JSON.parse(raw);
    const birthDate = parsed.birthDate || DEFAULT_BIOMETRICS.birthDate;
    const age = birthDate ? calculateAgeFromBirthDate(birthDate) : (parsed.age || 28);
    return {
      ...DEFAULT_BIOMETRICS,
      ...parsed,
      birthDate,
      age,
    };
  } catch (e) {
    return DEFAULT_BIOMETRICS;
  }
}

/**
 * Guarda los datos biométricos del usuario en almacenamiento local
 */
export async function saveStoredBiometrics(bio: UserBiometrics): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_BIOMETRICS, JSON.stringify(bio));
  } catch (e) {
    console.warn('Error saving biometrics:', e);
  }
}

/**
 * Tasa Metabólica Basal (TMB / BMR):
 * - Perfil Estándar: Fórmula Mifflin-St Jeor.
 * - Perfil Atlético / Musculado: Fórmula Katch-McArdle basada en Masa Magra (LBM),
 *   que refleja con alta precisión el mayor consumo metabólico del tejido muscular.
 */
export function calculateBMR(bio: UserBiometrics): number {
  const { weightKg, heightCm, age, gender, bodyType, bodyFatPercentage } = bio;

  if (bodyType === 'athletic') {
    // Estimación o uso directo del porcentaje graso atlético
    const bf = bodyFatPercentage && bodyFatPercentage > 0
      ? bodyFatPercentage
      : gender === 'male' ? 13 : 21;
    const leanMassKg = weightKg * (1 - bf / 100);
    // Katch-McArdle: 370 + (21.6 * Masa Magra en kg)
    return Math.round(370 + 21.6 * leanMassKg);
  }

  // Mifflin-St Jeor estándar
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return Math.round(gender === 'male' ? base + 5 : base - 161);
}

/**
 * Multiplicadores de estilo de vida laboral / cotidiano (NEAT):
 * - Sedentario: Oficina / PC / Escritorio (1.20)
 * - Ligero: Trabajo de pie / Comercio / Docencia (1.30)
 * - Moderado: En constante movimiento / Hostelería / Salud (1.45)
 * - Muy Activo: Trabajo físico pesado / Construcción (1.60)
 */
export const LIFESTYLE_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.20,
  light: 1.30,
  moderate: 1.45,
  very_active: 1.60,
};

/**
 * Gasto Calórico Mínimo Diario Base (TMB + Actividad Cotidiana de Trabajo/NEAT)
 * Esto es lo que el alumno quema en su día a día ANTES de ir al gimnasio.
 */
export function calculateBaseLifestyleExpenditure(bio: UserBiometrics): number {
  const bmr = calculateBMR(bio);
  const mult = LIFESTYLE_MULTIPLIERS[bio.activityLevel] || 1.30;
  return Math.round(bmr * mult);
}

/**
 * Gasto Energético Diario Total (TDEE)
 */
export function calculateTDEE(bio: UserBiometrics): number {
  return calculateBaseLifestyleExpenditure(bio);
}

export interface BMIResult {
  bmi: number;
  category: string;
  color: string;
  isAthletic: boolean;
  ffmi?: number;
  explanation: string;
}

/**
 * Índice de Masa Corporal (IMC / BMI) contextualizado por composición corporal:
 * Si el usuario entrena y tiene masa muscular desarrollada, evita el falso "Sobrepeso".
 */
export function calculateBMI(bio: UserBiometrics, lang: 'es' | 'en' = 'es'): BMIResult {
  const { weightKg, heightCm, bodyType, gender, bodyFatPercentage } = bio;
  const isEn = lang === 'en';

  if (!heightCm || heightCm <= 0) {
    return {
      bmi: 22.5,
      category: isEn ? 'Normal' : 'Normal',
      color: '#10b981',
      isAthletic: false,
      explanation: isEn ? 'Height within standard average.' : 'Estatura dentro del promedio.',
    };
  }
  const heightM = heightCm / 100;
  const bmi = Number((weightKg / (heightM * heightM)).toFixed(1));

  // Estimación de FFMI (Fat-Free Mass Index) para atletas
  const bf = bodyFatPercentage && bodyFatPercentage > 0
    ? bodyFatPercentage
    : gender === 'male' ? 13 : 21;
  const leanMassKg = weightKg * (1 - bf / 100);
  const rawFfmi = leanMassKg / (heightM * heightM);
  const normalizedFfmi = Number((rawFfmi + 6.1 * (1.8 - heightM)).toFixed(1));

  if (bodyType === 'athletic') {
    if (bmi < 18.5) {
      return {
        bmi,
        category: isEn ? 'Underweight' : 'Bajo peso',
        color: '#38bdf8',
        isAthletic: true,
        ffmi: normalizedFfmi,
        explanation: isEn
          ? 'Body weight below average. Surplus recommended for muscle growth.'
          : 'Peso corporal por debajo del promedio. Se recomienda superávit para desarrollo muscular.',
      };
    } else if (bmi < 31.5) {
      return {
        bmi,
        category: isEn ? 'Athletic / Lean Muscle' : 'Atlético / Masa Muscular',
        color: '#10b981',
        isAthletic: true,
        ffmi: normalizedFfmi,
        explanation: isEn
          ? 'Athletic physique with dense muscle mass and low body fat. Your scale weight reflects lean tissue, not excess fat.'
          : 'Físico atlético con masa muscular densa y bajo % graso. Tu peso se debe a tejido magro saludable, no a exceso de grasa.',
      };
    } else {
      return {
        bmi,
        category: isEn ? 'Heavy Muscular Physique' : 'Físico Muscular Muy Pesado',
        color: '#f59e0b',
        isAthletic: true,
        ffmi: normalizedFfmi,
        explanation: isEn
          ? 'High muscular volume (advanced hypertrophy or strength athlete).'
          : 'Volumen muscular muy elevado (hipertrofia avanzada o deportes de potencia).',
      };
    }
  }

  // Población estándar (clasificación OMS)
  if (bmi < 18.5) {
    return {
      bmi,
      category: isEn ? 'Underweight' : 'Bajo peso',
      color: '#38bdf8',
      isAthletic: false,
      explanation: isEn ? 'Body weight below standard healthy range.' : 'Peso corporal por debajo del rango saludable estándar.',
    };
  } else if (bmi < 25) {
    return {
      bmi,
      category: isEn ? 'Normal' : 'Normal',
      color: '#10b981',
      isAthletic: false,
      explanation: isEn ? 'Healthy weight range for your height.' : 'Rango de peso saludable acorde a tu estatura.',
    };
  } else if (bmi < 30) {
    return {
      bmi,
      category: isEn ? 'Overweight' : 'Sobrepeso',
      color: '#f59e0b',
      isAthletic: false,
      explanation: isEn
        ? 'Slightly above general population scale. Enable Athletic Profile if you lift weights.'
        : 'Ligero exceso de peso según escala general. Si entrenas fuerza activa el modo Atlético.',
    };
  } else {
    return {
      bmi,
      category: isEn ? 'Obese' : 'Obesidad',
      color: '#ef4444',
      isAthletic: false,
      explanation: isEn ? 'Elevated weight according to general scale.' : 'Peso elevado según escala general de salud.',
    };
  }
}

/**
 * Cálculo del gasto calórico en Pesas / Fuerza:
 * 1. Gasto metabólico base (MET ~6.0 para hipertrofia/fuerza moderada-vigorosa)
 *    kcal/min = (MET * 3.5 * pesoKg) / 200
 * 2. Bonus por volumen mecánico de trabajo levantado:
 *    (tonelaje total / 1000) * 2.8 kcal
 */
export function calculateStrengthCalories(
  durationMinutes: number,
  totalVolumeKg: number,
  weightKg: number
): number {
  if (durationMinutes <= 0 && totalVolumeKg <= 0) return 0;
  const safeWeight = weightKg > 0 ? weightKg : 75;
  const safeMinutes = Math.max(1, durationMinutes);

  // MET 6.2 para entrenamiento de fuerza activo en gimnasio
  const met = 6.2;
  const baseKcal = ((met * 3.5 * safeWeight) / 200) * safeMinutes;

  // Bonus por esfuerzo mecánico de tonelaje
  const volumeBonus = (totalVolumeKg / 1000) * 2.8;

  return Math.round(baseKcal + volumeBonus);
}

/**
 * Cálculo del gasto calórico para Cardio y Actividades Extra:
 * Soporta máquinas de gimnasio y actividades exteriores (caminata, running, deportes, etc.)
 */
export function calculateCardioCalories(
  activity: Omit<CardioActivityItem, 'id' | 'caloriesBurned' | 'createdAt'>,
  weightKg: number
): number {
  const { type, durationMinutes, inclineDegrees = 0, speedKmH = 5, resistanceLevel = 5 } = activity;
  if (durationMinutes <= 0) return 0;
  const safeWeight = weightKg > 0 ? weightKg : 75;

  let met = 5.0;

  switch (type) {
    case 'treadmill': {
      // Inclinación ej: 0° a 15°. Caminar en plano = 3.8 MET.
      // Cada grado de inclinación incrementa el gasto entre 0.35 y 0.45 MET (ACSM)
      const baseMet = 3.8;
      const inclineBonus = Math.max(0, inclineDegrees) * 0.38;
      const speedBonus = speedKmH > 5 ? (speedKmH - 5) * 0.75 : 0;
      met = baseMet + inclineBonus + speedBonus;
      break;
    }
    case 'stairmaster': {
      // Escalador requiere trabajo vertical antigravitatorio
      const level = Math.max(1, Math.min(15, resistanceLevel || 5));
      met = 6.2 + level * 0.42;
      break;
    }
    case 'elliptical': {
      const level = Math.max(1, Math.min(15, resistanceLevel || 5));
      met = 5.2 + level * 0.38;
      break;
    }
    case 'bike': {
      const level = Math.max(1, Math.min(15, resistanceLevel || 5));
      met = 4.8 + level * 0.42;
      break;
    }
    case 'outdoor_walk': {
      // Caminata al aire libre: MET 3.8 - 4.5 según velocidad
      const baseMet = 3.8;
      const speedBonus = speedKmH > 4 ? (speedKmH - 4) * 0.6 : 0;
      met = baseMet + speedBonus;
      break;
    }
    case 'running': {
      // Trote / Carrera: base 8.5 MET (~9 km/h) hasta 11.5 MET
      const baseMet = 8.5;
      const speedBonus = speedKmH > 8 ? (speedKmH - 8) * 0.9 : 0;
      met = baseMet + speedBonus;
      break;
    }
    case 'outdoor_cycling': {
      // Ciclismo exterior: MET 6.8 a 8.2
      const baseMet = 6.8;
      const speedBonus = speedKmH > 15 ? (speedKmH - 15) * 0.25 : 0;
      met = Math.min(10.0, baseMet + speedBonus);
      break;
    }
    case 'football': {
      // Fútbol: sprints intermitentes, cambios de ritmo (MET 8.0)
      met = 8.0;
      break;
    }
    case 'tennis': {
      // Tenis y Pádel: desplazamientos laterales rápidos, aceleraciones (MET 7.3)
      met = 7.3;
      break;
    }
    case 'golf': {
      // Golf: caminata continua del campo con bolsa/carrito + swings (MET 4.5)
      met = 4.5;
      break;
    }
    case 'basketball': {
      // Baloncesto / Básquetbol: saltos, contragolpes (MET 8.0)
      met = 8.0;
      break;
    }
    case 'boxing': {
      // Boxeo y Artes Marciales: saco, sparring, alta potencia (MET 9.0)
      met = 9.0;
      break;
    }
    case 'yoga': {
      // Yoga: flexibilidad, equilibrio, core y respiración (MET 3.0)
      met = 3.0;
      break;
    }
    case 'pilates': {
      // Pilates: mat, reformer, fortalecimiento postural (MET 3.2)
      met = 3.2;
      break;
    }
    case 'sports': {
      // Deportes colectivos / raqueta general (MET 7.2)
      met = 7.2;
      break;
    }
    case 'other_sport': {
      // Otra actividad física / deportiva (MET 6.5)
      met = 6.5;
      break;
    }
    case 'swimming': {
      // Natación estilo libre moderado/vigoroso (MET ~7.5)
      met = 7.5;
      break;
    }
  }

  // Formula ACSM: (MET * 3.5 * peso_kg / 200) * tiempo_min
  const kcal = ((met * 3.5 * safeWeight) / 200) * durationMinutes;
  return Math.round(kcal);
}

/**
 * Metadata descriptiva para UI de cada actividad
 */
export function getCardioMeta(type: CardioType, lang: 'es' | 'en' = 'es'): {
  title: string;
  category: 'gym' | 'outdoor' | 'sports' | 'mind_body';
  badgeColor: string;
  defaultMinutes: number;
} {
  const isEn = lang === 'en';
  switch (type) {
    case 'treadmill':
      return {
        title: isEn ? 'Incline Treadmill' : 'Caminadora con Inclinación',
        category: 'gym',
        badgeColor: '#10b981',
        defaultMinutes: 15,
      };
    case 'stairmaster':
      return {
        title: isEn ? 'StairMaster' : 'Escalador (StairMaster)',
        category: 'gym',
        badgeColor: '#38bdf8',
        defaultMinutes: 15,
      };
    case 'elliptical':
      return {
        title: isEn ? 'Elliptical' : 'Elíptica',
        category: 'gym',
        badgeColor: '#a78bfa',
        defaultMinutes: 20,
      };
    case 'bike':
      return {
        title: isEn ? 'Stationary Bike' : 'Bicicleta Estática',
        category: 'gym',
        badgeColor: '#fbbf24',
        defaultMinutes: 20,
      };
    case 'outdoor_walk':
      return {
        title: isEn ? 'Outdoor Walk' : 'Caminata al Aire Libre',
        category: 'outdoor',
        badgeColor: '#34d399',
        defaultMinutes: 30,
      };
    case 'running':
      return {
        title: isEn ? 'Running / Jogging' : 'Carrera / Running',
        category: 'outdoor',
        badgeColor: '#f97316',
        defaultMinutes: 25,
      };
    case 'outdoor_cycling':
      return {
        title: isEn ? 'Outdoor Cycling' : 'Ciclismo Exterior',
        category: 'outdoor',
        badgeColor: '#06b6d4',
        defaultMinutes: 30,
      };
    case 'swimming':
      return {
        title: isEn ? 'Swimming' : 'Natación',
        category: 'outdoor',
        badgeColor: '#0284c7',
        defaultMinutes: 30,
      };
    case 'football':
      return {
        title: isEn ? 'Soccer' : 'Fútbol',
        category: 'sports',
        badgeColor: '#10b981',
        defaultMinutes: 60,
      };
    case 'tennis':
      return {
        title: isEn ? 'Tennis / Padel' : 'Tenis / Pádel',
        category: 'sports',
        badgeColor: '#f59e0b',
        defaultMinutes: 60,
      };
    case 'golf':
      return {
        title: isEn ? 'Golf (Walking)' : 'Golf (Caminando)',
        category: 'sports',
        badgeColor: '#84cc16',
        defaultMinutes: 120,
      };
    case 'basketball':
      return {
        title: isEn ? 'Basketball' : 'Básquetbol',
        category: 'sports',
        badgeColor: '#ea580c',
        defaultMinutes: 60,
      };
    case 'boxing':
      return {
        title: isEn ? 'Boxing / Martial Arts' : 'Boxeo / Artes Marciales',
        category: 'sports',
        badgeColor: '#ef4444',
        defaultMinutes: 45,
      };
    case 'yoga':
      return {
        title: isEn ? 'Yoga' : 'Yoga',
        category: 'mind_body',
        badgeColor: '#c084fc',
        defaultMinutes: 45,
      };
    case 'pilates':
      return {
        title: isEn ? 'Pilates' : 'Pilates',
        category: 'mind_body',
        badgeColor: '#ec4899',
        defaultMinutes: 45,
      };
    case 'sports':
      return {
        title: isEn ? 'Various Sports' : 'Deportes Varios',
        category: 'sports',
        badgeColor: '#38bdf8',
        defaultMinutes: 45,
      };
    case 'other_sport':
      return {
        title: isEn ? 'Other Activity' : 'Otra Actividad',
        category: 'sports',
        badgeColor: '#818cf8',
        defaultMinutes: 45,
      };
  }
}

/**
 * Recalcula las calorías quemadas tras modificar la duración de una actividad
 * (útil si el usuario olvidó detener el cronómetro y quiere ajustar los minutos)
 */
export function updateCardioActivityDuration(
  item: CardioActivityItem,
  newDurationMinutes: number,
  weightKg: number
): CardioActivityItem {
  const safeMinutes = Math.max(1, newDurationMinutes);
  const newCalories = calculateCardioCalories(
    {
      ...item,
      durationMinutes: safeMinutes,
    },
    weightKg
  );
  return {
    ...item,
    durationMinutes: safeMinutes,
    caloriesBurned: newCalories,
  };
}

/**
 * Guarda o actualiza un registro calórico diario para alimentar los reportes
 */
export async function logDailyCalories(entry: {
  date: string; // YYYY-MM-DD
  strengthKcal: number;
  cardioKcal: number;
  durationMin: number;
  volumeKg: number;
}): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CALORIE_HISTORY);
    let history: DailyCalorieRecord[] = raw ? JSON.parse(raw) : [];

    const existingIdx = history.findIndex((h) => h.date === entry.date);
    const totalKcal = entry.strengthKcal + entry.cardioKcal;

    if (existingIdx >= 0) {
      history[existingIdx] = {
        date: entry.date,
        strengthKcal: Math.max(history[existingIdx].strengthKcal, entry.strengthKcal),
        cardioKcal: Math.max(history[existingIdx].cardioKcal, entry.cardioKcal),
        totalKcal: Math.max(history[existingIdx].totalKcal, totalKcal),
        totalDurationMin: Math.max(history[existingIdx].totalDurationMin, entry.durationMin),
        volumeKg: Math.max(history[existingIdx].volumeKg, entry.volumeKg),
        workoutsCount: history[existingIdx].workoutsCount + 1,
      };
    } else {
      history.push({
        date: entry.date,
        strengthKcal: entry.strengthKcal,
        cardioKcal: entry.cardioKcal,
        totalKcal: totalKcal,
        totalDurationMin: entry.durationMin,
        volumeKg: entry.volumeKg,
        workoutsCount: 1,
      });
    }

    // Mantener los últimos 90 días
    history.sort((a, b) => b.date.localeCompare(a.date));
    history = history.slice(0, 90);

    await AsyncStorage.setItem(STORAGE_KEY_CALORIE_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.warn('Error saving calorie history:', e);
  }
}

/**
 * Obtiene el historial calórico agrupado para reportes (Día, Semana, Mes)
 */
export async function getCalorieHistory(): Promise<DailyCalorieRecord[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CALORIE_HISTORY);
    if (!raw) return [];
    const parsed: DailyCalorieRecord[] = JSON.parse(raw);
    return parsed.sort((a, b) => a.date.localeCompare(b.date));
  } catch (e) {
    return [];
  }
}

export interface DailyEnergyExpenditure {
  bmr: number;
  baseLifestyleExpenditure: number; // TMB + NEAT (Gasto mínimo cotidiano según trabajo)
  tdee: number; // Mantenimiento base
  strengthKcal: number;
  cardioKcal: number;
  exerciseKcal: number;
  totalExpenditure: number; // Base cotidiana + Ejercicio acumulado de hoy
}

export interface CaloricBalanceSummary {
  expenditure: DailyEnergyExpenditure;
  intakeCalories: number;
  netKcal: number;
  isDeficit: boolean;
  savingsOrSurplusKcal: number;
}

/**
 * Obtiene las calorías quemadas en ejercicio (fuerza y cardio) en una fecha determinada.
 * Soporta invocaciones: getTodayExerciseCalories(userId, dateStr) o getTodayExerciseCalories(dateStr)
 */
export async function getTodayExerciseCalories(
  dateOrUserId?: string,
  targetDateStr?: string
): Promise<{
  strengthKcal: number;
  cardioKcal: number;
  totalExerciseKcal: number;
}> {
  const now = new Date();
  const defaultDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  let dateToSearch = defaultDate;
  if (targetDateStr && /^\d{4}-\d{2}-\d{2}$/.test(targetDateStr)) {
    dateToSearch = targetDateStr;
  } else if (dateOrUserId && /^\d{4}-\d{2}-\d{2}$/.test(dateOrUserId)) {
    dateToSearch = dateOrUserId;
  }

  const history = await getCalorieHistory();
  const todayEntry = history.find((h) => h.date === dateToSearch);
  if (!todayEntry) {
    return { strengthKcal: 0, cardioKcal: 0, totalExerciseKcal: 0 };
  }
  return {
    strengthKcal: todayEntry.strengthKcal || 0,
    cardioKcal: todayEntry.cardioKcal || 0,
    totalExerciseKcal: (todayEntry.strengthKcal || 0) + (todayEntry.cardioKcal || 0),
  };
}

/**
 * Calcula el gasto energético diario total del alumno:
 * Gasto Básico Cotidiano (TMB + Trabajo/NEAT) + Calorías de la rutina de fuerza + Cardio y deportes
 */
export function calculateDailyEnergyExpenditure(
  bio: UserBiometrics,
  exerciseKcal: { strengthKcal: number; cardioKcal: number }
): DailyEnergyExpenditure {
  const bmr = calculateBMR(bio);
  const baseLifestyle = calculateBaseLifestyleExpenditure(bio);
  const strengthKcal = exerciseKcal.strengthKcal || 0;
  const cardioKcal = exerciseKcal.cardioKcal || 0;
  const exerciseTotal = strengthKcal + cardioKcal;
  const totalExpenditure = baseLifestyle + exerciseTotal;

  return {
    bmr,
    baseLifestyleExpenditure: baseLifestyle,
    tdee: baseLifestyle,
    strengthKcal,
    cardioKcal,
    exerciseKcal: exerciseTotal,
    totalExpenditure,
  };
}

/**
 * Cruza el gasto total con las calorías consumidas en el plan de alimentación
 */
export function calculateCaloricBalance(
  expenditure: DailyEnergyExpenditure,
  intakeCalories: number
): CaloricBalanceSummary {
  const net = intakeCalories - expenditure.totalExpenditure;
  const isDeficit = net <= 0;
  return {
    expenditure,
    intakeCalories,
    netKcal: net,
    isDeficit,
    savingsOrSurplusKcal: Math.abs(net),
  };
}

