import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, TrendingUp, Calendar, Dumbbell, Award, ArrowUpRight, Flame } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useUnit } from '@/context/UnitContext';
import { translateExerciseName, translateMuscleGroup } from '@/lib/workoutTranslator';
import { supabase } from '@/lib/supabase';

interface ExerciseHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
  muscleGroup: string;
  userId: string;
}

interface HistorySessionRecord {
  date: string;
  maxWeightKg: number;
  maxReps: number;
  totalSets: number;
  bestSetDescription: string;
}

export default function ExerciseHistoryModal({
  visible,
  onClose,
  exerciseId,
  exerciseName,
  muscleGroup,
  userId,
}: ExerciseHistoryModalProps) {
  const { language } = useLanguage();
  const { unit, toDisplayWeight } = useUnit();

  const [records, setRecords] = useState<HistorySessionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible && exerciseId && userId) {
      fetchExerciseHistory();
    }
  }, [visible, exerciseId, userId]);

  const fetchExerciseHistory = async () => {
    setLoading(true);
    try {
      // 1. Obtener sesiones anteriores del alumno
      const { data: sessionsData, error: sessErr } = await supabase
        .from('workout_sessions')
        .select('id, scheduled_date, completed_at, status')
        .eq('client_id', userId)
        .order('scheduled_date', { ascending: false })
        .limit(10);

      if (sessErr) throw sessErr;

      if (!sessionsData || sessionsData.length === 0) {
        setRecords([]);
        return;
      }

      const sessionIds = sessionsData.map((s) => s.id);

      // 2. Obtener los logs de series registradas para este ejercicio
      const { data: logSetsData, error: logsErr } = await supabase
        .from('workout_log_sets')
        .select(`
          session_id,
          set_number,
          reps_completed,
          weight_kg,
          is_completed,
          routine_exercise_set:routine_exercise_set_id (
            routine_exercise:routine_exercise_id (
              exercise_id
            )
          )
        `)
        .in('session_id', sessionIds)
        .eq('is_completed', true);

      if (logsErr) {
        console.warn('Could not query logs directly:', logsErr);
      }

      // Agrupar por sesión
      const sessionsMap = new Map<string, { date: string; sets: { weight_kg: number; reps: number }[] }>();

      (sessionsData || []).forEach((s) => {
        sessionsMap.set(s.id, {
          date: s.completed_at ? s.completed_at.split('T')[0] : s.scheduled_date,
          sets: [],
        });
      });

      (logSetsData || []).forEach((log: any) => {
        const exIdInSet = log.routine_exercise_set?.routine_exercise?.exercise_id;
        if (exIdInSet === exerciseId && sessionsMap.has(log.session_id)) {
          sessionsMap.get(log.session_id)!.sets.push({
            weight_kg: Number(log.weight_kg) || 0,
            reps: Number(log.reps_completed) || 0,
          });
        }
      });

      const parsedRecords: HistorySessionRecord[] = [];

      sessionsMap.forEach((entry) => {
        if (entry.sets.length > 0) {
          let maxW = 0;
          let bestR = 0;
          entry.sets.forEach((s) => {
            if (s.weight_kg > maxW || (s.weight_kg === maxW && s.reps > bestR)) {
              maxW = s.weight_kg;
              bestR = s.reps;
            }
          });

          parsedRecords.push({
            date: entry.date,
            maxWeightKg: maxW,
            maxReps: bestR,
            totalSets: entry.sets.length,
            bestSetDescription: `${maxW} kg × ${bestR} reps`,
          });
        }
      });

      setRecords(parsedRecords);
    } catch (err) {
      console.warn('Error fetching exercise history:', err);
    } finally {
      setLoading(false);
    }
  };

  const allTimeRecordKg = records.reduce(
    (max, r) => (r.maxWeightKg > max ? r.maxWeightKg : max),
    0
  );

  // Cronología ordenada (de la sesión más antigua a la más reciente)
  const chronologicalRecords = [...records].reverse();
  const firstSession = chronologicalRecords[0];
  const latestSession = chronologicalRecords[chronologicalRecords.length - 1];

  const initialWeightDisplay = firstSession ? Math.round(toDisplayWeight(firstSession.maxWeightKg)) : 0;
  const latestWeightDisplay = latestSession ? Math.round(toDisplayWeight(latestSession.maxWeightKg)) : 0;

  const diffWeightDisplay = latestWeightDisplay - initialWeightDisplay;
  const growthPercent =
    initialWeightDisplay > 0
      ? Math.round((diffWeightDisplay / initialWeightDisplay) * 100)
      : 0;

  const maxWeightInChart = Math.max(
    1,
    ...chronologicalRecords.map((r) => Math.round(toDisplayWeight(r.maxWeightKg)))
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tag}>
                <TrendingUp size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>SOBRECARGA PROGRESIVA & RÉCORDS</Text>
              </View>
              <Text style={styles.title} numberOfLines={1}>
                {translateExerciseName(exerciseName, language)}
              </Text>
              <Text style={styles.subtitle}>
                {translateMuscleGroup(muscleGroup, language)}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Tarjeta de Récord Personal (PR) */}
            {allTimeRecordKg > 0 && (
              <View style={styles.prCard}>
                <View style={styles.prBadge}>
                  <Award size={18} color="#f59e0b" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.prLabel}>TU MEJOR MARCA HISTÓRICA</Text>
                  <Text style={styles.prValue}>
                    {toDisplayWeight(allTimeRecordKg)} {unit.toUpperCase()}
                  </Text>
                </View>
              </View>
            )}

            {/* Línea de Tiempo y Gráfica de Sobrecarga Progresiva */}
            {chronologicalRecords.length >= 2 && (
              <View style={styles.chartCard}>
                <View style={styles.chartHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.chartBadge}>
                      <TrendingUp size={11} color="#10b981" style={{ marginRight: 4 }} />
                      <Text style={styles.chartBadgeText}>LÍNEA DE TIEMPO DE PROGRESIÓN</Text>
                    </View>
                    <Text style={styles.chartTitle}>
                      {growthPercent > 0
                        ? `+${growthPercent}% de Ganancia de Fuerza`
                        : growthPercent === 0
                        ? 'Carga Estable y Consolidada'
                        : `${growthPercent}% Ajuste Técnico de Carga`}
                    </Text>
                    <Text style={styles.chartSub}>
                      Inicio: {initialWeightDisplay} {unit.toUpperCase()} ➔ Actual: {latestWeightDisplay} {unit.toUpperCase()}
                      {diffWeightDisplay > 0 && ` (+${diffWeightDisplay} ${unit.toUpperCase()})`}
                    </Text>
                  </View>

                  {growthPercent > 0 && (
                    <View style={styles.growthPill}>
                      <ArrowUpRight size={14} color="#10b981" />
                      <Text style={styles.growthPillText}>+{diffWeightDisplay} {unit}</Text>
                    </View>
                  )}
                </View>

                {/* Barras y Nodos de la Gráfica de Progresión */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chartBarsContainer}
                >
                  {chronologicalRecords.map((item, idx) => {
                    const w = Math.round(toDisplayWeight(item.maxWeightKg));
                    const prevItem = idx > 0 ? chronologicalRecords[idx - 1] : null;
                    const prevW = prevItem ? Math.round(toDisplayWeight(prevItem.maxWeightKg)) : w;
                    const isIncrease = w > prevW;
                    const isMax = w === maxWeightInChart && maxWeightInChart > 0;
                    const barHeight = Math.max(26, Math.round((w / maxWeightInChart) * 105));
                    const dateFormatted = item.date.length > 5 ? item.date.slice(5) : item.date;

                    return (
                      <View key={`chart-point-${idx}`} style={styles.chartColumn}>
                        <View style={styles.barTopBadge}>
                          {isMax ? (
                            <Flame size={11} color="#f59e0b" />
                          ) : isIncrease ? (
                            <Text style={styles.arrowUp}>↑</Text>
                          ) : (
                            <Text style={styles.arrowSame}>-</Text>
                          )}
                          <Text style={[styles.barWeightText, isMax && styles.barWeightTextMax]}>
                            {w}
                          </Text>
                        </View>

                        <View style={styles.barWrapper}>
                          <View
                            style={[
                              styles.barFill,
                              { height: barHeight },
                              isMax
                                ? styles.barFillMax
                                : isIncrease
                                ? styles.barFillIncrease
                                : styles.barFillRegular,
                            ]}
                          />
                        </View>

                        <Text style={styles.barDateText}>{dateFormatted}</Text>
                        <Text style={styles.barRepsText}>{item.maxReps}r</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            <Text style={styles.sectionHeading}>HISTORIAL POR SESIONES:</Text>

            {loading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="small" color="#38bdf8" />
                <Text style={styles.loadingText}>Cargando marcas anteriores...</Text>
              </View>
            ) : records.length === 0 ? (
              <View style={styles.emptyBox}>
                <Dumbbell size={38} color="#475569" />
                <Text style={styles.emptyTitle}>Primera vez con este ejercicio</Text>
                <Text style={styles.emptySub}>
                  Cuando completes tus series de hoy y finalices la sesión, tus pesos quedarán registrados aquí para monitorear tu sobrecarga progresiva.
                </Text>
              </View>
            ) : (
              <View style={styles.recordsList}>
                {records.map((r, idx) => {
                  const isPR = r.maxWeightKg === allTimeRecordKg && allTimeRecordKg > 0;
                  return (
                    <View key={`hist-${idx}`} style={styles.recordCard}>
                      <View style={styles.recordHeader}>
                        <View style={styles.dateRow}>
                          <Calendar size={13} color="#94a3b8" style={{ marginRight: 6 }} />
                          <Text style={styles.dateText}>{r.date}</Text>
                        </View>
                        {isPR && (
                          <View style={styles.recordPrPill}>
                            <Award size={10} color="#f59e0b" style={{ marginRight: 3 }} />
                            <Text style={styles.recordPrText}>RÉCORD</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.recordMainRow}>
                        <View>
                          <Text style={styles.recordWeight}>
                            {toDisplayWeight(r.maxWeightKg)} {unit.toUpperCase()}
                          </Text>
                          <Text style={styles.recordReps}>
                            Máximo a {r.maxReps} repeticiones ({r.totalSets} series registradas)
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeActionBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.closeActionBtnText}>Cerrar Historial</Text>
            </TouchableOpacity>
          </View>
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
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '88%',
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
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  content: {
    padding: 20,
  },
  prCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  prBadge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  prValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  chartCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
  },
  chartHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  chartBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  chartBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 0.5,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  chartSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  growthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 2,
  },
  growthPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10b981',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 14,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  chartColumn: {
    alignItems: 'center',
    minWidth: 44,
  },
  barTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 4,
  },
  arrowUp: {
    fontSize: 9,
    fontWeight: '900',
    color: '#10b981',
  },
  arrowSame: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
  },
  barWeightText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  barWeightTextMax: {
    color: '#f59e0b',
    fontWeight: '900',
  },
  barWrapper: {
    height: 110,
    width: 22,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: 14,
    borderRadius: 6,
  },
  barFillRegular: {
    backgroundColor: 'rgba(56, 189, 248, 0.65)',
  },
  barFillIncrease: {
    backgroundColor: '#10b981',
  },
  barFillMax: {
    backgroundColor: '#f59e0b',
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  barDateText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
    marginTop: 6,
  },
  barRepsText: {
    fontSize: 8.5,
    color: '#64748b',
    fontWeight: '700',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  recordsList: {
    gap: 10,
  },
  recordCard: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  recordPrPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  recordPrText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
  },
  recordMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordWeight: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  recordReps: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  centerBox: {
    alignItems: 'center',
    paddingVertical: 30,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  closeActionBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  closeActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
