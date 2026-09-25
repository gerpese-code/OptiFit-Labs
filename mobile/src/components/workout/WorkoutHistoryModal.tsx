import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Calendar,
  Clock,
  Flame,
  Dumbbell,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Download,
  RotateCcw,
  Sparkles,
} from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLanguage } from '@/context/LanguageContext';
import { useUnit } from '@/context/UnitContext';
import { supabase } from '@/lib/supabase';
import { WorkingExerciseItem } from '@/lib/routineProgression';

interface WorkoutHistorySession {
  id: string;
  date: string;
  dayName: string;
  routineTitle?: string;
  muscleGroup?: string;
  status: 'completed' | 'partial' | string;
  durationMinutes: number;
  exerciseMinutes?: number;
  restMinutes?: number;
  volumeKg: number;
  caloriesBurned: number;
  completionRate: number;
  exercises: {
    exercise_id?: string;
    name: string;
    muscle_group?: string;
    image_url?: string | null;
    sets: {
      routine_exercise_set_id?: string | null;
      set_number: number;
      reps: number;
      weight?: number;
      weight_kg: number;
      rpe?: number | null;
      completed?: boolean;
      is_completed?: boolean;
      is_extra?: boolean;
    }[];
  }[];
}

interface WorkoutHistoryModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  onLoadRoutineIntoSession?: (exercises: WorkingExerciseItem[], dayName?: string) => void;
}

export default function WorkoutHistoryModal({
  visible,
  onClose,
  userId,
  onLoadRoutineIntoSession,
}: WorkoutHistoryModalProps) {
  const { language } = useLanguage();
  const { unit, toDisplayWeight, formatWeight } = useUnit();

  const [sessions, setSessions] = useState<WorkoutHistorySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSessionIds, setExpandedSessionIds] = useState<Set<string>>(new Set());

  const toggleExpand = (sessionId: string) => {
    setExpandedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  };

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    try {
      // 1. Consultar historial local de respaldo rápido
      const localKey = `@fitnesspro_workout_history_${userId}`;
      const localRaw = await AsyncStorage.getItem(localKey);
      let localSessions: WorkoutHistorySession[] = [];
      if (localRaw) {
        try {
          localSessions = JSON.parse(localRaw);
        } catch (_) {}
      }

      // 2. Consultar sesiones en Supabase
      const { data: dbSessions, error } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', userId)
        .in('status', ['completed', 'partial'])
        .order('created_at', { ascending: false })
        .limit(40);

      if (!error && dbSessions && dbSessions.length > 0) {
        const sessionIds = dbSessions.map((s) => s.id);

        // Consultar log sets para enriquecer las sesiones que no tengan exercises en notes
        const { data: logSets } = await supabase
          .from('workout_log_sets')
          .select('id, session_id, set_number, reps_completed, weight_kg, rpe, is_completed, routine_exercise_set_id')
          .in('session_id', sessionIds)
          .order('set_number', { ascending: true });

        // Mapear routine_exercise_sets a nombres de ejercicios
        const setIds = (logSets || []).map((s) => s.routine_exercise_set_id).filter(Boolean);
        const setExerciseMap: Record<string, { exerciseId: string; name: string; muscleGroup?: string; img?: string | null }> = {};

        if (setIds.length > 0) {
          const { data: rxSets } = await supabase
            .from('routine_exercise_sets')
            .select('id, routine_exercises ( id, exercise_id, exercise:exercise_id ( id, name, muscle_group, image_urls, gif_url ) )')
            .in('id', setIds);

          (rxSets || []).forEach((item: any) => {
            const ex = item.routine_exercises?.exercise;
            if (item.routine_exercises?.exercise_id) {
              setExerciseMap[item.id] = {
                exerciseId: item.routine_exercises.exercise_id,
                name: ex?.name || 'Ejercicio',
                muscleGroup: ex?.muscle_group || 'General',
                img: ex?.image_urls?.[0] || ex?.gif_url || null,
              };
            }
          });
        }

        const logSetsBySession: Record<string, any[]> = {};
        (logSets || []).forEach((ls) => {
          if (!logSetsBySession[ls.session_id]) {
            logSetsBySession[ls.session_id] = [];
          }
          logSetsBySession[ls.session_id].push(ls);
        });

        const mapped: WorkoutHistorySession[] = dbSessions.map((s) => {
          let parsed: any = null;
          if (s.notes) {
            try {
              parsed = typeof s.notes === 'string' ? JSON.parse(s.notes) : s.notes;
            } catch (_) {}
          }

          let sessionExercises: any[] = [];
          if (parsed?.exercises && Array.isArray(parsed.exercises) && parsed.exercises.length > 0) {
            sessionExercises = parsed.exercises;
          } else {
            // Reconstruir desde workout_log_sets
            const setsForThisSession = logSetsBySession[s.id] || [];
            const exGroupMap: Record<string, any> = {};

            setsForThisSession.forEach((ls) => {
              const matched = ls.routine_exercise_set_id ? setExerciseMap[ls.routine_exercise_set_id] : null;
              const exKey = matched?.exerciseId || 'extra-ex';
              const exName = matched?.name || 'Ejercicio Registrado';
              const exMg = matched?.muscleGroup || 'General';
              const exImg = matched?.img || null;

              if (!exGroupMap[exKey]) {
                exGroupMap[exKey] = {
                  exercise_id: exKey,
                  name: exName,
                  muscle_group: exMg,
                  image_url: exImg,
                  sets: [],
                };
              }

              exGroupMap[exKey].sets.push({
                routine_exercise_set_id: ls.routine_exercise_set_id || null,
                set_number: ls.set_number,
                reps: ls.reps_completed,
                weight_kg: ls.weight_kg,
                rpe: ls.rpe,
                completed: ls.is_completed,
                is_completed: ls.is_completed,
              });
            });

            sessionExercises = Object.values(exGroupMap);
          }

          const rawDate = s.completed_at || s.created_at || s.scheduled_date;
          return {
            id: s.id,
            date: rawDate,
            dayName: parsed?.dayName || (typeof s.notes === 'string' && !parsed ? s.notes : 'Entrenamiento'),
            routineTitle: parsed?.routineTitle,
            muscleGroup: parsed?.muscle_group,
            status: s.status || 'completed',
            durationMinutes: s.duration_minutes || parsed?.total_minutes || 0,
            exerciseMinutes: parsed?.exercise_minutes,
            restMinutes: parsed?.rest_minutes,
            volumeKg: parsed?.volume_kg || 0,
            caloriesBurned: parsed?.calories_burned || 0,
            completionRate: s.completion_rate || 100,
            exercises: sessionExercises,
          };
        });

        setSessions(mapped);
        await AsyncStorage.setItem(localKey, JSON.stringify(mapped));
      } else if (localSessions.length > 0) {
        setSessions(localSessions);
      } else {
        setSessions([]);
      }
    } catch (e) {
      console.warn('Error fetching workout history:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [userId]);

  useEffect(() => {
    if (visible && userId) {
      setLoading(true);
      fetchHistory();
    }
  }, [visible, userId, fetchHistory]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString(language === 'es' ? 'es-ES' : 'en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (_) {
      return dateStr;
    }
  };

  const handleLoadRoutine = (session: WorkoutHistorySession) => {
    if (!onLoadRoutineIntoSession || session.exercises.length === 0) return;

    Alert.alert(
      language === 'es' ? '¿Cargar esta Rutina?' : 'Load this Routine?',
      language === 'es'
        ? `¿Deseas transferir los ${session.exercises.length} ejercicios y pesos de esta sesión al entrenamiento de hoy?`
        : `Transfer all ${session.exercises.length} exercises and weights from this session to today's workout?`,
      [
        { text: language === 'es' ? 'Cancelar' : 'Cancel', style: 'cancel' },
        {
          text: language === 'es' ? 'Cargar Rutina' : 'Load Routine',
          style: 'default',
          onPress: () => {
            const mappedExercises: WorkingExerciseItem[] = session.exercises.map((ex, exIdx) => ({
              id: `hist-ex-${exIdx}-${Date.now()}`,
              exercise_id: ex.exercise_id || `hist-exId-${exIdx}`,
              exercise: {
                id: ex.exercise_id || `hist-exId-${exIdx}`,
                name: ex.name,
                muscle_group: ex.muscle_group || 'General',
                image_urls: ex.image_url ? [ex.image_url] : [],
                gif_url: ex.image_url || null,
              },
              notes: null,
              sets: (ex.sets || []).map((st, sIdx) => ({
                id: `hist-set-${sIdx}-${Date.now()}`,
                routine_exercise_set_id: st.routine_exercise_set_id || null,
                set_number: st.set_number || sIdx + 1,
                target_reps: st.reps || 10,
                target_weight_kg: st.weight_kg ?? (st.weight || 0),
                target_rpe: st.rpe ?? null,
                rest_seconds: 90,
                is_extra: st.is_extra || false,
              })),
            }));

            onLoadRoutineIntoSession(mappedExercises, session.dayName);
            onClose();
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        {/* Cabecera del Modal */}
        <View style={styles.header}>
          <View style={styles.headerTitleContainer}>
            <View style={styles.headerIconBox}>
              <Calendar size={20} color="#10b981" />
            </View>
            <View>
              <Text style={styles.headerTitle}>
                {language === 'es' ? 'Historial de Entrenamiento' : 'Workout History'}
              </Text>
              <Text style={styles.headerSubtitle}>
                {language === 'es'
                  ? 'Registro completo de tus sesiones, pesos y series'
                  : 'Complete log of your completed sessions and sets'}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Contador rápido */}
        <View style={styles.statsBar}>
          <Text style={styles.statsBarText}>
            {language === 'es' ? 'Total Registradas: ' : 'Total Logged: '}
            <Text style={styles.statsBarHighlight}>{sessions.length}</Text>
          </Text>
        </View>

        {/* Contenido principal */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10b981" />
            <Text style={styles.loadingText}>
              {language === 'es' ? 'Cargando historial...' : 'Loading history...'}
            </Text>
          </View>
        ) : sessions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Dumbbell size={48} color="#334155" style={{ marginBottom: 12 }} />
            <Text style={styles.emptyTitle}>
              {language === 'es' ? 'Sin entrenamientos registrados' : 'No workouts logged yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {language === 'es'
                ? 'Completa tu primer entrenamiento y pulsa "Finalizar" para que aparezca en este historial.'
                : 'Complete your first workout and tap "Finish" to record it here.'}
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.listContainer}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
            }
          >
            {sessions.map((session) => {
              const isExpanded = expandedSessionIds.has(session.id);
              const totalSetsCount = session.exercises.reduce(
                (acc, ex) => acc + (ex.sets?.length || 0),
                0
              );
              const completedSetsCount = session.exercises.reduce(
                (acc, ex) => acc + (ex.sets || []).filter((s) => s.completed || s.is_completed).length,
                0
              );

              return (
                <View key={session.id} style={styles.sessionCard}>
                  {/* Fila Superior de la Tarjeta */}
                  <View style={styles.cardHeader}>
                    <View style={styles.dateAndBadge}>
                      <Text style={styles.dateText}>{formatDate(session.date)}</Text>
                      <View
                        style={[
                          styles.statusBadge,
                          session.status === 'completed'
                            ? styles.statusBadgeCompleted
                            : styles.statusBadgePartial,
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            session.status === 'completed'
                              ? styles.statusTextCompleted
                              : styles.statusTextPartial,
                          ]}
                        >
                          {session.status === 'completed'
                            ? (language === 'es' ? 'Completado' : 'Completed')
                            : (language === 'es' ? 'Parcial' : 'Partial')}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.dayTitle}>{session.dayName}</Text>
                    {session.routineTitle && (
                      <Text style={styles.routineTitleText}>{session.routineTitle}</Text>
                    )}
                  </View>

                  {/* Fila de Métricas Clave */}
                  <View style={styles.metricsRow}>
                    <View style={styles.metricItem}>
                      <Clock size={14} color="#38bdf8" />
                      <Text style={styles.metricLabel}>{session.durationMinutes} min</Text>
                    </View>
                    <View style={styles.metricItem}>
                      <Dumbbell size={14} color="#a855f7" />
                      <Text style={styles.metricLabel}>
                        {session.volumeKg > 0 ? formatWeight(session.volumeKg) : '---'}
                      </Text>
                    </View>
                    <View style={styles.metricItem}>
                      <CheckCircle2 size={14} color="#10b981" />
                      <Text style={styles.metricLabel}>
                        {completedSetsCount > 0 ? `${completedSetsCount} series` : `${totalSetsCount} series`}
                      </Text>
                    </View>
                    {session.caloriesBurned > 0 && (
                      <View style={styles.metricItem}>
                        <Flame size={14} color="#f59e0b" />
                        <Text style={styles.metricLabel}>{session.caloriesBurned} kcal</Text>
                      </View>
                    )}
                  </View>

                  {/* Acciones de la Tarjeta */}
                  <View style={styles.cardActionsRow}>
                    <TouchableOpacity
                      style={styles.expandToggleBtn}
                      onPress={() => toggleExpand(session.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.expandToggleBtnText}>
                        {isExpanded
                          ? (language === 'es' ? 'Ocultar Desglose' : 'Hide Breakdown')
                          : (language === 'es' ? `Ver Desglose (${session.exercises.length} ejercicios)` : `View Breakdown (${session.exercises.length} exercises)`)}
                      </Text>
                      {isExpanded ? (
                        <ChevronUp size={16} color="#10b981" />
                      ) : (
                        <ChevronDown size={16} color="#94a3b8" />
                      )}
                    </TouchableOpacity>

                    {onLoadRoutineIntoSession && session.exercises.length > 0 && (
                      <TouchableOpacity
                        style={styles.loadRoutineBtn}
                        onPress={() => handleLoadRoutine(session)}
                        activeOpacity={0.7}
                      >
                        <RotateCcw size={13} color="#38bdf8" style={{ marginRight: 4 }} />
                        <Text style={styles.loadRoutineBtnText}>
                          {language === 'es' ? 'Cargar esta Rutina' : 'Load Routine'}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Desglose Expandido de Ejercicios y Series */}
                  {isExpanded && (
                    <View style={styles.breakdownContainer}>
                      {session.exercises.map((ex, exIdx) => {
                        const doneCount = (ex.sets || []).filter(
                          (s) => s.completed || s.is_completed
                        ).length;

                        return (
                          <View key={exIdx} style={styles.exerciseBreakdownCard}>
                            {/* Cabecera del ejercicio */}
                            <View style={styles.exCardHeader}>
                              {ex.image_url ? (
                                <Image
                                  source={{ uri: ex.image_url }}
                                  style={styles.exThumb}
                                  resizeMode="cover"
                                />
                              ) : (
                                <View style={styles.exThumbPlaceholder}>
                                  <Dumbbell size={16} color="#64748b" />
                                </View>
                              )}
                              <View style={{ flex: 1, marginLeft: 10 }}>
                                <Text style={styles.exNameText} numberOfLines={2}>
                                  {ex.name}
                                </Text>
                                {ex.muscle_group && (
                                  <Text style={styles.exMuscleText}>{ex.muscle_group}</Text>
                                )}
                              </View>
                              <View style={styles.exDoneBadge}>
                                <Text style={styles.exDoneBadgeText}>
                                  {doneCount}/{ex.sets?.length || 0}
                                </Text>
                              </View>
                            </View>

                            {/* Tabla de series */}
                            <View style={styles.setsTable}>
                              <View style={styles.tableHeaderRow}>
                                <Text style={[styles.tableColHeader, { flex: 1 }]}>
                                  {language === 'es' ? 'Serie' : 'Set'}
                                </Text>
                                <Text style={[styles.tableColHeader, { flex: 1.5 }]}>
                                  {language === 'es' ? 'Peso' : 'Weight'}
                                </Text>
                                <Text style={[styles.tableColHeader, { flex: 1.5 }]}>
                                  {language === 'es' ? 'Reps' : 'Reps'}
                                </Text>
                                <Text style={[styles.tableColHeader, { flex: 1, textAlign: 'right' }]}>
                                  {language === 'es' ? 'Estado' : 'Status'}
                                </Text>
                              </View>

                              {(ex.sets || []).map((s, sIdx) => {
                                const isDone = s.completed || s.is_completed;
                                const wKg = s.weight_kg ?? (s.weight || 0);

                                return (
                                  <View
                                    key={sIdx}
                                    style={[
                                      styles.tableRow,
                                      isDone && styles.tableRowCompleted,
                                    ]}
                                  >
                                    <Text style={[styles.tableCell, styles.setNumCell, { flex: 1 }]}>
                                      #{s.set_number || sIdx + 1}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.weightCell, { flex: 1.5 }]}>
                                      {formatWeight(wKg)}
                                    </Text>
                                    <Text style={[styles.tableCell, styles.repsCell, { flex: 1.5 }]}>
                                      {s.reps} reps
                                    </Text>
                                    <View style={[{ flex: 1, alignItems: 'flex-end' }]}>
                                      {isDone ? (
                                        <CheckCircle2 size={14} color="#10b981" />
                                      ) : (
                                        <Text style={styles.pendingText}>-</Text>
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
    backgroundColor: '#030712',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
    backgroundColor: '#0b0f19',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerIconBox: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#9ca3af',
    marginTop: 1,
  },
  closeBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#1f2937',
    marginLeft: 8,
  },
  statsBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#0d1322',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  statsBarText: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statsBarHighlight: {
    color: '#10b981',
    fontWeight: '900',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 14,
    gap: 12,
    paddingBottom: 40,
  },
  sessionCard: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: 10,
  },
  dateAndBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
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
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statusTextCompleted: {
    color: '#34d399',
  },
  statusTextPartial: {
    color: '#fbbf24',
  },
  dayTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#f8fafc',
  },
  routineTitleText: {
    fontSize: 12,
    color: '#38bdf8',
    fontWeight: '600',
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 14,
    marginBottom: 10,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#e2e8f0',
    fontWeight: '700',
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  expandToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  expandToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10b981',
  },
  loadRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  loadRoutineBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  breakdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 10,
  },
  exerciseBreakdownCard: {
    backgroundColor: '#0a0f1d',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 12,
    padding: 10,
  },
  exCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  exThumb: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#030712',
  },
  exThumbPlaceholder: {
    width: 34,
    height: 34,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
  },
  exNameText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f1f5f9',
  },
  exMuscleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  exDoneBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  exDoneBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34d399',
  },
  setsTable: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 6,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.5)',
  },
  tableColHeader: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(30, 41, 59, 0.3)',
  },
  tableRowCompleted: {
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  tableCell: {
    fontSize: 11,
    fontWeight: '600',
  },
  setNumCell: {
    color: '#94a3b8',
    fontWeight: '800',
  },
  weightCell: {
    color: '#f8fafc',
    fontWeight: '800',
  },
  repsCell: {
    color: '#34d399',
    fontWeight: '800',
  },
  pendingText: {
    color: '#475569',
    fontSize: 12,
  },
});
