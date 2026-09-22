import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, ServingUnit, calculateFoodMacros, getAllFoods, FoodCategory } from './foodDatabase';
import { UserBiometrics, calculateDailyEnergyExpenditure } from './calorieCalculator';
import { MealType } from './nutritionTracker';

export type NutritionGoal = 'fat_loss' | 'muscle_gain' | 'weight_gain' | 'maintenance';

export type MealFrequency = 1 | 2 | 3 | 4 | 5 | 6;

export type FlavorPreference = 'dulce' | 'salado' | 'picante' | 'acido' | 'neutro';

export type DietaryRestriction = 'none' | 'lactose_free' | 'gluten_free' | 'vegetarian' | 'vegan';

export interface SuggestedMealFood {
  id: string; // Unique id for the item in the meal
  foodId: string;
  foodName: string;
  foodName_es: string;
  foodName_en: string;
  quantity: number;
  unit: ServingUnit;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  category: FoodCategory;
}

export interface SuggestedMeal {
  id: string;
  mealType: MealType;
  name: string;
  name_es: string;
  name_en: string;
  timeSuggestion: string; // Ej. "08:30"
  targetCalories: number;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  foods: SuggestedMealFood[];
}

export interface SuggestedPlan {
  id: string;
  createdAt: string;
  goal: NutritionGoal;
  currentWeightKg: number;
  targetWeightKg: number;
  mealFrequency: MealFrequency;
  flavorPreferences: FlavorPreference[];
  dietaryRestrictions: DietaryRestriction[];
  favoriteFoodIds: string[];
  baselineTDEE: number;
  dailyTargetCalories: number;
  dailyCalorieDelta: number; // Ej. -450 (ahorro/déficit) o +300 (superávit)
  estimatedWeeksToGoal: number;
  weeklyWeightChangeKg: number;
  targetProteinGrams: number;
  targetCarbsGrams: number;
  targetFatsGrams: number;
  totalCalories: number;
  totalProtein_g: number;
  totalCarbs_g: number;
  totalFats_g: number;
  meals: SuggestedMeal[];
}

export interface WizardPlanInput {
  goal: NutritionGoal;
  currentWeightKg: number;
  targetWeightKg: number;
  mealFrequency: MealFrequency;
  flavorPreferences: FlavorPreference[];
  dietaryRestrictions: DietaryRestriction[];
  favoriteFoodIds: string[];
}

const STORAGE_KEY_SUGGESTED_PLAN = '@fitnesspro_suggested_meal_plan_v2';

/**
 * Obtiene el plan alimenticio sugerido guardado del usuario
 */
export async function getStoredSuggestedPlan(): Promise<SuggestedPlan | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_SUGGESTED_PLAN);
    if (!raw) return null;
    return JSON.parse(raw) as SuggestedPlan;
  } catch (e) {
    console.warn('Error loading suggested plan:', e);
    return null;
  }
}

/**
 * Guarda el plan sugerido en almacenamiento local
 */
export async function saveStoredSuggestedPlan(plan: SuggestedPlan): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_SUGGESTED_PLAN, JSON.stringify(plan));
  } catch (e) {
    console.warn('Error saving suggested plan:', e);
  }
}

/**
 * Elimina el plan sugerido
 */
export async function clearStoredSuggestedPlan(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_SUGGESTED_PLAN);
  } catch (e) {
    console.warn('Error clearing suggested plan:', e);
  }
}

/**
 * Recalcula los totales de una comida y del plan entero tras cualquier modificación
 */
export function recalculatePlanTotals(plan: SuggestedPlan): SuggestedPlan {
  let totalCal = 0;
  let totalProt = 0;
  let totalCarb = 0;
  let totalFat = 0;

  const updatedMeals = plan.meals.map((meal) => {
    let mealCal = 0;
    let mealProt = 0;
    let mealCarb = 0;
    let mealFat = 0;

    meal.foods.forEach((f) => {
      mealCal += f.calories || 0;
      mealProt += f.protein_g || 0;
      mealCarb += f.carbs_g || 0;
      mealFat += f.fats_g || 0;
    });

    mealCal = Math.round(mealCal);
    mealProt = Number(mealProt.toFixed(1));
    mealCarb = Number(mealCarb.toFixed(1));
    mealFat = Number(mealFat.toFixed(1));

    totalCal += mealCal;
    totalProt += mealProt;
    totalCarb += mealCarb;
    totalFat += mealFat;

    return {
      ...meal,
      calories: mealCal,
      protein_g: mealProt,
      carbs_g: mealCarb,
      fats_g: mealFat,
    };
  });

  return {
    ...plan,
    totalCalories: Math.round(totalCal),
    totalProtein_g: Number(totalProt.toFixed(1)),
    totalCarbs_g: Number(totalCarb.toFixed(1)),
    totalFats_g: Number(totalFat.toFixed(1)),
    meals: updatedMeals,
  };
}

/**
 * Actualiza la porción de un alimento en una comida específica y recalcula macros
 */
export function updateMealFoodQuantity(
  plan: SuggestedPlan,
  mealId: string,
  foodItemId: string,
  newQuantity: number,
  foodRef: FoodItem
): SuggestedPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.id !== mealId) return meal;

    const updatedFoods = meal.foods.map((food) => {
      if (food.id !== foodItemId) return food;
      const cleanQty = Math.max(0, newQuantity);
      const computed = calculateFoodMacros(foodRef, cleanQty, food.unit);

      return {
        ...food,
        quantity: cleanQty,
        calories: computed.calories,
        protein_g: computed.protein_g,
        carbs_g: computed.carbs_g,
        fats_g: computed.fats_g,
      };
    }).filter((f) => f.quantity > 0);

    return {
      ...meal,
      foods: updatedFoods,
    };
  });

  return recalculatePlanTotals({ ...plan, meals: updatedMeals });
}

/**
 * Elimina un alimento de una comida del plan sugerido
 */
export function removeFoodFromPlanMeal(
  plan: SuggestedPlan,
  mealId: string,
  foodItemId: string
): SuggestedPlan {
  const updatedMeals = plan.meals.map((meal) => {
    if (meal.id !== mealId) return meal;
    return {
      ...meal,
      foods: meal.foods.filter((f) => f.id !== foodItemId),
    };
  });

  return recalculatePlanTotals({ ...plan, meals: updatedMeals });
}

/**
 * Añade un alimento a una comida del plan sugerido
 */
export function addFoodToPlanMeal(
  plan: SuggestedPlan,
  mealId: string,
  food: FoodItem,
  quantity: number,
  unit: ServingUnit
): SuggestedPlan {
  const cleanQty = Math.max(1, quantity);
  const computed = calculateFoodMacros(food, cleanQty, unit);

  const newFoodItem: SuggestedMealFood = {
    id: `meal_item_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    foodId: food.id,
    foodName: food.name,
    foodName_es: food.name_es || food.name,
    foodName_en: food.name_en || food.name,
    quantity: cleanQty,
    unit,
    calories: computed.calories,
    protein_g: computed.protein_g,
    carbs_g: computed.carbs_g,
    fats_g: computed.fats_g,
    category: food.category,
  };

  const updatedMeals = plan.meals.map((meal) => {
    if (meal.id !== mealId) return meal;
    return {
      ...meal,
      foods: [...meal.foods, newFoodItem],
    };
  });

  return recalculatePlanTotals({ ...plan, meals: updatedMeals });
}

/**
 * Motor Nutricional Científico y Equilibrado:
 * Genera el plan de alimentación sugerido en base a objetivos, comidas diarias y preferencias.
 */
export function generateSuggestedPlan(
  input: WizardPlanInput,
  allAvailableFoods: FoodItem[],
  biometrics: UserBiometrics
): SuggestedPlan {
  const currentWeight = input.currentWeightKg > 0 ? input.currentWeightKg : biometrics.weightKg || 75;
  const targetWeight = input.targetWeightKg > 0 ? input.targetWeightKg : currentWeight;

  // 1. Cálculo de TDEE y TMB
  const expenditure = calculateDailyEnergyExpenditure(biometrics, { strengthKcal: 0, cardioKcal: 0 });
  const baselineTDEE = expenditure.tdee || 2200;

  // 2. Definición del Déficit o Superávit Saludable
  let dailyDelta = 0;
  let dailyTargetCalories = baselineTDEE;
  let weeklyWeightChangeKg = 0;
  let estimatedWeeksToGoal = 8; // Default base

  const deltaWeight = Math.abs(currentWeight - targetWeight);

  switch (input.goal) {
    case 'fat_loss': {
      // Déficit saludable de -20% (entre 350 y 500 kcal)
      const rawDeficit = Math.round(baselineTDEE * 0.20);
      dailyDelta = -Math.min(550, Math.max(350, rawDeficit));
      // Piso calórico seguro para preservar salud metabólica y hormonal
      const minFloor = biometrics.gender === 'female' ? 1350 : 1600;
      dailyTargetCalories = Math.max(minFloor, baselineTDEE + dailyDelta);
      // 1 kg grasa corporal = ~7,700 kcal
      weeklyWeightChangeKg = -Number(((Math.abs(dailyDelta) * 7) / 7700).toFixed(2));
      if (deltaWeight > 0 && weeklyWeightChangeKg < 0) {
        estimatedWeeksToGoal = Math.max(2, Math.round(deltaWeight / Math.abs(weeklyWeightChangeKg)));
      } else {
        estimatedWeeksToGoal = 8;
      }
      break;
    }
    case 'muscle_gain': {
      // Superávit controlado (+250 a +350 kcal) para ganar músculo minimizando grasa
      dailyDelta = +300;
      dailyTargetCalories = baselineTDEE + dailyDelta;
      // Ganancia muscular magra promedio: ~0.25 kg por semana
      weeklyWeightChangeKg = 0.25;
      if (deltaWeight > 0) {
        estimatedWeeksToGoal = Math.max(4, Math.round(deltaWeight / weeklyWeightChangeKg));
      } else {
        estimatedWeeksToGoal = 12;
      }
      break;
    }
    case 'weight_gain': {
      // Superávit calórico más pronunciado (+450 a +500 kcal)
      dailyDelta = +450;
      dailyTargetCalories = baselineTDEE + dailyDelta;
      weeklyWeightChangeKg = 0.40;
      if (deltaWeight > 0) {
        estimatedWeeksToGoal = Math.max(3, Math.round(deltaWeight / weeklyWeightChangeKg));
      } else {
        estimatedWeeksToGoal = 10;
      }
      break;
    }
    case 'maintenance':
    default: {
      dailyDelta = 0;
      dailyTargetCalories = baselineTDEE;
      weeklyWeightChangeKg = 0;
      estimatedWeeksToGoal = 0;
      break;
    }
  }

  // 3. Reparto Óptimo de Macronutrientes
  // Proteína: 2.0g/kg en déficit o volumen (alta saciedad y síntesis proteica)
  const proteinGrams = Math.round(currentWeight * (input.goal === 'fat_loss' ? 2.2 : 2.0));
  const proteinKcal = proteinGrams * 4;

  // Grasas esenciales: 0.9g/kg (salud hormonal, vitaminas liposolubles)
  const fatsGrams = Math.round(currentWeight * 0.9);
  const fatsKcal = fatsGrams * 9;

  // Carbohidratos: restante calórico para energía y rendimiento
  const remainingKcalForCarbs = Math.max(200, dailyTargetCalories - (proteinKcal + fatsKcal));
  const carbsGrams = Math.round(remainingKcalForCarbs / 4);

  // 4. Configuración de Comidas según la Frecuencia (1 a 6 comidas)
  const mealTemplates = getMealDistributionTemplates(input.mealFrequency, dailyTargetCalories);

  // 5. Filtrado de Alimentos Disponibles según Restricciones
  const filteredFoods = filterFoodsByRestrictions(allAvailableFoods, input.dietaryRestrictions);

  // 6. Ensamblaje Inteligente de Comidas incorporando Favoritos y Sabores
  const generatedMeals: SuggestedMeal[] = mealTemplates.map((tmpl, idx) => {
    const mealTargetKcal = tmpl.targetCalories;
    const mealFoods = assembleMealFoods(
      tmpl.mealType,
      mealTargetKcal,
      input.favoriteFoodIds,
      input.flavorPreferences,
      filteredFoods,
      input.goal
    );

    let mealCal = 0;
    let mealProt = 0;
    let mealCarb = 0;
    let mealFat = 0;

    mealFoods.forEach((f) => {
      mealCal += f.calories;
      mealProt += f.protein_g;
      mealCarb += f.carbs_g;
      mealFat += f.fats_g;
    });

    return {
      id: `meal_suggested_${idx + 1}_${Date.now()}`,
      mealType: tmpl.mealType,
      name: tmpl.name_es,
      name_es: tmpl.name_es,
      name_en: tmpl.name_en,
      timeSuggestion: tmpl.timeSuggestion,
      targetCalories: mealTargetKcal,
      calories: Math.round(mealCal),
      protein_g: Number(mealProt.toFixed(1)),
      carbs_g: Number(mealCarb.toFixed(1)),
      fats_g: Number(mealFat.toFixed(1)),
      foods: mealFoods,
    };
  });

  const rawPlan: SuggestedPlan = {
    id: `plan_suggested_${Date.now()}`,
    createdAt: new Date().toISOString(),
    goal: input.goal,
    currentWeightKg: currentWeight,
    targetWeightKg: targetWeight,
    mealFrequency: input.mealFrequency,
    flavorPreferences: input.flavorPreferences,
    dietaryRestrictions: input.dietaryRestrictions,
    favoriteFoodIds: input.favoriteFoodIds,
    baselineTDEE,
    dailyTargetCalories,
    dailyCalorieDelta: dailyDelta,
    estimatedWeeksToGoal,
    weeklyWeightChangeKg,
    targetProteinGrams: proteinGrams,
    targetCarbsGrams: carbsGrams,
    targetFatsGrams: fatsGrams,
    totalCalories: 0,
    totalProtein_g: 0,
    totalCarbs_g: 0,
    totalFats_g: 0,
    meals: generatedMeals,
  };

  return recalculatePlanTotals(rawPlan);
}

/**
 * Plantillas de distribución de comidas de 1 a 6 ingestas
 */
interface MealDistributionTemplate {
  mealType: MealType;
  name_es: string;
  name_en: string;
  timeSuggestion: string;
  targetCalories: number;
}

function getMealDistributionTemplates(
  freq: MealFrequency,
  totalKcal: number
): MealDistributionTemplate[] {
  switch (freq) {
    case 1:
      return [
        {
          mealType: 'almuerzo',
          name_es: 'Comida Principal Única (OMAD)',
          name_en: 'Single Main Meal (OMAD)',
          timeSuggestion: '14:00',
          targetCalories: totalKcal,
        },
      ];
    case 2:
      return [
        {
          mealType: 'almuerzo',
          name_es: 'Primer Ingesta (Almuerzo Nutritivo)',
          name_en: 'First Meal (Nutrient-Rich Lunch)',
          timeSuggestion: '12:30',
          targetCalories: Math.round(totalKcal * 0.50),
        },
        {
          mealType: 'cena',
          name_es: 'Segunda Ingesta (Cena Recuperadora)',
          name_en: 'Second Meal (Recovery Dinner)',
          timeSuggestion: '20:30',
          targetCalories: Math.round(totalKcal * 0.50),
        },
      ];
    case 3:
      return [
        {
          mealType: 'desayuno',
          name_es: 'Desayuno Energético',
          name_en: 'Energizing Breakfast',
          timeSuggestion: '08:30',
          targetCalories: Math.round(totalKcal * 0.30),
        },
        {
          mealType: 'almuerzo',
          name_es: 'Almuerzo Equilibrado',
          name_en: 'Balanced Lunch',
          timeSuggestion: '13:30',
          targetCalories: Math.round(totalKcal * 0.40),
        },
        {
          mealType: 'cena',
          name_es: 'Cena Ligera & Proteica',
          name_en: 'Light & Protein Dinner',
          timeSuggestion: '21:00',
          targetCalories: Math.round(totalKcal * 0.30),
        },
      ];
    case 4:
      return [
        {
          mealType: 'desayuno',
          name_es: 'Desayuno Completo',
          name_en: 'Complete Breakfast',
          timeSuggestion: '08:00',
          targetCalories: Math.round(totalKcal * 0.25),
        },
        {
          mealType: 'almuerzo',
          name_es: 'Almuerzo Fuerte',
          name_en: 'Power Lunch',
          timeSuggestion: '13:00',
          targetCalories: Math.round(totalKcal * 0.35),
        },
        {
          mealType: 'merienda',
          name_es: 'Merienda / Snack de la Tarde',
          name_en: 'Afternoon Snack / Pre-workout',
          timeSuggestion: '17:00',
          targetCalories: Math.round(totalKcal * 0.15),
        },
        {
          mealType: 'cena',
          name_es: 'Cena Reparadora',
          name_en: 'Restorative Dinner',
          timeSuggestion: '21:00',
          targetCalories: Math.round(totalKcal * 0.25),
        },
      ];
    case 5:
      return [
        {
          mealType: 'desayuno',
          name_es: 'Desayuno Inicial',
          name_en: 'Kick-off Breakfast',
          timeSuggestion: '08:00',
          targetCalories: Math.round(totalKcal * 0.22),
        },
        {
          mealType: 'snacks',
          name_es: 'Colación Media Mañana',
          name_en: 'Mid-Morning Snack',
          timeSuggestion: '11:00',
          targetCalories: Math.round(totalKcal * 0.10),
        },
        {
          mealType: 'almuerzo',
          name_es: 'Almuerzo Principal',
          name_en: 'Main Lunch',
          timeSuggestion: '13:30',
          targetCalories: Math.round(totalKcal * 0.33),
        },
        {
          mealType: 'merienda',
          name_es: 'Merienda Energética',
          name_en: 'Energy Afternoon Snack',
          timeSuggestion: '17:30',
          targetCalories: Math.round(totalKcal * 0.15),
        },
        {
          mealType: 'cena',
          name_es: 'Cena Nocturna',
          name_en: 'Night Dinner',
          timeSuggestion: '21:00',
          targetCalories: Math.round(totalKcal * 0.20),
        },
      ];
    case 6:
    default:
      return [
        {
          mealType: 'desayuno',
          name_es: 'Comida 1 (Desayuno)',
          name_en: 'Meal 1 (Breakfast)',
          timeSuggestion: '07:30',
          targetCalories: Math.round(totalKcal * 0.20),
        },
        {
          mealType: 'snacks',
          name_es: 'Comida 2 (Media Mañana)',
          name_en: 'Meal 2 (Mid-Morning)',
          timeSuggestion: '10:30',
          targetCalories: Math.round(totalKcal * 0.10),
        },
        {
          mealType: 'almuerzo',
          name_es: 'Comida 3 (Almuerzo)',
          name_en: 'Meal 3 (Lunch)',
          timeSuggestion: '13:30',
          targetCalories: Math.round(totalKcal * 0.30),
        },
        {
          mealType: 'merienda',
          name_es: 'Comida 4 (Pre/Post Entreno)',
          name_en: 'Meal 4 (Pre/Post Workout)',
          timeSuggestion: '16:30',
          targetCalories: Math.round(totalKcal * 0.15),
        },
        {
          mealType: 'cena',
          name_es: 'Comida 5 (Cena)',
          name_en: 'Meal 5 (Dinner)',
          timeSuggestion: '19:45',
          targetCalories: Math.round(totalKcal * 0.15),
        },
        {
          mealType: 'snacks',
          name_es: 'Comida 6 (Colación Nocturna)',
          name_en: 'Meal 6 (Bedtime Snack)',
          timeSuggestion: '22:30',
          targetCalories: Math.round(totalKcal * 0.10),
        },
      ];
  }
}

/**
 * Filtra alimentos según restricciones dietarias
 */
function filterFoodsByRestrictions(
  foods: FoodItem[],
  restrictions: DietaryRestriction[]
): FoodItem[] {
  if (!restrictions || restrictions.length === 0 || restrictions.includes('none')) {
    return foods;
  }

  return foods.filter((f) => {
    const isMeat = f.category === 'carnes';
    const isDairy = f.category === 'lacteos';
    const nameLower = (f.name_es || f.name).toLowerCase();

    if (restrictions.includes('vegan')) {
      if (isMeat || isDairy) return false;
      if (nameLower.includes('huevo') || nameLower.includes('clara') || nameLower.includes('miel') || nameLower.includes('whey')) return false;
    }
    if (restrictions.includes('vegetarian')) {
      if (isMeat) {
        if (!nameLower.includes('huevo') && !nameLower.includes('clara')) return false;
      }
    }
    if (restrictions.includes('lactose_free')) {
      if (isDairy) {
        if (!nameLower.includes('deslactosada') && !nameLower.includes('sin lactosa') && !nameLower.includes('almendras') && !nameLower.includes('soja') && !nameLower.includes('avena')) {
          return false;
        }
      }
    }
    if (restrictions.includes('gluten_free')) {
      if (nameLower.includes('trigo') || nameLower.includes('harina') || nameLower.includes('pan blanco') || nameLower.includes('fideos') || nameLower.includes('pasta')) {
        return false;
      }
    }
    return true;
  });
}

/**
 * Ensambla alimentos balanceados y saludables para una comida específica
 */
function assembleMealFoods(
  mealType: MealType,
  targetKcal: number,
  favoriteIds: string[],
  flavorPrefs: FlavorPreference[],
  availableFoods: FoodItem[],
  goal: NutritionGoal
): SuggestedMealFood[] {
  const result: SuggestedMealFood[] = [];

  const pickFood = (categories: FoodCategory[], keywords: string[] = []): FoodItem | null => {
    // 1. Prioridad: Alimento favorito del usuario
    const favMatches = availableFoods.filter(
      (f) => favoriteIds.includes(f.id) && categories.includes(f.category)
    );
    if (favMatches.length > 0) {
      if (keywords.length > 0) {
        const kwMatch = favMatches.find((f) => {
          const n = (f.name_es || f.name).toLowerCase();
          return keywords.some((kw) => n.includes(kw));
        });
        if (kwMatch) return kwMatch;
      }
      return favMatches[Math.floor(Math.random() * favMatches.length)];
    }

    // 2. Coincidencia por categoría y palabras clave
    const catMatches = availableFoods.filter((f) => categories.includes(f.category));
    if (keywords.length > 0) {
      const kwMatch = catMatches.find((f) => {
        const n = (f.name_es || f.name).toLowerCase();
        return keywords.some((kw) => n.includes(kw));
      });
      if (kwMatch) return kwMatch;
    }

    return catMatches.length > 0 ? catMatches[Math.floor(Math.random() * catMatches.length)] : null;
  };

  const wantsSweet = flavorPrefs.includes('dulce');

  if (mealType === 'desayuno' || (mealType === 'merienda' && wantsSweet)) {
    const isYogurtStyle = wantsSweet || Math.random() > 0.4;

    if (isYogurtStyle) {
      const yogurt = pickFood(['lacteos'], ['yogur griego', 'skyr', 'yogurt']) || pickFood(['lacteos']);
      const oats = pickFood(['cereales'], ['avena', 'granola']) || pickFood(['cereales']);
      const fruit = pickFood(['frutas'], ['platano', 'banana', 'frutilla', 'fresa', 'arandano', 'manzana']) || pickFood(['frutas']);

      if (yogurt) {
        const yogurtKcal = Math.round(targetKcal * 0.45);
        const qty = yogurt.servingUnit === 'unidad' ? 1 : Math.round((yogurtKcal / (yogurt.calories || 60)) * 100);
        addFoodItemToResult(result, yogurt, qty);
      }
      if (oats) {
        const oatsKcal = Math.round(targetKcal * 0.35);
        const qtyGrams = Math.round((oatsKcal / (oats.calories || 389)) * 100);
        addFoodItemToResult(result, oats, Math.max(30, Math.min(100, qtyGrams)));
      }
      if (fruit) {
        const fruitQty = fruit.servingUnit === 'unidad' ? 1 : 100;
        addFoodItemToResult(result, fruit, fruitQty);
      }
    } else {
      const egg = pickFood(['carnes'], ['huevo', 'clara']) || pickFood(['carnes']);
      const bread = pickFood(['cereales'], ['pan integral', 'pan']) || pickFood(['cereales']);
      const fat = pickFood(['grasas'], ['palta', 'aguacate', 'frutos secos']) || pickFood(['frutas']);

      if (egg) {
        const eggQty = egg.servingUnit === 'unidad' ? 2 : 150;
        addFoodItemToResult(result, egg, eggQty);
      }
      if (bread) {
        const breadQty = bread.servingUnit === 'unidad' ? 2 : 60;
        addFoodItemToResult(result, bread, breadQty);
      }
      if (fat) {
        const fatQty = fat.servingUnit === 'unidad' ? 1 : 40;
        addFoodItemToResult(result, fat, fatQty);
      }
    }
  } else if (mealType === 'almuerzo' || mealType === 'cena') {
    const protein = pickFood(['carnes', 'legumbres'], ['pechuga', 'pollo', 'lomo', 'atun', 'salmon', 'carne']) || pickFood(['carnes']);
    const carb = pickFood(['cereales', 'verduras'], ['arroz', 'papa', 'batata', 'quinoa', 'pasta']) || pickFood(['cereales']);
    const veggie = pickFood(['verduras'], ['ensalada', 'espinaca', 'brocoli', 'tomate', 'mix']) || pickFood(['verduras']);
    const healthyFat = pickFood(['grasas'], ['aceite de oliva', 'oliva', 'palta']) || pickFood(['grasas']);

    if (protein) {
      const protTargetKcal = Math.round(targetKcal * 0.45);
      const protGrams = Math.round((protTargetKcal / (protein.calories || 120)) * 100);
      const cleanProtGrams = Math.max(100, Math.min(280, Math.round(protGrams / 10) * 10));
      addFoodItemToResult(result, protein, cleanProtGrams);
    }
    if (carb) {
      const carbTargetKcal = Math.round(targetKcal * 0.35);
      const carbGrams = Math.round((carbTargetKcal / (carb.calories || 130)) * 100);
      const cleanCarbGrams = Math.max(80, Math.min(250, Math.round(carbGrams / 10) * 10));
      addFoodItemToResult(result, carb, cleanCarbGrams);
    }
    if (veggie) {
      addFoodItemToResult(result, veggie, 120);
    }
    if (healthyFat) {
      const fatQty = healthyFat.servingUnit === 'unidad' ? 1 : 10;
      addFoodItemToResult(result, healthyFat, fatQty);
    }
  } else {
    const snackFood = pickFood(['frutas', 'lacteos', 'grasas'], ['frutos secos', 'yogur', 'manzana', 'platano', 'almendras']) || pickFood(['frutas']);
    if (snackFood) {
      const snackQty = snackFood.servingUnit === 'unidad' ? 1 : (snackFood.category === 'grasas' ? 25 : 150);
      addFoodItemToResult(result, snackFood, snackQty);
    }
    const extraProtein = pickFood(['lacteos', 'suplementos'], ['yogur griego', 'skyr', 'whey']) || pickFood(['lacteos']);
    if (extraProtein && targetKcal > 200) {
      const extraQty = extraProtein.servingUnit === 'unidad' ? 1 : 120;
      addFoodItemToResult(result, extraProtein, extraQty);
    }
  }

  return result;
}

function addFoodItemToResult(result: SuggestedMealFood[], food: FoodItem, quantity: number): void {
  const cleanQty = Math.max(1, quantity);
  const computed = calculateFoodMacros(food, cleanQty, food.servingUnit);

  result.push({
    id: `item_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    foodId: food.id,
    foodName: food.name,
    foodName_es: food.name_es || food.name,
    foodName_en: food.name_en || food.name,
    quantity: cleanQty,
    unit: food.servingUnit,
    calories: computed.calories,
    protein_g: computed.protein_g,
    carbs_g: computed.carbs_g,
    fats_g: computed.fats_g,
    category: food.category,
  });
}
