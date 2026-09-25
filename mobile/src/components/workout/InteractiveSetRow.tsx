import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Check, Trash2, Zap, CheckSquare, Square, Timer } from 'lucide-react-native';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';

export interface WorkingSetItem {
  id: string;
  routine_exercise_set_id: string | null;
  set_number: number;
  target_reps: number;
  target_weight_kg: number;
  target_rpe: number | null;
  rest_seconds: number;
  is_extra?: boolean;
  is_superset?: boolean;
  superset_count?: number; // 1 a 5
  superset_reps?: number[]; // ej: [6, 6, 6, 6]
}

interface InteractiveSetRowProps {
  set: WorkingSetItem;
  isCompleted: boolean;
  onComplete: (reps: number, weightLogged: number, nextCompleted?: boolean) => void;
  onRemoveSet?: () => void;
  onLaunchTimer?: (restSeconds: number) => void;
  onChangeActual?: (reps: number, weight: number) => void;
  onChangeSuperset?: (isSuperset: boolean, count: number, reps: number[]) => void;
}

export default function InteractiveSetRow({
  set,
  isCompleted,
  onComplete,
  onRemoveSet,
  onLaunchTimer,
  onChangeActual,
  onChangeSuperset,
}: InteractiveSetRowProps) {
  const { unit, toDisplayWeight } = useUnit();
  const { t, language } = useLanguage();

  // Peso objetivo en la unidad activa
  const targetWeightInUnit = Math.round(toDisplayWeight(set.target_weight_kg || 0));

  // Valores reales que el alumno puede modificar libremente
  const [actualReps, setActualReps] = useState(set.target_reps.toString());
  const [actualWeight, setActualWeight] = useState(targetWeightInUnit.toString());
  const prevUnitRef = useRef(unit);

  // Estado de Superserie
  const [isSuperset, setIsSuperset] = useState<boolean>(!!set.is_superset);
  const [supersetCount, setSupersetCount] = useState<number>(
    set.superset_count || (set.superset_reps ? set.superset_reps.length : 4)
  );

  const getInitialRepsArray = (count: number, initialReps?: number[]): string[] => {
    if (initialReps && initialReps.length > 0) {
      const arr = initialReps.slice(0, count).map((r) => r.toString());
      while (arr.length < count) {
        arr.push(arr[arr.length - 1] || '6');
      }
      return arr;
    }
    const defaultPerSub = Math.max(1, Math.round(set.target_reps / count) || 6);
    return Array(count).fill(defaultPerSub.toString());
  };

  const [continuousReps, setContinuousReps] = useState<string[]>(
    getInitialRepsArray(
      set.superset_count || (set.superset_reps ? set.superset_reps.length : 4),
      set.superset_reps
    )
  );

  // Sincronizar si el set cambia externamente
  useEffect(() => {
    setActualReps(set.target_reps.toString());
    setActualWeight(Math.round(toDisplayWeight(set.target_weight_kg || 0)).toString());
    if (set.is_superset !== undefined) {
      setIsSuperset(!!set.is_superset);
    }
    if (set.superset_count) {
      setSupersetCount(set.superset_count);
    }
    if (set.superset_reps && set.superset_reps.length > 0) {
      setContinuousReps(set.superset_reps.map((r) => r.toString()));
    }
  }, [set.target_reps, set.target_weight_kg, set.is_superset, set.superset_count, set.superset_reps, unit]);

  // Autoconversión reactiva si el alumno cambia de KG a LBS o viceversa
  useEffect(() => {
    if (prevUnitRef.current !== unit) {
      const val = parseInt(actualWeight, 10);
      if (!isNaN(val) && val > 0) {
        if (unit === 'lbs' && prevUnitRef.current === 'kg') {
          const converted = Math.round(val * 2.20462262);
          setActualWeight(converted.toString());
        } else if (unit === 'kg' && prevUnitRef.current === 'lbs') {
          const converted = Math.round(val * 0.45359237);
          setActualWeight(converted.toString());
        }
      } else {
        setActualWeight(targetWeightInUnit.toString());
      }
      prevUnitRef.current = unit;
    }
  }, [unit, targetWeightInUnit]);

  const repsNum = parseInt(actualReps, 10) || 0;
  const weightNum = parseInt(actualWeight, 10) || 0;

  const autoSaveTimerRef = useRef<any>(null);

  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, []);

  const triggerAutoComplete = (reps: number, weight: number) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (reps > 0 && weight >= 0 && !isCompleted) {
      autoSaveTimerRef.current = setTimeout(() => {
        triggerHaptic('success');
        onComplete(reps, weight, true);
      }, 900);
    }
  };

  // Limpieza automática al hacer foco para rellenar de inmediato sin tener que borrar
  const handleRepsFocus = () => {
    setActualReps('');
  };

  const handleRepsEndEditing = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    let finalVal = actualReps.trim();
    if (!finalVal) {
      finalVal = set.target_reps.toString();
      setActualReps(finalVal);
    }
    const currentReps = parseInt(finalVal, 10) || 0;
    const currentWeight = parseInt(actualWeight, 10) || 0;
    if (currentReps > 0 && currentWeight >= 0 && !isCompleted) {
      triggerHaptic('success');
      onComplete(currentReps, currentWeight, true);
    }
  };

  const handleWeightFocus = () => {
    setActualWeight('');
  };

  const handleWeightEndEditing = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    let finalVal = actualWeight.trim();
    if (!finalVal) {
      finalVal = targetWeightInUnit.toString();
      setActualWeight(finalVal);
    }
    const currentReps = parseInt(actualReps, 10) || 0;
    const currentWeight = parseInt(finalVal, 10) || 0;
    if (currentReps > 0 && currentWeight >= 0 && !isCompleted) {
      triggerHaptic('success');
      onComplete(currentReps, currentWeight, true);
    }
  };

  const handleToggle = () => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    const nextCompleted = !isCompleted;
    if (nextCompleted) {
      triggerHaptic('success');
    } else {
      triggerHaptic('tap');
    }
    onComplete(repsNum, weightNum, nextCompleted);
  };

  const handleRepsChange = (txt: string) => {
    const cleanTxt = txt.replace(/[^0-9]/g, '');
    setActualReps(cleanTxt);
    const newReps = parseInt(cleanTxt, 10) || 0;
    if (onChangeActual) {
      onChangeActual(newReps, weightNum);
    }
    if (isCompleted) {
      onComplete(newReps, weightNum, true);
    } else if (newReps > 0) {
      triggerAutoComplete(newReps, weightNum);
    }
  };

  const handleWeightChange = (txt: string) => {
    const cleanTxt = txt.replace(/[^0-9]/g, '');
    setActualWeight(cleanTxt);
    const newWeight = parseInt(cleanTxt, 10) || 0;
    if (onChangeActual) {
      onChangeActual(repsNum, newWeight);
    }
    if (isCompleted) {
      onComplete(repsNum, newWeight, true);
    } else if (repsNum > 0) {
      triggerAutoComplete(repsNum, newWeight);
    }
  };

  // Activar o desactivar modalidad de Superserie
  const handleToggleSuperset = () => {
    triggerHaptic('tap');
    const nextIsSuperset = !isSuperset;
    setIsSuperset(nextIsSuperset);

    let repsArray = continuousReps.map((r) => parseInt(r, 10) || 6);
    if (repsArray.length !== supersetCount) {
      repsArray = Array(supersetCount).fill(6);
      setContinuousReps(repsArray.map((r) => r.toString()));
    }

    if (nextIsSuperset) {
      const sum = repsArray.reduce((acc, curr) => acc + curr, 0);
      setActualReps(sum.toString());
      if (onChangeActual) onChangeActual(sum, weightNum);
      if (onChangeSuperset) onChangeSuperset(true, supersetCount, repsArray);
      if (isCompleted) onComplete(sum, weightNum, true);
    } else {
      if (onChangeSuperset) onChangeSuperset(false, supersetCount, repsArray);
    }
  };

  // Cambiar cantidad de micro-series en la superserie (1 a 5)
  const handleSelectSupersetCount = (count: number) => {
    triggerHaptic('tap');
    setSupersetCount(count);

    const nextArr: string[] = [];
    for (let i = 0; i < count; i++) {
      nextArr.push(continuousReps[i] || continuousReps[continuousReps.length - 1] || '6');
    }
    setContinuousReps(nextArr);

    const repsNumbers = nextArr.map((r) => parseInt(r, 10) || 0);
    const sum = repsNumbers.reduce((acc, curr) => acc + curr, 0);
    setActualReps(sum.toString());

    if (onChangeActual) onChangeActual(sum, weightNum);
    if (onChangeSuperset) onChangeSuperset(true, count, repsNumbers);
    if (isCompleted) onComplete(sum, weightNum, true);
  };

  const handleContinuousFocus = (idx: number) => {
    const updated = [...continuousReps];
    updated[idx] = '';
    setContinuousReps(updated);
  };

  const handleContinuousEndEditing = (idx: number) => {
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    let val = continuousReps[idx]?.trim();
    if (!val) {
      val = '6';
      const updated = [...continuousReps];
      updated[idx] = '6';
      setContinuousReps(updated);
    }
    const repsNumbers = continuousReps.map((r) => parseInt(r, 10) || 6);
    const sum = repsNumbers.reduce((acc, curr) => acc + curr, 0);
    setActualReps(sum.toString());
    if (onChangeActual) onChangeActual(sum, weightNum);
    if (onChangeSuperset) onChangeSuperset(true, supersetCount, repsNumbers);
    if (isCompleted) {
      onComplete(sum, weightNum, true);
    } else if (sum > 0) {
      triggerAutoComplete(sum, weightNum);
    }
  };

  // Modificar repeticiones de una micro-serie específica (ej: set 2 de 4)
  const handleContinuousRepChange = (idx: number, txt: string) => {
    const cleanTxt = txt.replace(/[^0-9]/g, '');
    const updated = [...continuousReps];
    updated[idx] = cleanTxt;
    setContinuousReps(updated);

    const repsNumbers = updated.map((r) => parseInt(r, 10) || 0);
    const sum = repsNumbers.reduce((acc, curr) => acc + curr, 0);
    setActualReps(sum.toString());

    if (onChangeActual) onChangeActual(sum, weightNum);
    if (onChangeSuperset) onChangeSuperset(true, supersetCount, repsNumbers);
    if (isCompleted) {
      onComplete(sum, weightNum, true);
    } else if (sum > 0) {
      triggerAutoComplete(sum, weightNum);
    }
  };

  return (
    <View style={[styles.container, isCompleted && styles.containerCompleted]}>
      {/* FILA PRINCIPAL */}
      <View style={styles.mainRow}>
        {/* Columna Izquierda: Número de Serie + RPE y Descanso compactos + Tilde Superset */}
        <View style={styles.leftCol}>
          <View style={styles.setNumberRow}>
            <Text style={[styles.setNumberText, isCompleted && styles.textCompleted]}>
              #{set.set_number}
            </Text>
            {set.is_extra && (
              <View style={styles.extraBadge}>
                <Text style={styles.extraBadgeText}>EXTRA</Text>
              </View>
            )}
          </View>

          {/* Insignias compactas de RPE y Descanso */}
          <View style={styles.chipsRow}>
            {set.target_rpe ? (
              <View style={styles.chipRpe}>
                <Text style={styles.chipRpeText}>RPE {set.target_rpe}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              onPress={() => onLaunchTimer && onLaunchTimer(set.rest_seconds || 90)}
              style={styles.chipRest}
              activeOpacity={0.7}
            >
              <Timer size={10} color="#94a3b8" style={{ marginRight: 2 }} />
              <Text style={styles.chipRestText}>{set.rest_seconds || 90}s</Text>
            </TouchableOpacity>
          </View>

          {/* Tilde/Checkbox para Activar Modalidad Superset */}
          <TouchableOpacity
            onPress={handleToggleSuperset}
            style={[styles.supersetToggleBtn, isSuperset && styles.supersetToggleBtnActive]}
            activeOpacity={0.7}
          >
            {isSuperset ? (
              <CheckSquare size={13} color="#f59e0b" style={{ marginRight: 3 }} />
            ) : (
              <Square size={13} color="#64748b" style={{ marginRight: 3 }} />
            )}
            <Text style={[styles.supersetToggleText, isSuperset && styles.supersetToggleTextActive]}>
              Superset
            </Text>
          </TouchableOpacity>
        </View>

        {/* Columna Central: Recuadros Grandes para REPS y PESO */}
        <View style={styles.inputsRow}>
          {/* Recuadro Grande de Repeticiones */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>{t('workout.reps_label', 'REPS')}</Text>
            <TextInput
              style={[
                styles.largeInput,
                styles.repsInput,
                isCompleted && styles.inputCompleted,
                isSuperset && styles.inputSupersetActive,
              ]}
              keyboardType="number-pad"
              value={actualReps}
              onFocus={handleRepsFocus}
              onChangeText={handleRepsChange}
              onEndEditing={handleRepsEndEditing}
              placeholder={set.target_reps ? set.target_reps.toString() : '0'}
              placeholderTextColor="#475569"
            />
          </View>

          {/* Recuadro Grande de Peso */}
          <View style={styles.inputBox}>
            <Text style={styles.inputLabel}>
              {t('workout.weight_label', 'PESO ({unit})').replace('{unit}', unit.toUpperCase())}
            </Text>
            <TextInput
              style={[
                styles.largeInput,
                styles.weightInput,
                isCompleted && styles.inputCompleted,
              ]}
              keyboardType="number-pad"
              value={actualWeight}
              onFocus={handleWeightFocus}
              onChangeText={handleWeightChange}
              onEndEditing={handleWeightEndEditing}
              placeholder={targetWeightInUnit ? targetWeightInUnit.toString() : '0'}
              placeholderTextColor="#475569"
            />
          </View>
        </View>

        {/* Columna Derecha: Botón Check Táctil y Borrar Serie Extra */}
        <View style={styles.actionsCol}>
          <TouchableOpacity
            onPress={handleToggle}
            style={[styles.checkBtn, isCompleted && styles.checkBtnCompleted]}
            activeOpacity={0.7}
          >
            <Check
              size={20}
              color={isCompleted ? '#ffffff' : '#64748b'}
              strokeWidth={isCompleted ? 3 : 2}
            />
          </TouchableOpacity>

          {onRemoveSet && !isCompleted && (
            <TouchableOpacity
              onPress={onRemoveSet}
              style={styles.removeBtn}
              activeOpacity={0.7}
            >
              <Trash2 size={13} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* PANEL EXPANDIBLE DE SUPERSET */}
      {isSuperset && (
        <View style={styles.supersetPanel}>
          <View style={styles.supersetHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Zap size={14} color="#f59e0b" />
              <Text style={styles.supersetTitle}>
                {language === 'en' ? 'Superset Sets (1 to 5):' : 'Superserie continua (1 a 5):'}
              </Text>
            </View>

            {/* Selector de cantidad de micro-series (1 al 5) */}
            <View style={styles.countSelector}>
              {[1, 2, 3, 4, 5].map((num) => {
                const isSelected = supersetCount === num;
                return (
                  <TouchableOpacity
                    key={num}
                    onPress={() => handleSelectSupersetCount(num)}
                    style={[styles.countBtn, isSelected && styles.countBtnSelected]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.countBtnText, isSelected && styles.countBtnTextSelected]}>
                      {num}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Inputs de repeticiones continuas */}
          <View style={styles.continuousInputsWrapper}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.continuousInputsRow}>
              {Array.from({ length: supersetCount }).map((_, idx) => (
                <View key={idx} style={styles.continuousItem}>
                  <Text style={styles.continuousItemLabel}>S{idx + 1}</Text>
                  <TextInput
                    style={styles.continuousInput}
                    keyboardType="number-pad"
                    value={continuousReps[idx] || ''}
                    onFocus={() => handleContinuousFocus(idx)}
                    onChangeText={(txt) => handleContinuousRepChange(idx, txt)}
                    onEndEditing={() => handleContinuousEndEditing(idx)}
                    placeholder="6"
                    placeholderTextColor="#64748b"
                  />
                  {idx < supersetCount - 1 && (
                    <Text style={styles.plusSymbol}>+</Text>
                  )}
                </View>
              ))}

              <View style={styles.totalBadge}>
                <Text style={styles.totalBadgeText}>
                  = {actualReps} {language === 'en' ? 'total reps' : 'reps tot.'}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b1120',
    borderRadius: 14,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  containerCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  mainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  leftCol: {
    width: 82,
    justifyContent: 'center',
  },
  setNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  setNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  textCompleted: {
    color: '#34d399',
  },
  extraBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.2)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
  },
  extraBadgeText: {
    fontSize: 7.5,
    fontWeight: '900',
    color: '#38bdf8',
  },
  chipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  chipRpe: {
    backgroundColor: 'rgba(52, 211, 153, 0.12)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: 'rgba(52, 211, 153, 0.25)',
  },
  chipRpeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
  },
  chipRest: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  chipRestText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  supersetToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    marginTop: 5,
    borderWidth: 1,
    borderColor: '#374151',
    alignSelf: 'flex-start',
  },
  supersetToggleBtnActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  supersetToggleText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
  },
  supersetToggleTextActive: {
    color: '#f59e0b',
  },
  inputsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 4,
  },
  inputBox: {
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#94a3b8',
    marginBottom: 4,
    letterSpacing: 0.8,
  },
  largeInput: {
    height: 52,
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#334155',
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
  },
  repsInput: {
    width: 80,
  },
  weightInput: {
    width: 92,
  },
  inputCompleted: {
    borderColor: '#10b981',
    color: '#34d399',
  },
  inputSupersetActive: {
    borderColor: '#f59e0b',
    color: '#fbbf24',
  },
  actionsCol: {
    width: 44,
    alignItems: 'center',
    gap: 4,
  },
  checkBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  removeBtn: {
    padding: 3,
  },
  supersetPanel: {
    backgroundColor: 'rgba(245, 158, 11, 0.05)',
    borderTopWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  supersetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  supersetTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#f59e0b',
  },
  countSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  countBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBtnSelected: {
    backgroundColor: '#f59e0b',
    borderColor: '#d97706',
  },
  countBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  countBtnTextSelected: {
    color: '#000000',
  },
  continuousInputsWrapper: {
    marginTop: 2,
  },
  continuousInputsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  continuousItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  continuousItemLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
  },
  continuousInput: {
    width: 48,
    height: 38,
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  plusSymbol: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    marginLeft: 2,
  },
  totalBadge: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 0.5,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginLeft: 6,
  },
  totalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },
});
