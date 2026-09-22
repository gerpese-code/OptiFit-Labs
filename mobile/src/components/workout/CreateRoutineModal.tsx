import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Dumbbell,
  Plus,
  Trash2,
  Check,
  Calendar,
  Sparkles,
  BookOpen,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { translateExerciseName, translateMuscleGroup } from '@/lib/workoutTranslator';
import { supabase } from '@/lib/supabase';
import { Exercise, Routine } from '@/types/database';
import ExerciseInventoryModal from './ExerciseInventoryModal';
import CreateCustomExerciseModal from './CreateCustomExerciseModal';

interface CreateRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  onRoutineCreated: (newRoutine: Routine) => void;
  userId: string;
}

interface RoutineDayDraft {
  name: string;
  exercises: Exercise[];
}

export default function CreateRoutineModal({
  visible,
  onClose,
  onRoutineCreated,
  userId,
}: CreateRoutineModalProps) {
  const { t, language } = useLanguage();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [days, setDays] = useState<RoutineDayDraft[]>([
    { name: 'Día 1: Entrenamiento Principal', exercises: [] },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  // Selector de inventario / catálogo
  const [inventoryVisible, setInventoryVisible] = useState(false);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(0);

  // Modal para Crear Ejercicio Propio Directo
  const [createCustomVisible, setCreateCustomVisible] = useState(false);
  const [customExerciseTargetDay, setCustomExerciseTargetDay] = useState<number>(0);

  const handleOpenCreateCustomForDay = (dayIndex: number) => {
    setCustomExerciseTargetDay(dayIndex);
    setCreateCustomVisible(true);
  };

  const handleCustomExerciseCreatedForDay = (newEx: Exercise) => {
    setDays((prev) => {
      const copy = [...prev];
      if (copy[customExerciseTargetDay]) {
        copy[customExerciseTargetDay] = {
          ...copy[customExerciseTargetDay],
          exercises: [...copy[customExerciseTargetDay].exercises, newEx],
        };
      }
      return copy;
    });
    setCreateCustomVisible(false);
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDays([{ name: 'Día 1: Entrenamiento Principal', exercises: [] }]);
  };

  const handleAddDay = () => {
    setDays((prev) => [
      ...prev,
      { name: `Día ${prev.length + 1}: Sesión ${prev.length + 1}`, exercises: [] },
    ]);
  };

  const handleRemoveDay = (index: number) => {
    if (days.length <= 1) {
      Alert.alert(
        t('common.error', 'Error'),
        'La rutina debe tener al menos un día de entrenamiento.'
      );
      return;
    }
    setDays((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOpenInventoryForDay = (dayIndex: number) => {
    setSelectedDayIndex(dayIndex);
    setInventoryVisible(true);
  };

  const handleAddExerciseToDay = (exercise: Exercise) => {
    setDays((prev) => {
      const copy = [...prev];
      if (copy[selectedDayIndex]) {
        copy[selectedDayIndex] = {
          ...copy[selectedDayIndex],
          exercises: [...copy[selectedDayIndex].exercises, exercise],
        };
      }
      return copy;
    });
  };

  const handleRemoveExerciseFromDay = (dayIndex: number, exIndex: number) => {
    setDays((prev) => {
      const copy = [...prev];
      if (copy[dayIndex]) {
        copy[dayIndex] = {
          ...copy[dayIndex],
          exercises: copy[dayIndex].exercises.filter((_, i) => i !== exIndex),
        };
      }
      return copy;
    });
  };

  const handleSaveRoutine = async () => {
    const trimmedTitle = title.trim() || 'Mi Rutina Personalizada';
    
    // Validar que al menos un día tenga ejercicios
    const hasAnyExercises = days.some((d) => d.exercises.length > 0);
    if (!hasAnyExercises) {
      Alert.alert(
        t('common.error', 'Error'),
        'Por favor agrega al menos un ejercicio a tu rutina antes de guardarla.'
      );
      return;
    }

    setIsSaving(true);
    try {
      // 1. Desactivar rutinas anteriores de este alumno
      await supabase
        .from('routines')
        .update({ is_active: false })
        .eq('client_id', userId);

      // 2. Crear la nueva rutina activa
      const { data: routineData, error: routineErr } = await supabase
        .from('routines')
        .insert({
          client_id: userId,
          title: trimmedTitle,
          description: description.trim() || 'Rutina personalizada diseñada por el alumno',
          is_active: true,
          is_template: false,
        })
        .select()
        .single();

      if (routineErr) throw routineErr;

      // 3. Crear los días y sus ejercicios
      for (let dIdx = 0; dIdx < days.length; dIdx++) {
        const dayDraft = days[dIdx];
        const { data: dayData, error: dayErr } = await supabase
          .from('routine_days')
          .insert({
            routine_id: routineData.id,
            day_number: dIdx + 1,
            name: dayDraft.name.trim() || `Día ${dIdx + 1}`,
            order_index: dIdx,
          })
          .select()
          .single();

        if (dayErr) throw dayErr;

        // 4. Crear los ejercicios de este día
        for (let eIdx = 0; eIdx < dayDraft.exercises.length; eIdx++) {
          const ex = dayDraft.exercises[eIdx];
          const { data: rxData, error: rxErr } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: dayData.id,
              exercise_id: ex.id,
              order_index: eIdx,
              notes: ex.is_custom ? 'Ejercicio creado por el alumno' : null,
            })
            .select()
            .single();

          if (rxErr) throw rxErr;

          // 5. Crear 3 series objetivo por defecto
          const defaultSets = [
            { routine_exercise_id: rxData.id, set_number: 1, target_reps: 12, target_weight_kg: 0, target_rpe: 8, rest_seconds: 90 },
            { routine_exercise_id: rxData.id, set_number: 2, target_reps: 10, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 90 },
            { routine_exercise_id: rxData.id, set_number: 3, target_reps: 8, target_weight_kg: 0, target_rpe: 9, rest_seconds: 120 },
          ];

          await supabase.from('routine_exercise_sets').insert(defaultSets);
        }
      }

      Alert.alert(
        t('common.success', 'Éxito'),
        t('workout.routine_saved_success', '¡Rutina guardada y activada con éxito!')
      );

      resetForm();
      onRoutineCreated(routineData as Routine);
      onClose();
    } catch (err: any) {
      console.error('Error creando rutina personalizada:', err);
      Alert.alert(
        t('common.error', 'Error'),
        err.message || 'No se pudo guardar la rutina. Revisa tu conexión.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tag}>
                <Sparkles size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>
                  {t('workout.create_routine_sub', 'NUEVA RUTINA')}
                </Text>
              </View>
              <Text style={styles.title}>
                {t('workout.create_routine_title', 'Crear mi Rutina')}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
            {/* Título de Rutina */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('workout.routine_title_label', 'Nombre de la Rutina')} *
              </Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder={t(
                  'workout.routine_title_placeholder',
                  'Ej. Mi Rutina Semanal'
                )}
                placeholderTextColor="#64748b"
              />
            </View>

            {/* Días y Ejercicios */}
            <View style={styles.daysSectionHeader}>
              <Text style={styles.sectionTitle}>Días de Entrenamiento</Text>
              <TouchableOpacity
                style={styles.addDayBtn}
                onPress={handleAddDay}
                activeOpacity={0.7}
              >
                <Plus size={13} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.addDayBtnText}>
                  {t('workout.add_day_btn', '+ Añadir Día')}
                </Text>
              </TouchableOpacity>
            </View>

            {days.map((day, dIdx) => (
              <View key={`day-${dIdx}`} style={styles.dayCard}>
                <View style={styles.dayHeader}>
                  <View style={styles.dayBadge}>
                    <Calendar size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                    <TextInput
                      style={styles.dayNameInput}
                      value={day.name}
                      onChangeText={(val) => {
                        const copy = [...days];
                        copy[dIdx].name = val;
                        setDays(copy);
                      }}
                      placeholder={`Día ${dIdx + 1}`}
                      placeholderTextColor="#64748b"
                    />
                  </View>

                  {days.length > 1 && (
                    <TouchableOpacity
                      style={styles.deleteDayBtn}
                      onPress={() => handleRemoveDay(dIdx)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={14} color="#f87171" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Lista de ejercicios del día */}
                {day.exercises.length === 0 ? (
                  <View style={styles.emptyDayBox}>
                    <Text style={styles.emptyDayText}>
                      No hay ejercicios añadidos en este día.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.exercisesList}>
                    {day.exercises.map((ex, exIdx) => (
                      <View key={`d-${dIdx}-ex-${exIdx}`} style={styles.exerciseRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.exerciseRowName} numberOfLines={1}>
                            {exIdx + 1}. {translateExerciseName(ex.name, language)}
                          </Text>
                          <Text style={styles.exerciseRowMuscle}>
                            {translateMuscleGroup(ex.muscle_group, language)}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.removeExBtn}
                          onPress={() => handleRemoveExerciseFromDay(dIdx, exIdx)}
                          activeOpacity={0.7}
                        >
                          <X size={14} color="#94a3b8" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}

                {/* Botones para Catálogo y Crear Ejercicio en este día */}
                <View style={styles.dayActionsRow}>
                  <TouchableOpacity
                    style={styles.dayCatalogBtn}
                    onPress={() => handleOpenInventoryForDay(dIdx)}
                    activeOpacity={0.7}
                  >
                    <BookOpen size={13} color="#38bdf8" style={{ marginRight: 5 }} />
                    <Text style={styles.dayCatalogBtnText}>
                      {t('routines.explore_catalog', 'Catálogo de Ejercicios')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.dayCreateExBtn}
                    onPress={() => handleOpenCreateCustomForDay(dIdx)}
                    activeOpacity={0.7}
                  >
                    <Plus size={13} color="#10b981" style={{ marginRight: 5 }} />
                    <Text style={styles.dayCreateExBtnText}>
                      {t('workout.create_custom_btn', '+ Crear Ejercicio')}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Botones de acción inferior */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancelar')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSaveRoutine}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    {t('workout.save_routine_btn', 'Guardar Rutina')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* Modal de Inventario de Ejercicios */}
          <ExerciseInventoryModal
            visible={inventoryVisible}
            onClose={() => setInventoryVisible(false)}
            onSelectExercise={handleAddExerciseToDay}
            userId={userId}
            actionTitle={`Agregar a ${days[selectedDayIndex]?.name || 'Día'}`}
          />

          {/* Modal para Crear Ejercicio Propio Directo */}
          <CreateCustomExerciseModal
            visible={createCustomVisible}
            onClose={() => setCreateCustomVisible(false)}
            onExerciseCreated={handleCustomExerciseCreatedForDay}
            userId={userId}
          />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  content: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#ffffff',
  },
  daysSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  addDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  addDayBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  dayCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 14,
    marginBottom: 14,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  dayBadge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dayNameInput: {
    flex: 1,
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
    padding: 0,
  },
  deleteDayBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  emptyDayBox: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptyDayText: {
    fontSize: 11,
    color: '#64748b',
    fontStyle: 'italic',
  },
  exercisesList: {
    gap: 6,
    marginBottom: 10,
  },
  exerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  exerciseRowName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  exerciseRowMuscle: {
    fontSize: 10,
    color: '#38bdf8',
    marginTop: 1,
  },
  removeExBtn: {
    padding: 4,
    marginLeft: 8,
  },
  dayActionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  dayCatalogBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  dayCatalogBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#38bdf8',
  },
  dayCreateExBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 6,
  },
  dayCreateExBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#10b981',
  },
  addExToDayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 10,
    paddingVertical: 8,
  },
  addExToDayBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#090d16',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
