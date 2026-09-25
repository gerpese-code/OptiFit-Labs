import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  History,
  Calendar,
  Dumbbell,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Layers,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useUnit } from '@/context/UnitContext';
import { translateExerciseName, translateMuscleGroup, translateDayName } from '@/lib/workoutTranslator';
import { supabase } from '@/lib/supabase';
import { WorkoutSession } from '@/types/database';

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  userId?: string;
}

interface DetailedExerciseItem {
  exercise_id?: string;
  name: string;
  muscle_group?: string;
  image_url?: string | null;
  sets: {
    set_number: number;
    reps: number;
    weight?: number;
    weight_kg?: number;
    unit?: string;
    completed?: boolean;
    is_completed?: boolean;
    rpe?: number | null;
  }[];
}

type FilterPreset = 'all' | '30d' | '7d';

export default function WorkoutHistoryModal({
  visible,
  onClose,
  userId,
}: WorkoutHistoryModalProps) {
  const { language, t } = useLanguage();
  const { unit, toDisplayWeight } = useUnit();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [filter, setFilter] = useState<FilterPreset>('all');
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());
  const [sessionExercisesMap, setSessionExercisesMap] = useState<Record<string, DetailedExerciseItem[]>>({});
  const [loadingSessionIds, setLoadingSessionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (visible && userId) {
      loadSessions();
    }
  }, [visible, userId]);

  const loadSessions = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', userId)
        .in('status', ['completed', 'partial'])
        .order('scheduled_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      const loaded = (data as WorkoutSession[]) || [];
      setSessions(loaded);

      // Pre-poblar caché de ejercicios si ya vienen en notes
      const initialMap: Record<string, DetailedExerciseItem[]> = {};
      loaded.forEach((s) => {
        if (s.notes) {
          try {
            const parsed = typeof s.notes === 'string' ? JSON.parse(s.notes) : s.notes;
            if (parsed.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
              initialMap[s.id] = parsed.exercises;
            }
          } catch (_) {}
        }
      });
      setSessionExercisesMap((prev) => ({ ...prev, ...initialMap }));
    } catch (err) {
      console.warn('Error al cargar historial de entrenamientos:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadSessions();
  };

  const toggleExpand = async (session: WorkoutSession) => {
    const isCurrentlyExpanded = expandedSessionIds.has(session.id);
    const newSet = new Set(expandedSessionIds);

    if (isCurrentlyExpanded) {
      newSet.delete(session.id);
      setExpandedSessionIds(newSet);
      return;
    }

    newSet.add(session.id);
    setExpandedSessionIds(newSet);

    // Si ya tenemos los ejercicios cacheados, no necesitamos buscar en la BD
    if (sessionExercisesMap[session.id] && sessionExercisesMap[session.id].length > 0) {
      return;
    }

    // Si no están en notes, consultar workout_log_sets como respaldo
    setLoadingSessionIds((prev) => new Set(prev).add(session.id));
    try {
      const { data: sets } = await supabase
        .from('workout_log_sets')
        .select(`
          id,
          routine_exercise_set_id,
          set_number,
          reps_completed,
          weight_kg,
          unit_logged,
          is_completed,
          rpe
        `)
        .eq('session_id', session.id)
        .order('set_number', { ascending: true });

      if (sets && sets.length > 0) {
        const setIds = sets.map((s: any) => s.routine_exercise_set_id).filter(Boolean);
        const setMap: Record<string, { exerciseId: string; name: string; muscleGroup: string; imgUrl: string | null }> = {};

        if (setIds.length > 0) {
          const { data: rxSets } = await supabase
            .from('routine_exercise_sets')
            .select(`
              id,
              routine_exercises (
                id,
                exercise_id,
                exercise:exercise_id (
                  id,
                  name,
                  muscle_group,
                  image_urls,
                  gif_url
                )
              )
            `)
            .in('id', setIds);

          (rxSets || []).forEach((item: any) => {
            const ex = item.routine_exercises?.exercise;
            if (ex) {
              setMap[item.id] = {
                exerciseId: ex.id,
                name: ex.name,
                muscleGroup: ex.muscle_group || 'General',
                imgUrl: ex.image_urls?.[0] || ex.gif_url || null,
              };
            }
          });
        }

        const groupedMap: Record<string, DetailedExerciseItem> = {};
        sets.forEach((st: any) => {
          const detail = st.routine_exercise_set_id ? setMap[st.routine_exercise_set_id] : null;
          const key = detail?.exerciseId || `set-${st.id}`;
          if (!groupedMap[key]) {
            groupedMap[key] = {
              exercise_id: detail?.exerciseId,
              name: detail?.name || 'Ejercicio',
              muscle_group: detail?.muscleGroup || 'General',
              image_url: detail?.imgUrl || null,
              sets: [],
            };
          }
          groupedMap[key].sets.push({
            set_number: st.set_number,
            reps: st.reps_completed,
            weight_kg: st.weight_kg,
            unit: st.unit_logged || 'kg',
            completed: st.is_completed,
            rpe: st.rpe,
          });
        });

        const list = Object.values(groupedMap);
        setSessionExercisesMap((prev) => ({ ...prev, [session.id]: list }));
      }
    } catch (e) {
      console.warn('Error al recuperar sets de la sesión:', e);
    } finally {
      setLoadingSessionIds((prev) => {
        const next = new Set(prev);
        next.delete(session.id);
        return next;
      });
    }
  };

  // Filtrado de sesiones
  const filteredSessions = useMemo(() => {
    if (filter === 'all') return sessions;

    const now = new Date();
    const daysLimit = filter === '7d' ? 7 : 30;
    const cutoff = new Date();
    cutoff.setDate(now.getDate() - daysLimit);
    const cutoffStr = cutoff.toISOString().split('T')[0];

    return sessions.filter((s) => s.scheduled_date >= cutoffStr);
  }, [sessions, filter]);

  // Métricas globales acumuladas
  const totalStats = useMemo(() => {
    let volumeKg = 0;
    let totalMinutes = 0;
    let completedCount = 0;

    sessions.forEach((s) => {
      if (s.status === 'completed') completedCount++;
      totalMinutes += s.duration_minutes || 0;
      if (s.notes) {
        try {
          const p = typeof s.notes === 'string' ? JSON.parse(s.notes) : s.notes;
          if (p.volume_kg) volumeKg += p.volume_kg;
        } catch (_) {}
      }
    });

    return {
      totalSessions: sessions.length,
      completedCount,
      totalMinutes,
      totalVolumeKg: Math.round(volumeKg),
    };
  }, [sessions]);

  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
      }
    } catch (_) {}
    return dateStr;
  };

  const formatWeightVal = (weightKg?: number) => {
    const w = weightKg || 0;
    const converted = toDisplayWeight(w);
    return `${Math.round(converted)} ${unit}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleWrap}>
            <View style={styles.headerIconBadge}>
              <History size={20} color="#10b981" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'es' ? 'Historial de Entrenamientos' : 'Workout History'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'es'
                  ? 'Registro detallado de rutinas, fechas, pesos y repeticiones'
                  : 'Detailed log of routines, dates, weights and reps'}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Global Summary Stats Cards */}
        <View style={styles.summaryBar}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryCardVal}>{totalStats.totalSessions}</Text>
            <Text style={styles.summaryCardLbl}>
              {language === 'es' ? 'Sesiones' : 'Workouts'}
            </Text>
          </View>
          <View style={styles.summaryCardDivider} />
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryCardVal, { color: '#38bdf8' }]}>
              {formatWeightVal(totalStats.totalVolumeKg)}
            </Text>
            <Text style={styles.summaryCardLbl}>
              {language === 'es' ? 'Volumen Total' : 'Total Volume'}
            </Text>
          </View>
          <View style={styles.summaryCardDivider} />
          <View style={styles.summaryCard}>
            <Text style={[styles.summaryCardVal, { color: '#f59e0b' }]}>
              {totalStats.totalMinutes} min
            </Text>
            <Text style={styles.summaryCardLbl}>
              {language === 'es' ? 'Tiempo Total' : 'Total Time'}
            </Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'all' && styles.filterPillActive]}
            onPress={() => setFilter('all')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, filter === 'all' && styles.filterPillTextActive]}>
              {language === 'es' ? 'Todas' : 'All'} ({sessions.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === '30d' && styles.filterPillActive]}
            onPress={() => setFilter('30d')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, filter === '30d' && styles.filterPillTextActive]}>
              {language === 'es' ? 'Últimos 30 días' : 'Last 30 days'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === '7d' && styles.filterPillActive]}
            onPress={() => setFilter('7d')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterPillText, filter === '7d' && styles.filterPillTextActive]}>
              {language === 'es' ? 'Últimos 7 días' : 'Last 7 days'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>
              {language === 'es' ? 'Cargando historial de entrenamientos...' : 'Loading workout history...'}
            </Text>
          </View>
        ) : filteredSessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Dumbbell size={48} color="#475569" strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              {language === 'es' ? 'Aún no hay sesiones registradas' : 'No workout sessions yet'}
            </Text>
            <Text style={styles.emptySub}>
              {language === 'es'
                ? 'Completa y finaliza tus entrenamientos para guardar y comparar tu progreso histórico aquí.'
                : 'Complete and finish your workouts to save and compare your historic progress here.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.sessionsList}
            contentContainerStyle={styles.sessionsListContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#10b981" />
            }
          >
            {filteredSessions.map((session) => {
              const isExpanded = expandedSessionIds.has(session.id);
              const isLoadingDetails = loadingSessionIds.has(session.id);
              const exercisesList = sessionExercisesMap[session.id] || [];

              let parsedNotes: any = null;
              if (session.notes) {
                try {
                  parsedNotes = typeof session.notes === 'string' ? JSON.parse(session.notes) : session.notes;
                } catch (_) {}
              }

              const routineTitle = parsedNotes?.routineTitle || '';
              const dayName = parsedNotes?.dayName || session.notes || (language === 'es' ? 'Sesión de Entrenamiento' : 'Workout Session');
              const muscleGroup = parsedNotes?.muscle_group || session.muscle_group || null;
              const totalSeconds = parsedNotes?.total_seconds || (session.duration_minutes || 0) * 60;
              const totalMin = Math.round(totalSeconds / 60);
              const exerciseMin = parsedNotes?.exercise_minutes ?? (parsedNotes?.exercise_seconds ? Math.round(parsedNotes.exercise_seconds / 60) : totalMin);
              const restMin = parsedNotes?.rest_minutes ?? (parsedNotes?.rest_seconds ? Math.round(parsedNotes.rest_seconds / 60) : 0);
              const caloriesVal = parsedNotes?.calories_burned ? `${parsedNotes.calories_burned} kcal` : '---';
              const volumeVal = parsedNotes?.volume_kg !== undefined ? formatWeightVal(parsedNotes.volume_kg) : '---';
              const isCompleted = session.status === 'completed';

              return (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Top card row: Date and status badge */}
                  <View style={styles.sessionCardHeader}>
                    <View style={styles.sessionDateWrap}>
                      <Calendar size={13} color="#10b981" style={{ marginRight: 5 }} />
                      <Text style={styles.sessionDateText}>
                        {formatDateDisplay(session.scheduled_date)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        isCompleted ? styles.statusBadgeCompleted : styles.statusBadgePartial,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          isCompleted ? styles.statusBadgeTextCompleted : styles.statusBadgeTextPartial,
                        ]}
                      >
                        {isCompleted
                          ? (language === 'es' ? 'COMPLETADO' : 'COMPLETED')
                          : (language === 'es' ? 'PARCIAL' : 'PARTIAL')}
                      </Text>
                    </View>
                  </View>

                  {/* Day name & routine */}
                  <View style={styles.sessionDayWrap}>
                    <Text style={styles.sessionDayName}>
                      {translateDayName(dayName, language)}
                    </Text>
                    {routineTitle ? (
                      <Text style={styles.sessionRoutineTitle}>{routineTitle}</Text>
                    ) : null}
                  </View>

                  {/* Muscle group badge if any */}
                  {muscleGroup && (
                    <View style={styles.mgBadge}>
                      <Text style={styles.mgBadgeText}>
                        {translateMuscleGroup(muscleGroup, language)}
                      </Text>
                    </View>
                  )}

                  {/* Metrics grid */}
                  <View style={styles.metricsGrid}>
                    <View style={styles.metricCell}>
                      <Clock size={12} color="#94a3b8" style={{ marginBottom: 2 }} />
                      <Text style={styles.metricVal}>{totalMin} min</Text>
                      <Text style={styles.metricSub}>
                        {exerciseMin}m ent / {restMin}m desc
                      </Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Dumbbell size={12} color="#38bdf8" style={{ marginBottom: 2 }} />
                      <Text style={[styles.metricVal, { color: '#38bdf8' }]}>{volumeVal}</Text>
                      <Text style={styles.metricSub}>
                        {language === 'es' ? 'Tonelaje' : 'Volume'}
                      </Text>
                    </View>
                    <View style={styles.metricCell}>
                      <Flame size={12} color="#f59e0b" style={{ marginBottom: 2 }} />
                      <Text style={[styles.metricVal, { color: '#f59e0b' }]}>{caloriesVal}</Text>
                      <Text style={styles.metricSub}>
                        {language === 'es' ? 'Quemadas' : 'Burned'}
                      </Text>
                    </View>
                    <View style={styles.metricCell}>
                      <TrendingUp size={12} color="#10b981" style={{ marginBottom: 2 }} />
                      <Text style={[styles.metricVal, { color: '#10b981' }]}>
                        {session.completion_rate || 0}%
                      </Text>
                      <Text style={styles.metricSub}>
                        {language === 'es' ? 'Completado' : 'Rate'}
                      </Text>
                    </View>
                  </View>

                  {/* Expand Exercises Button */}
                  <TouchableOpacity
                    style={[styles.expandBtn, isExpanded && styles.expandBtnActive]}
                    onPress={() => toggleExpand(session)}
                    activeOpacity={0.7}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Layers size={14} color={isExpanded ? '#10b981' : '#94a3b8'} />
                      <Text style={[styles.expandBtnText, isExpanded && styles.expandBtnTextActive]}>
                        {isExpanded
                          ? (language === 'es' ? 'Ocultar ejercicios y series' : 'Hide exercises and sets')
                          : (language === 'es' ? 'Ver ejercicios y series realizadas' : 'View exercises and sets')}
                      </Text>
                    </View>
                    {isExpanded ? (
                      <ChevronUp size={16} color="#10b981" />
                    ) : (
                      <ChevronDown size={16} color="#94a3b8" />
                    )}
                  </TouchableOpacity>

                  {/* Expanded Breakdown */}
                  {isExpanded && (
                    <View style={styles.expandedSection}>
                      {isLoadingDetails ? (
                        <View style={styles.loadingSetsWrap}>
                          <ActivityIndicator size="small" color="#10b981" />
                          <Text style={styles.loadingSetsText}>
                            {language === 'es' ? 'Cargando series realizadas...' : 'Loading completed sets...'}
                          </Text>
                        </View>
                      ) : exercisesList.length === 0 ? (
                        <View style={styles.emptySetsWrap}>
                          <Text style={styles.emptySetsText}>
                            {language === 'es'
                              ? 'No hay desglose detallado de series disponible para esta sesión.'
                              : 'No detailed sets breakdown available for this session.'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.exercisesBreakdownList}>
                          {exercisesList.map((ex, exIdx) => {
                            const completedSetsCount = (ex.sets || []).filter(
                              (s) => s.completed || s.is_completed
                            ).length;
                            const totalSetsCount = (ex.sets || []).length;
                            const isAllDone = completedSetsCount === totalSetsCount && totalSetsCount > 0;

                            return (
                              <View key={exIdx} style={styles.exerciseDetailCard}>
                                <View style={styles.exerciseDetailHeader}>
                                  {ex.image_url ? (
                                    <Image source={{ uri: ex.image_url }} style={styles.exerciseThumb} />
                                  ) : (
                                    <View style={styles.exerciseThumbPlaceholder}>
                                      <Dumbbell size={16} color="#64748b" />
                                    </View>
                                  )}
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.exerciseDetailName} numberOfLines={2}>
                                      {translateExerciseName(ex.name, language)}
                                    </Text>
                                    <Text style={styles.exerciseDetailMg}>
                                      {translateMuscleGroup(ex.muscle_group || 'General', language)}
                                    </Text>
                                  </View>
                                  <View
                                    style={[
                                      styles.exerciseProgressPill,
                                      isAllDone && styles.exerciseProgressPillDone,
                                    ]}
                                  >
                                    {isAllDone && (
                                      <CheckCircle2 size={10} color="#10b981" style={{ marginRight: 3 }} />
                                    )}
                                    <Text
                                      style={[
                                        styles.exerciseProgressPillText,
                                        isAllDone && styles.exerciseProgressPillTextDone,
                                      ]}
                                    >
                                      {completedSetsCount}/{totalSetsCount}
                                    </Text>
                                  </View>
                                </View>

                                {/* Sets Table */}
                                <View style={styles.setsTable}>
                                  <View style={styles.setsTableHeader}>
                                    <Text style={[styles.setsTableHeaderCell, { width: 45 }]}>
                                      {language === 'es' ? 'Serie' : 'Set'}
                                    </Text>
                                    <Text style={[styles.setsTableHeaderCell, { flex: 1 }]}>
                                      {language === 'es' ? 'Reps' : 'Reps'}
                                    </Text>
                                    <Text style={[styles.setsTableHeaderCell, { flex: 1.2 }]}>
                                      {language === 'es' ? 'Peso' : 'Weight'}
                                    </Text>
                                    <Text style={[styles.setsTableHeaderCell, { width: 50, textAlign: 'right' }]}>
                                      {language === 'es' ? 'Estado' : 'Status'}
                                    </Text>
                                  </View>

                                  {(ex.sets || []).map((sObj, sIdx) => {
                                    const isSetDone = sObj.completed || sObj.is_completed;
                                    const weightKg = sObj.weight_kg ?? (sObj.weight || 0);

                                    return (
                                      <View
                                        key={sIdx}
                                        style={[
                                          styles.setsTableRow,
                                          isSetDone && styles.setsTableRowDone,
                                        ]}
                                      >
                                        <Text style={[styles.setsTableCell, { width: 45, fontWeight: '700' }]}>
                                          #{sObj.set_number || sIdx + 1}
                                        </Text>
                                        <Text style={[styles.setsTableCell, { flex: 1, color: '#38bdf8', fontWeight: '800' }]}>
                                          {sObj.reps} reps
                                        </Text>
                                        <Text style={[styles.setsTableCell, { flex: 1.2, fontWeight: '800' }]}>
                                          {formatWeightVal(weightKg)}
                                        </Text>
                                        <View style={{ width: 50, alignItems: 'flex-end' }}>
                                          {isSetDone ? (
                                            <View style={styles.setDoneBadge}>
                                              <CheckCircle2 size={12} color="#10b981" />
                                            </View>
                                          ) : (
                                            <Text style={styles.setPendingText}>---</Text>
                                          )}
                                        </View>
                                      </View>
                                    );
                                  })}
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      )}
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0f1d',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  summaryCard: {
    flex: 1,
    alignItems: 'center',
  },
  summaryCardVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.2,
  },
  summaryCardLbl: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  summaryCardDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginVertical: 10,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  filterPillActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  filterPillTextActive: {
    color: '#10b981',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12.5,
    color: '#64748b',
    marginTop: 6,
    textAlign: 'center',
    lineHeight: 18,
  },
  sessionsList: {
    flex: 1,
  },
  sessionsListContent: {
    paddingHorizontal: 16,
    paddingBottom: 30,
    gap: 12,
  },
  sessionCard: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  sessionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sessionDateWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sessionDateText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
    textTransform: 'capitalize',
  },
  statusBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgePartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  statusBadgeTextCompleted: {
    color: '#10b981',
  },
  statusBadgeTextPartial: {
    color: '#f59e0b',
  },
  sessionDayWrap: {
    marginBottom: 6,
  },
  sessionDayName: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 20,
  },
  sessionRoutineTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 1,
  },
  mgBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
    marginBottom: 10,
  },
  mgBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 8,
    marginBottom: 10,
  },
  metricCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  metricVal: {
    fontSize: 12,
    fontWeight: '900',
    color: '#ffffff',
  },
  metricSub: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  expandBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  expandBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
  expandBtnTextActive: {
    color: '#10b981',
  },
  expandedSection: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 10,
  },
  loadingSetsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  loadingSetsText: {
    fontSize: 11.5,
    color: '#94a3b8',
  },
  emptySetsWrap: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  emptySetsText: {
    fontSize: 11.5,
    color: '#64748b',
    textAlign: 'center',
  },
  exercisesBreakdownList: {
    gap: 10,
  },
  exerciseDetailCard: {
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
  },
  exerciseDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exerciseThumb: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#1e293b',
  },
  exerciseThumbPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 6,
    marginRight: 8,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exerciseDetailName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  exerciseDetailMg: {
    fontSize: 10,
    color: '#64748b',
  },
  exerciseProgressPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  exerciseProgressPillDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  exerciseProgressPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#94a3b8',
  },
  exerciseProgressPillTextDone: {
    color: '#10b981',
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 6,
  },
  setsTableHeader: {
    flexDirection: 'row',
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  setsTableHeaderCell: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  setsTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  setsTableRowDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.05)',
  },
  setsTableCell: {
    fontSize: 11,
    color: '#e2e8f0',
  },
  setDoneBadge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  setPendingText: {
    fontSize: 10,
    color: '#475569',
  },
});
