import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Check,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Flame,
  Dumbbell,
  Scale,
  Zap,
  Apple,
  Search,
  CheckCircle2,
  Heart,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { FoodItem, FoodCategory } from '@/lib/foodDatabase';
import { UserBiometrics } from '@/lib/calorieCalculator';
import {
  NutritionGoal,
  MealFrequency,
  FlavorPreference,
  DietaryRestriction,
  WizardPlanInput,
  generateSuggestedPlan,
  SuggestedPlan,
} from '@/lib/suggestedMealPlan';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPlanGenerated: (plan: SuggestedPlan) => void;
  allFoods: FoodItem[];
  biometrics: UserBiometrics;
}

export default function SuggestedPlanWizardModal({
  visible,
  onClose,
  onPlanGenerated,
  allFoods,
  biometrics,
}: Props) {
  const { language, t } = useLanguage();
  const insets = useSafeAreaInsets();
  // Safe bottom padding for Android (guarantees 3-button navigation does not block footer)
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 16);
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Form State
  const [selectedGoal, setSelectedGoal] = useState<NutritionGoal>('fat_loss');
  const [currentWeight, setCurrentWeight] = useState<string>(
    biometrics.weightKg ? String(biometrics.weightKg) : '75'
  );
  const [targetWeight, setTargetWeight] = useState<string>(
    biometrics.weightKg ? String(Math.max(45, biometrics.weightKg - 5)) : '70'
  );
  const [mealFrequency, setMealFrequency] = useState<MealFrequency>(4);
  const [selectedFlavors, setSelectedFlavors] = useState<FlavorPreference[]>(['salado', 'dulce']);
  const [selectedRestrictions, setSelectedRestrictions] = useState<DietaryRestriction[]>(['none']);
  const [favoriteFoodIds, setFavoriteFoodIds] = useState<string[]>([]);
  const [favSearchQuery, setFavSearchQuery] = useState<string>('');
  const [favCategoryTab, setFavCategoryTab] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  // Objetivos disponibles
  const goals: { id: NutritionGoal; title_es: string; title_en: string; sub_es: string; sub_en: string; icon: any; color: string }[] = [
    {
      id: 'fat_loss',
      title_es: '🔥 Perder Grasa / Definición',
      title_en: '🔥 Fat Loss / Cutting',
      sub_es: 'Déficit calórico moderado y saludable (-400 a -500 kcal/día) preservando tu masa muscular.',
      sub_en: 'Healthy, moderate caloric deficit (-400 to -500 kcal/day) while preserving lean muscle mass.',
      icon: Flame,
      color: '#f97316',
    },
    {
      id: 'muscle_gain',
      title_es: '💪 Aumentar Masa Muscular (Volumen Limpio)',
      title_en: '💪 Lean Muscle Gain (Lean Bulk)',
      sub_es: 'Superávit controlado (+300 kcal/día) para maximizar hipertrofia minimizando grasa.',
      sub_en: 'Controlled caloric surplus (+300 kcal/day) to optimize hypertrophy while minimizing fat gain.',
      icon: Dumbbell,
      color: '#10b981',
    },
    {
      id: 'weight_gain',
      title_es: '⚖️ Ganar Peso Corporal',
      title_en: '⚖️ Weight Gain',
      sub_es: 'Superávit calórico óptimo (+450 kcal/día) con alimentos nutritivos y de alta densidad.',
      sub_en: 'Nutrient-dense caloric surplus (+450 kcal/day) for healthy and progressive weight gain.',
      icon: Scale,
      color: '#38bdf8',
    },
    {
      id: 'maintenance',
      title_es: '⚡ Mantenimiento & Rendimiento',
      title_en: '⚡ Maintenance & Performance',
      sub_es: 'Balance energético isocalórico para rendir al máximo en tus entrenamientos y mantener tu físico.',
      sub_en: 'Isocaloric energy balance to fuel peak workout performance and maintain body composition.',
      icon: Zap,
      color: '#a855f7',
    },
  ];

  // Opciones de comidas al día
  const frequencies: { count: MealFrequency; label_es: string; label_en: string; tag_es: string; tag_en: string }[] = [
    { count: 1, label_es: '1 Comida al día', label_en: '1 Meal per day', tag_es: 'OMAD / Ventana única', tag_en: 'OMAD / Single window' },
    { count: 2, label_es: '2 Comidas al día', label_en: '2 Meals per day', tag_es: 'Ayuno Intermitente 16/8', tag_en: 'Intermittent Fasting 16/8' },
    { count: 3, label_es: '3 Comidas al día', label_en: '3 Meals per day', tag_es: 'Clásico (Desayuno, Almuerzo, Cena)', tag_en: 'Classic (Breakfast, Lunch, Dinner)' },
    { count: 4, label_es: '4 Comidas al día', label_en: '4 Meals per day', tag_es: 'Recomendado (+ Merienda)', tag_en: 'Recommended (+ Afternoon Snack)' },
    { count: 5, label_es: '5 Comidas al día', label_en: '5 Meals per day', tag_es: 'Óptimo Fitness (+ Media Mañana)', tag_en: 'Fitness Optimum (+ Mid-Morning)' },
    { count: 6, label_es: '6 Comidas al día', label_en: '6 Meals per day', tag_es: 'Alto Volumen / Frecuente', tag_en: 'High Volume / Frequent' },
  ];

  // Sabores
  const flavorOptions: { id: FlavorPreference; label_es: string; label_en: string; emoji: string }[] = [
    { id: 'salado', label_es: 'Salado', label_en: 'Savory', emoji: '🧂' },
    { id: 'dulce', label_es: 'Dulce', label_en: 'Sweet', emoji: '🍬' },
    { id: 'picante', label_es: 'Picante / Especiado', label_en: 'Spicy', emoji: '🌶️' },
    { id: 'acido', label_es: 'Ácido / Cítrico', label_en: 'Citrus / Tart', emoji: '🍋' },
    { id: 'neutro', label_es: 'Neutro / Suave', label_en: 'Mild / Neutral', emoji: '🌾' },
  ];

  // Restricciones
  const restrictionOptions: { id: DietaryRestriction; label_es: string; label_en: string }[] = [
    { id: 'none', label_es: 'Sin restricciones (Omnívoro)', label_en: 'No restrictions (Omnivore)' },
    { id: 'lactose_free', label_es: 'Sin Lactosa', label_en: 'Lactose-Free' },
    { id: 'gluten_free', label_es: 'Sin Gluten / Celíaco', label_en: 'Gluten-Free' },
    { id: 'vegetarian', label_es: 'Vegetariano (con huevos/lácteos)', label_en: 'Vegetarian (eggs/dairy ok)' },
    { id: 'vegan', label_es: '100% Vegano', label_en: '100% Vegan' },
  ];

  const handleToggleFlavor = (flavor: FlavorPreference) => {
    if (selectedFlavors.includes(flavor)) {
      if (selectedFlavors.length > 1) {
        setSelectedFlavors(selectedFlavors.filter((f) => f !== flavor));
      }
    } else {
      setSelectedFlavors([...selectedFlavors, flavor]);
    }
  };

  const handleToggleRestriction = (res: DietaryRestriction) => {
    if (res === 'none') {
      setSelectedRestrictions(['none']);
      return;
    }
    const withoutNone = selectedRestrictions.filter((r) => r !== 'none');
    if (withoutNone.includes(res)) {
      const next = withoutNone.filter((r) => r !== res);
      setSelectedRestrictions(next.length === 0 ? ['none'] : next);
    } else {
      setSelectedRestrictions([...withoutNone, res]);
    }
  };

  const handleToggleFavoriteFood = (foodId: string) => {
    if (favoriteFoodIds.includes(foodId)) {
      setFavoriteFoodIds(favoriteFoodIds.filter((id) => id !== foodId));
    } else {
      setFavoriteFoodIds([...favoriteFoodIds, foodId]);
    }
  };

  // Filtrado de alimentos para la pantalla de favoritos
  const filteredAvailableFoods = useMemo(() => {
    return allFoods.filter((food) => {
      if (favCategoryTab !== 'all' && food.category !== favCategoryTab) {
        return false;
      }
      if (favSearchQuery.trim()) {
        const q = favSearchQuery.toLowerCase().trim();
        const n1 = (food.name_es || food.name).toLowerCase();
        const n2 = (food.name_en || food.name).toLowerCase();
        return n1.includes(q) || n2.includes(q);
      }
      return true;
    });
  }, [allFoods, favCategoryTab, favSearchQuery]);

  const handleGeneratePlan = () => {
    const curW = parseFloat(currentWeight);
    const tarW = parseFloat(targetWeight);

    if (isNaN(curW) || curW <= 30 || curW >= 300) {
      Alert.alert(
        language === 'en' ? 'Invalid Weight' : 'Peso Inválido',
        language === 'en' ? 'Please enter a valid current weight.' : 'Por favor ingresa un peso actual válido.'
      );
      return;
    }

    setIsGenerating(true);

    try {
      const input: WizardPlanInput = {
        goal: selectedGoal,
        currentWeightKg: curW,
        targetWeightKg: isNaN(tarW) ? curW : tarW,
        mealFrequency,
        flavorPreferences: selectedFlavors,
        dietaryRestrictions: selectedRestrictions,
        favoriteFoodIds,
      };

      const plan = generateSuggestedPlan(input, allFoods, biometrics);
      setIsGenerating(false);
      onPlanGenerated(plan);
      onClose();
    } catch (e) {
      setIsGenerating(false);
      Alert.alert(
        t('common.error', 'Error'),
        language === 'en' ? 'Could not generate plan.' : 'No se pudo generar el plan.'
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.sparkleIcon}>
                <Sparkles size={18} color="#10b981" />
              </View>
              <View>
                <Text style={styles.headerTitle}>
                  {language === 'en' ? 'Plan Generator' : 'Diseñar Plan Sugerido'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {language === 'en' ? `Step ${currentStep} of 4` : `Paso ${currentStep} de 4`}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentStep / 4) * 100}%` }]} />
          </View>

          {/* Body Content */}
          <ScrollView
            contentContainerStyle={[styles.scrollContent, { paddingBottom: safeBottom + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            {/* PASO 1: OBJETIVO & METAS */}
            {currentStep === 1 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeading}>
                  {language === 'en' ? 'What is your primary goal?' : '¿Cuál es tu objetivo principal?'}
                </Text>
                <Text style={styles.stepDescription}>
                  {language === 'en'
                    ? 'We will scientifically calculate your caloric balance and healthy progression.'
                    : 'Calcularemos con precisión científica tu balance calórico y una progresión 100% saludable.'}
                </Text>

                <View style={styles.goalsContainer}>
                  {goals.map((g) => {
                    const isSelected = selectedGoal === g.id;
                    const IconComp = g.icon;
                    return (
                      <TouchableOpacity
                        key={g.id}
                        style={[styles.goalCard, isSelected && styles.goalCardSelected]}
                        onPress={() => setSelectedGoal(g.id)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.goalCardHeader}>
                          <View style={[styles.goalIconBox, { backgroundColor: `${g.color}20` }]}>
                            <IconComp size={20} color={g.color} />
                          </View>
                          <Text style={[styles.goalTitle, isSelected && { color: '#34d399' }]}>
                            {language === 'en' ? g.title_en : g.title_es}
                          </Text>
                          {isSelected && (
                            <View style={styles.selectedBadge}>
                              <Check size={14} color="#052e16" />
                            </View>
                          )}
                        </View>
                        <Text style={styles.goalSub}>
                          {language === 'en' ? g.sub_en : g.sub_es}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.weightsRow}>
                  <View style={styles.weightInputGroup}>
                    <Text style={styles.inputLabel}>
                      {language === 'en' ? 'CURRENT WEIGHT (KG)' : 'PESO ACTUAL (KG)'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={currentWeight}
                      onChangeText={setCurrentWeight}
                      placeholder="Ej. 75"
                      placeholderTextColor="#475569"
                    />
                  </View>

                  <View style={styles.weightInputGroup}>
                    <Text style={styles.inputLabel}>
                      {language === 'en' ? 'TARGET WEIGHT (KG)' : 'PESO OBJETIVO (KG)'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={targetWeight}
                      onChangeText={setTargetWeight}
                      placeholder="Ej. 70"
                      placeholderTextColor="#475569"
                    />
                  </View>
                </View>
              </View>
            )}

            {/* PASO 2: FRECUENCIA DE COMIDAS */}
            {currentStep === 2 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeading}>
                  {language === 'en' ? 'How many meals do you prefer per day?' : '¿Cuántas comidas deseas hacer al día?'}
                </Text>
                <Text style={styles.stepDescription}>
                  {language === 'en'
                    ? 'Select from 1 to 6 meals. We will distribute your calories and macros evenly.'
                    : 'Selecciona de 1 a 6 comidas. Distribuiremos tus calorías y macros según tu rutina diaria.'}
                </Text>

                <View style={styles.frequenciesContainer}>
                  {frequencies.map((f) => {
                    const isSelected = mealFrequency === f.count;
                    return (
                      <TouchableOpacity
                        key={f.count}
                        style={[styles.frequencyCard, isSelected && styles.frequencyCardSelected]}
                        onPress={() => setMealFrequency(f.count)}
                        activeOpacity={0.8}
                      >
                        <View style={styles.frequencyLeft}>
                          <View style={[styles.frequencyNumBox, isSelected && styles.frequencyNumBoxActive]}>
                            <Text style={[styles.frequencyNumText, isSelected && styles.frequencyNumTextActive]}>
                              {f.count}
                            </Text>
                          </View>
                          <View>
                            <Text style={[styles.frequencyTitle, isSelected && styles.frequencyTitleActive]}>
                              {language === 'en' ? f.label_en : f.label_es}
                            </Text>
                            <Text style={styles.frequencyTag}>
                              {language === 'en' ? f.tag_en : f.tag_es}
                            </Text>
                          </View>
                        </View>
                        {isSelected && (
                          <View style={styles.selectedBadge}>
                            <Check size={14} color="#052e16" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* PASO 3: PREFERENCIAS & RESTRICCIONES */}
            {currentStep === 3 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeading}>
                  {language === 'en' ? 'Taste and dietary preferences' : 'Preferencias de paladar y restricciones'}
                </Text>
                <Text style={styles.stepDescription}>
                  {language === 'en'
                    ? 'Customize your flavors and any foods you want to avoid.'
                    : 'Personaliza los sabores que más disfrutas y cualquier alimento que desees evitar.'}
                </Text>

                <Text style={styles.subHeading}>
                  {language === 'en' ? 'FLAVOR PROFILES (Select multiple)' : 'SABORES PREFERIDOS (Selección múltiple)'}
                </Text>
                <View style={styles.chipsContainer}>
                  {flavorOptions.map((flav) => {
                    const isSelected = selectedFlavors.includes(flav.id);
                    return (
                      <TouchableOpacity
                        key={flav.id}
                        style={[styles.flavorChip, isSelected && styles.flavorChipSelected]}
                        onPress={() => handleToggleFlavor(flav.id)}
                        activeOpacity={0.7}
                      >
                        <Text style={styles.flavorEmoji}>{flav.emoji}</Text>
                        <Text style={[styles.flavorText, isSelected && styles.flavorTextSelected]}>
                          {language === 'en' ? flav.label_en : flav.label_es}
                        </Text>
                        {isSelected && <Check size={14} color="#34d399" style={{ marginLeft: 4 }} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <Text style={[styles.subHeading, { marginTop: 24 }]}>
                  {language === 'en' ? 'DIETARY RESTRICTIONS' : 'RESTRICCIONES ALIMENTARIAS'}
                </Text>
                <View style={styles.restrictionsContainer}>
                  {restrictionOptions.map((res) => {
                    const isSelected = selectedRestrictions.includes(res.id);
                    return (
                      <TouchableOpacity
                        key={res.id}
                        style={[styles.restrictionCard, isSelected && styles.restrictionCardSelected]}
                        onPress={() => handleToggleRestriction(res.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.checkCircle, isSelected && styles.checkCircleActive]}>
                          {isSelected && <Check size={12} color="#052e16" />}
                        </View>
                        <Text style={[styles.restrictionText, isSelected && styles.restrictionTextActive]}>
                          {language === 'en' ? res.label_en : res.label_es}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* PASO 4: ALIMENTOS FAVORITOS */}
            {currentStep === 4 && (
              <View style={styles.stepSection}>
                <Text style={styles.stepHeading}>
                  {language === 'en' ? 'Select your favorite foods' : 'Elige tus alimentos favoritos'}
                </Text>
                <Text style={styles.stepDescription}>
                  {language === 'en'
                    ? 'Our algorithm will prioritize these foods when creating your meals.'
                    : 'Nuestro motor priorizará estos alimentos al armar cada una de tus comidas.'}
                </Text>

                {/* Search Bar */}
                <View style={styles.searchBar}>
                  <Search size={16} color="#64748b" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={language === 'en' ? 'Search food (chicken, oats, yogurt...)' : 'Buscar alimento (pollo, avena, yogur...)'}
                    placeholderTextColor="#64748b"
                    value={favSearchQuery}
                    onChangeText={setFavSearchQuery}
                  />
                  {favSearchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setFavSearchQuery('')}>
                      <X size={16} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Category Filter Pills */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                  {[
                    { id: 'all', label: language === 'en' ? 'All' : 'Todos' },
                    { id: 'carnes', label: language === 'en' ? '🥩 Proteins & Eggs' : '🥩 Carnes y Huevos' },
                    { id: 'lacteos', label: language === 'en' ? '🥛 Dairy & Yogurts' : '🥛 Lácteos y Yogures' },
                    { id: 'cereales', label: language === 'en' ? '🌾 Cereals & Carbs' : '🌾 Cereales y Carbos' },
                    { id: 'frutas', label: language === 'en' ? '🍌 Fruits' : '🍌 Frutas' },
                    { id: 'verduras', label: language === 'en' ? '🥗 Veggies' : '🥗 Verduras' },
                    { id: 'grasas', label: language === 'en' ? '🥑 Healthy Fats' : '🥑 Grasas Saludables' },
                  ].map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catPill, favCategoryTab === cat.id && styles.catPillActive]}
                      onPress={() => setFavCategoryTab(cat.id)}
                    >
                      <Text style={[styles.catPillText, favCategoryTab === cat.id && styles.catPillTextActive]}>
                        {cat.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Contador de Favoritos */}
                <View style={styles.favoriteCounterRow}>
                  <Heart size={14} color="#f43f5e" />
                  <Text style={styles.favoriteCounterText}>
                    {language === 'en'
                      ? `${favoriteFoodIds.length} favorite foods selected`
                      : `${favoriteFoodIds.length} alimentos favoritos seleccionados`}
                  </Text>
                </View>

                {/* Lista de Alimentos */}
                <View style={styles.foodsList}>
                  {filteredAvailableFoods.slice(0, 40).map((food) => {
                    const isFav = favoriteFoodIds.includes(food.id);
                    return (
                      <TouchableOpacity
                        key={food.id}
                        style={[styles.foodRow, isFav && styles.foodRowFav]}
                        onPress={() => handleToggleFavoriteFood(food.id)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.foodRowLeft}>
                          <View style={[styles.foodFavIcon, isFav && styles.foodFavIconActive]}>
                            {isFav ? (
                              <Check size={14} color="#052e16" />
                            ) : (
                              <Heart size={14} color="#64748b" />
                            )}
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.foodRowName, isFav && styles.foodRowNameActive]}>
                              {language === 'en' ? food.name_en || food.name : food.name_es || food.name}
                            </Text>
                            <Text style={styles.foodRowSub}>
                              {food.calories} kcal • {food.protein_g}g P • {food.carbs_g}g C • {food.fats_g}g G ({food.servingLabel})
                            </Text>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer Controls */}
          <View style={[styles.modalFooter, { paddingBottom: safeBottom + 12 }]}>
            {currentStep > 1 && (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={() => setCurrentStep(currentStep - 1)}
                activeOpacity={0.8}
              >
                <ChevronLeft size={18} color="#94a3b8" />
                <Text style={styles.backBtnText}>
                  {language === 'en' ? 'Back' : 'Anterior'}
                </Text>
              </TouchableOpacity>
            )}

            {currentStep < 4 ? (
              <TouchableOpacity
                style={[styles.nextBtn, currentStep === 1 && { flex: 1 }]}
                onPress={() => setCurrentStep(currentStep + 1)}
                activeOpacity={0.8}
              >
                <Text style={styles.nextBtnText}>
                  {language === 'en' ? 'Next' : 'Siguiente'}
                </Text>
                <ChevronRight size={18} color="#052e16" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.generateBtn, isGenerating && { opacity: 0.6 }]}
                onPress={handleGeneratePlan}
                disabled={isGenerating}
                activeOpacity={0.8}
              >
                <Sparkles size={18} color="#052e16" />
                <Text style={styles.generateBtnText}>
                  {isGenerating
                    ? language === 'en' ? 'Generating...' : 'Diseñando Plan...'
                    : language === 'en' ? 'Create My Plan' : 'Generar Mi Plan'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: '#334155',
    maxHeight: '94%',
    minHeight: '80%',
    display: 'flex',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sparkleIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#064e3b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#f8fafc',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#1e293b',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  stepSection: {
    marginBottom: 8,
  },
  stepHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#f8fafc',
    marginBottom: 6,
  },
  stepDescription: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  goalsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  goalCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
  },
  goalCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b15',
  },
  goalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  goalIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  goalTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#e2e8f0',
    flex: 1,
  },
  goalSub: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 16,
    paddingLeft: 42,
  },
  selectedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weightsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  weightInputGroup: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  frequenciesContainer: {
    gap: 10,
  },
  frequencyCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1.5,
    borderColor: '#334155',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  frequencyCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b15',
  },
  frequencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  frequencyNumBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  frequencyNumBoxActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  frequencyNumText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#94a3b8',
  },
  frequencyNumTextActive: {
    color: '#052e16',
  },
  frequencyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  frequencyTitleActive: {
    color: '#34d399',
  },
  frequencyTag: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  subHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  flavorChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  flavorChipSelected: {
    backgroundColor: '#064e3b25',
    borderColor: '#10b981',
  },
  flavorEmoji: {
    fontSize: 15,
    marginRight: 6,
  },
  flavorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  flavorTextSelected: {
    color: '#34d399',
    fontWeight: '700',
  },
  restrictionsContainer: {
    gap: 8,
  },
  restrictionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  restrictionCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b15',
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkCircleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  restrictionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  restrictionTextActive: {
    color: '#f8fafc',
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#f8fafc',
  },
  catScroll: {
    marginBottom: 12,
  },
  catPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#334155',
  },
  catPillActive: {
    backgroundColor: '#064e3b',
    borderColor: '#10b981',
  },
  catPillText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  catPillTextActive: {
    color: '#34d399',
    fontWeight: '700',
  },
  favoriteCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  favoriteCounterText: {
    fontSize: 11,
    color: '#f43f5e',
    fontWeight: '700',
  },
  foodsList: {
    gap: 8,
  },
  foodRow: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 10,
  },
  foodRowFav: {
    borderColor: '#10b981',
    backgroundColor: '#064e3b15',
  },
  foodRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  foodFavIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodFavIconActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  foodRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#f8fafc',
  },
  foodRowNameActive: {
    color: '#34d399',
  },
  foodRowSub: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  nextBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    gap: 6,
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#052e16',
  },
  generateBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#10b981',
    gap: 8,
  },
  generateBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#052e16',
    letterSpacing: 0.3,
  },
});
