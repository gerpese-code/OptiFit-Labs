import AsyncStorage from '@react-native-async-storage/async-storage';
import { FoodItem, ServingUnit } from './foodDatabase';
import { MealType, LoggedFoodEntry } from './nutritionTracker';

export interface RecipeIngredient {
  foodId: string;
  foodName: string;
  quantity: number;
  unit: ServingUnit;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
}

export interface CustomRecipe {
  id: string;
  name: string;
  name_es: string;
  name_en: string;
  targetMeal?: MealType | 'todas';
  ingredients: RecipeIngredient[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFats: number;
  createdAt: string;
}

const STORAGE_KEY_CUSTOM_RECIPES = '@fitnesspro_custom_recipes_v1';

/**
 * Obtiene todas las recetas y comidas compuestas creadas por el usuario
 */
export async function getCustomRecipes(): Promise<CustomRecipe[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_CUSTOM_RECIPES);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('Error fetching custom recipes:', e);
    return [];
  }
}

/**
 * Guarda o actualiza una receta compuesta por múltiples alimentos
 */
export async function saveCustomRecipe(
  recipeData: Omit<CustomRecipe, 'id' | 'createdAt'>,
  existingId?: string
): Promise<CustomRecipe> {
  const current = await getCustomRecipes();
  const id = existingId || `recipe_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const createdAt = new Date().toISOString();

  const fullRecipe: CustomRecipe = {
    ...recipeData,
    id,
    createdAt,
  };

  const filtered = current.filter((r) => r.id !== id);
  const updated = [fullRecipe, ...filtered];

  await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_RECIPES, JSON.stringify(updated));
  return fullRecipe;
}

/**
 * Elimina una receta personalizada
 */
export async function deleteCustomRecipe(recipeId: string): Promise<void> {
  try {
    const current = await getCustomRecipes();
    const updated = current.filter((r) => r.id !== recipeId);
    await AsyncStorage.setItem(STORAGE_KEY_CUSTOM_RECIPES, JSON.stringify(updated));
  } catch (e) {
    console.warn('Error deleting custom recipe:', e);
  }
}

/**
 * Convierte una receta personalizada en un FoodItem para que pueda seleccionarse
 * y registrarse en cualquier comida de forma instantánea
 */
export function convertRecipeToFoodItem(recipe: CustomRecipe): FoodItem {
  return {
    id: recipe.id,
    name: `🥞 ${recipe.name}`,
    name_es: `🥞 ${recipe.name_es || recipe.name}`,
    name_en: `🥞 ${recipe.name_en || recipe.name}`,
    category: 'platos_preparados',
    servingUnit: 'unidad',
    defaultServingSize: 1,
    servingLabel: '1 porción / plato',
    servingLabel_es: '1 porción / plato',
    servingLabel_en: '1 serving / dish',
    calories: recipe.totalCalories,
    protein_g: recipe.totalProtein,
    carbs_g: recipe.totalCarbs,
    fats_g: recipe.totalFats,
    isCustom: true,
  };
}

/**
 * Convierte los alimentos actualmente registrados en una comida de hoy
 * en una plantilla de receta lista para guardarse (ej. "Torta de Avena", "Desayuno Fitness")
 */
export function convertMealEntriesToRecipe(
  recipeName: string,
  targetMeal: MealType,
  entries: LoggedFoodEntry[]
): Omit<CustomRecipe, 'id' | 'createdAt'> {
  const ingredients: RecipeIngredient[] = entries.map((e) => ({
    foodId: e.foodId,
    foodName: e.foodName,
    quantity: e.quantity,
    unit: e.unit,
    calories: e.calories,
    protein_g: e.protein_g,
    carbs_g: e.carbs_g,
    fats_g: e.fats_g,
  }));

  const totalCalories = Math.round(ingredients.reduce((sum, i) => sum + i.calories, 0));
  const totalProtein = Math.round(ingredients.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
  const totalCarbs = Math.round(ingredients.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
  const totalFats = Math.round(ingredients.reduce((sum, i) => sum + i.fats_g, 0) * 10) / 10;

  return {
    name: recipeName.trim(),
    name_es: recipeName.trim(),
    name_en: recipeName.trim(),
    targetMeal,
    ingredients,
    totalCalories,
    totalProtein,
    totalCarbs,
    totalFats,
  };
}
