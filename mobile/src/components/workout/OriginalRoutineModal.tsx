import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, RotateCcw, ShieldCheck, Zap, Dumbbell, AlertTriangle, ArrowRight } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  translateExerciseName,
  translateMuscleGroup,
  translateWorkoutNotes,
} from '@/lib/workoutTranslator';
import { useUnit } from '@/context/UnitContext';
import { WorkingSetItem } from './InteractiveSetRow';

export interface WorkingExerciseItem {
  id: string;
  exercise_id: string;
  exercise?: any;
  notes: string | null;
  sets: WorkingSetItem[];
}

interface OriginalRoutineModalProps {
  visible: boolean;
  onClose: () => void;
  dayName: string;
  routineTitle?: string;
  originalExercises: WorkingExerciseItem[];
  currentExercises: WorkingExerciseItem[];
  hasModifications: boolean;
  onResetAll: () => Promise<void>;
  onResetExercise: (exerciseId: string) => Promise<void>;
}

export default function OriginalRoutineModal({
  visible,
  onClose,
  dayName,
  routineTitle,
  originalExercises,
  currentExercises,
  hasModifications,
  onResetAll,
  onResetExercise,
}: OriginalRoutineModalProps) {
  const { t, language } = useLanguage();
  const { unit, toDisplayWeight } = useUnit();

  const handleConfirmResetAll = () => {
    Alert.alert(
      t('workout.reset_confirm_title', '¿Restaurar rutina original?'),
      t(
        'workout.reset_confirm_desc',
        'Se restablecerán las series, repeticiones y pesos prescritos originalmente por tu Coach.'
      ),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('common.confirm', 'Restaurar'),
          style: 'destructive',
          onPress: async () => {
            await onResetAll();
            onClose();
          },
        },
      ]
    );
  };

  const handleConfirmResetExercise = (exerciseId: string, name: string) => {
    Alert.alert(
      name,
      t(
        'workout.reset_exercise_confirm_desc',
        'Se restablecerán las series y pesos de este ejercicio a lo asignado por tu Coach.'
      ),
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('common.confirm', 'Restaurar'),
          style: 'destructive',
          onPress: async () => {
            await onResetExercise(exerciseId);
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <SafeAreaView style={styles.modalSafeArea}>
          <View style={styles.modalContainer}>
            {/* Cabecera del modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalSubtitle}>
                  {t('workout.original_modal_subtitle', 'PRESCRIPCIÓN OFICIAL VS TU PROGRESO')}
                </Text>
                <Text style={styles.modalTitle}>
                  {t('workout.original_modal_title', 'Plan Original del Coach')}
                </Text>
                <Text style={styles.routineMeta} numberOfLines={1}>
                  {dayName} • {routineTitle || 'OptiFit Labs'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={onClose}
                activeOpacity={0.7}
              >
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Banner de Estado */}
            <View style={styles.bannerContainer}>
              {hasModifications ? (
                <View style={styles.modifiedBanner}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
                    <Zap size={18} color="#fbbf24" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bannerTitleModified}>
                        {t('workout.has_modifications', 'Has adaptado este entrenamiento según tus últimos pesos y series.')}
                      </Text>
                      <Text style={styles.bannerSubModified}>
                        {language === 'en'
                          ? 'Your next sessions automatically remember your progress. You can reset back to coach prescription anytime.'
                          : 'Tus próximas sesiones recuerdan automáticamente tu progreso. Puedes volver a la pauta del coach en cualquier momento.'}
                      </Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    style={styles.resetAllBtn}
                    onPress={handleConfirmResetAll}
                    activeOpacity={0.8}
                  >
                    <RotateCcw size={14} color="#020617" style={{ marginRight: 6 }} />
                    <Text style={styles.resetAllBtnText}>
                      {t('workout.reset_all_btn', '↺ Restaurar Todo al Plan Original')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.exactBanner}>
                  <ShieldCheck size={18} color="#10b981" />
                  <Text style={styles.exactBannerText}>
                    {t('workout.no_modifications', 'Tu rutina actual coincide 100% con la prescripción del Coach.')}
                  </Text>
                </View>
              )}
            </View>

            {/* Lista de Ejercicios: Original vs Actual */}
            <ScrollView style={styles.scrollList} showsVerticalScrollIndicator={false}>
              {originalExercises.map((origRx, idx) => {
                const exId = origRx.exercise_id || origRx.id;
                const currRx = currentExercises.find((c) => (c.exercise_id || c.id) === exId);

                // Comprobar si este ejercicio específico tiene modificaciones
                const isDiff =
                  !currRx ||
                  currRx.sets.length !== origRx.sets.length ||
                  currRx.sets.some((currSet, sIdx) => {
                    const origSet = origRx.sets[sIdx];
                    if (!origSet) return true;
                    return (
                      currSet.target_reps !== origSet.target_reps ||
                      currSet.target_weight_kg !== origSet.target_weight_kg
                    );
                  });

                const exName = origRx.exercise?.name || `Ejercicio ${idx + 1}`;

                return (
                  <View key={origRx.id || idx} style={styles.exerciseCard}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>
                          {idx + 1}. {translateExerciseName(exName, language)}
                        </Text>
                        <Text style={styles.cardMuscle}>
                          {translateMuscleGroup(origRx.exercise?.muscle_group || 'General', language)}
                        </Text>
                      </View>

                      {isDiff ? (
                        <View style={styles.statusBadgeModified}>
                          <Zap size={12} color="#fbbf24" style={{ marginRight: 4 }} />
                          <Text style={styles.statusBadgeTextModified}>
                            {language === 'en' ? 'Adapted' : 'Adaptado'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.statusBadgeOriginal}>
                          <ShieldCheck size={12} color="#34d399" style={{ marginRight: 4 }} />
                          <Text style={styles.statusBadgeTextOriginal}>
                            {language === 'en' ? 'Coach Plan' : 'Plan Coach'}
                          </Text>
                        </View>
                      )}
                    </View>

                    {origRx.notes && (
                      <Text style={styles.coachNotesText}>💡 {translateWorkoutNotes(origRx.notes, language)}</Text>
                    )}

                    {/* Prescripción Original del Coach */}
                    <View style={styles.comparisonBox}>
                      <Text style={styles.comparisonLabel}>
                        {t('workout.original_values', 'Prescripción del Coach:')}
                      </Text>
                      <View style={styles.setsList}>
                        {origRx.sets.map((s, sIdx) => (
                          <View key={s.id || sIdx} style={styles.setRowOrig}>
                            <Text style={styles.setNumBadge}>#{s.set_number}</Text>
                            <Text style={styles.setText}>
                              {s.target_reps} reps @ {toDisplayWeight(s.target_weight_kg || 0)} {unit.toUpperCase()}
                            </Text>
                            {s.target_rpe && (
                              <Text style={styles.rpeText}>RPE {s.target_rpe}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    </View>

                    {/* Si tiene modificaciones, mostrar valores adaptados y botón de reset individual */}
                    {isDiff && currRx && (
                      <View style={[styles.comparisonBox, styles.currentBox]}>
                        <View style={styles.currentHeader}>
                          <Text style={styles.currentLabel}>
                            {t('workout.current_values', 'Tus valores actuales adaptados:')}
                          </Text>
                          <TouchableOpacity
                            style={styles.resetExerciseBtn}
                            onPress={() => handleConfirmResetExercise(exId, exName)}
                            activeOpacity={0.7}
                          >
                            <RotateCcw size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                            <Text style={styles.resetExerciseText}>
                              {t('workout.reset_exercise_btn', 'Restaurar al original')}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        <View style={styles.setsList}>
                          {currRx.sets.map((s, sIdx) => (
                            <View key={s.id || sIdx} style={styles.setRowCurr}>
                              <Text style={[styles.setNumBadge, { backgroundColor: '#1e293b' }]}>
                                #{s.set_number}
                              </Text>
                              <Text style={[styles.setText, { color: '#fbbf24', fontWeight: '800' }]}>
                                {s.target_reps} reps @ {toDisplayWeight(s.target_weight_kg || 0)} {unit.toUpperCase()}
                              </Text>
                              {s.is_extra && (
                                <View style={styles.extraTag}>
                                  <Text style={styles.extraTagText}>
                                    {t('workout.extra_series', 'Serie extra')}
                                  </Text>
                                </View>
                              )}
                            </View>
                          ))}
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
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
    maxHeight: '90%',
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
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
    fontSize: 17,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  routineMeta: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    marginLeft: 10,
  },
  bannerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  modifiedBanner: {
    backgroundColor: 'rgba(245, 158, 11, 0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 12,
    gap: 10,
  },
  bannerTitleModified: {
    fontSize: 11,
    fontWeight: '800',
    color: '#fbbf24',
  },
  bannerSubModified: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  resetAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fbbf24',
    borderRadius: 10,
    paddingVertical: 9,
  },
  resetAllBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#020617',
  },
  exactBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  exactBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
    flex: 1,
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  exerciseCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  cardMuscle: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadgeModified: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  statusBadgeTextModified: {
    fontSize: 9,
    fontWeight: '900',
    color: '#fbbf24',
  },
  statusBadgeOriginal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  statusBadgeTextOriginal: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
  },
  coachNotesText: {
    fontSize: 10,
    color: '#94a3b8',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    padding: 8,
    borderRadius: 8,
    borderLeftWidth: 2,
    borderLeftColor: '#10b981',
  },
  comparisonBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 6,
  },
  currentBox: {
    borderColor: 'rgba(251, 191, 36, 0.25)',
    backgroundColor: 'rgba(251, 191, 36, 0.03)',
  },
  comparisonLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  currentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fbbf24',
    letterSpacing: 0.5,
  },
  resetExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
  resetExerciseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
  setsList: {
    gap: 4,
  },
  setRowOrig: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setRowCurr: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  setNumBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    backgroundColor: '#0f172a',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  setText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  rpeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#a855f7',
  },
  extraTag: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  extraTagText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#38bdf8',
  },
});
