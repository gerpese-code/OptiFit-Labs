import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  X,
  Plus,
  Trash2,
  ChefHat,
  Search,
  Check,
  Flame,
  Scale,
  Sparkles,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  FoodItem,
  ServingUnit,
  calculateFoodMacros,
  searchFoods,
  PRELOADED_FOODS,
  getCustomFoods,
} from '@/lib/foodDatabase';
import {
  CustomRecipe,
  RecipeIngredient,
  saveCustomRecipe,
} from '@/lib/recipeTracker';
import { MealType, MEAL_TYPES, LoggedFoodEntry } from '@/lib/nutritionTracker';

interface RecipeCreatorModalProps {
  visible: boolean;
  onClose: () => void;
  onRecipeSaved: (recipe: CustomRecipe) => void;
  defaultMeal?: MealType;
  initialEntries?: LoggedFoodEntry[];
}

export default function RecipeCreatorModal({
  visible,
  onClose,
  onRecipeSaved,
  defaultMeal = 'desayuno',
  initialEntries = [],
}: RecipeCreatorModalProps) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 16);

  const [recipeName, setRecipeName] = useState('');
  const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMeal);
  const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);

  // Estado del selector de ingredientes
  const [isPickingIngredient, setIsPickingIngredient] = useState(false);
  const [foodSearchQuery, setFoodSearchQuery] = useState('');
  const [availableFoods, setAvailableFoods] = useState<FoodItem[]>([]);
  const [selectedFoodForAdd, setSelectedFoodForAdd] = useState<FoodItem | null>(null);
  const [ingredientQty, setIngredientQty] = useState('100');
  const [ingredientUnit, setIngredientUnit] = useState<ServingUnit>('gramos');

  useEffect(() => {
    if (visible) {
      loadInitialData();
    }
  }, [visible, defaultMeal, initialEntries]);

  const loadInitialData = async () => {
    setSelectedMeal(defaultMeal);
    const custom = await getCustomFoods();
    setAvailableFoods([...custom, ...PRELOADED_FOODS]);

    if (initialEntries && initialEntries.length > 0) {
      const converted: RecipeIngredient[] = initialEntries.map((e) => ({
        foodId: e.foodId,
        foodName: e.foodName,
        quantity: e.quantity,
        unit: e.unit,
        calories: e.calories,
        protein_g: e.protein_g,
        carbs_g: e.carbs_g,
        fats_g: e.fats_g,
      }));
      setIngredients(converted);
      setRecipeName(language === 'en' ? 'My Custom Meal' : 'Mi Comida Frecuente');
    } else {
      setIngredients([]);
      setRecipeName('');
    }
  };

  // Calcular totales acumulados de la receta
  const totalCalories = Math.round(ingredients.reduce((sum, i) => sum + i.calories, 0));
  const totalProtein = Math.round(ingredients.reduce((sum, i) => sum + i.protein_g, 0) * 10) / 10;
  const totalCarbs = Math.round(ingredients.reduce((sum, i) => sum + i.carbs_g, 0) * 10) / 10;
  const totalFats = Math.round(ingredients.reduce((sum, i) => sum + i.fats_g, 0) * 10) / 10;

  // Filtrado de alimentos para añadir a la receta
  const filteredFoods = foodSearchQuery.trim()
    ? searchFoods(availableFoods, foodSearchQuery, 'all', language)
    : availableFoods.slice(0, 30);

  const handleSelectFoodToAdd = (food: FoodItem) => {
    setSelectedFoodForAdd(food);
    setIngredientUnit(food.servingUnit);
    setIngredientQty(food.defaultServingSize ? food.defaultServingSize.toString() : '100');
  };

  const handleConfirmAddIngredient = () => {
    if (!selectedFoodForAdd) return;
    const qty = parseFloat(ingredientQty) || 1;
    const macros = calculateFoodMacros(selectedFoodForAdd, qty, ingredientUnit);

    const newIng: RecipeIngredient = {
      foodId: selectedFoodForAdd.id,
      foodName: language === 'en' && selectedFoodForAdd.name_en ? selectedFoodForAdd.name_en : (selectedFoodForAdd.name_es || selectedFoodForAdd.name),
      quantity: qty,
      unit: ingredientUnit,
      calories: macros.calories,
      protein_g: macros.protein_g,
      carbs_g: macros.carbs_g,
      fats_g: macros.fats_g,
    };

    setIngredients((prev) => [...prev, newIng]);
    setSelectedFoodForAdd(null);
    setIsPickingIngredient(false);
    setFoodSearchQuery('');
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveRecipe = async () => {
    if (!recipeName.trim()) {
      Alert.alert(
        language === 'en' ? 'Recipe Name Required' : 'Nombre requerido',
        language === 'en' ? 'Please enter a name for this recipe (e.g. Oatmeal Cake).' : 'Por favor ingresa un nombre para la receta (ej. Torta de Avena).'
      );
      return;
    }

    if (ingredients.length === 0) {
      Alert.alert(
        language === 'en' ? 'Ingredients Required' : 'Ingredientes requeridos',
        language === 'en' ? 'Please add at least 1 food ingredient to this recipe.' : 'Por favor añade al menos 1 alimento a la receta.'
      );
      return;
    }

    const saved = await saveCustomRecipe({
      name: recipeName.trim(),
      name_es: recipeName.trim(),
      name_en: recipeName.trim(),
      targetMeal: selectedMeal,
      ingredients,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFats,
    });

    onRecipeSaved(saved);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { paddingBottom: safeBottom + 20 }]}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <ChefHat size={22} color="#10b981" style={{ marginRight: 8 }} />
              <View>
                <Text style={styles.subtitle}>
                  {language === 'en' ? 'RECIPE & MEAL BUILDER' : 'CREADOR DE RECETAS & PLATOS'}
                </Text>
                <Text style={styles.title}>
                  {language === 'en' ? 'New Frequent Recipe' : 'Nueva Receta / Plato'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
            {/* Input Nombre de la Receta */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {language === 'en' ? 'RECIPE NAME:' : 'NOMBRE DE LA RECETA / PLATO:'}
              </Text>
              <TextInput
                style={styles.textInput}
                placeholder={language === 'en' ? 'e.g. Oatmeal Protein Cake' : 'Ej. Torta de Avena con Proteína'}
                placeholderTextColor="#64748b"
                value={recipeName}
                onChangeText={setRecipeName}
              />
            </View>

            {/* Selector de Comida Preferente */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                {language === 'en' ? 'CATEGORY / TARGET MEAL:' : 'SECCIÓN O COMIDA:'}
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.mealScroll}>
                {MEAL_TYPES.map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.mealBtn, selectedMeal === m.id && styles.mealBtnActive]}
                    onPress={() => setSelectedMeal(m.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.mealEmoji}>{m.emoji}</Text>
                    <Text style={[styles.mealBtnText, selectedMeal === m.id && styles.mealBtnTextActive]}>
                      {language === 'en'
                        ? (m.id === 'desayuno' ? 'Breakfast' : m.id === 'almuerzo' ? 'Lunch' : m.id === 'merienda' ? 'Snack' : m.id === 'cena' ? 'Dinner' : 'Snacks')
                        : m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Resumen Nutricional en Vivo */}
            <View style={styles.macroCard}>
              <View style={styles.macroCardHeader}>
                <Flame size={16} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={styles.macroCardTitle}>
                  {language === 'en' ? 'TOTAL RECIPE MACROS' : 'MACRONUTRIENTES TOTALES'}
                </Text>
              </View>
              <View style={styles.macroGrid}>
                <View style={styles.macroCol}>
                  <Text style={styles.macroValKcal}>{totalCalories}</Text>
                  <Text style={styles.macroLbl}>kcal</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroCol}>
                  <Text style={styles.macroVal}>{totalProtein}g</Text>
                  <Text style={styles.macroLbl}>{language === 'en' ? 'Protein' : 'Proteína'}</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroCol}>
                  <Text style={styles.macroVal}>{totalCarbs}g</Text>
                  <Text style={styles.macroLbl}>{language === 'en' ? 'Carbs' : 'Carbos'}</Text>
                </View>
                <View style={styles.macroDivider} />
                <View style={styles.macroCol}>
                  <Text style={styles.macroVal}>{totalFats}g</Text>
                  <Text style={styles.macroLbl}>{language === 'en' ? 'Fats' : 'Grasas'}</Text>
                </View>
              </View>
            </View>

            {/* Lista de Ingredientes */}
            <View style={styles.ingredientsSection}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.label}>
                  {language === 'en' ? `INGREDIENTS (${ingredients.length}):` : `INGREDIENTES (${ingredients.length}):`}
                </Text>
                <TouchableOpacity
                  style={styles.addIngBtn}
                  onPress={() => {
                    setIsPickingIngredient(true);
                    setFoodSearchQuery('');
                  }}
                  activeOpacity={0.7}
                >
                  <Plus size={14} color="#10b981" style={{ marginRight: 4 }} />
                  <Text style={styles.addIngBtnText}>
                    {language === 'en' ? '+ Add Ingredient' : '+ Añadir Alimento'}
                  </Text>
                </TouchableOpacity>
              </View>

              {ingredients.length === 0 ? (
                <View style={styles.emptyIngredients}>
                  <Text style={styles.emptyIngText}>
                    {language === 'en'
                      ? 'No ingredients added yet. Tap "+ Add Ingredient" to pick foods.'
                      : 'Aún no has añadido alimentos a la receta. Pulsa "+ Añadir Alimento".'}
                  </Text>
                </View>
              ) : (
                <View style={styles.ingredientsList}>
                  {ingredients.map((ing, idx) => (
                    <View key={idx} style={styles.ingredientRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.ingName}>{ing.foodName}</Text>
                        <Text style={styles.ingDetails}>
                          {ing.quantity} {ing.unit === 'gramos' ? 'g' : 'u'} • {ing.calories} kcal ({ing.protein_g}g P • {ing.carbs_g}g C • {ing.fats_g}g G)
                        </Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeIngBtn}
                        onPress={() => handleRemoveIngredient(idx)}
                      >
                        <Trash2 size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Botón Guardar Receta */}
            <TouchableOpacity
              style={styles.saveRecipeBtn}
              onPress={handleSaveRecipe}
              activeOpacity={0.8}
            >
              <Check size={18} color="#020617" style={{ marginRight: 6 }} />
              <Text style={styles.saveRecipeBtnText}>
                {language === 'en' ? 'Save Recipe / Meal' : 'Guardar Receta / Plato'}
              </Text>
            </TouchableOpacity>
          </ScrollView>

          {/* Submodal: Seleccionar Alimento para la Receta */}
          <Modal visible={isPickingIngredient} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerCard, { paddingBottom: safeBottom + 16 }]}>
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {language === 'en' ? 'Select Food Ingredient' : 'Seleccionar Alimento'}
                  </Text>
                  <TouchableOpacity onPress={() => setIsPickingIngredient(false)}>
                    <X size={20} color="#94a3b8" />
                  </TouchableOpacity>
                </View>

                {/* Buscador */}
                <View style={styles.searchBar}>
                  <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder={language === 'en' ? 'Search food (oats, egg, milk...)' : 'Buscar alimento (avena, huevo, leche...)'}
                    placeholderTextColor="#64748b"
                    value={foodSearchQuery}
                    onChangeText={setFoodSearchQuery}
                  />
                </View>

                <ScrollView style={{ maxHeight: 260 }}>
                  {filteredFoods.map((f) => {
                    const isSel = selectedFoodForAdd?.id === f.id;
                    const fName = language === 'en' && f.name_en ? f.name_en : (f.name_es || f.name);
                    return (
                      <TouchableOpacity
                        key={f.id}
                        style={[styles.foodPickRow, isSel && styles.foodPickRowActive]}
                        onPress={() => handleSelectFoodToAdd(f)}
                        activeOpacity={0.7}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.foodPickName, isSel && { color: '#34d399' }]}>
                            {fName}
                          </Text>
                          <Text style={styles.foodPickSub}>
                            {f.calories} kcal / {f.servingLabel} ({f.protein_g}g P • {f.carbs_g}g C • {f.fats_g}g G)
                          </Text>
                        </View>
                        {isSel && <Check size={18} color="#10b981" />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                {/* Panel de Cantidad del Ingrediente */}
                {selectedFoodForAdd && (
                  <View style={styles.ingredientPortionBox}>
                    <Text style={styles.portionBoxTitle}>
                      {language === 'en' ? 'Specify Quantity:' : 'Cantidad del ingrediente:'}
                    </Text>
                    <View style={styles.portionRow}>
                      <TouchableOpacity
                        style={styles.stepperSmallBtn}
                        onPress={() => {
                          const num = Math.max(1, (parseFloat(ingredientQty) || 10) - (ingredientUnit === 'gramos' ? 10 : 1));
                          setIngredientQty(num.toString());
                        }}
                      >
                        <Text style={styles.stepperTxt}>-</Text>
                      </TouchableOpacity>

                      <TextInput
                        style={styles.qtyInputSmall}
                        keyboardType="numeric"
                        value={ingredientQty}
                        onChangeText={setIngredientQty}
                      />

                      <TouchableOpacity
                        style={styles.stepperSmallBtn}
                        onPress={() => {
                          const num = (parseFloat(ingredientQty) || 0) + (ingredientUnit === 'gramos' ? 10 : 1);
                          setIngredientQty(num.toString());
                        }}
                      >
                        <Text style={styles.stepperTxt}>+</Text>
                      </TouchableOpacity>

                      <Text style={styles.unitSuffix}>
                        {ingredientUnit === 'gramos' ? 'g' : 'u'}
                      </Text>

                      <TouchableOpacity
                        style={styles.addBtnSmall}
                        onPress={handleConfirmAddIngredient}
                      >
                        <Text style={styles.addBtnSmallText}>
                          {language === 'en' ? 'Add' : 'Añadir'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            </View>
          </Modal>
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
  modalCard: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#0f172a',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  mealScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  mealBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mealBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderColor: '#10b981',
  },
  mealEmoji: {
    marginRight: 6,
    fontSize: 14,
  },
  mealBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  mealBtnTextActive: {
    color: '#34d399',
  },
  macroCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    padding: 14,
    marginBottom: 16,
  },
  macroCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  macroCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 1,
  },
  macroGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  macroCol: {
    alignItems: 'center',
  },
  macroValKcal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f59e0b',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  macroLbl: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  macroDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  ingredientsSection: {
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addIngBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  addIngBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  emptyIngredients: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    alignItems: 'center',
  },
  emptyIngText: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
  },
  ingredientsList: {
    gap: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ingName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  ingDetails: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  removeIngBtn: {
    padding: 6,
    borderRadius: 8,
  },
  saveRecipeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 14,
    borderRadius: 14,
  },
  saveRecipeBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#020617',
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    padding: 20,
  },
  pickerCard: {
    backgroundColor: '#090d16',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 18,
    maxHeight: '85%',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 13,
  },
  foodPickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  foodPickRowActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderRadius: 8,
  },
  foodPickName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  foodPickSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  ingredientPortionBox: {
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#10b981',
    padding: 12,
    marginTop: 12,
  },
  portionBoxTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    marginBottom: 8,
  },
  portionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperSmallBtn: {
    backgroundColor: '#1e293b',
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperTxt: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  qtyInputSmall: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    width: 60,
    height: 34,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '800',
  },
  unitSuffix: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
  },
  addBtnSmall: {
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 'auto',
  },
  addBtnSmallText: {
    fontSize: 12,
    fontWeight: '900',
    color: '#020617',
  },
});
