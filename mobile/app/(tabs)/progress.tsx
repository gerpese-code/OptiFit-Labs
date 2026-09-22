import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Plus,
  Scale,
  Calendar,
  Check,
  X,
  Dumbbell,
  Play,
  Zap,
  RefreshCw,
  Flame,
  HeartPulse,
  Clock,
  History,
  Activity,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';
import { translateDayName, translateRoutineTitle } from '@/lib/workoutTranslator';
import { offlineQueue } from '@/lib/offlineQueue';
import { ClientMetric, WorkoutSession } from '@/types/database';
import AttendanceCalendar from '@/components/progress/AttendanceCalendar';
import WeightTrendChart from '@/components/progress/WeightTrendChart';
import CaloricExpenditureReport from '@/components/progress/CaloricExpenditureReport';
import DateRangeFilterBar, { DateRange, TimelinePreset } from '@/components/progress/DateRangeFilterBar';
import AccountInactiveLock from '@/components/common/AccountInactiveLock';
import GymBackground from '@/components/common/GymBackground';
import {
  getStoredBiometrics,
  getCalorieHistory,
  DailyCalorieRecord,
  UserBiometrics,
  DEFAULT_BIOMETRICS,
  calculateStrengthCalories,
} from '@/lib/calorieCalculator';

export default function ProgressScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { unit, toStandardKg, toDisplayWeight } = useUnit();
  const { t, language } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [metrics, setMetrics] = useState<ClientMetric[]>([]);
  const [biometrics, setBiometrics] = useState<UserBiometrics>(DEFAULT_BIOMETRICS);
  const [calorieHistory, setCalorieHistory] = useState<DailyCalorieRecord[]>([]);

  const [todayWorkout, setTodayWorkout] = useState<{
    session_id?: string;
    dayName: string;
    routineTitle?: string;
    duration_minutes: number;
    completion_rate: number;
    completedSetsCount: number;
    totalSetsCount: number;
    totalVolumeKg: number;
    calories_burned?: number;
    strength_calories?: number;
    cardio_calories?: number;
    status: 'completed' | 'partial';
  } | null>(null);

  // Modal para registrar peso
  const [isLogWeightOpen, setIsLogWeightOpen] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [savingWeight, setSavingWeight] = useState(false);

  // Timeline y Rango de Fechas
  const computeInitialRange = (): DateRange => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const start = new Date();
    start.setDate(today.getDate() - 30);
    return {
      preset: '30d',
      start: start.toISOString().split('T')[0],
      end: todayStr,
      label: language === 'en' ? 'Last 30 Days' : 'Últimos 30 Días',
    };
  };

  const [activeRange, setActiveRange] = useState<DateRange>(computeInitialRange);

  const computeDateRange = (preset: TimelinePreset, customStart?: string, customEnd?: string): DateRange => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    if (preset === 'all') {
      return {
        preset: 'all',
        start: '2020-01-01',
        end: todayStr,
        label: language === 'en' ? 'All Time' : 'Todo el Historial',
      };
    }

    if (preset === 'custom' && customStart && customEnd) {
      return {
        preset: 'custom',
        start: customStart,
        end: customEnd,
        label: `${customStart} → ${customEnd}`,
      };
    }

    let days = 30;
    let label = language === 'en' ? 'Last 30 Days' : 'Últimos 30 Días';
    if (preset === '7d') {
      days = 7;
      label = language === 'en' ? 'Last 7 Days' : 'Últimos 7 Días';
    } else if (preset === '90d') {
      days = 90;
      label = language === 'en' ? 'Last 90 Days (3M)' : 'Últimos 90 Días (3M)';
    } else if (preset === '1y') {
      days = 365;
      label = language === 'en' ? 'Last 1 Year' : 'Último Año';
    }

    const startDate = new Date();
    startDate.setDate(today.getDate() - days);
    const startStr = startDate.toISOString().split('T')[0];

    return {
      preset,
      start: startStr,
      end: todayStr,
      label,
    };
  };

  const handleSelectPreset = (preset: TimelinePreset) => {
    setActiveRange(computeDateRange(preset));
  };

  const handleApplyCustomRange = (start: string, end: string) => {
    setActiveRange(computeDateRange('custom', start, end));
  };

  const loadProgressData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // 0. Sincronizar cualquier serie pendiente en cola offline
      await offlineQueue.syncQueue();

      // 1. Cargar historial de sesiones para el calendario desde Supabase
      const { data: sessionsData, error: sErr } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', user.id)
        .order('scheduled_date', { ascending: false });

      if (sErr) console.warn('Aviso cargando sesiones:', sErr);
      let mergedSessions: WorkoutSession[] = [...(sessionsData || [])];

      // 2. Cargar datos en vivo o locales de hoy
      const todayStr = new Date().toISOString().split('T')[0];
      const liveJson = await AsyncStorage.getItem('@fitnesspro_today_workout_live');
      const completedSetsJson = await AsyncStorage.getItem('@fitnesspro_completed_sets');

      let currentLive = liveJson ? JSON.parse(liveJson) : null;

      // Si no hay liveJson pero hay series guardadas en memoria local, reconstruir
      if (!currentLive && completedSetsJson) {
        try {
          const cSets = JSON.parse(completedSetsJson);
          const cKeys = Object.keys(cSets);
          if (cKeys.length > 0) {
            let volKg = 0;
            cKeys.forEach((k) => {
              const s = cSets[k];
              volKg += toStandardKg(s.weight || 0, unit) * (s.reps || 0);
            });
            currentLive = {
              dayName: 'Día 1: Torso, Fuerza & Control',
              routineTitle: 'Rutina Pro: Fuerza e Hipertrofia',
              duration_minutes: 15,
              completion_rate: Math.min(100, Math.round((cKeys.length / 12) * 100)),
              completedSetsCount: cKeys.length,
              totalSetsCount: 12,
              totalVolumeKg: volKg,
              status: cKeys.length >= 10 ? 'completed' : 'partial',
            };
          }
        } catch (e) {}
      }

      // Si aún no hay currentLive, verificar si la cola offline tiene series registradas
      if (!currentLive) {
        try {
          const queue = await offlineQueue.getQueue();
          const loggedSets = queue.filter((item) => item.type === 'LOG_SET');
          if (loggedSets.length > 0) {
            let volKg = 0;
            loggedSets.forEach((item) => {
              const s = item.payload;
              const w = s.weight_logged || s.weight_kg || 0;
              const r = s.reps_completed || 0;
              volKg += toStandardKg(w, s.unit_logged || unit) * r;
            });
            currentLive = {
              dayName: 'Día 1: Torso, Fuerza & Control',
              routineTitle: 'Rutina Pro: Fuerza e Hipertrofia',
              duration_minutes: Math.max(1, Math.round(loggedSets.length * 2.5)),
              completion_rate: Math.min(100, Math.round((loggedSets.length / 12) * 100)),
              completedSetsCount: loggedSets.length,
              totalSetsCount: 12,
              totalVolumeKg: volKg,
              status: loggedSets.length >= 10 ? 'completed' : 'partial',
            };
          }
        } catch (qErr) {
          console.warn('Aviso leyendo cola offline para progreso:', qErr);
        }
      }

      // Cargar datos fisiológicos y biometría para reportes
      const bio = await getStoredBiometrics();
      setBiometrics(bio);

      const calHist = await getCalorieHistory();
      setCalorieHistory(calHist);

      if (currentLive) {
        if (!currentLive.calories_burned) {
          const strKcal = calculateStrengthCalories(
            currentLive.duration_minutes || 15,
            currentLive.totalVolumeKg || 0,
            bio.weightKg
          );
          currentLive.calories_burned = strKcal;
          currentLive.strength_calories = strKcal;
          currentLive.cardio_calories = 0;
        }
        setTodayWorkout(currentLive);

        // Si la sesión de hoy no está en Supabase todavía, integrarla al calendario
        const exists = mergedSessions.some((s) => s.scheduled_date === todayStr);
        if (!exists && currentLive.completedSetsCount > 0) {
          mergedSessions.unshift({
            id: currentLive.session_id || 'today-local',
            client_id: user.id,
            routine_day_id: null,
            scheduled_date: todayStr,
            status: currentLive.status || 'partial',
            duration_minutes: currentLive.duration_minutes || 1,
            completion_rate: currentLive.completion_rate || 50,
            notes: currentLive.dayName,
            created_at: new Date().toISOString(),
          } as WorkoutSession);
        }
      }

      setSessions(mergedSessions);

      // 3. Cargar métricas de peso corporal
      const { data: metricsData, error: mErr } = await supabase
        .from('client_metrics')
        .select('*')
        .eq('client_id', user.id)
        .order('date', { ascending: true });

      if (mErr) throw mErr;
      setMetrics(metricsData || []);
    } catch (err) {
      console.error('Error al cargar progreso del alumno:', err);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [user])
  );

  const handleSaveWeight = async () => {
    if (!user) return;
    const weightVal = parseFloat(newWeight);
    if (!weightVal || weightVal <= 0) {
      Alert.alert(language === 'en' ? 'Error' : 'Error', language === 'en' ? 'Please enter a valid weight value.' : 'Ingresa un valor de peso válido.');
      return;
    }

    setSavingWeight(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const weightKg = toStandardKg(weightVal, unit);

      const { error } = await supabase.from('client_metrics').upsert(
        {
          client_id: user.id,
          date: todayStr,
          weight_logged: weightVal,
          unit_logged: unit,
          weight_kg: weightKg,
          notes: newNotes.trim() || null,
        },
        { onConflict: 'client_id,date' }
      );

      if (error) throw error;

      setIsLogWeightOpen(false);
      setNewWeight('');
      setNewNotes('');
      await loadProgressData();
    } catch (err: any) {
      Alert.alert(language === 'en' ? 'Error saving weight' : 'Error al guardar peso', err.message);
    } finally {
      setSavingWeight(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{t('progress.loading', 'Cargando tu progreso...')}</Text>
      </View>
    );
  }

  // Si el alumno está inactivo, mostrar pantalla de bloqueo
  if (profile && profile.is_active === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AccountInactiveLock sectionName="tus reportes y progreso" />
      </SafeAreaView>
    );
  }

  // Filtrar datos según el periodo / línea de tiempo seleccionada
  const filteredSessions = sessions.filter(
    (s) => s.scheduled_date >= activeRange.start && s.scheduled_date <= activeRange.end
  );

  const filteredMetrics = metrics.filter(
    (m) => m.date >= activeRange.start && m.date <= activeRange.end
  );

  const filteredCalorieHistory = calorieHistory.filter(
    (c) => c.date >= activeRange.start && c.date <= activeRange.end
  );

  const totalPeriodSessions = filteredSessions.length;
  const completedPeriodSessions = filteredSessions.filter(
    (s) => s.status === 'completed' || (s.completion_rate != null && s.completion_rate >= 80)
  ).length;
  const completionRatePct =
    totalPeriodSessions > 0 ? Math.round((completedPeriodSessions / totalPeriodSessions) * 100) : 0;
  const totalPeriodDurationMin = filteredSessions.reduce(
    (acc, s) => acc + (s.duration_minutes || 0),
    0
  );
  const totalPeriodHours = (totalPeriodDurationMin / 60).toFixed(1);
  const totalPeriodKcal = filteredCalorieHistory.reduce(
    (acc, c) => acc + (c.totalKcal || 0),
    0
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GymBackground />
      <View style={styles.topBar}>
        <View>
          <Text style={styles.screenSubtitle}>{t('progress.subtitle', 'ASISTENCIA Y MÉTRICAS')}</Text>
          <Text style={styles.screenTitle}>{t('progress.title', 'Mi Progreso')}</Text>
        </View>

        <TouchableOpacity
          style={styles.logWeightBtn}
          onPress={() => setIsLogWeightOpen(true)}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" style={{ marginRight: 4 }} />
          <Text style={styles.logWeightBtnText}>{t('progress.log_weight_btn', 'Pesarme Hoy')}</Text>
        </TouchableOpacity>
      </View>

      {/* Selector de Rango de Fechas / Línea de Tiempo */}
      <DateRangeFilterBar
        activeRange={activeRange}
        onSelectPreset={handleSelectPreset}
        onApplyCustomRange={handleApplyCustomRange}
        language={language as 'es' | 'en'}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta Resumen del Periodo */}
        <View style={styles.periodSummaryCard}>
          <View style={styles.periodSummaryHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TrendingUp size={14} color="#10b981" style={{ marginRight: 6 }} />
              <Text style={styles.periodSummaryTitle}>
                {language === 'en' ? 'PERIOD PERFORMANCE' : 'RESUMEN DEL PERIODO'}
              </Text>
            </View>
            <Text style={styles.periodSummarySubtitle}>{activeRange.label}</Text>
          </View>

          <View style={styles.periodStatsGrid}>
            <View style={styles.periodStatCard}>
              <Text style={styles.periodStatVal}>{totalPeriodSessions}</Text>
              <Text style={styles.periodStatLbl}>{language === 'en' ? 'Workouts' : 'Sesiones'}</Text>
            </View>
            <View style={styles.periodStatCard}>
              <Text style={[styles.periodStatVal, { color: '#10b981' }]}>{completionRatePct}%</Text>
              <Text style={styles.periodStatLbl}>{language === 'en' ? 'Completion' : 'Completado'}</Text>
            </View>
            <View style={styles.periodStatCard}>
              <Text style={styles.periodStatVal}>{totalPeriodHours}h</Text>
              <Text style={styles.periodStatLbl}>{language === 'en' ? 'Total Time' : 'Tiempo'}</Text>
            </View>
            <View style={styles.periodStatCard}>
              <Text style={[styles.periodStatVal, { color: '#f59e0b' }]}>
                {totalPeriodKcal > 0 ? totalPeriodKcal.toLocaleString() : '—'}
              </Text>
              <Text style={styles.periodStatLbl}>{language === 'en' ? 'Est. Kcal' : 'Kcal'}</Text>
            </View>
          </View>
        </View>

        {/* Tarjeta Destacada: Entrenamiento de Hoy */}
        {todayWorkout && todayWorkout.completedSetsCount > 0 ? (
          <View style={styles.todayCard}>
            <View style={styles.todayHeader}>
              <View style={styles.todayTitleCol}>
                <View style={styles.badgeRow}>
                  <View
                    style={[
                      styles.statusBadge,
                      todayWorkout.completion_rate >= 90
                        ? styles.statusBadgeSuccess
                        : styles.statusBadgeWarning,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        todayWorkout.completion_rate >= 90
                          ? styles.statusBadgeTextSuccess
                          : styles.statusBadgeTextWarning,
                      ]}
                    >
                      {todayWorkout.completion_rate >= 90
                        ? '✓ COMPLETADO'
                        : `EN CURSO (${todayWorkout.completion_rate}%)`}
                    </Text>
                  </View>
                  <Text style={styles.todayDateBadge}>{language === 'en' ? 'TODAY' : 'HOY'}</Text>
                </View>
                <Text style={styles.todayDayName}>{translateDayName(todayWorkout.dayName, language)}</Text>
                <Text style={styles.todayRoutineTitle}>{translateRoutineTitle(todayWorkout.routineTitle || '', language)}</Text>
              </View>

              <View style={styles.todayIconCircle}>
                <Dumbbell size={22} color="#10b981" />
              </View>
            </View>

            {/* Grid de 4 Métricas Rápidas */}
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>KCAL</Text>
                <Text style={[styles.statValue, { color: '#f59e0b' }]}>
                  {todayWorkout.calories_burned || 0}
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('home.stat_sets', 'SERIES')}</Text>
                <Text style={styles.statValue}>
                  {todayWorkout.completedSetsCount}
                  <Text style={styles.statSubValue}>
                    {todayWorkout.totalSetsCount > 0 ? ` / ${todayWorkout.totalSetsCount}` : ''}
                  </Text>
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('summary.time', 'TIEMPO')}</Text>
                <Text style={styles.statValue}>
                  {todayWorkout.duration_minutes || 1}
                  <Text style={styles.statSubValue}> min</Text>
                </Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>{t('home.stat_volume', 'VOLUMEN')}</Text>
                <Text style={styles.statValue}>
                  {toDisplayWeight(todayWorkout.totalVolumeKg || 0)}
                  <Text style={styles.statSubValue}> {unit.toUpperCase()}</Text>
                </Text>
              </View>
            </View>

            {todayWorkout.completion_rate < 90 && (
              <TouchableOpacity
                style={styles.continueBtn}
                onPress={() => router.push('/(tabs)')}
                activeOpacity={0.8}
              >
                <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.continueBtnText}>{language === 'en' ? 'Continue Workout' : 'Continuar Entrenamiento'}</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <View style={styles.noWorkoutCard}>
            <View style={styles.noWorkoutHeader}>
              <Zap size={18} color="#f59e0b" style={{ marginRight: 8 }} />
              <Text style={styles.noWorkoutTitle}>{language === 'en' ? 'No workout logged today' : 'Sin entrenamiento registrado hoy'}</Text>
            </View>
            <Text style={styles.noWorkoutDesc}>
              {language === 'en' ? 'Go to the Workout tab to start your routine and log your sets.' : 'Ve a la pestaña Entrenamiento para iniciar tu rutina y registrar tus series.'}
            </Text>
            <TouchableOpacity
              style={styles.startWorkoutBtn}
              onPress={() => router.push('/(tabs)')}
              activeOpacity={0.8}
            >
              <Play size={14} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.startWorkoutBtnText}>{language === 'en' ? 'Go to Workout' : 'Ir a Entrenar'}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Reporte de Gasto Calórico (Día / Semana / Mes) */}
        <CaloricExpenditureReport
          history={filteredCalorieHistory}
          todayWorkoutLive={todayWorkout}
          biometrics={biometrics}
        />

        {/* Calendario de Asistencia */}
        <AttendanceCalendar sessions={filteredSessions} />

        {/* Gráfico de Evolución de Peso */}
        <WeightTrendChart metrics={filteredMetrics} />

        {/* Línea de Tiempo de Entrenamientos del Periodo */}
        <View style={styles.timelineSection}>
          <View style={styles.timelineSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <History size={16} color="#10b981" style={{ marginRight: 6 }} />
              <Text style={styles.sectionTitle}>
                {language === 'en' ? 'Workout Timeline' : 'Línea de Tiempo'}
              </Text>
            </View>
            <View style={styles.timelineCountBadge}>
              <Text style={styles.timelineCountText}>
                {filteredSessions.length} {language === 'en' ? 'sessions' : 'sesiones'}
              </Text>
            </View>
          </View>

          {filteredSessions.length === 0 ? (
            <View style={styles.emptyTimelineBox}>
              <Clock size={24} color="#64748b" style={{ marginBottom: 8 }} />
              <Text style={styles.emptyTimelineTitle}>
                {language === 'en' ? 'No Sessions in this Period' : 'Sin Sesiones en este Periodo'}
              </Text>
              <Text style={styles.emptyTimelineDesc}>
                {language === 'en'
                  ? 'There are no completed or logged workouts within the selected date range.'
                  : 'No hay entrenamientos registrados en el rango de fechas seleccionado.'}
              </Text>
            </View>
          ) : (
            <View style={styles.timelineList}>
              {filteredSessions.map((session, index) => {
                const isCompleted =
                  session.status === 'completed' ||
                  (session.completion_rate != null && session.completion_rate >= 80);

                return (
                  <View key={session.id || `sess-${index}`} style={styles.timelineItem}>
                    {/* Indicador de Línea Vertical */}
                    <View style={styles.timelineLineCol}>
                      <View
                        style={[
                          styles.timelineNode,
                          isCompleted ? styles.timelineNodeCompleted : styles.timelineNodePartial,
                        ]}
                      >
                        <Check size={11} color={isCompleted ? '#ffffff' : '#f59e0b'} />
                      </View>
                      {index < filteredSessions.length - 1 && <View style={styles.timelineLine} />}
                    </View>

                    {/* Contenido de la Sesión */}
                    <View style={styles.timelineContentCard}>
                      <View style={styles.timelineCardTop}>
                        <Text style={styles.timelineDateText}>{session.scheduled_date}</Text>
                        <View
                          style={[
                            styles.timelineStatusBadge,
                            isCompleted ? styles.badgeSuccess : styles.badgePartial,
                          ]}
                        >
                          <Text
                            style={[
                              styles.timelineStatusText,
                              isCompleted ? styles.badgeTextSuccess : styles.badgeTextPartial,
                            ]}
                          >
                            {isCompleted
                              ? (language === 'en' ? 'COMPLETED' : 'COMPLETADO')
                              : (language === 'en' ? 'PARTIAL' : 'EN CURSO')}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.timelineItemTitle} numberOfLines={1}>
                        {session.notes
                          ? translateDayName(session.notes, language)
                          : (language === 'en' ? 'Workout Routine' : 'Rutina de Entrenamiento')}
                      </Text>

                      <View style={styles.timelineDetailsRow}>
                        <View style={styles.timelineDetailItem}>
                          <Clock size={12} color="#64748b" style={{ marginRight: 4 }} />
                          <Text style={styles.timelineDetailText}>
                            {session.duration_minutes || 0} min
                          </Text>
                        </View>
                        <View style={styles.timelineDetailItem}>
                          <Activity size={12} color="#10b981" style={{ marginRight: 4 }} />
                          <Text style={styles.timelineDetailText}>
                            {session.completion_rate || 0}%
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Modal para registrar peso corporal */}
      <Modal visible={isLogWeightOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <Scale size={20} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>{t('progress.log_weight_modal_title', 'Registrar Peso Corporal')}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsLogWeightOpen(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? `TODAY'S WEIGHT IN ${unit.toUpperCase()}` : `PESO HOY EN ${unit.toUpperCase()}`}
              </Text>
              <TextInput
                style={styles.weightInput}
                keyboardType="decimal-pad"
                placeholder={language === 'en' ? `e.g. ${unit === 'kg' ? '75.5' : '166'}` : `Ej. ${unit === 'kg' ? '75.5' : '166'}`}
                placeholderTextColor="#475569"
                value={newWeight}
                onChangeText={setNewWeight}
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                {language === 'en' ? 'NOTES (OPTIONAL)' : 'NOTAS (OPCIONAL)'}
              </Text>
              <TextInput
                style={styles.notesInput}
                placeholder={language === 'en' ? 'Fasting, post-workout...' : 'En ayunas, después de entrenar...'}
                placeholderTextColor="#475569"
                value={newNotes}
                onChangeText={setNewNotes}
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveWeight}
                disabled={savingWeight}
                activeOpacity={0.8}
              >
                {savingWeight ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <>
                    <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>{language === 'en' ? 'Save Weight Log' : 'Guardar Registro'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020503',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#020503',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(2, 6, 4, 0.94)',
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#00ff87',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  logWeightBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  logWeightBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#051209',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalBody: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  weightInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  notesInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 44,
    color: '#ffffff',
    fontSize: 13,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 48,
    marginTop: 20,
    marginBottom: 10,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  todayCard: {
    backgroundColor: '#051209',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 18,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  todayTitleCol: {
    flex: 1,
    paddingRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  statusBadgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  statusBadgeWarning: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.4)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  statusBadgeTextSuccess: {
    color: '#34d399',
  },
  statusBadgeTextWarning: {
    color: '#fbbf24',
  },
  todayDateBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  todayDayName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  todayRoutineTitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  todayIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
  },
  statSubValue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 10,
    borderRadius: 14,
    marginTop: 4,
  },
  continueBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  noWorkoutCard: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    marginBottom: 16,
  },
  noWorkoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  noWorkoutTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  noWorkoutDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 12,
    lineHeight: 16,
  },
  startWorkoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
  },
  startWorkoutBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
  },
  // Resumen del Periodo
  periodSummaryCard: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    marginBottom: 16,
  },
  periodSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  periodSummaryTitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#10b981',
  },
  periodSummarySubtitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  periodStatsGrid: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 8,
    justifyContent: 'space-between',
  },
  periodStatCard: {
    flex: 1,
    alignItems: 'center',
  },
  periodStatVal: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  periodStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  // Línea de Tiempo de Entrenamientos
  timelineSection: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  timelineSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  timelineCountBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timelineCountText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
  },
  emptyTimelineBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  emptyTimelineTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptyTimelineDesc: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
  },
  timelineList: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
  },
  timelineLineCol: {
    alignItems: 'center',
    width: 28,
    marginRight: 10,
  },
  timelineNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    zIndex: 2,
  },
  timelineNodeCompleted: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  timelineNodePartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    borderColor: '#f59e0b',
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#1e293b',
    marginVertical: 4,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 12,
  },
  timelineCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timelineDateText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  timelineStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgePartial: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  timelineStatusText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  badgeTextSuccess: {
    color: '#34d399',
  },
  badgeTextPartial: {
    color: '#fbbf24',
  },
  timelineItemTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  timelineDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timelineDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timelineDetailText: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
});
