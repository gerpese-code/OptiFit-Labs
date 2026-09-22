import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, Trash2, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react-native';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';
import { RoutineExerciseSet } from '@/types/database';

export interface WorkingSetItem {
  id: string;
  routine_exercise_set_id: string | null;
  set_number: number;
  target_reps: number;
  target_weight_kg: number;
  target_rpe: number | null;
  rest_seconds: number;
  is_extra?: boolean;
}

interface InteractiveSetRowProps {
  set: WorkingSetItem;
  isCompleted: boolean;
  onComplete: (reps: number, weightLogged: number, nextCompleted?: boolean) => void;
  onRemoveSet?: () => void;
  onLaunchTimer?: (restSeconds: number) => void;
  onChangeActual?: (reps: number, weight: number) => void;
}

export default function InteractiveSetRow({
  set,
  isCompleted,
  onComplete,
  onRemoveSet,
  onLaunchTimer,
  onChangeActual,
}: InteractiveSetRowProps) {
  const { unit, toDisplayWeight } = useUnit();
  const { t, language } = useLanguage();

  // Peso objetivo prescrito por el Coach en la unidad activa (números enteros redondos)
  const targetWeightInUnit = Math.round(toDisplayWeight(set.target_weight_kg || 0));
  const secondaryWeight = unit === 'lbs'
    ? `${Math.round(set.target_weight_kg || 0)} kg`
    : `${Math.round((set.target_weight_kg || 0) * 2.20462262)} lbs`;

  // Valores reales que el alumno puede modificar libremente (números enteros)
  const [actualReps, setActualReps] = useState(set.target_reps.toString());
  const [actualWeight, setActualWeight] = useState(targetWeightInUnit.toString());
  const prevUnitRef = React.useRef(unit);

  // Sincronizar si la serie cambia externamente (ej: restauración al plan original)
  React.useEffect(() => {
    setActualReps(set.target_reps.toString());
    setActualWeight(Math.round(toDisplayWeight(set.target_weight_kg || 0)).toString());
  }, [set.target_reps, set.target_weight_kg, unit]);

  // Autoconversión reactiva a números enteros si el alumno cambia de KG a LBS o viceversa
  React.useEffect(() => {
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

  // Comparativas objetivas vs reales (enteros)
  const repsDiff = repsNum - set.target_reps;
  const weightDiff = weightNum - targetWeightInUnit;

  const handleToggle = () => {
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
    }
  };

  return (
    <View style={[styles.row, isCompleted && styles.rowCompleted]}>
      {/* Columna Serie */}
      <View style={styles.setNumberCol}>
        <Text style={[styles.setNumberText, isCompleted && styles.textCompleted]}>
          #{set.set_number}
        </Text>
        {set.is_extra && (
          <View style={styles.extraBadge}>
            <Text style={styles.extraBadgeText}>EXTRA</Text>
          </View>
        )}
      </View>

      {/* Meta Prescrita por el Coach */}
      <View style={styles.targetCol}>
        <Text style={styles.targetLabel}>
          {set.is_extra ? t('workout.extra_set_label', 'SERIE AÑADIDA') : t('workout.coach_target_label', 'OBJETIVO COACH')}
        </Text>
        <Text style={styles.targetValue}>
          {set.target_reps} reps @ {targetWeightInUnit} {unit}
          {(set.target_weight_kg || 0) > 0 && (
            <Text style={styles.targetSecondary}> (~{secondaryWeight})</Text>
          )}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
          {set.target_rpe && (
            <Text style={styles.targetRpe}>RPE {set.target_rpe}</Text>
          )}
          <Text style={styles.restBadge}>
            ⏱️ {set.rest_seconds || 60}s desc.
          </Text>
        </View>

        {/* Indicador de Comparativa (si completó y hubo diferencia) */}
        {isCompleted && (repsDiff !== 0 || weightDiff !== 0) && (
          <View style={styles.diffRow}>
            {weightDiff !== 0 && (
              <Text
                style={[
                  styles.diffBadge,
                  weightDiff > 0 ? styles.diffPositive : styles.diffNegative,
                ]}
              >
                {weightDiff > 0 ? `+${weightDiff}` : weightDiff} {unit}
              </Text>
            )}
            {repsDiff !== 0 && (
              <Text
                style={[
                  styles.diffBadge,
                  repsDiff > 0 ? styles.diffPositive : styles.diffNegative,
                ]}
              >
                {repsDiff > 0 ? `+${repsDiff}` : repsDiff} reps
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Inputs Reales del Alumno (siempre editables para corregir cuando quiera) */}
      <View style={styles.inputsRow}>
        <View style={styles.inputBox}>
          <Text style={styles.inputSublabel}>{t('workout.reps_label', 'Reps')}</Text>
          <TextInput
            style={[styles.input, isCompleted && styles.inputCompleted]}
            keyboardType="number-pad"
            value={actualReps}
            onChangeText={handleRepsChange}
            selectTextOnFocus
          />
        </View>

        <View style={styles.inputBox}>
          <Text style={styles.inputSublabel}>
            {t('workout.weight_label', 'Peso ({unit})').replace('{unit}', unit)}
          </Text>
          <TextInput
            style={[styles.input, isCompleted && styles.inputCompleted]}
            keyboardType="number-pad"
            value={actualWeight}
            onChangeText={handleWeightChange}
            selectTextOnFocus
          />
        </View>
      </View>

      {/* Acciones: Botón Check (Toggle) y Eliminar Serie Extra */}
      <View style={styles.actionsCol}>
        <TouchableOpacity
          onPress={handleToggle}
          style={[styles.checkBtn, isCompleted && styles.checkBtnCompleted]}
          activeOpacity={0.7}
        >
          <Check
            size={18}
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
            <Trash2 size={13} color="#64748b" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  rowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  setNumberCol: {
    width: 32,
    alignItems: 'center',
  },
  setNumberText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#94a3b8',
    fontFamily: 'monospace',
  },
  textCompleted: {
    color: '#34d399',
  },
  extraBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
    marginTop: 2,
    borderWidth: 0.5,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  extraBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#38bdf8',
  },
  targetCol: {
    flex: 1,
    paddingHorizontal: 8,
  },
  targetLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  targetValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },
  targetSecondary: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
  },
  targetRpe: {
    fontSize: 10,
    color: '#34d399',
    fontWeight: '600',
  },
  restBadge: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '600',
    backgroundColor: '#1e293b',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  diffRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  diffBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  diffPositive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    color: '#38bdf8',
  },
  diffNegative: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    color: '#f59e0b',
  },
  inputsRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputBox: {
    alignItems: 'center',
  },
  inputSublabel: {
    fontSize: 9,
    color: '#64748b',
    marginBottom: 2,
    fontWeight: '600',
  },
  input: {
    width: 48,
    height: 34,
    backgroundColor: '#020617',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  inputCompleted: {
    borderColor: '#10b981',
    color: '#34d399',
  },
  actionsCol: {
    alignItems: 'center',
    marginLeft: 8,
    gap: 4,
  },
  checkBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBtnCompleted: {
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  removeBtn: {
    padding: 2,
  },
});
