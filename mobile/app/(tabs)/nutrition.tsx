import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Apple,
  Flame,
  PieChart,
  RefreshCw,
  Plus,
  Minus,
  ChefHat,
  Trash2,
  Droplets,
  Search,
  X,
  Sparkles,
  Scale,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Utensils,
  Check,
  Clock,
  BarChart3,
} from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { NutritionPlan } from '@/types/database';
import PdfPlanViewer from '@/components/nutrition/PdfPlanViewer';
import GymBackground from '@/components/common/GymBackground';
import AccountInactiveLock from '@/components/common/AccountInactiveLock';
import CaloricBalanceReportModal from '@/components/nutrition/CaloricBalanceReportModal';
import RecipeCreatorModal from '@/components/nutrition/RecipeCreatorModal';
import SuggestedPlanWizardModal from '@/components/nutrition/SuggestedPlanWizardModal';
import SuggestedPlanView from '@/components/nutrition/SuggestedPlanView';
import {
  SuggestedPlan,
  SuggestedMeal,
  getStoredSuggestedPlan,
  saveStoredSuggestedPlan,
} from '@/lib/suggestedMealPlan';
import {
  getCustomRecipes,
  convertRecipeToFoodItem,
  CustomRecipe,
} from '@/lib/recipeTracker';
import {
  FoodItem,
  FoodCategory,
  ServingUnit,
  getAllFoods,
  saveCustomFood,
  calculateFoodMacros,
  searchFoods,
} from '@/lib/foodDatabase';
import {
  MealType,
  MEAL_TYPES,
  DailyNutritionLog,
  getDailyNutritionLog,
  addFoodToMeal,
  removeFoodEntry,
  updateWaterIntake,
  getTodayDateString,
  LoggedFoodEntry,
  getRecentFoods,
} from '@/lib/nutritionTracker';
import {
  getStoredBiometrics,
  getTodayExerciseCalories,
  calculateDailyEnergyExpenditure,
  calculateCaloricBalance,
  UserBiometrics,
  DEFAULT_BIOMETRICS,
  DailyEnergyExpenditure,
  CaloricBalanceSummary,
} from '@/lib/calorieCalculator';

export default function NutritionScreen() {
  const { user, profile } = useAuth();
  const { language, t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Tabs de pantalla: 'balance' | 'coach'
  const [activeTab, setActiveTab] = useState<'balance' | 'suggested' | 'coach'>('balance');
  const [suggestedPlan, setSuggestedPlan] = useState<SuggestedPlan | null>(null);
  const [showPlanWizard, setShowPlanWizard] = useState(false);
  const [activePlan, setActivePlan] = useState<NutritionPlan | null>(null);

  // Biometría y cálculos
  const [biometrics, setBiometrics] = useState<UserBiometrics>(DEFAULT_BIOMETRICS);
  const [exerciseBurn, setExerciseBurn] = useState({ strengthKcal: 0, cardioKcal: 0, totalExerciseKcal: 0 });
  const [expenditure, setExpenditure] = useState<DailyEnergyExpenditure | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Registro del día
  const [todayLog, setTodayLog] = useState<DailyNutritionLog>({
    date: getTodayDateString(),
    userId: user?.id || 'guest',
    waterMl: 0,
    entries: [],
    totals: { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 },
  });

  // Modal selector de alimentos
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<MealType>('desayuno');
  const [allFoodsList, setAllFoodsList] = useState<FoodItem[]>([]);
  const [recentFoodsList, setRecentFoodsList] = useState<FoodItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  const [selectedServingUnit, setSelectedServingUnit] = useState<ServingUnit>('gramos');
  const [portionQuantity, setPortionQuantity] = useState('100');

  // Recetas personalizadas (platos compuestos como Torta de Avena)
  const [customRecipes, setCustomRecipes] = useState<CustomRecipe[]>([]);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [recipeModalMeal, setRecipeModalMeal] = useState<MealType>('desayuno');
  const [recipeInitialEntries, setRecipeInitialEntries] = useState<LoggedFoodEntry[]>([]);

  // Modal custom food
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCategory, setCustomCategory] = useState<FoodCategory>('cereales');
  const [customUnit, setCustomUnit] = useState<ServingUnit>('gramos');
  const [customServingSize, setCustomServingSize] = useState('100');
  const [customKcal, setCustomKcal] = useState('');
  const [customProt, setCustomProt] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');

  const loadAllData = useCallback(async () => {
    if (!user) return;
    try {
      // 1. Plan de nutrición del Coach
      const { data: planData } = await supabase
        .from('nutrition_plans')
        .select('*')
        .eq('client_id', user.id)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1);

      if (planData && planData.length > 0) {
        setActivePlan(planData[0] as NutritionPlan);
      } else {
        setActivePlan(null);
      }

      // 2. Biometría
      const bio = await getStoredBiometrics();
      setBiometrics(bio);

      // 3. Gasto calórico
      const exBurn = await getTodayExerciseCalories(user.id);
      setExerciseBurn(exBurn);

      const exp = calculateDailyEnergyExpenditure(bio, exBurn);
      setExpenditure(exp);

      // 4. Registro de nutrición de hoy
      const todayDate = getTodayDateString();
      const log = await getDailyNutritionLog(user.id, todayDate);
      setTodayLog(log);

      // 5. Cargar recetas personalizadas del usuario
      const recipes = await getCustomRecipes();
      setCustomRecipes(recipes);
      const recipeFoodItems = recipes.map(convertRecipeToFoodItem);

      // 6. Lista de alimentos (recetas + predefinidos + custom) y recientes
      const foods = await getAllFoods();
      setAllFoodsList([...recipeFoodItems, ...foods]);

      const recents = await getRecentFoods();
      setRecentFoodsList(recents);

      // Cargar plan sugerido guardado
      const storedPlan = await getStoredSuggestedPlan();
      setSuggestedPlan(storedPlan);
    } catch (e) {
      console.warn('Error cargando datos de nutrición:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
  };

  // Balance energético (Gasto Total vs Consumo Diario)
  const caloricBalance: CaloricBalanceSummary | null = useMemo(() => {
    if (!expenditure) return null;
    return calculateCaloricBalance(expenditure, todayLog.totals.calories);
  }, [expenditure, todayLog.totals.calories]);

  // Metas recomendadas
  const targetProteinG = useMemo(() => {
    if (activePlan?.macros_json?.protein_g && activePlan.macros_json.protein_g > 0) {
      return activePlan.macros_json.protein_g;
    }
    return Math.round((biometrics.weightKg || 75) * 2);
  }, [activePlan, biometrics.weightKg]);

  const targetWaterMl = useMemo(() => {
    return Math.round((biometrics.weightKg || 70) * 35);
  }, [biometrics.weightKg]);

  // Lista de categorías para chips de filtro
  const categoryChips: { id: string; label: string }[] = useMemo(() => [
    { id: 'all', label: t('nutrition.cat_all', 'Todos') },
    { id: 'recent', label: t('nutrition.recent_shelf_title', '🕒 Recientes') },
    { id: 'recetas', label: t('nutrition.cat_recipes', '🥞 Mis Recetas') },
    { id: 'bebidas', label: t('nutrition.cat_beverages', '☕ Bebidas, Café & Alcohol') },
    { id: 'frutas', label: t('nutrition.cat_fruits', '🍌 Frutas') },
    { id: 'cereales', label: t('nutrition.cat_grains', '🌾 Cereales & Carbos') },
    { id: 'verduras', label: t('nutrition.cat_veggies', '🥗 Verduras') },
    { id: 'carnes', label: t('nutrition.cat_meats', '🥩 Carnes & Huevos') },
    { id: 'legumbres', label: t('nutrition.cat_legumes', '🫘 Legumbres') },
    { id: 'lacteos', label: t('nutrition.cat_dairy', '🥛 Lácteos') },
    { id: 'grasas', label: t('nutrition.cat_fats', '🥑 Grasas & Frutos Secos') },
    { id: 'suplementos', label: t('nutrition.cat_supplements', '⚡ Suplementos & Proteínas') },
    { id: 'platos_preparados', label: t('nutrition.cat_prepared', '🥪 Platos Típicos') },
    { id: 'custom', label: t('nutrition.cat_custom', '⭐ Mis Alimentos') },
  ], [t]);

  // Filtrado de alimentos con búsqueda inteligente bilingüe
  const filteredFoods = useMemo(() => {
    if (selectedCategoryFilter === 'recent') {
      if (!searchQuery.trim()) return recentFoodsList;
      return searchFoods(recentFoodsList, searchQuery, 'all', language);
    }
    if (selectedCategoryFilter === 'recetas') {
      const recipesOnly = allFoodsList.filter((f) => f.id.startsWith('recipe_') || f.name.startsWith('🥞'));
      if (!searchQuery.trim()) return recipesOnly;
      return searchFoods(recipesOnly, searchQuery, 'all', language);
    }
    return searchFoods(allFoodsList, searchQuery, selectedCategoryFilter, language);
  }, [allFoodsList, recentFoodsList, selectedCategoryFilter, searchQuery, language]);

  // Cálculo en vivo de macros de la porción en el modal
  const livePreviewMacros = useMemo(() => {
    if (!selectedFood) return { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0 };
    const qty = parseFloat(portionQuantity) || 0;
    return calculateFoodMacros(selectedFood, qty, selectedServingUnit);
  }, [selectedFood, portionQuantity, selectedServingUnit]);

  const handleOpenAddFood = async (meal: MealType) => {
    setSelectedMealForAdd(meal);
    setSelectedFood(null);
    setSearchQuery('');
    setSelectedCategoryFilter('all');

    // Cargar los 5 recientes actualizados
    try {
      const recents = await getRecentFoods();
      setRecentFoodsList(recents);
    } catch (e) {
      console.warn('Error loading recents:', e);
    }

    setSearchModalVisible(true);
  };

  const handlePlanGenerated = async (plan: SuggestedPlan) => {
    setSuggestedPlan(plan);
    await saveStoredSuggestedPlan(plan);
    setActiveTab('suggested');
    Alert.alert(
      language === 'en' ? 'Plan Generated!' : '¡Plan Creado con Éxito!',
      language === 'en'
        ? `Your healthy plan of ${plan.totalCalories} kcal/day is ready. You can modify portions or log meals at any time.`
        : `Tu pauta saludable de ${plan.totalCalories} kcal/día está lista. Puedes modificar porciones o registrar comidas en cualquier momento.`
    );
  };

  const handleLogMealToToday = async (meal: SuggestedMeal) => {
    if (!user) return;
    try {
      const todayDate = getTodayDateString();
      let currentLog = todayLog;
      for (const food of meal.foods) {
        const foodItem: FoodItem = allFoodsList.find((f) => f.id === food.foodId) || {
          id: food.foodId,
          name: food.foodName,
          name_es: food.foodName_es,
          name_en: food.foodName_en,
          category: food.category,
          servingUnit: food.unit,
          defaultServingSize: food.unit === 'gramos' ? 100 : 1,
          servingLabel: food.unit === 'gramos' ? `${food.quantity}g` : `${food.quantity} u`,
          calories: Math.round((food.calories / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)),
          protein_g: Number(((food.protein_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
          carbs_g: Number(((food.carbs_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
          fats_g: Number(((food.fats_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
        };

        currentLog = await addFoodToMeal(
          user.id,
          todayDate,
          meal.mealType,
          foodItem,
          food.quantity,
          food.unit
        );
      }
      setTodayLog(currentLog);
      Alert.alert(
        language === 'en' ? 'Meal Logged!' : '¡Comida Registrada!',
        language === 'en'
          ? `"${meal.name_en}" was logged into your daily meals.`
          : `"${meal.name_es}" fue agregada a tus comidas de hoy.`
      );
    } catch (e) {
      Alert.alert(
        t('common.error', 'Error'),
        language === 'en' ? 'Could not log meal.' : 'No se pudo registrar la comida.'
      );
    }
  };

  const handleLogAllMealsToToday = async (planToLog: SuggestedPlan) => {
    if (!user) return;
    Alert.alert(
      language === 'en' ? 'Log Entire Plan?' : '¿Registrar Todo el Plan?',
      language === 'en'
        ? `This will log all ${planToLog.meals.length} meals into today's food log.`
        : `Esto registrará las ${planToLog.meals.length} comidas del plan en tu registro de hoy.`,
      [
        { text: language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: language === 'en' ? 'Yes, Log All' : 'Sí, Registrar Todo',
          onPress: async () => {
            try {
              const todayDate = getTodayDateString();
              let currentLog = todayLog;
              for (const meal of planToLog.meals) {
                for (const food of meal.foods) {
                  const foodItem: FoodItem = allFoodsList.find((f) => f.id === food.foodId) || {
                    id: food.foodId,
                    name: food.foodName,
                    name_es: food.foodName_es,
                    name_en: food.foodName_en,
                    category: food.category,
                    servingUnit: food.unit,
                    defaultServingSize: food.unit === 'gramos' ? 100 : 1,
                    servingLabel: food.unit === 'gramos' ? `${food.quantity}g` : `${food.quantity} u`,
                    calories: Math.round((food.calories / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)),
                    protein_g: Number(((food.protein_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
                    carbs_g: Number(((food.carbs_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
                    fats_g: Number(((food.fats_g / (food.quantity || 1)) * (food.unit === 'gramos' ? 100 : 1)).toFixed(1)),
                  };

                  currentLog = await addFoodToMeal(
                    user.id,
                    todayDate,
                    meal.mealType,
                    foodItem,
                    food.quantity,
                    food.unit
                  );
                }
              }
              setTodayLog(currentLog);
              setActiveTab('balance');
              Alert.alert(
                language === 'en' ? 'All Meals Logged!' : '¡Plan Registrado!',
                language === 'en'
                  ? 'Your energy balance and daily macros were updated.'
                  : 'Tu balance calórico y macros del día fueron actualizados.'
              );
            } catch (e) {
              Alert.alert(
                t('common.error', 'Error'),
                language === 'en' ? 'Could not log meals.' : 'No se pudieron registrar las comidas.'
              );
            }
          },
        },
      ]
    );
  };

  const handleStepQuantity = (delta: number) => {
    const current = parseFloat(portionQuantity) || 0;
    const next = Math.max(0, current + delta);
    const rounded = Math.round(next * 10) / 10;
    setPortionQuantity(String(rounded));
  };

  const handleRecipeSaved = async (newRecipe: CustomRecipe) => {
    try {
      const recipes = await getCustomRecipes();
      setCustomRecipes(recipes);
      const recipeFoodItems = recipes.map(convertRecipeToFoodItem);
      const foods = await getAllFoods();
      setAllFoodsList([...recipeFoodItems, ...foods]);

      // Opción de registrar directamente en la comida activa
      const targetM: MealType = (newRecipe.targetMeal && newRecipe.targetMeal !== 'todas')
        ? newRecipe.targetMeal
        : recipeModalMeal;
      const mealLabel = getMealLabel(targetM);

      Alert.alert(
        language === 'en' ? 'Recipe Created!' : '¡Receta Creada!',
        language === 'en'
          ? `"${newRecipe.name}" was saved. Do you want to log it into ${mealLabel} now?`
          : `"${newRecipe.name}" fue guardada. ¿Deseas registrarla en ${mealLabel} ahora?`,
        [
          { text: language === 'en' ? 'Later' : 'Más tarde', style: 'cancel' },
          {
            text: language === 'en' ? 'Log Now' : 'Registrar ahora',
            onPress: async () => {
              if (!user) return;
              const foodItem = convertRecipeToFoodItem(newRecipe);
              const updated = await addFoodToMeal(
                user.id,
                getTodayDateString(),
                targetM,
                foodItem,
                1,
                'unidad'
              );
              setTodayLog(updated);
              const recents = await getRecentFoods();
              setRecentFoodsList(recents);
            },
          },
        ]
      );
    } catch (e) {
      console.warn('Error refreshing after recipe save:', e);
    }
  };

  const isSliceableFood = (food: FoodItem | null): boolean => {
    if (!food) return false;
    if (food.servingUnit === 'rebanada') return true;
    const lowerName = (food.name || '').toLowerCase();
    const lowerCat = (food.category || '').toLowerCase();
    if (lowerCat === 'lacteos' && (lowerName.includes('queso') || lowerName.includes('cheese') || food.id.includes('queso'))) {
      if (
        lowerName.includes('crema') ||
        lowerName.includes('untable') ||
        lowerName.includes('rallado') ||
        lowerName.includes('cottage') ||
        lowerName.includes('ricotta') ||
        lowerName.includes('ricota')
      ) {
        return false;
      }
      return true;
    }
    if (lowerCat === 'carnes' && (lowerName.includes('jamon') || lowerName.includes('jamón') || lowerName.includes('pavo') || lowerName.includes('lomo') || lowerName.includes('paleta'))) {
      return true;
    }
    if (lowerCat === 'cereales' && (lowerName.includes('pan') || lowerName.includes('bread') || lowerName.includes('tostada'))) {
      return true;
    }
    return false;
  };

  const handleSelectFood = (food: FoodItem) => {
    setSelectedFood(food);
    if (isSliceableFood(food)) {
      setSelectedServingUnit('rebanada');
      setPortionQuantity(food.servingUnit === 'rebanada' ? String(food.defaultServingSize) : '1');
    } else {
      setSelectedServingUnit(food.servingUnit);
      setPortionQuantity(String(food.defaultServingSize));
    }
  };

  const handleConfirmAddFood = async () => {
    if (!user || !selectedFood) return;
    const qty = parseFloat(portionQuantity);
    if (isNaN(qty) || qty <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid portion' : 'Porción inválida',
        language === 'en' ? 'Please enter an amount greater than 0.' : 'Ingresa una cantidad mayor a 0.'
      );
      return;
    }

    try {
      const todayDate = getTodayDateString();
      const updatedLog = await addFoodToMeal(
        user.id,
        todayDate,
        selectedMealForAdd,
        selectedFood,
        qty,
        selectedServingUnit
      );
      setTodayLog(updatedLog);

      // Refrescar recientes
      const updatedRecents = await getRecentFoods();
      setRecentFoodsList(updatedRecents);

      setSearchModalVisible(false);
      setSelectedFood(null);
    } catch (e) {
      Alert.alert(
        t('common.error', 'Error'),
        language === 'en' ? 'Could not log food.' : 'No se pudo registrar el alimento.'
      );
    }
  };

  const handleDeleteFood = async (entryId: string) => {
    if (!user) return;
    try {
      const todayDate = getTodayDateString();
      const updatedLog = await removeFoodEntry(user.id, todayDate, entryId);
      setTodayLog(updatedLog);
    } catch (e) {
      Alert.alert(
        t('common.error', 'Error'),
        language === 'en' ? 'Could not delete entry.' : 'No se pudo eliminar el alimento.'
      );
    }
  };

  const handleWaterDelta = async (deltaMl: number) => {
    if (!user) return;
    const todayDate = getTodayDateString();
    const updated = await updateWaterIntake(user.id, todayDate, deltaMl);
    setTodayLog(updated);
  };

  const handleSaveCustomFood = async () => {
    if (!customName.trim()) {
      Alert.alert(
        language === 'en' ? 'Missing data' : 'Faltan datos',
        language === 'en' ? 'Enter the food name.' : 'Ingresa el nombre del alimento.'
      );
      return;
    }
    const kcal = parseFloat(customKcal) || 0;
    const prot = parseFloat(customProt) || 0;
    const carbs = parseFloat(customCarbs) || 0;
    const fats = parseFloat(customFats) || 0;
    const servingSize = parseFloat(customServingSize) || (customUnit === 'gramos' ? 100 : 1);

    const saved = await saveCustomFood({
      name: customName.trim(),
      name_es: customName.trim(),
      name_en: customName.trim(),
      category: customCategory,
      servingUnit: customUnit,
      defaultServingSize: servingSize,
      servingLabel: customUnit === 'gramos' ? `${servingSize}g` : (customUnit === 'rebanada' ? `${servingSize} reb` : `${servingSize} u`),
      unitWeightGrams: customUnit === 'rebanada' ? 25 : undefined,
      calories: kcal,
      protein_g: prot,
      carbs_g: carbs,
      fats_g: fats,
    });

    const refreshedFoods = await getAllFoods();
    setAllFoodsList(refreshedFoods);
    setCustomModalVisible(false);

    setCustomName('');
    setCustomKcal('');
    setCustomProt('');
    setCustomCarbs('');
    setCustomFats('');
    handleSelectFood(saved);
  };

  // Helper para nombre de comida traducido
  const getMealLabel = (mealId: MealType): string => {
    switch (mealId) {
      case 'desayuno':
        return t('nutrition.meal_breakfast', 'Desayuno');
      case 'almuerzo':
        return t('nutrition.meal_lunch', 'Almuerzo');
      case 'merienda':
        return t('nutrition.meal_snack_afternoon', 'Merienda');
      case 'cena':
        return t('nutrition.meal_dinner', 'Cena');
      case 'snacks':
        return t('nutrition.meal_snacks', 'Snacks / Colación');
      default:
        return mealId;
    }
  };

  const getMealSubtitle = (mealId: MealType): string => {
    switch (mealId) {
      case 'desayuno':
        return t('nutrition.meal_breakfast_sub', 'Energía para arrancar');
      case 'almuerzo':
        return t('nutrition.meal_lunch_sub', 'Comida fuerte');
      case 'merienda':
        return t('nutrition.meal_snack_afternoon_sub', 'Recarga de la tarde');
      case 'cena':
        return t('nutrition.meal_dinner_sub', 'Cierre y recuperación');
      case 'snacks':
        return t('nutrition.meal_snacks_sub', 'Entre comidas');
      default:
        return '';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{t('common.loading', 'Cargando balance y nutrición...')}</Text>
      </View>
    );
  }

  if (profile && profile.is_active === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AccountInactiveLock sectionName={t('tabs.nutrition', 'tu plan de nutrición')} />
      </SafeAreaView>
    );
  }

  const coachMacros = activePlan?.macros_json || {
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fats_g: 0,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GymBackground />
      {/* Barra Superior */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.screenSubtitle}>{t('nutrition.screen_subtitle', 'BALANCE ENERGÉTICO & ALIMENTACIÓN')}</Text>
          <Text style={styles.screenTitle}>{t('nutrition.screen_title', 'Nutrición Diaria')}</Text>
        </View>
        <TouchableOpacity
          style={styles.refreshIconBtn}
          onPress={handleRefresh}
          disabled={refreshing}
          activeOpacity={0.7}
        >
          <RefreshCw size={18} color="#10b981" />
        </TouchableOpacity>
      </View>

      {/* Selector de Pestaña: Mi Balance vs Plan del Coach */}
      <View style={styles.segmentedContainer}>
        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'balance' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('balance')}
          activeOpacity={0.8}
        >
          <Scale size={14} color={activeTab === 'balance' ? '#10b981' : '#64748b'} />
          <Text style={[styles.segmentText, activeTab === 'balance' && styles.segmentTextActive]}>
            {t('nutrition.tab_balance', 'Mi Balance')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'suggested' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('suggested')}
          activeOpacity={0.8}
        >
          <Sparkles size={14} color={activeTab === 'suggested' ? '#10b981' : '#64748b'} />
          <Text style={[styles.segmentText, activeTab === 'suggested' && styles.segmentTextActive]}>
            {t('nutrition.tab_suggested', 'Plan Sugerido')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.segmentBtn, activeTab === 'coach' && styles.segmentBtnActive]}
          onPress={() => setActiveTab('coach')}
          activeOpacity={0.8}
        >
          <Award size={14} color={activeTab === 'coach' ? '#10b981' : '#64748b'} />
          <Text style={[styles.segmentText, activeTab === 'coach' && styles.segmentTextActive]}>
            {t('nutrition.tab_coach_short', 'Coach')}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ======================================================== */}
        {/* PESTAÑA 1: BALANCE ENERGÉTICO & COMIDAS DIARIAS */}
        {/* ======================================================== */}
        {activeTab === 'balance' && (
          <View style={styles.tabContent}>
            {/* Banner Acceso Directo a Plan Sugerido */}
            <TouchableOpacity
              style={styles.suggestedBanner}
              onPress={() => {
                if (!suggestedPlan) {
                  setShowPlanWizard(true);
                } else {
                  setActiveTab('suggested');
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.suggestedBannerLeft}>
                <View style={styles.suggestedBannerIconBox}>
                  <Sparkles size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.suggestedBannerTitle}>
                    {suggestedPlan
                      ? (language === 'en' ? 'Suggested Plan is Active' : 'Tu Plan Sugerido está Activo')
                      : (language === 'en' ? '✨ Design Custom Meal Plan' : '✨ Diseña tu Plan Sugerido')}
                  </Text>
                  <Text style={styles.suggestedBannerSub}>
                    {suggestedPlan
                      ? `${suggestedPlan.totalCalories} kcal • ${suggestedPlan.meals.length} ${language === 'en' ? 'meals' : 'comidas'} • ${language === 'en' ? 'Tap to view or edit' : 'Toca para ver o modificar'}`
                      : (language === 'en'
                          ? 'Select favorite foods, goals and meals/day in 1 min.'
                          : 'Elige alimentos favoritos, objetivos y comidas en 1 min.')}
                  </Text>
                </View>
              </View>
              <ArrowUpRight size={18} color="#10b981" />
            </TouchableOpacity>

            {/* Widget Balance Energético */}
            <View style={styles.balanceCard}>
              <View style={styles.balanceHeader}>
                <Text style={styles.balanceHeaderTitle}>{t('nutrition.balance_title', 'BALANCE ENERGÉTICO DE HOY')}</Text>
                <View style={styles.dateBadge}>
                  <Text style={styles.dateBadgeText}>{todayLog.date}</Text>
                </View>
              </View>

              <View style={styles.calorieRow}>
                <View style={styles.calorieBox}>
                  <Text style={styles.calorieBoxLabel}>{t('nutrition.total_expenditure', 'GASTO TOTAL')}</Text>
                  <View style={styles.calorieBoxValueRow}>
                    <Flame size={18} color="#f97316" />
                    <Text style={styles.calorieBurnValue}>
                      {expenditure?.totalExpenditure || 0}
                    </Text>
                    <Text style={styles.calorieUnit}>kcal</Text>
                  </View>
                  <Text style={styles.calorieBoxSub}>{t('nutrition.exp_sub', 'TDEE + Entreno + Cardio')}</Text>
                </View>

                <View style={styles.calorieDivider} />

                <View style={styles.calorieBox}>
                  <Text style={styles.calorieBoxLabel}>{t('nutrition.consumed', 'CONSUMO')}</Text>
                  <View style={styles.calorieBoxValueRow}>
                    <Utensils size={18} color="#38bdf8" />
                    <Text style={styles.calorieEatValue}>
                      {todayLog.totals.calories}
                    </Text>
                    <Text style={styles.calorieUnit}>kcal</Text>
                  </View>
                  <Text style={styles.calorieBoxSub}>{t('nutrition.consumed_sub', 'Comidas registradas')}</Text>
                </View>
              </View>

              {caloricBalance && (
                <View
                  style={[
                    styles.balanceBanner,
                    caloricBalance.isDeficit ? styles.bannerDeficit : styles.bannerSurplus,
                  ]}
                >
                  <View style={styles.bannerIconRow}>
                    {caloricBalance.isDeficit ? (
                      <ArrowDownRight size={20} color="#10b981" />
                    ) : (
                      <ArrowUpRight size={20} color="#f59e0b" />
                    )}
                    <Text
                      style={[
                        styles.bannerTitle,
                        { color: caloricBalance.isDeficit ? '#34d399' : '#fbbf24' },
                      ]}
                    >
                      {caloricBalance.isDeficit
                        ? t('nutrition.deficit_badge', '¡TE ESTÁS AHORRANDO {kcal} KCAL HOY!').replace('{kcal}', String(caloricBalance.savingsOrSurplusKcal))
                        : t('nutrition.surplus_badge', 'CONSUMISTE {kcal} KCAL DE MÁS HOY').replace('{kcal}', String(caloricBalance.savingsOrSurplusKcal))}
                    </Text>
                  </View>
                  <Text style={styles.bannerDescription}>
                    {caloricBalance.isDeficit
                      ? t('nutrition.deficit_desc', 'Estás en déficit calórico. Tu organismo está quemando reservas de grasa corporal para suplir la energía restante.')
                      : t('nutrition.surplus_desc', 'Estás en superávit energético por encima de tu gasto diario, idóneo para ganancia de volumen o recuperación muscular.')}
                  </Text>
                </View>
              )}

              <View style={styles.breakdownRow}>
                <View style={styles.miniPill}>
                  <Text style={styles.miniPillLabel}>{t('nutrition.tdee_base', 'TDEE Basal')}:</Text>
                  <Text style={styles.miniPillValue}>{expenditure?.tdee || 0} kcal</Text>
                </View>
                <View style={styles.miniPill}>
                  <Text style={styles.miniPillLabel}>{t('nutrition.strength_routine', 'Rutina Fuerza')}:</Text>
                  <Text style={[styles.miniPillValue, { color: '#a855f7' }]}>
                    +{exerciseBurn.strengthKcal} kcal
                  </Text>
                </View>
                <View style={styles.miniPill}>
                  <Text style={styles.miniPillLabel}>{t('nutrition.cardio', 'Cardio')}:</Text>
                  <Text style={[styles.miniPillValue, { color: '#06b6d4' }]}>
                    +{exerciseBurn.cardioKcal} kcal
                  </Text>
                </View>
              </View>

              {/* Botón Ver Reportes Calóricos Acumulados */}
              <TouchableOpacity
                style={styles.openReportBtn}
                onPress={() => setIsReportModalOpen(true)}
                activeOpacity={0.8}
              >
                <BarChart3 size={15} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.openReportBtnText}>
                  {t('report.open_button', '📊 Ver Reportes de Balance (1D - 1 Mes)')}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Macros Consumidos */}
            <View style={styles.cardSection}>
              <View style={styles.sectionHeader}>
                <PieChart size={18} color="#10b981" />
                <Text style={styles.sectionHeaderTitle}>{t('nutrition.macros_title', 'MACRONUTRIENTES CONSUMIDOS')}</Text>
              </View>

              <View style={styles.macroPillsRow}>
                <View style={[styles.macroPill, { borderColor: 'rgba(56, 189, 248, 0.3)' }]}>
                  <Text style={[styles.macroPillLabel, { color: '#38bdf8' }]}>{t('nutrition.protein', 'PROTEÍNA')}</Text>
                  <Text style={styles.macroPillValue}>{todayLog.totals.protein_g}g</Text>
                  <Text style={styles.macroPillTarget}>Meta ~{targetProteinG}g</Text>
                </View>

                <View style={[styles.macroPill, { borderColor: 'rgba(52, 211, 153, 0.3)' }]}>
                  <Text style={[styles.macroPillLabel, { color: '#34d399' }]}>{t('nutrition.carbs', 'CARBOS')}</Text>
                  <Text style={styles.macroPillValue}>{todayLog.totals.carbs_g}g</Text>
                  <Text style={styles.macroPillTarget}>{Math.round(todayLog.totals.carbs_g * 4)} kcal</Text>
                </View>

                <View style={[styles.macroPill, { borderColor: 'rgba(251, 113, 133, 0.3)' }]}>
                  <Text style={[styles.macroPillLabel, { color: '#fb7185' }]}>{t('nutrition.fats', 'GRASAS')}</Text>
                  <Text style={styles.macroPillValue}>{todayLog.totals.fats_g}g</Text>
                  <Text style={styles.macroPillTarget}>{Math.round(todayLog.totals.fats_g * 9)} kcal</Text>
                </View>
              </View>
            </View>

            {/* Hidratación Diaria */}
            <View style={styles.cardSection}>
              <View style={styles.waterHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Droplets size={18} color="#38bdf8" />
                  <Text style={styles.waterTitle}>{t('nutrition.hydration_title', 'HIDRATACIÓN DIARIA')}</Text>
                </View>
                <Text style={styles.waterValue}>
                  {todayLog.waterMl} / {targetWaterMl} ml
                </Text>
              </View>

              <View style={styles.progressBarContainer}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: '#38bdf8',
                      width: `${Math.min(
                        100,
                        targetWaterMl > 0 ? (todayLog.waterMl / targetWaterMl) * 100 : 0
                      )}%`,
                    },
                  ]}
                />
              </View>

              <View style={styles.waterActionsRow}>
                <TouchableOpacity
                  style={styles.waterDeltaBtn}
                  onPress={() => handleWaterDelta(-250)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.waterDeltaBtnText}>-250 ml</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.waterDeltaBtn, styles.waterAddBtn]}
                  onPress={() => handleWaterDelta(250)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#38bdf8" />
                  <Text style={[styles.waterDeltaBtnText, { color: '#38bdf8', fontWeight: '800' }]}>
                    {t('nutrition.glass_250', '+250 ml (1 Vaso)')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.waterDeltaBtn, styles.waterAddBtn]}
                  onPress={() => handleWaterDelta(500)}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#38bdf8" />
                  <Text style={[styles.waterDeltaBtnText, { color: '#38bdf8', fontWeight: '800' }]}>
                    {t('nutrition.bottle_500', '+500 ml (Botella)')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Registro de Comidas */}
            <View style={styles.mealsHeader}>
              <Text style={styles.mealsHeaderTitle}>{t('nutrition.meals_section_title', 'REGISTRO DE COMIDAS')}</Text>
              <Text style={styles.mealsHeaderSubtitle}>
                {t('nutrition.meals_section_sub', 'Toca "+ Añadir" para buscar alimentos o cargar recientes')}
              </Text>
            </View>

            {MEAL_TYPES.map((meal) => {
              const mealEntries = todayLog.entries.filter((e) => e.meal === meal.id);
              const mealKcal = mealEntries.reduce((acc, curr) => acc + (curr.calories || 0), 0);
              const mealLabel = getMealLabel(meal.id);
              const mealSub = getMealSubtitle(meal.id);

              return (
                <View key={meal.id} style={styles.mealCard}>
                  <View style={styles.mealCardHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                      <View>
                        <Text style={styles.mealLabel}>{mealLabel}</Text>
                        <Text style={styles.mealSubtitle}>{mealSub}</Text>
                      </View>
                    </View>
                    <View style={styles.mealKcalBadge}>
                      <Flame size={13} color="#fbbf24" />
                      <Text style={styles.mealKcalText}>{mealKcal} kcal</Text>
                    </View>
                  </View>

                  {mealEntries.length === 0 ? (
                    <Text style={styles.mealEmptyText}>
                      {t('nutrition.empty_meal', 'No has registrado alimentos en {meal}.').replace('{meal}', mealLabel.toLowerCase())}
                    </Text>
                  ) : (
                    <View style={styles.entriesList}>
                      {mealEntries.map((item) => (
                        <View key={item.id} style={styles.entryRow}>
                          <View style={{ flex: 1 }}>
                            {(() => {
                            const foundFood = allFoodsList.find((f) => f.id === item.foodId);
                            const displayName = language === 'en'
                              ? (foundFood?.name_en || (item as any).foodName_en || item.foodName)
                              : (foundFood?.name_es || (item as any).foodName_es || item.foodName);
                            return <Text style={styles.entryName}>{displayName}</Text>;
                          })()}
                            {(() => {
                              const unitLabel = item.unit === 'rebanada'
                                ? (language === 'en' ? (item.quantity === 1 ? 'slice' : 'slices') : (item.quantity === 1 ? 'rebanada' : 'rebanadas'))
                                : item.unit === 'unidad'
                                ? (language === 'en' ? (item.quantity === 1 ? 'unit' : 'units') : (item.quantity === 1 ? 'unidad' : 'unidades'))
                                : 'g';
                              return (
                                <Text style={styles.entryDetails}>
                                  {item.quantity} {unitLabel} • {item.calories} kcal • {item.protein_g}g P
                                </Text>
                              );
                            })()}
                          </View>
                          <TouchableOpacity
                            style={styles.entryDeleteBtn}
                            onPress={() => handleDeleteFood(item.id)}
                            activeOpacity={0.6}
                          >
                            <Trash2 size={16} color="#ef4444" />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.mealActionsRow}>
                    <TouchableOpacity
                      style={styles.addFoodBtn}
                      onPress={() => handleOpenAddFood(meal.id)}
                      activeOpacity={0.7}
                    >
                      <Plus size={15} color="#10b981" />
                      <Text style={styles.addFoodBtnText}>
                        {t('nutrition.add_to', 'Añadir a {meal}').replace('{meal}', mealLabel)}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.addRecipeBtn}
                      onPress={() => {
                        setRecipeModalMeal(meal.id);
                        setRecipeInitialEntries([]);
                        setShowRecipeModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <ChefHat size={15} color="#38bdf8" />
                      <Text style={styles.addRecipeBtnText}>
                        {t('nutrition.create_recipe_btn', '🥞 + Receta')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {mealEntries.length >= 2 && (
                    <TouchableOpacity
                      style={styles.saveMealAsRecipeBtn}
                      onPress={() => {
                        setRecipeModalMeal(meal.id);
                        setRecipeInitialEntries(mealEntries);
                        setShowRecipeModal(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <Sparkles size={13} color="#fbbf24" />
                      <Text style={styles.saveMealAsRecipeBtnText}>
                        {t('nutrition.save_as_recipe', '⭐ Guardar esta comida como Receta')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })}
          </View>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 2: PLAN ALIMENTICIO SUGERIDO POR LA APP */}
        {/* ======================================================== */}
        {activeTab === 'suggested' && (
          <View style={styles.tabContent}>
            <SuggestedPlanView
              plan={suggestedPlan}
              onOpenWizard={() => setShowPlanWizard(true)}
              onPlanUpdated={(updated) => setSuggestedPlan(updated)}
              onLogMealToToday={handleLogMealToToday}
              onLogAllMealsToToday={handleLogAllMealsToToday}
              allFoods={allFoodsList}
            />
          </View>
        )}

        {/* ======================================================== */}
        {/* PESTAÑA 3: PLAN DEL COACH Y DOCUMENTO PDF */}
        {/* ======================================================== */}
        {activeTab === 'coach' && (
          <View style={styles.tabContent}>
            {!activePlan ? (
              <View style={styles.emptyCard}>
                <Apple size={48} color="#475569" />
                <Text style={styles.emptyTitle}>{t('coach.no_plan_title', 'Sin plan de nutrición asignado')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('coach.no_plan_sub', 'Tu Coach aún no ha prescrito un plan alimenticio o pauta en PDF.')}
                </Text>
                <TouchableOpacity
                  style={styles.refreshBtn}
                  onPress={loadAllData}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={16} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.refreshBtnText}>{t('coach.check_btn', 'Comprobar')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.planContainer}>
                <View style={styles.planHeaderCard}>
                  <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>{t('coach.active_badge', 'PLAN ACTIVO')}</Text>
                  </View>
                  <Text style={styles.planTitle}>{activePlan.title}</Text>
                  <Text style={styles.planDate}>
                    {t('coach.assigned_on', 'Asignado el')} {new Date(activePlan.created_at).toLocaleDateString()}
                  </Text>
                </View>

                <View style={styles.macrosSection}>
                  <Text style={styles.sectionTitle}>{t('coach.goals_title', 'Metas Diarias Prescritas por el Coach')}</Text>

                  <View style={styles.macrosGrid}>
                    <View style={[styles.macroCard, styles.cardKcal]}>
                      <Flame size={20} color="#fbbf24" />
                      <Text style={styles.macroValue}>{coachMacros.calories}</Text>
                      <Text style={styles.macroLabel}>KCAL / DÍA</Text>
                    </View>
                    <View style={[styles.macroCard, styles.cardProt]}>
                      <Text style={[styles.macroValue, { color: '#38bdf8' }]}>
                        {coachMacros.protein_g}g
                      </Text>
                      <Text style={styles.macroLabel}>{t('nutrition.protein', 'PROTEÍNA')}</Text>
                    </View>
                    <View style={[styles.macroCard, styles.cardCarbs]}>
                      <Text style={[styles.macroValue, { color: '#34d399' }]}>
                        {coachMacros.carbs_g}g
                      </Text>
                      <Text style={styles.macroLabel}>{t('nutrition.carbs', 'CARBOS')}</Text>
                    </View>
                    <View style={[styles.macroCard, styles.cardFats]}>
                      <Text style={[styles.macroValue, { color: '#fb7185' }]}>
                        {coachMacros.fats_g}g
                      </Text>
                      <Text style={styles.macroLabel}>{t('nutrition.fats', 'GRASAS')}</Text>
                    </View>
                  </View>
                </View>

                {activePlan.pdf_url && <PdfPlanViewer pdfPath={activePlan.pdf_url} />}

                {activePlan.notes && (
                  <View style={styles.notesCard}>
                    <Text style={styles.notesTitle}>{t('coach.notes_title', 'Indicaciones del Coach')}</Text>
                    <Text style={styles.notesBody}>{activePlan.notes}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* ======================================================== */}
      {/* MODAL: BUSCAR Y AÑADIR ALIMENTO */}
      {/* ======================================================== */}
      <Modal
        visible={searchModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSearchModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={styles.modalContainer}>
              {/* Cabecera del Modal */}
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>{t('nutrition.modal_select_food', 'SELECCIONAR ALIMENTO')}</Text>
                  <Text style={styles.modalTitle}>
                    {t('nutrition.add_to', 'Añadir a {meal}').replace('{meal}', getMealLabel(selectedMealForAdd))}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setSearchModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Barra de Búsqueda */}
              <View style={styles.searchBar}>
                <Search size={18} color="#64748b" style={{ marginRight: 8 }} />
                <TextInput
                  style={styles.searchInput}
                  placeholder={t('nutrition.search_placeholder', 'Buscar banana, avena, pollo, lentejas...')}
                  placeholderTextColor="#64748b"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <X size={16} color="#94a3b8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Chips de Categorías */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.filterScrollView}
                contentContainerStyle={styles.filterChipsContainer}
              >
                {categoryChips.map((chip) => (
                  <TouchableOpacity
                    key={chip.id}
                    style={[
                      styles.filterChip,
                      selectedCategoryFilter === chip.id && styles.filterChipActive,
                    ]}
                    onPress={() => setSelectedCategoryFilter(chip.id)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        selectedCategoryFilter === chip.id && styles.filterChipTextActive,
                      ]}
                    >
                      {chip.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Estante de Alimentos Usados Recientemente (Últimos 5) */}
              {!searchQuery.trim() && (selectedCategoryFilter === 'all' || selectedCategoryFilter === 'recent') && recentFoodsList.length > 0 && (
                <View style={styles.recentShelfContainer}>
                  <View style={styles.recentShelfHeader}>
                    <Clock size={13} color="#10b981" />
                    <Text style={styles.recentShelfTitle}>
                      {t('nutrition.recent_shelf_title', '🕒 USADOS RECIENTEMENTE (Últimos 20)')}
                    </Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentShelfChips}>
                    {recentFoodsList.map((rf) => {
                      const displayName = language === 'en' && rf.name_en ? rf.name_en : (rf.name_es || rf.name);
                      const isSelected = selectedFood?.id === rf.id;
                      return (
                        <TouchableOpacity
                          key={rf.id}
                          style={[
                            styles.recentFoodChip,
                            isSelected && styles.recentFoodChipSelected,
                          ]}
                          onPress={() => handleSelectFood(rf)}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.recentFoodChipText,
                              isSelected && styles.recentFoodChipTextSelected,
                            ]}
                            numberOfLines={1}
                          >
                            {displayName}
                          </Text>
                          <Text style={styles.recentFoodChipKcal}>{rf.calories} kcal</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Botón para crear personalizado */}
              <TouchableOpacity
                style={styles.createCustomBtn}
                onPress={() => setCustomModalVisible(true)}
                activeOpacity={0.8}
              >
                <Sparkles size={16} color="#10b981" style={{ marginRight: 6 }} />
                <Text style={styles.createCustomBtnText}>
                  {t('nutrition.create_custom_btn', '¿No encuentras tu alimento? + Crear personalizado')}
                </Text>
              </TouchableOpacity>

              {/* Botón para crear receta / plato compuesto */}
              <TouchableOpacity
                style={[styles.createCustomBtn, { marginTop: 6, borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.08)' }]}
                onPress={() => {
                  setSearchModalVisible(false);
                  setRecipeModalMeal(selectedMealForAdd);
                  setRecipeInitialEntries([]);
                  setShowRecipeModal(true);
                }}
                activeOpacity={0.8}
              >
                <ChefHat size={16} color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={[styles.createCustomBtnText, { color: '#38bdf8' }]}>
                  {language === 'en' ? '🥞 + Create Custom Recipe / Meal' : '🥞 + Crear Receta / Plato Compuesto'}
                </Text>
              </TouchableOpacity>

              {/* Lista de Alimentos Filtrados */}
              <ScrollView style={styles.foodsScrollList} showsVerticalScrollIndicator={false}>
                {filteredFoods.length === 0 ? (
                  <View style={styles.noFoodsContainer}>
                    <Apple size={36} color="#475569" />
                    <Text style={styles.noFoodsText}>
                      {t('nutrition.no_foods_found', 'No se encontraron alimentos con ese término.')}
                    </Text>
                  </View>
                ) : (
                  filteredFoods.map((item) => {
                    const isSelected = selectedFood?.id === item.id;
                    const displayName = language === 'en' && item.name_en ? item.name_en : (item.name_es || item.name);
                    const displayServing = language === 'en' && item.servingLabel_en ? item.servingLabel_en : (item.servingLabel_es || item.servingLabel);

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.foodItemRow, isSelected && styles.foodItemRowSelected]}
                        onPress={() => handleSelectFood(item)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.foodItemName, isSelected && { color: '#34d399' }]}>
                            {displayName}
                          </Text>
                          <Text style={styles.foodItemServing}>
                            {displayServing} • {item.calories} kcal • {item.protein_g}g P • {item.carbs_g}g C • {item.fats_g}g G
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.checkCircle}>
                            <Check size={14} color="#020617" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>

              {/* Panel Inferior: Selector de Porción y Confirmación */}
              {selectedFood && (
                <View style={styles.portionPanel}>
                  <View style={styles.portionPanelHeader}>
                    <Text style={styles.portionFoodName} numberOfLines={1}>
                      {language === 'en' && selectedFood.name_en ? selectedFood.name_en : (selectedFood.name_es || selectedFood.name)}
                    </Text>
                    <View style={styles.unitToggleContainer}>
                      <TouchableOpacity
                        style={[
                          styles.unitToggleBtn,
                          selectedServingUnit === 'gramos' && styles.unitToggleBtnActive,
                        ]}
                        onPress={() => {
                          setSelectedServingUnit('gramos');
                          setPortionQuantity('100');
                        }}
                      >
                        <Text
                          style={[
                            styles.unitToggleText,
                            selectedServingUnit === 'gramos' && styles.unitToggleTextActive,
                          ]}
                        >
                          {t('nutrition.unit_grams', 'Gramos (g)')}
                        </Text>
                      </TouchableOpacity>

                      {isSliceableFood(selectedFood) ? (
                        <TouchableOpacity
                          style={[
                            styles.unitToggleBtn,
                            selectedServingUnit === 'rebanada' && styles.unitToggleBtnActive,
                          ]}
                          onPress={() => {
                            setSelectedServingUnit('rebanada');
                            setPortionQuantity('1');
                          }}
                        >
                          <Text
                            style={[
                              styles.unitToggleText,
                              selectedServingUnit === 'rebanada' && styles.unitToggleTextActive,
                            ]}
                          >
                            {language === 'en' ? 'Slices (sl)' : 'Rebanadas (reb)'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.unitToggleBtn,
                            selectedServingUnit === 'unidad' && styles.unitToggleBtnActive,
                          ]}
                          onPress={() => {
                            setSelectedServingUnit('unidad');
                            setPortionQuantity('1');
                          }}
                        >
                          <Text
                            style={[
                              styles.unitToggleText,
                              selectedServingUnit === 'unidad' && styles.unitToggleTextActive,
                            ]}
                          >
                            {t('nutrition.unit_units', 'Unidades (u)')}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.stepperContainer}>
                    <Text style={styles.quantityLabel}>{t('nutrition.quantity_label', 'CANTIDAD:')}</Text>
                    <View style={styles.stepperRow}>
                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleStepQuantity(selectedServingUnit === 'gramos' ? -10 : -1)}
                        activeOpacity={0.7}
                      >
                        <Minus size={18} color="#ffffff" />
                      </TouchableOpacity>

                      <View style={styles.inputWithSuffix}>
                        <TextInput
                          style={styles.quantityInput}
                          keyboardType="numeric"
                          value={portionQuantity}
                          onChangeText={setPortionQuantity}
                          selectTextOnFocus
                        />
                        <Text style={styles.quantityUnitSuffix}>
                          {selectedServingUnit === 'gramos'
                            ? 'g'
                            : selectedServingUnit === 'rebanada'
                            ? (language === 'en' ? 'sl' : 'reb')
                            : 'u'}
                        </Text>
                      </View>

                      <TouchableOpacity
                        style={styles.stepperBtn}
                        onPress={() => handleStepQuantity(selectedServingUnit === 'gramos' ? 10 : 1)}
                        activeOpacity={0.7}
                      >
                        <Plus size={18} color="#ffffff" />
                      </TouchableOpacity>
                    </View>

                    {/* Botones de ajuste rápido (Delta Pills) */}
                    <View style={styles.deltaPillsRow}>
                      {selectedServingUnit === 'gramos' ? (
                        <>
                          <TouchableOpacity style={styles.deltaPill} onPress={() => handleStepQuantity(-50)}>
                            <Text style={styles.deltaPillText}>-50g</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deltaPill} onPress={() => handleStepQuantity(-10)}>
                            <Text style={styles.deltaPillText}>-10g</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(10)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+10g</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(50)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+50g</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(100)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+100g</Text>
                          </TouchableOpacity>
                        </>
                      ) : selectedServingUnit === 'rebanada' ? (
                        <>
                          <TouchableOpacity style={styles.deltaPill} onPress={() => handleStepQuantity(-2)}>
                            <Text style={styles.deltaPillText}>-2 reb</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={styles.deltaPill} onPress={() => handleStepQuantity(-1)}>
                            <Text style={styles.deltaPillText}>-1 reb</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(1)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+1 reb</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(2)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+2 reb</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(3)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+3 reb</Text>
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity style={styles.deltaPill} onPress={() => handleStepQuantity(-1)}>
                            <Text style={styles.deltaPillText}>-1 u</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(1)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+1 u</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.deltaPill, styles.deltaPillAdd]} onPress={() => handleStepQuantity(2)}>
                            <Text style={[styles.deltaPillText, styles.deltaPillTextAdd]}>+2 u</Text>
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>

                  <View style={styles.livePreviewRow}>
                    <Text style={styles.livePreviewKcal}>{livePreviewMacros.calories} kcal</Text>
                    <Text style={styles.livePreviewDetail}>
                      {livePreviewMacros.protein_g}g P • {livePreviewMacros.carbs_g}g C • {livePreviewMacros.fats_g}g G
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.confirmAddBtn}
                    onPress={handleConfirmAddFood}
                    activeOpacity={0.8}
                  >
                    <Check size={18} color="#020617" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmAddBtnText}>
                      {t('nutrition.confirm_add', 'Confirmar y Añadir')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* ======================================================== */}
      {/* MODAL: CREAR ALIMENTO PERSONALIZADO */}
      {/* ======================================================== */}
      <Modal
        visible={customModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalSafeArea}>
            <View style={[styles.modalContainer, { maxHeight: '90%' }]}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalSubtitle}>{t('nutrition.custom_subtitle', 'NUEVO ALIMENTO')}</Text>
                  <Text style={styles.modalTitle}>{t('nutrition.custom_title', 'Crear Alimento Personalizado')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.modalCloseBtn}
                  onPress={() => setCustomModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <X size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ padding: 16 }} showsVerticalScrollIndicator={false}>
                <Text style={styles.inputLabel}>{t('nutrition.custom_food_name', 'Nombre del alimento:')}</Text>
                <TextInput
                  style={styles.customTextInput}
                  placeholder="Ej. Batido de Avena y Frutillas"
                  placeholderTextColor="#64748b"
                  value={customName}
                  onChangeText={setCustomName}
                />

                <Text style={styles.inputLabel}>{t('nutrition.custom_measure_unit', 'Unidad de medida:')}</Text>
                <View style={styles.customUnitRow}>
                  <TouchableOpacity
                    style={[
                      styles.customUnitOption,
                      customUnit === 'gramos' && styles.customUnitOptionActive,
                    ]}
                    onPress={() => {
                      setCustomUnit('gramos');
                      setCustomServingSize('100');
                    }}
                  >
                    <Text
                      style={[
                        styles.customUnitText,
                        customUnit === 'gramos' && styles.customUnitTextActive,
                      ]}
                    >
                      {t('nutrition.custom_per_100g', '100 gramos')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.customUnitOption,
                      customUnit === 'rebanada' && styles.customUnitOptionActive,
                    ]}
                    onPress={() => {
                      setCustomUnit('rebanada');
                      setCustomServingSize('1');
                    }}
                  >
                    <Text
                      style={[
                        styles.customUnitText,
                        customUnit === 'rebanada' && styles.customUnitTextActive,
                      ]}
                    >
                      {language === 'en' ? '1 slice' : '1 rebanada'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.customUnitOption,
                      customUnit === 'unidad' && styles.customUnitOptionActive,
                    ]}
                    onPress={() => {
                      setCustomUnit('unidad');
                      setCustomServingSize('1');
                    }}
                  >
                    <Text
                      style={[
                        styles.customUnitText,
                        customUnit === 'unidad' && styles.customUnitTextActive,
                      ]}
                    >
                      {t('nutrition.custom_per_unit', '1 unidad')}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.macroFormGrid}>
                  <View style={styles.macroFormField}>
                    <Text style={styles.inputLabel}>{t('nutrition.custom_calories', 'Calorías (kcal):')}</Text>
                    <TextInput
                      style={styles.customTextInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      value={customKcal}
                      onChangeText={setCustomKcal}
                    />
                  </View>
                  <View style={styles.macroFormField}>
                    <Text style={styles.inputLabel}>{t('nutrition.protein', 'Proteína')} (g):</Text>
                    <TextInput
                      style={styles.customTextInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      value={customProt}
                      onChangeText={setCustomProt}
                    />
                  </View>
                </View>

                <View style={styles.macroFormGrid}>
                  <View style={styles.macroFormField}>
                    <Text style={styles.inputLabel}>{t('nutrition.carbs', 'Carbohidratos')} (g):</Text>
                    <TextInput
                      style={styles.customTextInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      value={customCarbs}
                      onChangeText={setCustomCarbs}
                    />
                  </View>
                  <View style={styles.macroFormField}>
                    <Text style={styles.inputLabel}>{t('nutrition.fats', 'Grasas')} (g):</Text>
                    <TextInput
                      style={styles.customTextInput}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#64748b"
                      value={customFats}
                      onChangeText={setCustomFats}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.saveCustomBtn}
                  onPress={handleSaveCustomFood}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#020617" style={{ marginRight: 6 }} />
                  <Text style={styles.saveCustomBtnText}>{t('nutrition.custom_save_btn', 'Guardar Alimento')}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal Creador de Recetas y Platos Compuestos */}
      <RecipeCreatorModal
        visible={showRecipeModal}
        onClose={() => setShowRecipeModal(false)}
        onRecipeSaved={handleRecipeSaved}
        defaultMeal={recipeModalMeal}
        initialEntries={recipeInitialEntries}
      />

      {/* Modal Asistente de Plan Nutricional Sugerido */}
      <SuggestedPlanWizardModal
        visible={showPlanWizard}
        onClose={() => setShowPlanWizard(false)}
        onPlanGenerated={handlePlanGenerated}
        allFoods={allFoodsList}
        biometrics={biometrics}
      />

      <CaloricBalanceReportModal
        visible={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        userId={user?.id || 'guest'}
        biometrics={biometrics}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020503',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020503',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(2, 6, 4, 0.94)',
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#00ff87',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  refreshIconBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  segmentedContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    backgroundColor: '#051209',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  segmentBtnActive: {
    backgroundColor: '#0b2014',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  tabContent: {
    gap: 16,
  },

  // Tarjeta de Balance Energético
  balanceCard: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    gap: 14,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  balanceHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#94a3b8',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  calorieBox: {
    flex: 1,
    alignItems: 'center',
  },
  calorieBoxLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#94a3b8',
    marginBottom: 4,
  },
  calorieBoxValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  calorieBurnValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#f97316',
  },
  calorieEatValue: {
    fontSize: 22,
    fontWeight: '900',
    color: '#38bdf8',
  },
  calorieUnit: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  calorieBoxSub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 3,
  },
  calorieDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#1e293b',
  },

  // Banner Déficit / Superávit
  balanceBanner: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    gap: 6,
  },
  bannerDeficit: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  bannerSurplus: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  bannerIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  bannerDescription: {
    fontSize: 10,
    fontWeight: '500',
    color: '#94a3b8',
    lineHeight: 14,
  },

  // Desglose inferior
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  miniPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  miniPillLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748b',
  },
  miniPillValue: {
    fontSize: 10,
    fontWeight: '900',
    color: '#e2e8f0',
    marginTop: 2,
  },
  openReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 4,
  },
  openReportBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Sección genérica de tarjeta
  cardSection: {
    backgroundColor: '#051209',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#e2e8f0',
  },
  macroPillsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  macroPill: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    alignItems: 'center',
  },
  macroPillLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  macroPillValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  macroPillTarget: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },

  // Hidratación
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waterTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#e2e8f0',
  },
  waterValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#020617',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  waterActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  waterDeltaBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  waterAddBtn: {
    flexDirection: 'row',
    gap: 4,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
  },
  waterDeltaBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },

  // Comidas
  mealsHeader: {
    marginTop: 4,
  },
  mealsHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
    color: '#94a3b8',
  },
  mealsHeaderSubtitle: {
    fontSize: 10,
    fontWeight: '500',
    color: '#64748b',
    marginTop: 2,
  },
  mealCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    gap: 12,
  },
  mealCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealEmoji: {
    fontSize: 22,
  },
  mealLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  mealSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    color: '#64748b',
  },
  mealKcalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(251, 191, 36, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  mealKcalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  mealEmptyText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
    paddingVertical: 4,
  },
  entriesList: {
    gap: 8,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  entryName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  entryDetails: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  entryDeleteBtn: {
    padding: 6,
  },
  addFoodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  addFoodBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  mealActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  addRecipeBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
  },
  saveMealAsRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.25)',
  },
  saveMealAsRecipeBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },
  stepperContainer: {
    gap: 10,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  stepperBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 6,
  },
  deltaPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  deltaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  deltaPillAdd: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  deltaPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  deltaPillTextAdd: {
    color: '#34d399',
  },

  // Plan del Coach
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 32,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  refreshBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  planContainer: {
    gap: 16,
  },
  planHeaderCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 6,
  },
  activeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  activeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  planDate: {
    fontSize: 10,
    color: '#64748b',
  },
  macrosSection: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
    color: '#e2e8f0',
  },
  macrosGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  macroCard: {
    flex: 1,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  cardKcal: {
    borderColor: 'rgba(251, 191, 36, 0.3)',
  },
  cardProt: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  cardCarbs: {
    borderColor: 'rgba(52, 211, 153, 0.3)',
  },
  cardFats: {
    borderColor: 'rgba(251, 113, 133, 0.3)',
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  macroLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#64748b',
    marginTop: 2,
  },
  notesCard: {
    backgroundColor: '#0f172a',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 6,
  },
  notesTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#e2e8f0',
  },
  notesBody: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },

  // Modal selector de alimentos
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalSafeArea: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    maxHeight: '88%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalSubtitle: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    color: '#10b981',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  filterScrollView: {
    marginTop: 10,
    maxHeight: 40,
  },
  filterChipsContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterChipTextActive: {
    color: '#34d399',
    fontWeight: '800',
  },

  // Estante de Recientes (Últimos 5)
  recentShelfContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
  },
  recentShelfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  recentShelfTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  recentShelfChips: {
    gap: 8,
  },
  recentFoodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  recentFoodChipSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  recentFoodChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
    maxWidth: 140,
  },
  recentFoodChipTextSelected: {
    color: '#34d399',
    fontWeight: '800',
  },
  recentFoodChipKcal: {
    fontSize: 10,
    fontWeight: '800',
    color: '#fbbf24',
  },

  createCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  createCustomBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  foodsScrollList: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  noFoodsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  noFoodsText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#0f172a',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  foodItemRowSelected: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  foodItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  foodItemServing: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 3,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },

  // Portion Selector Panel
  portionPanel: {
    backgroundColor: '#020617',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    padding: 16,
    gap: 10,
  },
  portionPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  portionFoodName: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    flex: 1,
    marginRight: 8,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  unitToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  unitToggleBtnActive: {
    backgroundColor: '#10b981',
  },
  unitToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
  },
  unitToggleTextActive: {
    color: '#020617',
    fontWeight: '900',
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  quantityLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
  },
  quantityInput: {
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '900',
    paddingHorizontal: 12,
    paddingVertical: 6,
    minWidth: 80,
    textAlign: 'center',
  },
  quantityUnitSuffix: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  livePreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  livePreviewKcal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#fbbf24',
  },
  livePreviewDetail: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  confirmAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
  },
  confirmAddBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#020617',
  },

  // Modal Custom Alimento Form
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 6,
  },
  customTextInput: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#ffffff',
    fontSize: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
  },
  customUnitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  customUnitOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  customUnitOptionActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  customUnitText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  customUnitTextActive: {
    color: '#34d399',
    fontWeight: '800',
  },
  macroFormGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroFormField: {
    flex: 1,
  },
  saveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 10,
    marginBottom: 24,
  },
  saveCustomBtnText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#020617',
  },
  suggestedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#064e3b18',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
  },
  suggestedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  suggestedBannerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestedBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#34d399',
  },
  suggestedBannerSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
