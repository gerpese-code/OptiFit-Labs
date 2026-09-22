import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, ServingUnit, calculateFoodMacros } from './foodDatabase';

export type MealType = 'desayuno' | 'almuerzo' | 'merienda' | 'cena' | 'snacks';

export interface LoggedFoodEntry {
  id: string;
  meal: MealType;
  foodId: string;
  foodName: string;
  quantity: number;
  unit: ServingUnit;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  loggedAt: string;
}

export interface DailyMacroTotals {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface DailyNutritionLog {
  date: string; // YYYY-MM-DD
  userId: string;
  waterMl: number;
  entries: LoggedFoodEntry[];
  totals: DailyMacroTotals;
}

export const MEAL_TYPES: { id: MealType; label: string; emoji: string; subtitle: string }[] = [
  { id: 'desayuno', label: 'Desayuno', emoji: '🍳', subtitle: 'Energía para arrancar' },
  { id: 'almuerzo', label: 'Almuerzo', emoji: '🍲', subtitle: 'Comida fuerte' },
  { id: 'merienda', label: 'Merienda', emoji: '🥪', subtitle: 'Recarga de la tarde' },
  { id: 'cena', label: 'Cena', emoji: '🥗', subtitle: 'Cierre y recuperación' },
  { id: 'snacks', label: 'Snacks / Colación', emoji: '🍎', subtitle: 'Entre comidas' },
];

function getStorageKey(userId: string, date: string): string {
  const cleanUser = userId || 'guest';
  return `@fitnesspro_nutrition_${cleanUser}_${date}`;
}

const STORAGE_KEY_RECENT_FOODS = '@fitnesspro_recent_foods_v1';

/**
 * Obtiene los últimos 20 alimentos seleccionados por el usuario para acceso frecuente
 */
export async function getRecentFoods(): Promise<FoodItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_RECENT_FOODS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, 20) : [];
  } catch (e) {
    console.warn('Error fetching recent foods:', e);
    return [];
  }
}

/**
 * Registra un alimento en la lista de recientes/frecuentes (máximo 20, deduplicado)
 */
export async function saveRecentFood(food: FoodItem): Promise<void> {
  try {
    const recents = await getRecentFoods();
    // Quitar el alimento si ya existía para ponerlo al principio
    const filtered = recents.filter((f) => f.id !== food.id);
    const updated = [food, ...filtered].slice(0, 20);
    await AsyncStorage.setItem(STORAGE_KEY_RECENT_FOODS, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error saving recent food:', e);
  }
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateDailyTotals(entries: LoggedFoodEntry[]): DailyMacroTotals {
  return entries.reduce(
    (acc, entry) => ({
      calories: acc.calories + (entry.calories || 0),
      protein_g: Number((acc.protein_g + (entry.protein_g || 0)).toFixed(1)),
      carbs_g: Number((acc.carbs_g + (entry.carbs_g || 0)).toFixed(1)),
      fats_g: Number((acc.fats_g + (entry.fats_g || 0)).toFixed(1)),
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 }
  );
}

/**
 * Obtiene el registro de nutrición del día seleccionado
 */
export async function getDailyNutritionLog(
  userId: string,
  date: string = getTodayDateString()
): Promise<DailyNutritionLog> {
  const key = getStorageKey(userId, date);
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) {
      return {
        date,
        userId,
        waterMl: 0,
        entries: [],
        totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
      };
    }
    const parsed = JSON.parse(raw);
    const totals = calculateDailyTotals(parsed.entries || []);
    return {
      date,
      userId,
      waterMl: parsed.waterMl || 0,
      entries: parsed.entries || [],
      totals,
    };
  } catch (e) {
    console.warn('Error fetching daily nutrition log:', e);
    return {
      date,
      userId,
      waterMl: 0,
      entries: [],
      totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
    };
  }
}

/**
 * Guarda el registro diario en AsyncStorage
 */
export async function saveDailyNutritionLog(log: DailyNutritionLog): Promise<void> {
  const key = getStorageKey(log.userId, log.date);
  try {
    log.totals = calculateDailyTotals(log.entries);
    await AsyncStorage.setItem(key, JSON.stringify(log));
  } catch (e) {
    console.warn('Error saving daily nutrition log:', e);
  }
}

/**
 * Agrega un alimento a una comida del día
 */
export async function addFoodToMeal(
  userId: string,
  date: string,
  meal: MealType,
  food: FoodItem,
  quantity: number,
  unit: ServingUnit
): Promise<DailyNutritionLog> {
  const currentLog = await getDailyNutritionLog(userId, date);
  const calculated = calculateFoodMacros(food, quantity, unit);

  const newEntry: LoggedFoodEntry = {
    id: `entry_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    meal,
    foodId: food.id,
    foodName: food.name,
    quantity,
    unit,
    calories: calculated.calories,
    protein_g: calculated.protein_g,
    carbs_g: calculated.carbs_g,
    fats_g: calculated.fats_g,
    loggedAt: new Date().toISOString(),
  };

  const updatedEntries = [...currentLog.entries, newEntry];
  const updatedLog: DailyNutritionLog = {
    ...currentLog,
    entries: updatedEntries,
    totals: calculateDailyTotals(updatedEntries),
  };

  await saveRecentFood(food);
  await saveDailyNutritionLog(updatedLog);
  return updatedLog;
}

/**
 * Elimina una entrada de alimento del día
 */
export async function removeFoodEntry(
  userId: string,
  date: string,
  entryId: string
): Promise<DailyNutritionLog> {
  const currentLog = await getDailyNutritionLog(userId, date);
  const updatedEntries = currentLog.entries.filter((e) => e.id !== entryId);
  const updatedLog: DailyNutritionLog = {
    ...currentLog,
    entries: updatedEntries,
    totals: calculateDailyTotals(updatedEntries),
  };

  await saveDailyNutritionLog(updatedLog);
  return updatedLog;
}

/**
 * Suma o resta agua (en ml) al día
 */
export async function updateWaterIntake(
  userId: string,
  date: string,
  deltaMl: number
): Promise<DailyNutritionLog> {
  const currentLog = await getDailyNutritionLog(userId, date);
  const newWater = Math.max(0, (currentLog.waterMl || 0) + deltaMl);
  const updatedLog: DailyNutritionLog = {
    ...currentLog,
    waterMl: newWater,
  };

  await saveDailyNutritionLog(updatedLog);
  return updatedLog;
}

// ============================================================================
// 📊 REPORTES DE BALANCE CALÓRICO Y REGISTROS MENSUALES
// ============================================================================

export interface DailyCalorieReportItem {
  date: string;
  dayName: string;
  intakeCalories: number;
  baseExpenditure: number;
  exerciseCalories: number;
  totalExpenditure: number;
  netCalories: number;
  isDeficit: boolean;
  hasIntakeLogged: boolean;
  hasExerciseLogged: boolean;
}

export interface CalorieBalanceReportSummary {
  periodLabel: string;
  startDate: string;
  endDate: string;
  daysCount: number;
  totalIntake: number;
  avgIntake: number;
  totalExpenditure: number;
  avgExpenditure: number;
  totalExerciseCalories: number;
  totalNet: number;
  isCumulativeDeficit: boolean;
  cumulativeSavingsOrSurplus: number;
  estimatedFatKgChange: number; // Kcal netas / 7700 kcal por kg de grasa
  dailyItems: DailyCalorieReportItem[];
}

export interface MonthlyCalorieArchive {
  monthKey: string; // YYYY-MM
  monthTitle: string; // Ej: "Septiembre 2026"
  totalIntake: number;
  totalExpenditure: number;
  totalExerciseCalories: number;
  netKcal: number;
  isDeficit: boolean;
  daysTracked: number;
  estimatedFatLossKg: number;
}

const STORAGE_KEY_MONTHLY_ARCHIVES = '@fitnesspro_monthly_calorie_archives_v1';

/**
 * Obtiene los registros de nutrición para una lista de fechas en una sola llamada optimizada
 */
export async function getNutritionLogsForDates(
  userId: string,
  dates: string[]
): Promise<Map<string, DailyNutritionLog>> {
  const map = new Map<string, DailyNutritionLog>();
  if (!dates.length) return map;

  const keys = dates.map((d) => getStorageKey(userId, d));
  try {
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([key, value], idx) => {
      const date = dates[idx];
      if (value) {
        try {
          const parsed = JSON.parse(value);
          map.set(date, {
            date,
            userId,
            waterMl: parsed.waterMl || 0,
            entries: parsed.entries || [],
            totals: calculateDailyTotals(parsed.entries || []),
          });
        } catch {
          map.set(date, {
            date,
            userId,
            waterMl: 0,
            entries: [],
            totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
          });
        }
      } else {
        map.set(date, {
          date,
          userId,
          waterMl: 0,
          entries: [],
          totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
        });
      }
    });
  } catch (e) {
    console.warn('Error fetching multiGet nutrition logs:', e);
  }
  return map;
}

/**
 * Genera el reporte de balance calórico para un período seleccionado (1 día, 7 días, 14 días, 30 días o mes específico)
 */
export async function generateCalorieBalanceReport(
  userId: string,
  baseDailyExpenditure: number,
  periodOption: '1' | '7' | '14' | '30' | 'month',
  customMonthStr?: string // YYYY-MM
): Promise<CalorieBalanceReportSummary> {
  const now = new Date();
  const dates: string[] = [];

  const dayNamesEs = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  if (periodOption === 'month' && customMonthStr) {
    // Generar días del mes seleccionado
    const [yearStr, monthStr] = customMonthStr.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    for (let d = 1; d <= daysInMonth; d++) {
      const dStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dates.push(dStr);
    }
  } else {
    const count = parseInt(periodOption, 10) || 1;
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${year}-${month}-${day}`);
    }
  }

  // Cargar logs de nutrición de las fechas
  const nutritionMap = await getNutritionLogsForDates(userId, dates);

  // Cargar historial de ejercicios guardado
  const rawHistory = await AsyncStorage.getItem('@fitnesspro_calorie_history_v2');
  const calorieHistory: Array<{ date: string; strengthKcal: number; cardioKcal: number }> = rawHistory
    ? JSON.parse(rawHistory)
    : [];

  const exerciseMap = new Map<string, number>();
  calorieHistory.forEach((item) => {
    exerciseMap.set(item.date, (item.strengthKcal || 0) + (item.cardioKcal || 0));
  });

  const dailyItems: DailyCalorieReportItem[] = [];
  let totalIntake = 0;
  let totalExpenditure = 0;
  let totalExerciseCalories = 0;

  dates.forEach((dateStr) => {
    const dObj = new Date(dateStr + 'T12:00:00');
    const dayName = dayNamesEs[dObj.getDay()] || '';

    const nutLog = nutritionMap.get(dateStr);
    const intake = nutLog?.totals?.calories || 0;
    const exercise = exerciseMap.get(dateStr) || 0;
    const dayExp = baseDailyExpenditure + exercise;
    const net = intake - dayExp;

    totalIntake += intake;
    totalExpenditure += dayExp;
    totalExerciseCalories += exercise;

    dailyItems.push({
      date: dateStr,
      dayName,
      intakeCalories: intake,
      baseExpenditure: baseDailyExpenditure,
      exerciseCalories: exercise,
      totalExpenditure: dayExp,
      netCalories: net,
      isDeficit: net <= 0,
      hasIntakeLogged: intake > 0,
      hasExerciseLogged: exercise > 0,
    });
  });

  const daysCount = dates.length || 1;
  const avgIntake = Math.round(totalIntake / daysCount);
  const avgExpenditure = Math.round(totalExpenditure / daysCount);
  const totalNet = totalIntake - totalExpenditure;
  const isCumulativeDeficit = totalNet <= 0;
  const cumulativeSavingsOrSurplus = Math.abs(totalNet);
  const estimatedFatKgChange = Number((cumulativeSavingsOrSurplus / 7700).toFixed(2));

  let periodLabel = `${daysCount} días`;
  if (periodOption === '1') periodLabel = 'Hoy (1 Día)';
  else if (periodOption === '7') periodLabel = 'Últimos 7 Días';
  else if (periodOption === '14') periodLabel = 'Últimos 14 Días';
  else if (periodOption === '30') periodLabel = 'Últimos 30 Días';
  else if (periodOption === 'month' && customMonthStr) {
    const [y, m] = customMonthStr.split('-');
    const mNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    periodLabel = `${mNames[parseInt(m, 10) - 1] || customMonthStr} ${y}`;
  }

  return {
    periodLabel,
    startDate: dates[0] || '',
    endDate: dates[dates.length - 1] || '',
    daysCount,
    totalIntake,
    avgIntake,
    totalExpenditure,
    avgExpenditure,
    totalExerciseCalories,
    totalNet,
    isCumulativeDeficit,
    cumulativeSavingsOrSurplus,
    estimatedFatKgChange,
    dailyItems,
  };
}

/**
 * Obtiene los cierres mensuales archivados
 */
export async function getMonthlyCalorieArchives(userId: string): Promise<MonthlyCalorieArchive[]> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEY_MONTHLY_ARCHIVES}_${userId || 'guest'}`);
    if (!raw) return [];
    const parsed: MonthlyCalorieArchive[] = JSON.parse(raw);
    return parsed.sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  } catch (e) {
    return [];
  }
}

/**
 * Guarda o actualiza un cierre mensual en el archivo histórico
 */
export async function saveMonthlyCalorieArchive(
  userId: string,
  archive: MonthlyCalorieArchive
): Promise<void> {
  try {
    const current = await getMonthlyCalorieArchives(userId);
    const filtered = current.filter((a) => a.monthKey !== archive.monthKey);
    const updated = [archive, ...filtered].sort((a, b) => b.monthKey.localeCompare(a.monthKey));
    await AsyncStorage.setItem(
      `${STORAGE_KEY_MONTHLY_ARCHIVES}_${userId || 'guest'}`,
      JSON.stringify(updated)
    );
  } catch (e) {
    console.warn('Error saving monthly calorie archive:', e);
  }
}
