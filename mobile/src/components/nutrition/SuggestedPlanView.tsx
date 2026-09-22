import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Sparkles,
  Flame,
  Dumbbell,
  Scale,
  Zap,
  Plus,
  Minus,
  Trash2,
  Clock,
  Utensils,
  Check,
  RefreshCw,
  Search,
  X,
  Heart,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { FoodItem, ServingUnit, calculateFoodMacros } from '@/lib/foodDatabase';
import {
  SuggestedPlan,
  SuggestedMeal,
  SuggestedMealFood,
  updateMealFoodQuantity,
  removeFoodFromPlanMeal,
  addFoodToPlanMeal,
  saveStoredSuggestedPlan,
} from '@/lib/suggestedMealPlan';
import { MealType } from '@/lib/nutritionTracker';

interface Props {
  plan: SuggestedPlan | null;
  onOpenWizard: () => void;
  onPlanUpdated: (updatedPlan: SuggestedPlan) => void;
  onLogMealToToday: (meal: SuggestedMeal) => void;
  onLogAllMealsToToday: (plan: SuggestedPlan) => void;
  allFoods: FoodItem[];
}

export default function SuggestedPlanView({
  plan,
  onOpenWizard,
  onPlanUpdated,
  onLogMealToToday,
  onLogAllMealsToToday,
  allFoods,
}: Props) {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 16);

  // Modal para añadir alimento a una comida del plan
  const [addFoodModalVisible, setAddFoodModalVisible] = useState(false);
  const [targetMealIdForAdd, setTargetMealIdForAdd] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<FoodItem | null>(null);
  const [addPortionQty, setAddPortionQty] = useState('100');
  const [addPortionUnit, setAddPortionUnit] = useState<ServingUnit>('gramos');

  // Estado de comidas expandidas
  const [expandedMeals, setExpandedMeals] = useState<Record<string, boolean>>({});

  if (!plan) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconCircle}>
          <Sparkles size={36} color="#10b981" />
        </View>
        <Text style={styles.emptyTitle}>
          {language === 'en' ? 'No Suggested Plan Yet' : 'Aún no tienes un Plan Sugerido'}
        </Text>
        <Text style={styles.emptySubtitle}>
          {language === 'en'
            ? 'Design a healthy, professional nutrition plan tailored to your body metrics, goals, and food preferences in less than a minute.'
            : 'Diseña una pauta saludable y profesional adaptada a tu biometría, tus objetivos y tus alimentos favoritos en menos de 1 minuto.'}
        </Text>
        <TouchableOpacity style={styles.createBtn} onPress={onOpenWizard} activeOpacity={0.8}>
          <Sparkles size={18} color="#052e16" />
          <Text style={styles.createBtnText}>
            {language === 'en' ? '✨ Create Suggested Plan' : '✨ Diseñar Plan Sugerido'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const toggleMealExpanded = (mealId: string) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealId]: prev[mealId] === undefined ? false : !prev[mealId],
    }));
  };

  const handleStepFoodQty = async (
    mealId: string,
    foodItemId: string,
    foodRef: FoodItem,
    delta: number,
    currentQty: number
  ) => {
    const nextQty = Math.max(0, currentQty + delta);
    const updated = updateMealFoodQuantity(plan, mealId, foodItemId, nextQty, foodRef);
    onPlanUpdated(updated);
    await saveStoredSuggestedPlan(updated);
  };

  const handleRemoveFood = async (mealId: string, foodItemId: string, foodName: string) => {
    Alert.alert(
      language === 'en' ? 'Remove Food' : 'Eliminar Alimento',
      language === 'en'
        ? `Remove "${foodName}" from this meal?`
        : `¿Eliminar "${foodName}" de esta comida?`,
      [
        { text: language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        {
          text: language === 'en' ? 'Remove' : 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            const updated = removeFoodFromPlanMeal(plan, mealId, foodItemId);
            onPlanUpdated(updated);
            await saveStoredSuggestedPlan(updated);
          },
        },
      ]
    );
  };

  const handleOpenAddFoodToMeal = (mealId: string) => {
    setTargetMealIdForAdd(mealId);
    setSelectedFoodForAdd(null);
    setSearchQuery('');
    setAddPortionQty('100');
    setAddPortionUnit('gramos');
    setAddFoodModalVisible(true);
  };

  const handleConfirmAddFood = async () => {
    if (!targetMealIdForAdd || !selectedFoodForAdd) return;
    const qty = parseFloat(addPortionQty) || 100;
    const updated = addFoodToPlanMeal(
      plan,
      targetMealIdForAdd,
      selectedFoodForAdd,
      qty,
      addPortionUnit
    );
    onPlanUpdated(updated);
    await saveStoredSuggestedPlan(updated);
    setAddFoodModalVisible(false);
  };

  // Filtrado de alimentos para el modal de añadir
  const modalFilteredFoods = allFoods.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const n1 = (f.name_es || f.name).toLowerCase();
    const n2 = (f.name_en || f.name).toLowerCase();
    return n1.includes(q) || n2.includes(q);
  });

  const getGoalBadge = () => {
    switch (plan.goal) {
      case 'fat_loss':
        return { label: language === 'en' ? 'FAT LOSS / CUTTING' : 'PÉRDIDA DE GRASA / DEFINICIÓN', color: '#f97316' };
      case 'muscle_gain':
        return { label: language === 'en' ? 'LEAN MUSCLE GAIN' : 'AUMENTO DE MASA MUSCULAR', color: '#10b981' };
      case 'weight_gain':
        return { label: language === 'en' ? 'WEIGHT GAIN' : 'GANANCIA DE PESO', color: '#38bdf8' };
      case 'maintenance':
      default:
        return { label: language === 'en' ? 'MAINTENANCE' : 'MANTENIMIENTO & RENDIMIENTO', color: '#a855f7' };
    }
  };

  const goalBadge = getGoalBadge();

  return (
    <View style={[styles.container, { paddingBottom: safeBottom + 40 }]}>
      {/* TARJETA DE RESUMEN METABÓLICO Y PROYECCIÓN */}
      <View style={styles.summaryCard}>
        <View style={styles.badgeRow}>
          <View style={[styles.goalBadgeBox, { borderColor: goalBadge.color }]}>
            <Text style={[styles.goalBadgeText, { color: goalBadge.color }]}>{goalBadge.label}</Text>
          </View>
          <TouchableOpacity style={styles.reconfigBtn} onPress={onOpenWizard} activeOpacity={0.7}>
            <RefreshCw size={13} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.reconfigBtnText}>
              {language === 'en' ? 'Reconfigure' : 'Reconfigurar'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Calorías Diarias y Ahorro */}
        <View style={styles.kcalRow}>
          <View>
            <Text style={styles.kcalTitle}>
              {language === 'en' ? 'TARGET CALORIES' : 'INGESTA DIARIA SUGERIDA'}
            </Text>
            <View style={styles.kcalValueRow}>
              <Text style={styles.kcalBigValue}>{plan.totalCalories}</Text>
              <Text style={styles.kcalUnit}>kcal / día</Text>
            </View>
          </View>

          <View style={styles.savingsBox}>
            {plan.dailyCalorieDelta < 0 ? (
              <>
                <Flame size={16} color="#10b981" />
                <Text style={styles.savingsText}>
                  {language === 'en'
                    ? `~${Math.abs(plan.dailyCalorieDelta)} kcal saved/day`
                    : `Ahorras ~${Math.abs(plan.dailyCalorieDelta)} kcal/día`}
                </Text>
              </>
            ) : plan.dailyCalorieDelta > 0 ? (
              <>
                <Dumbbell size={16} color="#38bdf8" />
                <Text style={[styles.savingsText, { color: '#38bdf8' }]}>
                  {language === 'en'
                    ? `+${plan.dailyCalorieDelta} kcal surplus/day`
                    : `Superávit de +${plan.dailyCalorieDelta} kcal/día`}
                </Text>
              </>
            ) : (
              <Text style={styles.savingsText}>
                {language === 'en' ? 'Exact maintenance balance' : 'Balance exacto de mantenimiento'}
              </Text>
            )}
          </View>
        </View>

        {/* Mensaje de Proyección Saludable */}
        <View style={styles.projectionBox}>
          <Clock size={16} color="#f59e0b" style={{ marginTop: 2, marginRight: 8 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.projectionTitle}>
              {language === 'en' ? 'ESTIMATED HEALTHY TIMELINE' : 'PROYECCIÓN DE TIEMPO SALUDABLE'}
            </Text>
            <Text style={styles.projectionText}>
              {plan.goal === 'fat_loss' && (
                language === 'en'
                  ? `You will reach your goal of ${plan.targetWeightKg} kg in approximately ${plan.estimatedWeeksToGoal} weeks at a steady rate of ~0.5 kg/week, preserving 100% of your muscle mass with zero rebound effect.`
                  : `Alcanzarás tu meta de ${plan.targetWeightKg} kg en aproximadamente ${plan.estimatedWeeksToGoal} semanas a un ritmo seguro de ~0.5 kg/semana, protegiendo tu masa muscular y evitando el efecto rebote.`
              )}
              {plan.goal === 'muscle_gain' && (
                language === 'en'
                  ? `Estimated ${plan.estimatedWeeksToGoal} weeks of clean bulking to gain lean muscle tissue sustainably without excess body fat.`
                  : `Proyección de ${plan.estimatedWeeksToGoal} semanas de superávit limpio para construir tejido muscular magro sin acumulación excesiva de grasa.`
              )}
              {plan.goal === 'weight_gain' && (
                language === 'en'
                  ? `Estimated ${plan.estimatedWeeksToGoal} weeks of progressive weight gain with nutrient-dense meals.`
                  : `Proyección de ${plan.estimatedWeeksToGoal} semanas de aumento progresivo de peso con alimentos densos y saludables.`
              )}
              {plan.goal === 'maintenance' && (
                language === 'en'
                  ? 'Maintain optimal energy and body composition while fully fueling your workouts.'
                  : 'Mantiene tu composición corporal actual con suficiente energía para rendir en tus entrenamientos.'
              )}
            </Text>
          </View>
        </View>

        {/* Macro Bars */}
        <View style={styles.macrosContainer}>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>{language === 'en' ? 'PROTEIN' : 'PROTEÍNA'}</Text>
            <Text style={[styles.macroValue, { color: '#38bdf8' }]}>{plan.totalProtein_g}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>{language === 'en' ? 'CARBS' : 'CARBOHIDRATOS'}</Text>
            <Text style={[styles.macroValue, { color: '#34d399' }]}>{plan.totalCarbs_g}g</Text>
          </View>
          <View style={styles.macroPill}>
            <Text style={styles.macroLabel}>{language === 'en' ? 'FATS' : 'GRASAS'}</Text>
            <Text style={[styles.macroValue, { color: '#f59e0b' }]}>{plan.totalFats_g}g</Text>
          </View>
        </View>

        {/* Botón para registrar TODO el plan */}
        <TouchableOpacity
          style={styles.logAllBtn}
          onPress={() => onLogAllMealsToToday(plan)}
          activeOpacity={0.8}
        >
          <Check size={18} color="#052e16" />
          <Text style={styles.logAllBtnText}>
            {language === 'en' ? 'Log Entire Plan to Today' : 'Registrar Todo el Plan en mis Comidas de Hoy'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* LISTA DE COMIDAS (1 A 6 COMIDAS) */}
      <View style={styles.mealsHeader}>
        <Text style={styles.mealsHeaderTitle}>
          {language === 'en'
            ? `Daily Distribution (${plan.meals.length} Meals)`
            : `Distribución Diaria (${plan.meals.length} Comidas)`}
        </Text>
        <Text style={styles.mealsHeaderSub}>
          {language === 'en'
            ? 'You can adjust portions, swap ingredients or log each meal directly.'
            : 'Puedes ajustar porciones, cambiar alimentos o registrar cada comida con un toque.'}
        </Text>
      </View>

      <View style={styles.mealsList}>
        {plan.meals.map((meal) => {
          const isCollapsed = expandedMeals[meal.id] === false;
          return (
            <View key={meal.id} style={styles.mealCard}>
              {/* Encabezado de la Comida */}
              <TouchableOpacity
                style={styles.mealCardHeader}
                onPress={() => toggleMealExpanded(meal.id)}
                activeOpacity={0.8}
              >
                <View style={styles.mealHeaderLeft}>
                  <View style={styles.mealClockBox}>
                    <Clock size={14} color="#10b981" />
                    <Text style={styles.mealTimeText}>{meal.timeSuggestion}</Text>
                  </View>
                  <View>
                    <Text style={styles.mealName}>
                      {language === 'en' ? meal.name_en : meal.name_es}
                    </Text>
                    <Text style={styles.mealMacrosSummary}>
                      {meal.calories} kcal • {meal.protein_g}g P • {meal.carbs_g}g C • {meal.fats_g}g G
                    </Text>
                  </View>
                </View>
                {isCollapsed ? (
                  <ChevronDown size={20} color="#64748b" />
                ) : (
                  <ChevronUp size={20} color="#64748b" />
                )}
              </TouchableOpacity>

              {/* Contenido de la Comida */}
              {!isCollapsed && (
                <View style={styles.mealCardBody}>
                  {/* Lista de Alimentos */}
                  <View style={styles.foodItemsList}>
                    {meal.foods.map((food) => {
                      const foodRef = allFoods.find((f) => f.id === food.foodId) || {
                        id: food.foodId,
                        name: food.foodName,
                        name_es: food.foodName_es,
                        name_en: food.foodName_en,
                        category: food.category,
                        servingUnit: food.unit,
                        defaultServingSize: food.unit === 'gramos' ? 100 : 1,
                        servingLabel: food.unit === 'gramos' ? `${food.quantity}g` : `${food.quantity} u`,
                        calories: Math.round((food.calories / (food.quantity || 1)) * 100),
                        protein_g: food.protein_g,
                        carbs_g: food.carbs_g,
                        fats_g: food.fats_g,
                      };

                      const stepDelta = food.unit === 'gramos' ? 10 : 1;

                      return (
                        <View key={food.id} style={styles.foodItemRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.foodItemName}>
                              {language === 'en' ? food.foodName_en : food.foodName_es}
                            </Text>
                            <Text style={styles.foodItemMacros}>
                              {food.calories} kcal • {food.protein_g}g P • {food.carbs_g}g C • {food.fats_g}g G
                            </Text>
                          </View>

                          {/* Controles + / - */}
                          <View style={styles.quantityControls}>
                            <TouchableOpacity
                              style={styles.stepBtn}
                              onPress={() =>
                                handleStepFoodQty(meal.id, food.id, foodRef, -stepDelta, food.quantity)
                              }
                              activeOpacity={0.7}
                            >
                              <Minus size={14} color="#94a3b8" />
                            </TouchableOpacity>

                            <View style={styles.qtyBox}>
                              <Text style={styles.qtyText}>
                                {food.quantity} {food.unit === 'gramos' ? 'g' : 'u'}
                              </Text>
                            </View>

                            <TouchableOpacity
                              style={styles.stepBtn}
                              onPress={() =>
                                handleStepFoodQty(meal.id, food.id, foodRef, +stepDelta, food.quantity)
                              }
                              activeOpacity={0.7}
                            >
                              <Plus size={14} color="#10b981" />
                            </TouchableOpacity>

                            <TouchableOpacity
                              style={styles.trashBtn}
                              onPress={() => handleRemoveFood(meal.id, food.id, food.foodName_es)}
                              activeOpacity={0.7}
                            >
                              <Trash2 size={15} color="#ef4444" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      );
                    })}
                  </View>

                  {/* Acciones de la Comida */}
                  <View style={styles.mealActionsRow}>
                    <TouchableOpacity
                      style={styles.addFoodBtn}
                      onPress={() => handleOpenAddFoodToMeal(meal.id)}
                      activeOpacity={0.7}
                    >
                      <Plus size={15} color="#38bdf8" />
                      <Text style={styles.addFoodBtnText}>
                        {language === 'en' ? 'Add Food' : '+ Agregar Alimento'}
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.logSingleMealBtn}
                      onPress={() => onLogMealToToday(meal)}
                      activeOpacity={0.8}
                    >
                      <Check size={15} color="#052e16" />
                      <Text style={styles.logSingleMealBtnText}>
                        {language === 'en' ? 'Log this Meal' : '⚡ Consumir / Registrar'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {/* MODAL PARA AGREGAR ALIMENTO A UNA COMIDA */}
      <Modal visible={addFoodModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { paddingBottom: safeBottom + 14 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {language === 'en' ? 'Add Food to Meal' : 'Agregar Alimento a la Comida'}
              </Text>
              <TouchableOpacity onPress={() => setAddFoodModalVisible(false)}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={styles.modalSearchBar}>
              <Search size={16} color="#64748b" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder={language === 'en' ? 'Search food to add...' : 'Buscar alimento para añadir...'}
                placeholderTextColor="#64748b"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <ScrollView style={{ maxHeight: 280 }} showsVerticalScrollIndicator={false}>
              {modalFilteredFoods.slice(0, 30).map((f) => {
                const isSelected = selectedFoodForAdd?.id === f.id;
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={[styles.modalFoodRow, isSelected && styles.modalFoodRowSelected]}
                    onPress={() => {
                      setSelectedFoodForAdd(f);
                      setAddPortionUnit(f.servingUnit);
                      setAddPortionQty(String(f.defaultServingSize));
                    }}
                  >
                    <Text style={[styles.modalFoodName, isSelected && { color: '#34d399' }]}>
                      {language === 'en' ? f.name_en || f.name : f.name_es || f.name}
                    </Text>
                    <Text style={styles.modalFoodSub}>
                      {f.calories} kcal ({f.servingLabel})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Ajuste de cantidad antes de añadir */}
            {selectedFoodForAdd && (
              <View style={styles.modalAddBottomSection}>
                <Text style={styles.modalSelectedLabel}>
                  {selectedFoodForAdd.name_es || selectedFoodForAdd.name}
                </Text>
                <View style={styles.modalQtyRow}>
                  <Text style={styles.modalQtyLabel}>
                    {language === 'en' ? 'Quantity:' : 'Cantidad:'}
                  </Text>
                  <TextInput
                    style={styles.modalQtyInput}
                    keyboardType="numeric"
                    value={addPortionQty}
                    onChangeText={setAddPortionQty}
                  />
                  <Text style={styles.modalQtyUnit}>
                    {addPortionUnit === 'gramos' ? 'gramos' : 'unidades'}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmAddFood}
                  activeOpacity={0.8}
                >
                  <Plus size={16} color="#052e16" />
                  <Text style={styles.modalConfirmBtnText}>
                    {language === 'en' ? 'Add to Meal' : 'Añadir a esta Comida'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#064e3b25',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#10b981',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#052e16',
  },
  summaryCard: {
    backgroundColor: '#1e293b',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  goalBadgeBox: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  goalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  reconfigBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064e3b20',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  reconfigBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  kcalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  kcalTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  kcalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  kcalBigValue: {
    fontSize: 28,
    fontWeight: '900',
    color: '#f8fafc',
  },
  kcalUnit: {
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  savingsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  savingsText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10b981',
  },
  projectionBox: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#f59e0b',
  },
  projectionTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  projectionText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  macrosContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  macroPill: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 2,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: '800',
  },
  logAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  logAllBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#052e16',
  },
  mealsHeader: {
    marginBottom: 12,
  },
  mealsHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  mealsHeaderSub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  mealsList: {
    gap: 12,
  },
  mealCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  mealCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#1e293b',
  },
  mealHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  mealClockBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  mealTimeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
  },
  mealMacrosSummary: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  mealCardBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderColor: '#334155',
    paddingTop: 10,
  },
  foodItemsList: {
    gap: 8,
    marginBottom: 12,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  foodItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  foodItemMacros: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBox: {
    paddingHorizontal: 6,
    minWidth: 46,
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f8fafc',
  },
  trashBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#450a0a',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  mealActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addFoodBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#0284c7',
    gap: 4,
  },
  addFoodBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  logSingleMealBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#10b981',
    gap: 4,
  },
  logSingleMealBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#052e16',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#f8fafc',
  },
  modalSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#f8fafc',
  },
  modalFoodRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: '#1e293b',
  },
  modalFoodRowSelected: {
    backgroundColor: '#064e3b20',
    borderRadius: 8,
  },
  modalFoodName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  modalFoodSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalAddBottomSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#334155',
  },
  modalSelectedLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 8,
  },
  modalQtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  modalQtyLabel: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalQtyInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    width: 80,
    textAlign: 'center',
  },
  modalQtyUnit: {
    fontSize: 12,
    color: '#94a3b8',
  },
  modalConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  modalConfirmBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#052e16',
  },
});
