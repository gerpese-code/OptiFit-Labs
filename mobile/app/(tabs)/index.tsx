import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  AppState,
  Linking,
  RefreshControl,
  Animated,
  BackHandler,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Play,
  Check,
  CheckCircle2,
  Dumbbell,
  Clock,
  Plus,
  RefreshCw,
  Flame,
  Activity,
  ClipboardList,
  RotateCcw,
  ShieldCheck,
  Zap,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Repeat,
  BookOpen,
  TrendingUp,
  Scale,
  Target,
  BicepsFlexed,
  MessageCircle,
  Edit3,
  History,
  User,
  Disc,
  Music,
} from 'lucide-react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';
import {
  translateExerciseName,
  translateMuscleGroup,
  translateRoutineTitle,
  translateDayName,
  translateWorkoutNotes,
  translateExerciseDescription,
} from '@/lib/workoutTranslator';
import OriginalRoutineModal from '@/components/workout/OriginalRoutineModal';
import ExerciseInventoryModal from '@/components/workout/ExerciseInventoryModal';
import CreateRoutineModal from '@/components/workout/CreateRoutineModal';
import CreateCustomExerciseModal from '@/components/workout/CreateCustomExerciseModal';
import BarbellCalculatorModal from '@/components/workout/BarbellCalculatorModal';
import ExerciseHistoryModal from '@/components/workout/ExerciseHistoryModal';
import WorkoutHistoryModal from '@/components/workout/WorkoutHistoryModal';
import RoutineSplitCard from '@/components/workout/RoutineSplitCard';
import MuscleGroupCard from '@/components/workout/MuscleGroupCard';
import GymBackground from '@/components/common/GymBackground';
import WorkoutMusicModal from '@/components/music/WorkoutMusicModal';
import WorkoutMusicWidget from '@/components/music/WorkoutMusicWidget';
import { getStoredAvatarUrl } from '@/lib/avatarService';
import {
  STANDARD_MUSCLE_GROUPS,
  PAIRED_MUSCLE_GROUP_ORDER,
  StandardMuscleGroup,
  MuscleGroupDefinition,
  isExerciseInMuscleGroup,
  filterRoutineExercisesByMuscleGroup,
} from '@/lib/constants/muscleGroups';
import {
  getUserPreferences,
  triggerHaptic,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from '@/lib/userPreferences';
import { setKeepScreenAwake } from '@/lib/keepAwake';
import {
  getProgressionOverrides,
  recordSessionProgression,
  clearProgressionOverrides,
  fetchLastCompletedSessionProgression,
  saveDayWorkoutSnapshot,
  loadDayWorkoutSnapshot,
  clearDayWorkoutSnapshot,
  syncRoutineExercisesToSupabase,
  DayProgressionOverrides,
} from '@/lib/routineProgression';
import { supabase } from '@/lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/context/AuthContext';
import { useUnit } from '@/context/UnitContext';
import { offlineQueue, SyncStatusEvent } from '@/lib/offlineQueue';
import { Routine, RoutineDay, RoutineExercise, WorkoutSession, Exercise } from '@/types/database';
import ExerciseMediaViewer from '@/components/workout/ExerciseMediaViewer';
import InteractiveSetRow, { WorkingSetItem } from '@/components/workout/InteractiveSetRow';
import FloatingRestTimer from '@/components/workout/FloatingRestTimer';
import WorkoutSummaryModal from '@/components/workout/WorkoutSummaryModal';
import CardioExtrasSection from '@/components/workout/CardioExtrasSection';
import AccountInactiveLock from '@/components/common/AccountInactiveLock';
import BioHackerPeptidesModal from '@/components/home/BioHackerPeptidesModal';
import CoachingVipModal from '@/components/home/CoachingVipModal';
import {
  getStoredBiometrics,
  saveStoredBiometrics,
  calculateStrengthCalories,
  logDailyCalories,
  UserBiometrics,
  CardioActivityItem,
  DEFAULT_BIOMETRICS,
} from '@/lib/calorieCalculator';
import { touchUserActivity } from '@/lib/activityTracker';


interface WorkingExerciseItem {
  id: string;
  exercise_id: string;
  exercise?: any;
  notes: string | null;
  sets: WorkingSetItem[];
}

export default function WorkoutScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const { unit, setUnit, toggleUnit, toStandardKg, toDisplayWeight } = useUnit();
  const { t, language, setLanguage } = useLanguage();

  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [showMusicModal, setShowMusicModal] = useState<boolean>(false);

  const [originalExercises, setOriginalExercises] = useState<WorkingExerciseItem[]>([]);
  const [progressionOverrides, setProgressionOverrides] = useState<DayProgressionOverrides>({});
  const [showOriginalModal, setShowOriginalModal] = useState(false);
  const [showBioHackerModal, setShowBioHackerModal] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showCreateRoutineModal, setShowCreateRoutineModal] = useState(false);
  const [routineToEdit, setRoutineToEdit] = useState<Routine | null>(null);
  const [routineDaysToEdit, setRoutineDaysToEdit] = useState<RoutineDay[] | null>(null);
  const [substitutingExerciseIndex, setSubstitutingExerciseIndex] = useState<number | null>(null);
  const [customizingExerciseIndex, setCustomizingExerciseIndex] = useState<number | null>(null);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);
  const [showWorkoutHistoryModal, setShowWorkoutHistoryModal] = useState(false);
  const [syncStatus, setSyncStatus] = useState<SyncStatusEvent>({
    isSyncing: false,
    isOnline: true,
    pendingCount: 0,
  });
  const [showSyncedToast, setShowSyncedToast] = useState(false);

  // Cambia el idioma y sincroniza las medidas del sistema (ESP -> kg / cm, ENG -> lbs / ft)
  const handleSelectLanguageAndUnits = async (selectedLang: 'es' | 'en') => {
    try {
      await setLanguage(selectedLang);
      const targetUnit = selectedLang === 'es' ? 'kg' : 'lbs';
      await setUnit(targetUnit);

      const currentBio = await getStoredBiometrics();
      const updatedBio: UserBiometrics = {
        ...currentBio,
        heightUnit: selectedLang === 'es' ? 'cm' : 'ft_in',
        unitPreference: targetUnit,
      };
      await saveStoredBiometrics(updatedBio);
      setBiometrics(updatedBio);
    } catch (e) {
      console.warn('Error cambiando idioma y medidas:', e);
    }
  };

  const [loading, setLoading] = useState(true);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [assignedRoutinesList, setAssignedRoutinesList] = useState<Routine[]>([]);
  const [routineDaysList, setRoutineDaysList] = useState<RoutineDay[]>([]);
  const [selectedRoutineDay, setSelectedRoutineDay] = useState<RoutineDay | null>(null);
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<StandardMuscleGroup | null>(null);
  const [completionCounts, setCompletionCounts] = useState<Record<string, number>>({});
  const [lastCompletedDates, setLastCompletedDates] = useState<Record<string, string>>({});
  const [totalCompletedWorkouts, setTotalCompletedWorkouts] = useState<number>(0);
  const [todayDay, setTodayDay] = useState<RoutineDay | null>(null);
  const [workingExercises, setWorkingExercises] = useState<WorkingExerciseItem[]>([]);
  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(null);

  // Biometría y actividades de cardio / extras
  const [biometrics, setBiometrics] = useState<UserBiometrics>(DEFAULT_BIOMETRICS);
  const [cardioActivities, setCardioActivities] = useState<CardioActivityItem[]>([]);

  // Estados de la sesión activa
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalRestSeconds, setTotalRestSeconds] = useState(0);
  const totalRestSecondsRef = useRef(0);
  const isRestingRef = useRef(false);

  // Mapa de series completadas { [setId]: { reps, weight, completed } }
  const [completedSets, setCompletedSets] = useState<{
    [setId: string]: { reps: number; weight: number; completed: boolean };
  }>({});

  // Cronómetro flotante de descanso ultra-preciso (con timestamp único para reset instantáneo)
  const [restTimerConfig, setRestTimerConfig] = useState<{ seconds: number; id: number } | null>(null);

  const handleLaunchRestTimer = (seconds: number) => {
    const sec = Math.max(1, seconds || 60);
    setRestTimerConfig({ seconds: sec, id: Date.now() });
    isRestingRef.current = true;
  };

  const handleDismissRestTimer = () => {
    setRestTimerConfig(null);
    isRestingRef.current = false;
  };

  const [isFallbackRoutine, setIsFallbackRoutine] = useState(false);

  // Modal de resumen final
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    durationMinutes: 0,
    exerciseMinutes: 0,
    restMinutes: 0,
    completionRate: 0,
    totalVolumeKg: 0,
    totalCaloriesBurned: 0,
  });

  // Preferencias de experiencia de entrenamiento
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Modales de herramientas de entrenamiento
  const [barbellModalVisible, setBarbellModalVisible] = useState(false);
  const [barbellInitialWeight, setBarbellInitialWeight] = useState<number>(60);
  const [barbellExName, setBarbellExName] = useState<string>('');

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyExId, setHistoryExId] = useState<string>('');
  const [historyExName, setHistoryExName] = useState<string>('');
  const [historyMuscleGroup, setHistoryMuscleGroup] = useState<string>('');

  // Cargar y refrescar preferencias y avatar cuando la pantalla se enfoca
  useFocusEffect(
    React.useCallback(() => {
      getUserPreferences().then(setPreferences).catch(() => {});
      if (user?.id) {
        getStoredAvatarUrl(user.id).then((url) => {
          if (url) setAvatarUrl(url);
        }).catch(() => {});
      }
    }, [user?.id])
  );

  // Escuchar estado de red y sincronización en segundo plano
  useEffect(() => {
    const unsubscribe = offlineQueue.subscribe((status) => {
      setSyncStatus((prev) => {
        if (prev.isSyncing && !status.isSyncing && status.pendingCount === 0) {
          setShowSyncedToast(true);
          setTimeout(() => setShowSyncedToast(false), 2500);
        }
        return status;
      });
    });
    return () => unsubscribe();
  }, []);

  // Mantener pantalla activa durante el entrenamiento si está activado en ajustes
  useEffect(() => {
    if (isSessionActive) {
      setKeepScreenAwake(true);
    } else {
      setKeepScreenAwake(false);
    }
    return () => {
      setKeepScreenAwake(false);
    };
  }, [isSessionActive]);

  // Animaciones continuas para el botón de BioHacker Peptides (Brillo, Titileo y Pulso)
  const peptideGlowAnim = useRef(new Animated.Value(0.35)).current;
  const peptideBlinkAnim = useRef(new Animated.Value(1)).current;
  const peptidePulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // 1. Efecto de brillo continuo en aura y fondo (Glow)
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(peptideGlowAnim, {
          toValue: 0.9,
          duration: 1300,
          useNativeDriver: true,
        }),
        Animated.timing(peptideGlowAnim, {
          toValue: 0.35,
          duration: 1300,
          useNativeDriver: true,
        }),
      ])
    );

    // 2. Titileo del badge de ancla (Blink / Sparkle)
    const blinkLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(peptideBlinkAnim, {
          toValue: 0.25,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(peptideBlinkAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );

    // 3. Pulso sutil de escala (Scale)
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(peptidePulseAnim, {
          toValue: 1.015,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(peptidePulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );

    glowLoop.start();
    blinkLoop.start();
    pulseLoop.start();

    return () => {
      glowLoop.stop();
      blinkLoop.stop();
      pulseLoop.stop();
    };
  }, [peptideGlowAnim, peptideBlinkAnim, peptidePulseAnim]);

  // Redirección a WhatsApp del Coach para consulta de Planes VIP Personalizados
  const handleOpenCoachWhatsApp = () => {
    triggerHaptic('tap');
    const message =
      language === 'en'
        ? "Hi Coach! 👋 I'm reaching out from the OptiFit Labs app 📱. I'd like to ask about the Personalized Training and Nutrition Plans to achieve my goals. Could you provide more details and available plans? Thank you!"
        : '¡Hola Coach! 👋 Vengo desde la app OptiFit Labs 📱. Quisiera consultar por los Planes Personalizados de Entrenamiento y Nutrición para alcanzar mi objetivo. ¿Podrías brindarme más información y opciones disponibles? ¡Muchas gracias!';
    const url = `https://wa.me/5493364254391?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp',
        language === 'en'
          ? 'Could not open WhatsApp automatically. You can write directly to +54 9 3364 25 4391.'
          : 'No se pudo abrir WhatsApp automáticamente. Puedes escribir directamente al +54 9 3364 25 4391.'
      );
    });
  };

  // Redirección a WhatsApp del Coach para solicitar Rutinas Personalizadas
  const handleRequestPersonalizedRoutineWhatsApp = () => {
    triggerHaptic('tap');
    const message =
      language === 'en'
        ? "Hi Coach! 👋 I'm writing from the OptiFit Labs app 📱. I'd like to request my personalized training routines. How can we get started? Thank you!"
        : '¡Hola Coach! 👋 Te escribo desde la app OptiFit Labs 📱. Quisiera solicitar mis rutinas de entrenamiento personalizadas. ¿Cómo podemos coordinar para armarlas? ¡Muchas gracias!';
    const url = `https://wa.me/5493364254391?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp',
        language === 'en'
          ? 'Could not open WhatsApp automatically. You can write directly to +54 9 3364 25 4391.'
          : 'No se pudo abrir WhatsApp automáticamente. Puedes escribir directamente al +54 9 3364 25 4391.'
      );
    });
  };

  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (isSessionActive && sessionStartTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - sessionStartTime) / 1000));
        if (isRestingRef.current) {
          setTotalRestSeconds((prev) => {
            const next = prev + 1;
            totalRestSecondsRef.current = next;
            return next;
          });
        }
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSessionActive, sessionStartTime]);

  // Auto-guardado continuo e inmediato ante salida de la pantalla o segundo plano
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState.match(/inactive|background/)) {
        if (isSessionActive && activeSession) {
          syncLiveSummary(completedSets, cardioActivities, elapsedSeconds, activeSession.id);
          AsyncStorage.setItem('@fitnesspro_completed_sets', JSON.stringify(completedSets));
          AsyncStorage.setItem('@fitnesspro_session_rest_seconds', totalRestSecondsRef.current.toString());
        }
      }
    });
    return () => subscription.remove();
  }, [isSessionActive, activeSession, completedSets, cardioActivities, elapsedSeconds]);

  // Rutina de demostración y contingencia completa para garantizar entrenamiento inmediato
  const DEFAULT_PRO_ROUTINE: Routine = {
    id: 'starter-pro-routine',
    client_id: user?.id || 'default',
    title: 'Rutina Pro: Fuerza e Hipertrofia',
    description: 'Programa oficial de iniciación y acondicionamiento prescrito por el sistema',
    is_template: true,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  const DEFAULT_PRO_DAY: RoutineDay = {
    id: 'starter-pro-day-1',
    routine_id: 'starter-pro-routine',
    name: 'Día 1: Torso, Fuerza & Control',
    day_number: 1,
    order_index: 0,
  };

  const DEFAULT_WORKING_EXERCISES: WorkingExerciseItem[] = [
    {
      id: 'starter-rx-1',
      exercise_id: 'ex-bench-press',
      notes: 'Retracción escapular activa y 1s de pausa en el pecho',
      exercise: {
        id: 'ex-bench-press',
        name: 'Press de Banca Plano con Barra',
        muscle_group: 'Pecho',
        description: 'Básico multiarticular para desarrollo de fuerza y masa en pectoral mayor.',
        image_urls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=60'],
        video_url: null,
        gif_url: null,
      },
      sets: [
        { id: 'starter-set-1-1', routine_exercise_set_id: null, set_number: 1, target_reps: 12, target_weight_kg: 50, target_rpe: 7.5, rest_seconds: 90, is_extra: false },
        { id: 'starter-set-1-2', routine_exercise_set_id: null, set_number: 2, target_reps: 10, target_weight_kg: 60, target_rpe: 8.5, rest_seconds: 90, is_extra: false },
        { id: 'starter-set-1-3', routine_exercise_set_id: null, set_number: 3, target_reps: 8, target_weight_kg: 70, target_rpe: 9.0, rest_seconds: 120, is_extra: false },
      ],
    },
    {
      id: 'starter-rx-2',
      exercise_id: 'ex-pullups',
      notes: 'Tirar con los codos y pecho hacia la barra con rango completo',
      exercise: {
        id: 'ex-pullups',
        name: 'Dominadas Pronas (Pull-ups)',
        muscle_group: 'Espalda',
        description: 'Constructor de amplitud dorsal. Iniciar desde depresión escapular.',
        image_urls: ['https://images.unsplash.com/photo-1598971639058-fab3c3109a00?w=800&auto=format&fit=crop&q=60'],
        video_url: null,
        gif_url: null,
      },
      sets: [
        { id: 'starter-set-2-1', routine_exercise_set_id: null, set_number: 1, target_reps: 10, target_weight_kg: 0, target_rpe: 8.0, rest_seconds: 90, is_extra: false },
        { id: 'starter-set-2-2', routine_exercise_set_id: null, set_number: 2, target_reps: 8, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 90, is_extra: false },
        { id: 'starter-set-2-3', routine_exercise_set_id: null, set_number: 3, target_reps: 6, target_weight_kg: 5, target_rpe: 9.5, rest_seconds: 120, is_extra: false },
      ],
    },
    {
      id: 'starter-rx-3',
      exercise_id: 'ex-squat',
      notes: 'Romper el paralelo controlando 3s en la bajada excéntrica',
      exercise: {
        id: 'ex-squat',
        name: 'Sentadilla Trasera con Barra',
        muscle_group: 'Cuádriceps',
        description: 'Patrón rey de empuje inferior. Bajar controlando y empujar el suelo con firmeza.',
        image_urls: ['https://images.unsplash.com/photo-1574680096145-d05b474e2155?w=800&auto=format&fit=crop&q=60'],
        video_url: null,
        gif_url: null,
      },
      sets: [
        { id: 'starter-set-3-1', routine_exercise_set_id: null, set_number: 1, target_reps: 10, target_weight_kg: 70, target_rpe: 8.0, rest_seconds: 120, is_extra: false },
        { id: 'starter-set-3-2', routine_exercise_set_id: null, set_number: 2, target_reps: 8, target_weight_kg: 80, target_rpe: 8.5, rest_seconds: 120, is_extra: false },
        { id: 'starter-set-3-3', routine_exercise_set_id: null, set_number: 3, target_reps: 6, target_weight_kg: 90, target_rpe: 9.0, rest_seconds: 150, is_extra: false },
      ],
    },
    {
      id: 'starter-rx-4',
      exercise_id: 'ex-lateral-raises',
      notes: 'Plano escapular a 30°, máxima tensión continua sin balancear',
      exercise: {
        id: 'ex-lateral-raises',
        name: 'Elevaciones Laterales con Mancuernas',
        muscle_group: 'Hombros',
        description: 'Anchura de hombros en el plano escapular con pausa arriba.',
        image_urls: ['https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&auto=format&fit=crop&q=60'],
        video_url: null,
        gif_url: null,
      },
      sets: [
        { id: 'starter-set-4-1', routine_exercise_set_id: null, set_number: 1, target_reps: 15, target_weight_kg: 10, target_rpe: 8.0, rest_seconds: 60, is_extra: false },
        { id: 'starter-set-4-2', routine_exercise_set_id: null, set_number: 2, target_reps: 12, target_weight_kg: 12, target_rpe: 8.5, rest_seconds: 60, is_extra: false },
        { id: 'starter-set-4-3', routine_exercise_set_id: null, set_number: 3, target_reps: 10, target_weight_kg: 14, target_rpe: 9.5, rest_seconds: 90, is_extra: false },
      ],
    },
  ];

  const setupWorkingExercisesForDay = async (
    selectedDay: RoutineDay,
    targetMuscleGroup?: StandardMuscleGroup | null
  ) => {
    // Si se especifica un grupo muscular objetivo (o el día tiene un grupo muscular explícito),
    // discriminamos y filtramos de forma estricta los ejercicios correspondientes a ese grupo
    let rawExercises = selectedDay.routine_exercises || [];
    const mgToFilter = targetMuscleGroup || (selectedDay.muscle_group as StandardMuscleGroup);
    if (mgToFilter && mgToFilter !== 'Cuerpo Completo') {
      const filtered = filterRoutineExercisesByMuscleGroup(rawExercises, mgToFilter);
      if (filtered.length > 0) {
        rawExercises = filtered;
      }
    }

    const tailoredDay: RoutineDay = {
      ...selectedDay,
      muscle_group: mgToFilter || selectedDay.muscle_group,
      routine_exercises: rawExercises,
    };
    setTodayDay(tailoredDay);

    const mapped: WorkingExerciseItem[] = rawExercises.map(
      (rx: any) => {
        let supersetMap: Record<number, { is_superset: boolean; superset_count: number; superset_reps: number[]; superset_weights_kg?: number[] }> = {};
        if (rx.notes && typeof rx.notes === 'string' && rx.notes.includes('[SUPERSET_CONFIG:')) {
          try {
            const match = rx.notes.match(/\[SUPERSET_CONFIG:(.*?)\]/);
            if (match && match[1]) {
              const list = JSON.parse(match[1]);
              list.forEach((item: any) => {
                supersetMap[item.set_number] = item;
              });
            }
          } catch (e) {}
        }

        return {
          id: rx.id,
          exercise_id: rx.exercise_id,
          exercise: rx.exercise,
          notes: rx.notes ? rx.notes.replace(/\[SUPERSET_CONFIG:.*?\]/g, '').trim() : null,
          sets: (rx.routine_exercise_sets || [])
            .sort((a: any, b: any) => a.set_number - b.set_number)
            .map((s: any) => {
              const ss = supersetMap[s.set_number];
              return {
                id: s.id,
                routine_exercise_set_id: s.id,
                set_number: s.set_number,
                target_reps: s.target_reps,
                target_weight_kg: s.target_weight_kg || 0,
                target_rpe: s.target_rpe,
                rest_seconds: s.rest_seconds || 90,
                is_extra: false,
                is_superset: ss ? ss.is_superset : false,
                superset_count: ss ? ss.superset_count : undefined,
                superset_reps: ss ? ss.superset_reps : undefined,
                superset_weights_kg: ss ? ss.superset_weights_kg : undefined,
              };
            }),
        };
      }
    );
    setOriginalExercises(mapped);

    // 1. Cargar snapshot de la última rutina realizada si el alumno personalizó ejercicios/series
    const routineTime = (selectedDay as any)?.updated_at || (activeRoutine as any)?.updated_at || null;
    const snapshot = await loadDayWorkoutSnapshot(user?.id || 'guest', selectedDay.id, supabase, routineTime);

    if (snapshot && snapshot.exercises && snapshot.exercises.length > 0) {
      const workingFromSnapshot: WorkingExerciseItem[] = snapshot.exercises.map((sx, idx) => ({
        id: sx.id || `snap-item-${idx}-${Date.now()}`,
        exercise_id: sx.exercise_id,
        exercise: sx.exercise,
        notes: sx.notes || null,
        sets: (sx.sets || []).map((s, sIdx) => ({
          id: s.id || `work-set-${sx.exercise_id || idx}-${s.set_number || sIdx + 1}-${sIdx}-${Date.now()}`,
          routine_exercise_set_id: s.routine_exercise_set_id || null,
          set_number: s.set_number || sIdx + 1,
          target_reps: s.target_reps,
          target_weight_kg: s.target_weight_kg,
          target_rpe: s.target_rpe ?? null,
          rest_seconds: s.rest_seconds || 90,
          is_extra: s.is_extra || false,
          is_superset: !!s.is_superset,
          superset_count: s.superset_count,
          superset_reps: s.superset_reps,
          superset_weights_kg: s.superset_weights_kg,
        })),
      }));

      // Si el coach añadió nuevos ejercicios a la rutina oficial que no estaban en el snapshot previo,
      // anexarlos automáticamente para que el alumno siempre disponga de los nuevos ejercicios asignados.
      const snapshotExIds = new Set(snapshot.exercises.map((sx) => sx.exercise_id));
      const newlyAddedFromRoutine = mapped.filter((rx) => rx.exercise_id && !snapshotExIds.has(rx.exercise_id));
      if (newlyAddedFromRoutine.length > 0) {
        workingFromSnapshot.push(...newlyAddedFromRoutine);
      }

      // Cargar también progressionOverrides para marcas visuales
      const overrides = await getProgressionOverrides(user?.id || 'guest', selectedDay.id);
      setProgressionOverrides(overrides);

      setWorkingExercises(workingFromSnapshot);
      await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(workingFromSnapshot));
      return;
    }

    // 2. Si no hay snapshot personalizado, cargar plantilla original combinada con overrides de progresión
    let overrides = await getProgressionOverrides(user?.id || 'guest', selectedDay.id);
    if ((!overrides || Object.keys(overrides).length === 0) && user?.id) {
      const dbOverrides = await fetchLastCompletedSessionProgression(user.id, selectedDay.id, supabase);
      if (dbOverrides && Object.keys(dbOverrides).length > 0) {
        overrides = dbOverrides;
      }
    }
    setProgressionOverrides(overrides);

    const merged: WorkingExerciseItem[] = mapped.map((rx) => {
      const exId = rx.exercise_id || rx.id;
      const ovr = overrides[exId];
      if (!ovr || !ovr.sets || ovr.sets.length === 0) {
        return rx;
      }
      return {
        ...rx,
        sets: ovr.sets.map((os, sIdx) => {
          const originalSet = rx.sets[sIdx];
          return {
            id: `prog-${exId}-${os.set_number}-${sIdx}`,
            routine_exercise_set_id: os.routine_exercise_set_id || originalSet?.routine_exercise_set_id || null,
            set_number: os.set_number,
            target_reps: os.target_reps,
            target_weight_kg: os.target_weight_kg,
            target_rpe: os.target_rpe,
            rest_seconds: os.rest_seconds || 90,
            is_extra: os.is_extra || false,
          };
        }),
      };
    });

    setWorkingExercises(merged);
    await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(merged));
  };

  const handleSelectRoutineDay = async (day: RoutineDay) => {
    triggerHaptic('tap');
    const matched = assignedRoutinesList.find((r) => r.id === day.routine_id);
    if (matched) setActiveRoutine(matched);
    await setupWorkingExercisesForDay(day);
    setSelectedRoutineDay(day);
    if (day.muscle_group) {
      setSelectedMuscleGroup(day.muscle_group as StandardMuscleGroup);
    }
  };

  const handleSelectMuscleGroup = async (
    muscleGroup: MuscleGroupDefinition,
    day?: RoutineDay | null
  ) => {
    triggerHaptic('tap');
    if (day && day.routine_exercises && day.routine_exercises.length > 0) {
      // Filtrar estrictamente los ejercicios para este grupo muscular específico
      const filtered = filterRoutineExercisesByMuscleGroup(day.routine_exercises, muscleGroup.id);
      const exercisesToUse = filtered.length > 0 ? filtered : day.routine_exercises;

      const matched = assignedRoutinesList.find((r) => r.id === day.routine_id);
      if (matched) setActiveRoutine(matched);

      const tailoredDay: RoutineDay = {
        ...day,
        muscle_group: muscleGroup.id,
        routine_exercises: exercisesToUse,
      };

      await setupWorkingExercisesForDay(tailoredDay, muscleGroup.id);
      setSelectedRoutineDay(tailoredDay);
      setSelectedMuscleGroup(muscleGroup.id);
    } else {
      const groupName = language === 'en' ? muscleGroup.nameEn : muscleGroup.nameEs;
      Alert.alert(
        groupName.toUpperCase(),
        language === 'en'
          ? `No routine assigned for ${groupName} yet. What would you like to do?`
          : `Aún no tienes una rutina asignada para ${groupName}. ¿Qué deseas hacer?`,
        [
          { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
          {
            text: language === 'en' ? '📚 View Catalog' : '📚 Explorar Catálogo',
            onPress: () => {
              setSubstitutingExerciseIndex(null);
              setShowInventoryModal(true);
            },
          },
          {
            text: language === 'en' ? '⚡ + Create Routine' : '⚡ + Crear Rutina',
            onPress: () => {
              setRoutineToEdit(null);
              setRoutineDaysToEdit(null);
              setShowCreateRoutineModal(true);
            },
          },
        ]
      );
    }
  };

  const handleBackToDashboard = async () => {
    triggerHaptic('tap');
    if (todayDay && user?.id && workingExercises.length > 0) {
      try {
        await saveDayWorkoutSnapshot(
          user.id,
          todayDay.id,
          workingExercises,
          completedSets,
          unit,
          toStandardKg,
          todayDay.name
        );
        syncRoutineExercisesToSupabase(supabase, todayDay.id, workingExercises).catch(() => {});
      } catch (e) {
        console.warn('Aviso guardando snapshot al salir:', e);
      }
    }
    setSelectedRoutineDay(null);
    setSelectedMuscleGroup(null);
    loadTodayWorkout();
  };

  const loadTodayWorkout = async () => {
    if (!user) {
      console.log('[DEBUG WORKOUT] No user logged in');
      return;
    }
    setLoading(true);
    try {
      // Cargar biometría y actividades de cardio registradas para hoy
      const bio = await getStoredBiometrics();
      setBiometrics(bio);

      const savedCardio = await AsyncStorage.getItem('@fitnesspro_active_cardio');
      if (savedCardio) {
        try {
          setCardioActivities(JSON.parse(savedCardio));
        } catch (e) {}
      }

      // Restaurar sesión activa y series completadas si la app se cerró o se minimizó
      const todayDateStr = new Date().toISOString().split('T')[0];
      const savedDate = await AsyncStorage.getItem('@fitnesspro_active_session_date');
      let savedSessionStr: string | null = await AsyncStorage.getItem('@fitnesspro_active_session');
      const savedSets = await AsyncStorage.getItem('@fitnesspro_completed_sets');
      if (savedSets) {
        try {
          setCompletedSets(JSON.parse(savedSets));
        } catch (e) {}
      }
      if (savedSessionStr) {
        try {
          const parsedSession = JSON.parse(savedSessionStr);
          setActiveSession(parsedSession);
          setIsSessionActive(true);
        } catch (e) {}
      }
      const savedStartTime = await AsyncStorage.getItem('@fitnesspro_session_start_time');
      if (savedStartTime) {
        const st = parseInt(savedStartTime, 10);
        if (!isNaN(st)) {
          setSessionStartTime(st);
          setElapsedSeconds(Math.max(1, Math.floor((Date.now() - st) / 1000)));
        }
      }
      const savedRest = await AsyncStorage.getItem('@fitnesspro_session_rest_seconds');
      if (savedRest) {
        const r = parseInt(savedRest, 10);
        if (!isNaN(r)) {
          setTotalRestSeconds(r);
          totalRestSecondsRef.current = r;
        }
      }

      // 0. Cargar desde la caché local (offline-first) para disponibilidad inmediata sin internet
      try {
        const [cachedRoutines, cachedDays, cachedCompletions] = await Promise.all([
          offlineQueue.getCachedAssignedRoutines(),
          offlineQueue.getCachedRoutineDays(),
          offlineQueue.getCachedCompletions(),
        ]);

        if (cachedRoutines && cachedRoutines.length > 0) {
          setAssignedRoutinesList(cachedRoutines);
          setActiveRoutine(cachedRoutines[0]);
        }
        if (cachedDays && cachedDays.length > 0) {
          setRoutineDaysList(cachedDays);
        }
        if (cachedCompletions) {
          setCompletionCounts(cachedCompletions.counts || {});
          setLastCompletedDates(cachedCompletions.dates || {});
          setTotalCompletedWorkouts(cachedCompletions.total || 0);
        }
      } catch (cacheErr) {
        console.warn('Aviso leyendo caché inicial:', cacheErr);
      }

      console.log('[DEBUG WORKOUT] Buscando rutinas asignadas en Supabase para:', user.id, user.email);
      // 1. Obtener todas las rutinas asignadas específicamente a este alumno y que estén activas
      const { data: routinesData, error: routineErr } = await supabase
        .from('routines')
        .select('*')
        .eq('client_id', user.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (routineErr) throw routineErr;

      const allActiveRoutines: Routine[] = (routinesData as Routine[]) || [];

      // 2. Si el coach no le ha asignado una rutina activa a este alumno:
      if (allActiveRoutines.length === 0) {
        console.log('[DEBUG WORKOUT] No hay rutinas activas asignadas por el coach para este alumno.');
        setActiveRoutine(null);
        setAssignedRoutinesList([]);
        setRoutineDaysList([]);
        setSelectedRoutineDay(null);
        setTodayDay(null);
        setOriginalExercises([]);
        setWorkingExercises([]);
        setIsFallbackRoutine(false);
        setLoading(false);
        await Promise.all([
          offlineQueue.cacheAssignedRoutines([]),
          offlineQueue.cacheRoutineDays([]),
        ]);
        return;
      }

      const targetRoutine = allActiveRoutines[0];
      console.log('[DEBUG WORKOUT] Rutinas activas asignadas cargadas:', allActiveRoutines.length, allActiveRoutines.map((r) => r.title));

      setAssignedRoutinesList(allActiveRoutines);
      setActiveRoutine(targetRoutine);
      setIsFallbackRoutine(false);

      // 3. Obtener todas las rutinas / grupos musculares asignados con sus ejercicios y series
      const activeRoutineIds = allActiveRoutines.map((r) => r.id);
      const { data: daysData, error: daysErr } = await supabase
        .from('routine_days')
        .select(`
          *,
          routine_exercises (
            *,
            exercise:exercise_id (*),
            routine_exercise_sets (*)
          )
        `)
        .in('routine_id', activeRoutineIds)
        .order('order_index', { ascending: true });

      if (daysErr) throw daysErr;

      if (daysData && daysData.length > 0) {
        const loadedDays = daysData as RoutineDay[];
        setRoutineDaysList(loadedDays);

        // 4. Obtener sesiones completadas por este alumno para los contadores (+1)
        const { data: userSessions } = await supabase
          .from('workout_sessions')
          .select('routine_day_id, notes, status, completed_at, created_at')
          .eq('client_id', user.id)
          .eq('status', 'completed');

        const counts: Record<string, number> = {};
        const dates: Record<string, string> = {};

        loadedDays.forEach((d) => {
          if (d.completion_count) counts[d.id] = d.completion_count;
          if (d.last_completed_at) dates[d.id] = d.last_completed_at;
          if (d.muscle_group) {
            if (d.completion_count) counts[d.muscle_group] = Math.max(counts[d.muscle_group] || 0, d.completion_count);
            if (d.last_completed_at) dates[d.muscle_group] = d.last_completed_at;
          }
        });

        (userSessions || []).forEach((s: any) => {
          const ts = s.completed_at || s.created_at;
          if (s.routine_day_id) {
            counts[s.routine_day_id] = (counts[s.routine_day_id] || 0) + 1;
            if (ts) {
              const prev = dates[s.routine_day_id];
              if (!prev || new Date(ts) > new Date(prev)) {
                dates[s.routine_day_id] = ts;
              }
            }
          }

          let sessMg = s.muscle_group;
          if (!sessMg && s.notes) {
            try {
              const parsedN = typeof s.notes === 'string' ? JSON.parse(s.notes) : s.notes;
              sessMg = parsedN?.muscle_group;
            } catch (e) {}
          }
          if (sessMg) {
            counts[sessMg] = (counts[sessMg] || 0) + 1;
            if (ts) {
              const prevM = dates[sessMg];
              if (!prevM || new Date(ts) > new Date(prevM)) {
                dates[sessMg] = ts;
              }
            }
          }
        });

        setCompletionCounts(counts);
        setLastCompletedDates(dates);
        setTotalCompletedWorkouts(userSessions?.length || 0);

        // Guardar en la caché local para persistencia offline absoluta
        await Promise.all([
          offlineQueue.cacheAssignedRoutines(allActiveRoutines),
          offlineQueue.cacheRoutineDays(loadedDays),
          offlineQueue.cacheCompletions({ counts, dates, total: userSessions?.length || 0 }),
        ]);

        // Pre-cargar catálogo de ejercicios en background si aún no está en caché local
        offlineQueue.getCachedExercises().then((cachedEx) => {
          if (!cachedEx || cachedEx.length === 0) {
            supabase
              .from('exercises')
              .select('*')
              .order('name', { ascending: true })
              .then(({ data: exData }) => {
                if (exData && exData.length > 0) {
                  offlineQueue.cacheExercises(exData);
                }
              });
          }
        });

        // Si había una sesión activa guardada, restaurar ese día de entrenamiento específico
        const savedDayId = await AsyncStorage.getItem('@fitnesspro_active_day_id');
        if (savedSessionStr || savedDayId) {
          try {
            const parsed = savedSessionStr ? JSON.parse(savedSessionStr) : null;
            const targetDayId = parsed?.routine_day_id || savedDayId;
            if (targetDayId) {
              const matchedDay = loadedDays.find((d) => d.id === targetDayId);
              if (matchedDay) {
                const matchedR = allActiveRoutines.find((r) => r.id === matchedDay.routine_id);
                if (matchedR) setActiveRoutine(matchedR);
                await setupWorkingExercisesForDay(matchedDay);
                setSelectedRoutineDay(matchedDay);
                return;
              }
            }
          } catch (e) {}
        }

        // Si no hay sesión activa en curso, permanecer en el Panel de Rutinas (selectedRoutineDay = null)
        setSelectedRoutineDay(null);
        return;
      }

      // 4. MODO CONTINGENCIA / ENTRENAMIENTO ACTIVO INMEDIATO:
      console.log('[DEBUG WORKOUT] Activando Rutina Pro de contingencia para entrenamiento inmediato');
      setActiveRoutine(DEFAULT_PRO_ROUTINE);
      setRoutineDaysList([DEFAULT_PRO_DAY]);
      setTodayDay(DEFAULT_PRO_DAY);
      setOriginalExercises(DEFAULT_WORKING_EXERCISES);

      const fallbackOverrides = await getProgressionOverrides(user?.id || 'guest', DEFAULT_PRO_DAY.id);
      setProgressionOverrides(fallbackOverrides);

      const mergedFallback: WorkingExerciseItem[] = DEFAULT_WORKING_EXERCISES.map((rx) => {
        const exId = rx.exercise_id || rx.id;
        const ovr = fallbackOverrides[exId];
        if (!ovr || !ovr.sets || ovr.sets.length === 0) {
          return rx;
        }
        return {
          ...rx,
          sets: ovr.sets.map((os, sIdx) => ({
            id: `prog-fb-${exId}-${os.set_number}-${sIdx}`,
            routine_exercise_set_id: null,
            set_number: os.set_number,
            target_reps: os.target_reps,
            target_weight_kg: os.target_weight_kg,
            target_rpe: os.target_rpe,
            rest_seconds: os.rest_seconds || 90,
            is_extra: os.is_extra || false,
          })),
        };
      });

      setWorkingExercises(mergedFallback);
      setIsFallbackRoutine(true);
    } catch (err) {
      console.warn('Operando en modo sin conexión (offline):', err);
      // Preservar datos asignados del alumno si ya existían en memoria local
      const cachedRoutines = await offlineQueue.getCachedAssignedRoutines();
      const cachedDays = await offlineQueue.getCachedRoutineDays();

      if (cachedRoutines && cachedRoutines.length > 0 && cachedDays && cachedDays.length > 0) {
        setAssignedRoutinesList(cachedRoutines);
        setActiveRoutine(cachedRoutines[0]);
        setRoutineDaysList(cachedDays);
        setIsFallbackRoutine(false);
      } else {
        // Fallback sólo si no hay ninguna rutina guardada en el dispositivo
        setActiveRoutine(DEFAULT_PRO_ROUTINE);
        setRoutineDaysList([DEFAULT_PRO_DAY]);
        setTodayDay(DEFAULT_PRO_DAY);
        setOriginalExercises(DEFAULT_WORKING_EXERCISES);
        setWorkingExercises(DEFAULT_WORKING_EXERCISES);
        setIsFallbackRoutine(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadTodayWorkout();
    } finally {
      setRefreshing(false);
    }
  };

  // Recargar rutinas y progreso cada vez que el usuario vuelve a la pestaña de entrenamiento
  useFocusEffect(
    React.useCallback(() => {
      loadTodayWorkout();
    }, [user])
  );

  // Manejo del botón físico / triángulo de navegación atrás de Android (Hardware Back Button)
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // 1. Si hay algún modal abierto, cerrarlo primero en lugar de cerrar la app
        if (showCustomizeModal) {
          setShowCustomizeModal(false);
          setCustomizingExerciseIndex(null);
          return true;
        }
        if (showCreateRoutineModal) {
          handleCloseCreateRoutineModal();
          return true;
        }
        if (showInventoryModal) {
          setShowInventoryModal(false);
          setSubstitutingExerciseIndex(null);
          return true;
        }
        if (showOriginalModal) {
          setShowOriginalModal(false);
          return true;
        }
        if (showBioHackerModal) {
          setShowBioHackerModal(false);
          return true;
        }
        if (showCoachingModal) {
          setShowCoachingModal(false);
          return true;
        }
        if (barbellModalVisible) {
          setBarbellModalVisible(false);
          return true;
        }
        if (historyModalVisible) {
          setHistoryModalVisible(false);
          return true;
        }
        if (showSummaryModal) {
          setShowSummaryModal(false);
          return true;
        }

        // 2. Si el usuario está visualizando una rutina / grupo muscular seleccionado
        if (selectedRoutineDay) {
          if (isSessionActive) {
            Alert.alert(
              language === 'en' ? 'Exit Workout?' : '¿Volver a Mis Rutinas?',
              language === 'en'
                ? 'Your workout session is active. Do you want to return to the routines dashboard? Your progress is saved.'
                : 'Tienes una sesión de entrenamiento activa. ¿Deseas volver a tus rutinas? Tu progreso quedará guardado.',
              [
                { text: language === 'en' ? 'Keep Training' : 'Continuar Entrenando', style: 'cancel' },
                {
                  text: language === 'en' ? 'Back to Routines' : 'Volver a Rutinas',
                  style: 'default',
                  onPress: () => handleBackToDashboard(),
                },
              ]
            );
            return true;
          } else {
            handleBackToDashboard();
            return true;
          }
        }

        // 3. En la pantalla principal sin rutina abierta, permitir navegación normal
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [
      showCustomizeModal,
      showCreateRoutineModal,
      showInventoryModal,
      showOriginalModal,
      showBioHackerModal,
      showCoachingModal,
      barbellModalVisible,
      historyModalVisible,
      showSummaryModal,
      selectedRoutineDay,
      isSessionActive,
      language,
    ])
  );

  useEffect(() => {
    loadTodayWorkout();
  }, [user]);

  // Agregar serie adicional en la sesión y persistir para las próximas sesiones
  const handleAddExtraSet = async (exIndex: number) => {
    const updated = [...workingExercises];
    const currentSets = updated[exIndex].sets;
    const lastSet = currentSets[currentSets.length - 1];

    const newSetNumber = currentSets.length + 1;
    const extraSetId = `extra-${Date.now()}-${newSetNumber}`;

    const newSet: WorkingSetItem = {
      id: extraSetId,
      routine_exercise_set_id: null,
      set_number: newSetNumber,
      target_reps: lastSet ? lastSet.target_reps : 10,
      target_weight_kg: lastSet ? lastSet.target_weight_kg : 20,
      target_rpe: lastSet ? lastSet.target_rpe : 8,
      rest_seconds: lastSet ? lastSet.rest_seconds : 90,
      is_extra: false,
    };

    updated[exIndex].sets.push(newSet);
    setWorkingExercises(updated);
    await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

    if (todayDay && user?.id) {
      await saveDayWorkoutSnapshot(
        user.id,
        todayDay.id,
        updated,
        completedSets,
        unit,
        toStandardKg,
        todayDay.name
      );
      syncRoutineExercisesToSupabase(supabase, todayDay.id, updated).catch(() => {});
    }
  };

  // Quitar una serie y persistir para las próximas sesiones
  const handleRemoveSet = async (exIndex: number, setIdx: number) => {
    const updated = [...workingExercises];
    const removedSet = updated[exIndex].sets[setIdx];
    updated[exIndex].sets = updated[exIndex].sets
      .filter((_, i) => i !== setIdx)
      .map((s, idx) => ({ ...s, set_number: idx + 1 }));
    setWorkingExercises(updated);
    await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

    if (removedSet) {
      const cSetsCopy = { ...completedSets };
      delete cSetsCopy[removedSet.id];
      setCompletedSets(cSetsCopy);
      await AsyncStorage.setItem('@fitnesspro_completed_sets', JSON.stringify(cSetsCopy));
    }

    if (todayDay && user?.id) {
      await saveDayWorkoutSnapshot(
        user.id,
        todayDay.id,
        updated,
        completedSets,
        unit,
        toStandardKg,
        todayDay.name
      );
      syncRoutineExercisesToSupabase(supabase, todayDay.id, updated).catch(() => {});
    }
  };

  const generateUUID = (): string => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };

  const isValidUUID = (str: string | null | undefined): boolean => {
    if (!str) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  };

  const handleStartSession = async (): Promise<WorkoutSession | null> => {
    if (!user || !todayDay) return null;

    const startTime = Date.now();
    setSessionStartTime(startTime);
    setIsSessionActive(true);
    setElapsedSeconds(0);
    setTotalRestSeconds(0);
    totalRestSecondsRef.current = 0;

    const todayDateStr = new Date().toISOString().split('T')[0];
    await AsyncStorage.setItem('@fitnesspro_active_session_date', todayDateStr);
    await AsyncStorage.setItem('@fitnesspro_session_start_time', startTime.toString());
    await AsyncStorage.setItem('@fitnesspro_session_rest_seconds', '0');
    const sessionId = generateUUID();

    const newSessionPayload = {
      id: sessionId,
      client_id: user.id,
      routine_day_id: isValidUUID(todayDay.id) ? todayDay.id : null,
      scheduled_date: todayDateStr,
      status: 'partial' as const,
      duration_minutes: 0,
      completion_rate: 0,
      notes: todayDay.name,
    };

    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .insert(newSessionPayload)
        .select()
        .single();

      if (error) throw error;
      const created = (data as WorkoutSession) || (newSessionPayload as WorkoutSession);
      setActiveSession(created);
      await AsyncStorage.setItem('@fitnesspro_active_session', JSON.stringify(created));
      touchUserActivity(user?.id);
      return created;
    } catch (err) {
      console.warn('Aviso al iniciar sesión en Supabase:', err);
      offlineQueue.enqueue({
        type: 'START_SESSION',
        payload: newSessionPayload,
      });
      setActiveSession(newSessionPayload as any);
      await AsyncStorage.setItem('@fitnesspro_active_session', JSON.stringify(newSessionPayload));
      return newSessionPayload as any;
    }
  };

    // Helper para calcular métricas en tiempo real (Fuerza + Cardio + Tonelaje)
  const computeCurrentSessionStats = (
    cSets: typeof completedSets,
    cardioList: CardioActivityItem[],
    elapsedSec: number
  ) => {
    let totalTargetSets = 0;
    workingExercises.forEach((rx) => {
      totalTargetSets += rx.sets.length;
    });

    const completedCount = Object.values(cSets).filter((s) => s.completed).length;
    const currentRate = totalTargetSets > 0 ? Math.round((completedCount / totalTargetSets) * 100) : 0;
    const strengthDurationMin = Math.max(1, Math.round(elapsedSec / 60));

    let totalVolumeKg = 0;
    Object.values(cSets).forEach((s) => {
      const kg = toStandardKg(s.weight, unit);
      totalVolumeKg += kg * s.reps;
    });

    const strengthKcal = calculateStrengthCalories(
      strengthDurationMin,
      totalVolumeKg,
      biometrics.weightKg
    );

    const completedCardio = cardioList.filter((c) => c.completed);
    const cardioKcal = completedCardio.reduce((sum, c) => sum + c.caloriesBurned, 0);
    const cardioMin = completedCardio.reduce((sum, c) => sum + c.durationMinutes, 0);

    const totalKcal = strengthKcal + cardioKcal;
    const totalDurationMin = strengthDurationMin + cardioMin;

    return {
      totalTargetSets,
      completedCount,
      currentRate,
      strengthDurationMin,
      cardioMin,
      totalDurationMin,
      totalVolumeKg,
      strengthKcal,
      cardioKcal,
      totalKcal,
    };
  };

  const syncLiveSummary = async (
    cSets: typeof completedSets,
    cardioList: CardioActivityItem[],
    currentDurationSec: number,
    sessionIdOverride?: string
  ) => {
    const stats = computeCurrentSessionStats(cSets, cardioList, currentDurationSec);
    const sessionIdToUse = sessionIdOverride || activeSession?.id || generateUUID();

    const liveSummary = {
      session_id: sessionIdToUse,
      client_id: user?.id,
      scheduled_date: new Date().toISOString().split('T')[0],
      dayName: todayDay?.name || 'Entrenamiento de Hoy',
      routineTitle: activeRoutine?.title || 'Rutina Pro',
      duration_minutes: stats.totalDurationMin,
      completion_rate: stats.currentRate,
      completedSetsCount: stats.completedCount,
      totalSetsCount: stats.totalTargetSets,
      totalVolumeKg: stats.totalVolumeKg,
      calories_burned: stats.totalKcal,
      strength_calories: stats.strengthKcal,
      cardio_calories: stats.cardioKcal,
      cardio_activities: cardioList,
      status: (stats.currentRate >= 90 ? 'completed' : 'partial') as 'completed' | 'partial',
      updated_at: new Date().toISOString(),
    };

    await AsyncStorage.setItem('@fitnesspro_today_workout_live', JSON.stringify(liveSummary));

    if (activeSession?.id && isValidUUID(activeSession.id)) {
      supabase
        .from('workout_sessions')
        .update({
          status: 'partial',
          completion_rate: stats.currentRate,
          duration_minutes: stats.totalDurationMin,
        })
        .eq('id', activeSession.id)
        .then(() => {});
    }
  };

  const handleAddCardio = async (item: CardioActivityItem) => {
    const updated = [...cardioActivities, item];
    setCardioActivities(updated);
    await AsyncStorage.setItem('@fitnesspro_active_cardio', JSON.stringify(updated));
    await syncLiveSummary(completedSets, updated, elapsedSeconds);

    const todayDateStr = new Date().toISOString().split('T')[0];
    const stats = computeCurrentSessionStats(completedSets, updated, elapsedSeconds);
    await logDailyCalories({
      date: todayDateStr,
      strengthKcal: stats.strengthKcal,
      cardioKcal: stats.cardioKcal,
      durationMin: stats.totalDurationMin,
      volumeKg: stats.totalVolumeKg,
    });
    touchUserActivity(user?.id);
  };

  const handleUpdateCardio = async (updatedItem: CardioActivityItem) => {
    const updated = cardioActivities.map((c) =>
      c.id === updatedItem.id ? updatedItem : c
    );
    setCardioActivities(updated);
    await AsyncStorage.setItem('@fitnesspro_active_cardio', JSON.stringify(updated));
    await syncLiveSummary(completedSets, updated, elapsedSeconds);

    const todayDateStr = new Date().toISOString().split('T')[0];
    const stats = computeCurrentSessionStats(completedSets, updated, elapsedSeconds);
    await logDailyCalories({
      date: todayDateStr,
      strengthKcal: stats.strengthKcal,
      cardioKcal: stats.cardioKcal,
      durationMin: stats.totalDurationMin,
      volumeKg: stats.totalVolumeKg,
    });
    touchUserActivity(user?.id);
  };

  const handleToggleCardio = async (id: string) => {
    const updated = cardioActivities.map((c) =>
      c.id === id ? { ...c, completed: !c.completed } : c
    );
    setCardioActivities(updated);
    await AsyncStorage.setItem('@fitnesspro_active_cardio', JSON.stringify(updated));
    await syncLiveSummary(completedSets, updated, elapsedSeconds);

    const todayDateStr = new Date().toISOString().split('T')[0];
    const stats = computeCurrentSessionStats(completedSets, updated, elapsedSeconds);
    await logDailyCalories({
      date: todayDateStr,
      strengthKcal: stats.strengthKcal,
      cardioKcal: stats.cardioKcal,
      durationMin: stats.totalDurationMin,
      volumeKg: stats.totalVolumeKg,
    });
  };

  const handleRemoveCardio = async (id: string) => {
    const updated = cardioActivities.filter((c) => c.id !== id);
    setCardioActivities(updated);
    await AsyncStorage.setItem('@fitnesspro_active_cardio', JSON.stringify(updated));
    await syncLiveSummary(completedSets, updated, elapsedSeconds);

    const todayDateStr = new Date().toISOString().split('T')[0];
    const stats = computeCurrentSessionStats(completedSets, updated, elapsedSeconds);
    await logDailyCalories({
      date: todayDateStr,
      strengthKcal: stats.strengthKcal,
      cardioKcal: stats.cardioKcal,
      durationMin: stats.totalDurationMin,
      volumeKg: stats.totalVolumeKg,
    });
  };

  // Guardar datos REALES del alumno en workout_log_sets y sincronizar en vivo
  const handleCompleteSet = async (
    setId: string,
    routineSetId: string | null,
    setNumber: number,
    repsCompleted: number,
    weightLogged: number,
    isCompleted: boolean = true,
    restSeconds?: number
  ) => {
    let currentSession = activeSession;
    if (isCompleted && (!isSessionActive || !currentSession)) {
      currentSession = await handleStartSession();
    }

    const weightKg = toStandardKg(weightLogged, unit);

    const newCompletedSets = {
      ...completedSets,
      [setId]: { reps: repsCompleted, weight: weightLogged, completed: isCompleted },
    };
    setCompletedSets(newCompletedSets);
    await AsyncStorage.setItem('@fitnesspro_completed_sets', JSON.stringify(newCompletedSets));
    if (todayDay?.id) {
      await AsyncStorage.setItem('@fitnesspro_active_day_id', todayDay.id);
    }

    const sessionIdToUse = currentSession?.id || activeSession?.id || generateUUID();
    await syncLiveSummary(newCompletedSets, cardioActivities, elapsedSeconds, sessionIdToUse);

    if (isCompleted) {
      // Disparar temporizador de descanso automático ultra-preciso
      handleLaunchRestTimer(restSeconds || 60);
      triggerHaptic('success');

      // Insertar la serie en workout_log_sets
      const logPayload = {
        id: generateUUID(),
        session_id: sessionIdToUse,
        routine_exercise_set_id: isValidUUID(routineSetId) ? routineSetId : null,
        set_number: setNumber,
        reps_completed: repsCompleted,
        weight_logged: weightLogged,
        unit_logged: unit,
        weight_kg: Math.round(weightKg),
        is_completed: true,
        rpe: null,
      };

      try {
        const { error } = await supabase.from('workout_log_sets').insert(logPayload);
        if (error) throw error;
        touchUserActivity(user?.id);
      } catch (err) {
        offlineQueue.enqueue({
          type: 'LOG_SET',
          payload: logPayload,
        });
      }
    } else {
      // Si el alumno desmarcó la serie (toggle verde desactivado)
      if (isValidUUID(sessionIdToUse)) {
        try {
          if (isValidUUID(routineSetId)) {
            await supabase
              .from('workout_log_sets')
              .delete()
              .eq('session_id', sessionIdToUse)
              .eq('routine_exercise_set_id', routineSetId);
          } else {
            await supabase
              .from('workout_log_sets')
              .delete()
              .eq('session_id', sessionIdToUse)
              .eq('set_number', setNumber);
          }
        } catch (e) {
          console.warn('Aviso borrando serie desmarcada:', e);
        }
      }
    }
  };

  // Restaurar todo el entrenamiento al plan original prescrito por el coach
  const handleResetAllToOriginal = async () => {
    if (!todayDay || !user?.id) return;
    try {
      await clearProgressionOverrides(user.id, todayDay.id);
      await clearDayWorkoutSnapshot(user.id, todayDay.id);
      setProgressionOverrides({});

      // Restaurar ejercicios de trabajo a una copia limpia de originalExercises
      const restored = originalExercises.map((rx) => ({
        ...rx,
        sets: rx.sets.map((s, sIdx) => ({
          ...s,
          id: `rst-${s.set_number}-${Date.now()}-${sIdx}`,
        })),
      }));
      setWorkingExercises(restored);
      await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(restored));
      setCompletedSets({});
      await AsyncStorage.removeItem('@fitnesspro_completed_sets');

      Alert.alert(
        t('common.success', 'Éxito'),
        t(
          'workout.reset_confirm_desc',
          'Se restablecieron las series, repeticiones y pesos prescritos originalmente por tu Coach.'
        )
      );
    } catch (e) {
      console.warn('Error al restaurar rutina original:', e);
    }
  };

  // Restaurar un único ejercicio específico al plan original del coach
  const handleResetExerciseToOriginal = async (exerciseId: string) => {
    if (!todayDay || !user?.id) return;
    try {
      const updatedOverrides = await clearProgressionOverrides(user.id, todayDay.id, exerciseId);
      setProgressionOverrides(updatedOverrides);

      const origRx = originalExercises.find((o) => (o.exercise_id || o.id) === exerciseId);
      if (origRx) {
        const updated = workingExercises.map((rx) => {
          if ((rx.exercise_id || rx.id) === exerciseId) {
            return {
              ...origRx,
              sets: origRx.sets.map((s, sIdx) => ({
                ...s,
                id: `rst-ex-${s.set_number}-${Date.now()}-${sIdx}`,
              })),
            };
          }
          return rx;
        });
        setWorkingExercises(updated);
      }
    } catch (e) {
      console.warn('Error al restaurar ejercicio:', e);
    }
  };

  // Cargar una rutina histórica completa en la sesión actual
  const handleLoadRoutineFromHistory = async (
    exercises: WorkingExerciseItem[],
    dayName?: string
  ) => {
    if (!exercises || exercises.length === 0) return;
    setWorkingExercises(exercises);
    await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(exercises));
    setCompletedSets({});
    await AsyncStorage.removeItem('@fitnesspro_completed_sets');

    if (todayDay && user?.id) {
      await saveDayWorkoutSnapshot(
        user.id,
        todayDay.id,
        exercises,
        {},
        unit,
        toStandardKg,
        dayName || todayDay.name
      );
    }
    triggerHaptic('success');
    Alert.alert(
      t('common.success', 'Éxito'),
      language === 'es'
        ? `Se ha cargado la rutina histórica "${dayName || 'Seleccionada'}" con sus ejercicios y pesos para la sesión de hoy.`
        : `Historical routine "${dayName || 'Selected'}" loaded for today's workout.`
    );
  };

  // Abrir selector para agregar ejercicio
  const handleOpenAddExercise = () => {
    setSubstitutingExerciseIndex(null);
    setShowInventoryModal(true);
  };

  // Abrir selector para sustituir un ejercicio existente
  const handleOpenSubstituteExercise = (exIdx: number) => {
    setSubstitutingExerciseIndex(exIdx);
    setShowInventoryModal(true);
  };

  // Abrir modal para personalizar un ejercicio existente directamente desde la rutina
  const handleOpenCustomizeExercise = (exIdx: number) => {
    setCustomizingExerciseIndex(exIdx);
    setShowCustomizeModal(true);
  };

  // Callback cuando se personaliza un ejercicio
  const handleExerciseCustomized = async (newExercise: Exercise) => {
    if (customizingExerciseIndex !== null) {
      const updated = [...workingExercises];
      const currentItem = updated[customizingExerciseIndex];
      if (currentItem) {
        updated[customizingExerciseIndex] = {
          ...currentItem,
          exercise_id: newExercise.id,
          exercise: newExercise,
        };
        setWorkingExercises(updated);
        await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

        // Actualizar en base de datos si es un ejercicio persistido en la rutina
        if (isValidUUID(currentItem.id)) {
          try {
            await supabase.from('routine_exercises').update({ exercise_id: newExercise.id }).eq('id', currentItem.id);
          } catch (e) {
            console.warn('Error actualizando routine_exercises en Supabase:', e);
          }
        }

        // Actualizar snapshot inmediatamente para que quede guardado incluso si sale de la pantalla
        if (todayDay && user?.id) {
          await saveDayWorkoutSnapshot(
            user.id,
            todayDay.id,
            updated,
            completedSets,
            unit,
            toStandardKg,
            todayDay.name
          );
        }
      }
      setCustomizingExerciseIndex(null);
    }
  };

  // Callback cuando se selecciona un ejercicio del inventario
  const handleSelectExerciseFromInventory = async (exercise: Exercise) => {
    if (substitutingExerciseIndex !== null) {
      const updated = [...workingExercises];
      const currentItem = updated[substitutingExerciseIndex];
      if (currentItem) {
        updated[substitutingExerciseIndex] = {
          ...currentItem,
          exercise_id: exercise.id,
          exercise: exercise,
        };
        setWorkingExercises(updated);
        await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

        // Sincronizar en Supabase y guardar snapshot de inmediato con la sustitución
        if (todayDay && user?.id) {
          syncRoutineExercisesToSupabase(supabase, todayDay.id, updated).catch((e) => {
            console.warn('Aviso sincronizando sustitución en Supabase:', e);
          });
          await saveDayWorkoutSnapshot(
            user.id,
            todayDay.id,
            updated,
            completedSets,
            unit,
            toStandardKg,
            todayDay.name
          );
        }
      }
      setSubstitutingExerciseIndex(null);
    } else {
      const newId = `custom-rx-${Date.now()}`;
      const newWorkingItem: WorkingExerciseItem = {
        id: newId,
        exercise_id: exercise.id,
        exercise: exercise,
        notes: exercise.is_custom ? 'Ejercicio añadido por el alumno' : null,
        sets: [
          {
            id: `set-${Date.now()}-1`,
            routine_exercise_set_id: null,
            set_number: 1,
            target_reps: 12,
            target_weight_kg: 0,
            target_rpe: 8,
            rest_seconds: 90,
            is_extra: false,
          },
          {
            id: `set-${Date.now()}-2`,
            routine_exercise_set_id: null,
            set_number: 2,
            target_reps: 10,
            target_weight_kg: 0,
            target_rpe: 8.5,
            rest_seconds: 90,
            is_extra: false,
          },
          {
            id: `set-${Date.now()}-3`,
            routine_exercise_set_id: null,
            set_number: 3,
            target_reps: 8,
            target_weight_kg: 0,
            target_rpe: 9,
            rest_seconds: 120,
            is_extra: false,
          },
        ],
      };
      const updated = [...workingExercises, newWorkingItem];
      setWorkingExercises(updated);
      await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

      // Sincronizar en Supabase y guardar snapshot de inmediato con el nuevo ejercicio
      if (todayDay && user?.id) {
        syncRoutineExercisesToSupabase(supabase, todayDay.id, updated).catch((e) => {
          console.warn('Aviso sincronizando nuevo ejercicio en Supabase:', e);
        });
        await saveDayWorkoutSnapshot(
          user.id,
          todayDay.id,
          updated,
          completedSets,
          unit,
          toStandardKg,
          todayDay.name
        );
      }
    }
  };

  // Eliminar ejercicio de la sesión de hoy o permanentemente de la rutina
  const handleRemoveExercise = (exIdx: number) => {
    const targetEx = workingExercises[exIdx];
    const exName = targetEx?.exercise?.name || 'este ejercicio';

    Alert.alert(
      t('workout.remove_exercise_confirm_title', '¿Eliminar ejercicio?'),
      language === 'es'
        ? `¿Cómo deseas quitar "${exName}"?`
        : `How would you like to remove "${exName}"?`,
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: language === 'es' ? 'Solo de hoy' : 'Only today',
          style: 'default',
          onPress: async () => {
            const updated = workingExercises.filter((_, idx) => idx !== exIdx);
            setWorkingExercises(updated);
            await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

            const cSetsCopy = { ...completedSets };
            if (targetEx && targetEx.sets) {
              targetEx.sets.forEach((s) => {
                delete cSetsCopy[s.id];
              });
            }
            setCompletedSets(cSetsCopy);
            await AsyncStorage.setItem('@fitnesspro_completed_sets', JSON.stringify(cSetsCopy));
            if (todayDay && user?.id) {
              await saveDayWorkoutSnapshot(
                user.id,
                todayDay.id,
                updated,
                cSetsCopy,
                unit,
                toStandardKg,
                todayDay.name
              );
            }
            if (isSessionActive && activeSession) {
              syncLiveSummary(cSetsCopy, cardioActivities, elapsedSeconds, activeSession.id);
            }
          },
        },
        {
          text: language === 'es' ? 'Quitar de la rutina (Permanente)' : 'Remove from routine (Permanent)',
          style: 'destructive',
          onPress: async () => {
            try {
              // 1. Quitar de la vista actual
              const updated = workingExercises.filter((_, idx) => idx !== exIdx);
              setWorkingExercises(updated);
              await AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));

              // 2. Sincronizar en Supabase de forma permanente
              if (todayDay && user?.id) {
                await syncRoutineExercisesToSupabase(supabase, todayDay.id, updated);
              }

              // 3. Limpiar sets completados en sesión
              const cSetsCopy = { ...completedSets };
              if (targetEx && targetEx.sets) {
                targetEx.sets.forEach((s) => {
                  delete cSetsCopy[s.id];
                });
              }
              setCompletedSets(cSetsCopy);
              await AsyncStorage.setItem('@fitnesspro_completed_sets', JSON.stringify(cSetsCopy));

              setOriginalExercises((prev) => prev.filter((_, idx) => idx !== exIdx));

              // 4. Actualizar snapshot del día sin el ejercicio eliminado
              if (todayDay && user?.id) {
                await saveDayWorkoutSnapshot(
                  user.id,
                  todayDay.id,
                  updated,
                  cSetsCopy,
                  unit,
                  toStandardKg,
                  todayDay.name
                );
              }

              loadTodayWorkout();

              Alert.alert(
                t('common.success', 'Éxito'),
                language === 'es'
                  ? `"${exName}" ha sido eliminado permanentemente de la rutina.`
                  : `"${exName}" was permanently removed from the routine.`
              );
            } catch (err: any) {
              console.error('Error al quitar ejercicio permanentemente:', err);
              Alert.alert(t('common.error', 'Error'), err.message || 'No se pudo eliminar de la base de datos.');
            }
          },
        },
      ]
    );
  };

  // Abrir modal para modificar cualquier rutina (asignada o propia)
  const handleOpenEditRoutine = (targetRoutine: Routine, day?: RoutineDay) => {
    triggerHaptic('tap');
    setRoutineToEdit(targetRoutine);
    const matchedDays = routineDaysList.filter((d) => d.routine_id === targetRoutine.id);
    setRoutineDaysToEdit(matchedDays.length > 0 ? matchedDays : (day ? [day] : null));
    setShowCreateRoutineModal(true);
  };

  // Eliminar una rutina por completo (asignada por coach o creada por el alumno)
  const handleDeleteRoutine = (routineId: string, routineTitle: string) => {
    triggerHaptic('tap');
    Alert.alert(
      language === 'es' ? '¿Eliminar Rutina por completo?' : 'Delete Routine completely?',
      language === 'es'
        ? `¿Estás seguro de que deseas eliminar permanentemente la rutina "${routineTitle}"? Se borrará tanto de tu lista como de tus entrenamientos.`
        : `Are you sure you want to permanently delete the routine "${routineTitle}"? It will be removed from your workouts.`,
      [
        { text: t('common.cancel', 'Cancelar'), style: 'cancel' },
        {
          text: t('common.delete', 'Eliminar'),
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('routines').delete().eq('id', routineId);
              if (error) throw error;

              // Si la rutina abierta en pantalla es la eliminada, volver al dashboard
              if (activeRoutine?.id === routineId || selectedRoutineDay?.routine_id === routineId) {
                setSelectedRoutineDay(null);
                setTodayDay(null);
                setWorkingExercises([]);
                await AsyncStorage.removeItem('@fitnesspro_working_exercises');
              }

              await loadTodayWorkout();

              Alert.alert(
                t('common.success', 'Éxito'),
                language === 'es'
                  ? 'La rutina ha sido eliminada con éxito.'
                  : 'The routine has been successfully deleted.'
              );
            } catch (err: any) {
              console.error('Error al eliminar rutina:', err);
              Alert.alert(t('common.error', 'Error'), err.message || 'No se pudo eliminar la rutina.');
            }
          },
        },
      ]
    );
  };

  // Callback cuando se crea una nueva rutina personalizada
  const handleRoutineCreated = (newRoutine: Routine) => {
    setActiveRoutine(newRoutine);
    loadTodayWorkout();
  };

  // Callback cuando se actualiza una rutina existente
  const handleRoutineUpdated = async (updatedRoutine: Routine) => {
    setActiveRoutine(updatedRoutine);
    if (user?.id) {
      const daysOfRoutine = routineDaysList.filter((d) => d.routine_id === updatedRoutine.id);
      for (const d of daysOfRoutine) {
        await clearDayWorkoutSnapshot(user.id, d.id);
      }
    }
    loadTodayWorkout();
  };

  // Callback cuando se elimina una rutina desde el modal de edición
  const handleRoutineDeleted = (deletedRoutineId: string) => {
    if (activeRoutine?.id === deletedRoutineId || selectedRoutineDay?.routine_id === deletedRoutineId) {
      setSelectedRoutineDay(null);
      setTodayDay(null);
      setWorkingExercises([]);
      AsyncStorage.removeItem('@fitnesspro_working_exercises').catch(() => {});
    }
    loadTodayWorkout();
  };

  // Cerrar modal de rutina limpiando estado de edición
  const handleCloseCreateRoutineModal = () => {
    setShowCreateRoutineModal(false);
    setRoutineToEdit(null);
    setRoutineDaysToEdit(null);
  };

  // Diálogo interactivo de confirmación antes de finalizar la sesión
  const handleFinishSession = () => {
    if (!todayDay) return;
    Alert.alert(
      t('workout.finish_confirm_title', '¿Finalizar Sesión?'),
      t(
        'workout.finish_confirm_msg',
        '¿Estás seguro de que finalizaste el entrenamiento y deseas guardar los datos de esta sesión?'
      ),
      [
        {
          text: t('common.cancel', 'Cancelar'),
          style: 'cancel',
        },
        {
          text: t('workout.confirm_finish_btn', 'Sí, Finalizar y Guardar'),
          style: 'default',
          onPress: () => performFinishSession(),
        },
      ]
    );
  };

  const performFinishSession = async () => {
    if (!todayDay) return;
    touchUserActivity(user?.id);

    const stats = computeCurrentSessionStats(completedSets, cardioActivities, elapsedSeconds);
    const finishDate = new Date().toISOString();
    const todayDateStr = finishDate.split('T')[0];

    // Desglose exacto de los 3 tiempos
    const totalDurationMin = Math.max(1, Math.round(elapsedSeconds / 60));
    const restMin = Math.round(totalRestSeconds / 60);
    const exerciseMin = Math.max(0, totalDurationMin - restMin);

    const currentMg = selectedMuscleGroup || todayDay.muscle_group || null;

    const exercisesSummary = workingExercises.map((rx) => {
      const exInfo = (rx as any).exercise || (rx as any).exercise_info;
      const loggedSets = rx.sets.map((s) => {
        const log = completedSets[s.id];
        return {
          set_number: s.set_number,
          routine_exercise_set_id: s.routine_exercise_set_id || null,
          target_reps: s.target_reps,
          target_weight_kg: s.target_weight_kg,
          reps: log?.completed ? log.reps : s.target_reps,
          weight: log?.completed ? log.weight : Math.round(toDisplayWeight(s.target_weight_kg || 0)),
          weight_kg: log?.completed ? toStandardKg(log.weight, unit) : s.target_weight_kg || 0,
          unit: unit,
          completed: !!log?.completed,
          is_superset: !!s.is_superset,
          superset_count: s.superset_count,
          superset_reps: s.superset_reps,
          superset_weights_kg: s.superset_weights_kg,
        };
      });
      return {
        exercise_id: rx.exercise_id || rx.id,
        name: exInfo?.name || 'Ejercicio',
        muscle_group: exInfo?.muscle_group || 'General',
        image_url: exInfo?.image_urls?.[0] || exInfo?.gif_url || null,
        sets: loggedSets,
      };
    });

    const snapshotExercises = workingExercises.map((rx, exIdx) => {
      const exInfo = (rx as any).exercise || (rx as any).exercise_info || {};
      const sets = rx.sets.map((s, sIdx) => {
        const logged = completedSets[s.id];
        let finalReps = s.target_reps;
        let finalWeightKg = s.target_weight_kg || 0;

        if (logged && logged.completed) {
          finalReps = logged.reps;
          finalWeightKg = toStandardKg(logged.weight, unit);
        }

        return {
          id: `snap-${rx.exercise_id || rx.id}-${sIdx + 1}-${Date.now()}`,
          routine_exercise_set_id: s.routine_exercise_set_id || null,
          set_number: sIdx + 1,
          target_reps: Math.max(1, finalReps),
          target_weight_kg: Math.max(0, Math.round(finalWeightKg * 10) / 10),
          target_rpe: s.target_rpe || null,
          rest_seconds: s.rest_seconds || 90,
          is_extra: s.is_extra || false,
          is_superset: !!s.is_superset,
          superset_count: s.superset_count,
          superset_reps: s.superset_reps,
          superset_weights_kg: s.superset_weights_kg,
        };
      });

      return {
        id: rx.id || `rx-snap-${exIdx}-${Date.now()}`,
        exercise_id: rx.exercise_id || rx.id,
        exercise: {
          id: exInfo.id || rx.exercise_id || rx.id,
          name: exInfo.name || 'Ejercicio',
          muscle_group: exInfo.muscle_group || 'General',
          image_urls: exInfo.image_urls || (exInfo.image_url ? [exInfo.image_url] : []),
          gif_url: exInfo.gif_url || null,
          is_custom: !!exInfo.is_custom,
          created_by: exInfo.created_by || null,
        },
        notes: rx.notes || null,
        order_index: exIdx,
        sets,
      };
    });

    const finishPayload = {
      session_id: activeSession?.id,
      completed_at: finishDate,
      duration_minutes: totalDurationMin,
      completion_rate: stats.currentRate,
      status: 'completed' as const,
      muscle_group: currentMg,
      notes: JSON.stringify({
        dayName: todayDay.name,
        muscle_group: currentMg,
        total_seconds: elapsedSeconds,
        exercise_seconds: Math.max(0, elapsedSeconds - totalRestSeconds),
        rest_seconds: totalRestSeconds,
        total_minutes: totalDurationMin,
        exercise_minutes: exerciseMin,
        rest_minutes: restMin,
        calories_burned: stats.totalKcal,
        strength_calories: stats.strengthKcal,
        cardio_calories: stats.cardioKcal,
        volume_kg: stats.totalVolumeKg,
        exercises: exercisesSummary,
        working_exercises_snapshot: snapshotExercises,
      }),
    };

    if (activeSession?.id && isValidUUID(activeSession.id)) {
      try {
        const updateData: any = {
          completed_at: finishPayload.completed_at,
          duration_minutes: totalDurationMin,
          completion_rate: stats.currentRate,
          status: finishPayload.status,
          notes: finishPayload.notes,
          routine_day_id: isValidUUID(todayDay.id) ? todayDay.id : null,
        };
        const { error: upErr } = await supabase
          .from('workout_sessions')
          .update(updateData)
          .eq('id', activeSession.id);
        if (upErr) {
          console.warn('Aviso al actualizar sesión en Supabase:', upErr.message);
        }
      } catch (err) {
        offlineQueue.enqueue({
          type: 'COMPLETE_SESSION',
          payload: finishPayload,
        });
      }
    }

    // Registrar en el historial diario para reportes por día, semana y mes
    await logDailyCalories({
      date: todayDateStr,
      strengthKcal: stats.strengthKcal,
      cardioKcal: stats.cardioKcal,
      durationMin: totalDurationMin,
      volumeKg: stats.totalVolumeKg,
    });

    const finalSummary = {
      session_id: activeSession?.id,
      client_id: user?.id,
      scheduled_date: todayDateStr,
      dayName: todayDay.name,
      routineTitle: activeRoutine?.title,
      muscle_group: currentMg,
      duration_minutes: totalDurationMin,
      exercise_minutes: exerciseMin,
      rest_minutes: restMin,
      completion_rate: stats.currentRate,
      completedSetsCount: stats.completedCount,
      totalSetsCount: stats.totalTargetSets,
      totalVolumeKg: stats.totalVolumeKg,
      calories_burned: stats.totalKcal,
      strength_calories: stats.strengthKcal,
      cardio_calories: stats.cardioKcal,
      cardio_activities: cardioActivities,
      status: finishPayload.status,
      completed_at: finishPayload.completed_at,
      updated_at: finishDate,
    };

    // Guardar la adaptación progresiva de series, reps y pesos para la PRÓXIMA sesión
    if (todayDay && user?.id) {
      try {
        const updatedOverrides = await recordSessionProgression(
          user.id,
          todayDay.id,
          workingExercises,
          completedSets,
          unit,
          toStandardKg
        );
        setProgressionOverrides(updatedOverrides);

        // Sincronizar permanentemente los ejercicios y series a routine_exercises en Supabase
        await syncRoutineExercisesToSupabase(
          supabase,
          todayDay.id,
          workingExercises
        );

        // Guardar snapshot de la rutina realizada (con ejercicios agregados/eliminados, series/pesos y supersets)
        await saveDayWorkoutSnapshot(
          user.id,
          todayDay.id,
          workingExercises,
          completedSets,
          unit,
          toStandardKg,
          todayDay.name
        );
      } catch (progErr) {
        console.warn('Error al guardar progresión adaptativa y sincronizar en Supabase:', progErr);
      }
    }

    // Incrementar contador de finalización (+1) para este grupo muscular específico y día
    const nowIso = new Date().toISOString();
    setTotalCompletedWorkouts((prev) => prev + 1);

    if (todayDay?.id) {
      const newDayCount = (completionCounts[todayDay.id] || 0) + 1;
      setCompletionCounts((prev) => {
        const updated = { ...prev, [todayDay.id]: newDayCount };
        if (currentMg) {
          updated[currentMg] = (prev[currentMg] || 0) + 1;
        }
        return updated;
      });
      setLastCompletedDates((prev) => {
        const updated = { ...prev, [todayDay.id]: nowIso };
        if (currentMg) {
          updated[currentMg] = nowIso;
        }
        return updated;
      });

      // Actualizar en Supabase routine_days (defensivo)
      try {
        await supabase
          .from('routine_days')
          .update({
            completion_count: newDayCount,
            last_completed_at: nowIso,
          })
          .eq('id', todayDay.id);
      } catch (countErr) {
        console.warn('Error al actualizar contador en routine_days:', countErr);
      }
    } else if (currentMg) {
      setCompletionCounts((prev) => ({ ...prev, [currentMg]: (prev[currentMg] || 0) + 1 }));
      setLastCompletedDates((prev) => ({ ...prev, [currentMg]: nowIso }));
    }

    await AsyncStorage.setItem('@fitnesspro_today_workout_live', JSON.stringify(finalSummary));
    await AsyncStorage.setItem('@fitnesspro_last_workout_summary', JSON.stringify(finalSummary));

    // Limpiar variables de sesión activa en curso
    await AsyncStorage.removeItem('@fitnesspro_active_session');
    await AsyncStorage.removeItem('@fitnesspro_active_session_date');
    await AsyncStorage.removeItem('@fitnesspro_active_day_id');
    await AsyncStorage.removeItem('@fitnesspro_completed_sets');
    await AsyncStorage.removeItem('@fitnesspro_working_exercises');
    await AsyncStorage.removeItem('@fitnesspro_session_start_time');
    await AsyncStorage.removeItem('@fitnesspro_session_rest_seconds');

    setCompletedSets({});
    setActiveSession(null);
    setIsSessionActive(false);
    handleDismissRestTimer();

    setSummaryStats({
      durationMinutes: totalDurationMin,
      exerciseMinutes: exerciseMin,
      restMinutes: restMin,
      completionRate: stats.currentRate,
      totalVolumeKg: stats.totalVolumeKg,
      totalCaloriesBurned: stats.totalKcal,
    });
    setShowSummaryModal(true);
  };

  // Mapear grupos musculares estándar a los días de rutina asignados con discriminación estricta de ejercicios
  const { muscleToDayMap, unmappedDays } = React.useMemo(() => {
    const normalize = (s?: string | null) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

    const MUSCLE_ALIASES: Record<StandardMuscleGroup, { primary: string[]; secondary: string[] }> = {
      Pecho: {
        primary: ['pecho', 'pectoral', 'pectorales', 'chest'],
        secondary: ['press banca', 'aperturas', 'cruces', 'dips'],
      },
      Espalda: {
        primary: ['espalda', 'dorsal', 'dorsales', 'back', 'lats'],
        secondary: ['trapecio', 'trapecios', 'dominadas', 'jalon', 'remo'],
      },
      Cuádriceps: {
        primary: ['cuadriceps', 'cuadricep', 'quads', 'quad', 'pierna anterior'],
        secondary: ['sentadilla', 'prensa', 'extensiones'],
      },
      Glúteos: {
        primary: ['gluteos', 'gluteo', 'glutes', 'glute', 'cadera'],
        secondary: ['hip thrust', 'patada gluteo', 'abducciones', 'puente'],
      },
      Isquiosurales: {
        primary: ['isquiosurales', 'isquios', 'isquiotibiales', 'femorales', 'femoral', 'hamstrings', 'hamstring', 'pierna posterior', 'cadena posterior'],
        secondary: ['peso muerto rumano', 'rdl', 'curl femoral', 'curl pierna'],
      },
      Hombros: {
        primary: ['hombros', 'hombro', 'deltoides', 'deltoide', 'shoulders', 'shoulder'],
        secondary: ['press militar', 'elevaciones laterales', 'face pull', 'pajaros'],
      },
      Bíceps: {
        primary: ['biceps', 'bicep'],
        secondary: ['curl biceps', 'curl martillo', 'banco scott', 'predicador'],
      },
      Tríceps: {
        primary: ['triceps', 'tricep'],
        secondary: ['press frances', 'extension triceps', 'fondos triceps', 'skull crusher', 'copa'],
      },
      Core: {
        primary: ['core', 'abs', 'abdominales', 'abdomen', 'abdominal'],
        secondary: ['plancha', 'crunches', 'rueda abdominal', 'elevaciones piernas'],
      },
      Pantorrillas: {
        primary: ['pantorrillas', 'pantorrilla', 'gemelos', 'gemelo', 'calves', 'calf'],
        secondary: ['elevaciones talones', 'talones pie', 'talones sentado'],
      },
      'Cuerpo Completo': {
        primary: ['cuerpo completo', 'full body', 'fullbody', 'total body'],
        secondary: ['acondicionamiento', 'funcional', 'circuito'],
      },
    };

    const map = new Map<StandardMuscleGroup, RoutineDay>();
    const matchedDayIds = new Set<string>();

    const matchesTokens = (text: string | null | undefined, tokens: string[]) => {
      if (!text) return false;
      const norm = normalize(text);
      return tokens.some((t) => norm.includes(t));
    };

    STANDARD_MUSCLE_GROUPS.forEach((mg) => {
      // 1. PRIORIDAD MÁXIMA: Buscar días que contengan ejercicios específicos para este grupo muscular
      const daysWithMatchingExercises = routineDaysList.filter((d) =>
        (d.routine_exercises || []).some((rx: any) =>
          isExerciseInMuscleGroup(rx.exercise, mg.id)
        )
      );

      let matchedDay: RoutineDay | undefined;

      if (daysWithMatchingExercises.length > 0) {
        // Ordenar para preferir el día con muscle_group explícito o mayor cantidad de ejercicios del grupo
        daysWithMatchingExercises.sort((a, b) => {
          if (a.muscle_group === mg.id && b.muscle_group !== mg.id) return -1;
          if (b.muscle_group === mg.id && a.muscle_group !== mg.id) return 1;
          const countA = (a.routine_exercises || []).filter((rx: any) => isExerciseInMuscleGroup(rx.exercise, mg.id)).length;
          const countB = (b.routine_exercises || []).filter((rx: any) => isExerciseInMuscleGroup(rx.exercise, mg.id)).length;
          return countB - countA;
        });
        matchedDay = daysWithMatchingExercises[0];
      }

      // 2. Coincidencias alternativas por metadatos del bloque si no hay ejercicios clasificados directamente
      if (!matchedDay) {
        const config = MUSCLE_ALIASES[mg.id] || { primary: [normalize(mg.id)], secondary: [] };
        const { primary, secondary } = config;

        // 2a. Coincidencia directa por campo muscle_group del día
        matchedDay = routineDaysList.find((d) => matchesTokens(d.muscle_group, primary));

        // 2b. Coincidencia por nombre de día (ej: "Día 1: Pecho" o "Día 2: Pierna Posterior")
        if (!matchedDay) {
          matchedDay = routineDaysList.find((d) => matchesTokens(d.name, primary));
        }

        // 2c. Coincidencia por título de la rutina padre
        if (!matchedDay) {
          matchedDay = routineDaysList.find((d) => {
            const parent = assignedRoutinesList.find((r) => r.id === d.routine_id);
            return parent && matchesTokens(parent.title, primary);
          });
        }

        // 2d. Coincidencia secundaria por nombres de ejercicios
        if (!matchedDay && secondary.length > 0) {
          matchedDay = routineDaysList.find((d) => {
            if (!d.routine_exercises || d.routine_exercises.length === 0) return false;
            return d.routine_exercises.some((rx: any) =>
              matchesTokens(rx.exercise?.name, secondary)
            );
          });
        }
      }

      if (matchedDay) {
        // DISCRIMINAR ESTRICTAMENTE: Filtrar los ejercicios para que este día solo contenga los de este grupo muscular
        const tailoredExercises = filterRoutineExercisesByMuscleGroup(
          matchedDay.routine_exercises || [],
          mg.id
        );

        const finalDay: RoutineDay = {
          ...matchedDay,
          muscle_group: mg.id,
          routine_exercises: tailoredExercises.length > 0 ? tailoredExercises : matchedDay.routine_exercises,
        };

        map.set(mg.id, finalDay);
        matchedDayIds.add(matchedDay.id);
      }
    });

    const unmapped = routineDaysList.filter((d) => !matchedDayIds.has(d.id));

    return { muscleToDayMap: map, unmappedDays: unmapped };
  }, [routineDaysList, assignedRoutinesList]);

  // Lista de grupos musculares organizados en parejas lógicas para 2 columnas (ej: Pecho-Tríceps, Glúteos-Cuádriceps)
  const orderedMuscleGroups: MuscleGroupDefinition[] = useMemo(() => {
    const map = new Map<string, MuscleGroupDefinition>(
      STANDARD_MUSCLE_GROUPS.map((mg) => [mg.id, mg])
    );
    return PAIRED_MUSCLE_GROUP_ORDER.map((id) => map.get(id)).filter(
      (item): item is MuscleGroupDefinition => Boolean(item)
    );
  }, []);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>{t('home.loading_workout', 'Cargando entrenamiento de hoy...')}</Text>
      </View>
    );
  }

  // Si el coach marcó al alumno como inactivo, mostrar pantalla de bloqueo
  if (profile && profile.is_active === false) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <AccountInactiveLock sectionName="tus rutinas y entrenamientos" />
      </SafeAreaView>
    );
  }

  const currentStats = computeCurrentSessionStats(completedSets, cardioActivities, elapsedSeconds);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GymBackground />
      {/* Barra superior con selector de Idioma & Medidas (ESP 🇪🇸 / ENG 🇺🇸) */}
      <View style={styles.topBar}>
        {/* Fila 1: Saludo, Avatar y Código de Alumno a la izquierda; Idioma, Unidades y Música a la derecha */}
        <View style={styles.topBarHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
            <TouchableOpacity
              onPress={() => router.push('/profile')}
              activeOpacity={0.8}
              style={styles.topBarAvatarCircle}
            >
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.topBarAvatarImage} />
              ) : (
                <User size={18} color="#10b981" />
              )}
            </TouchableOpacity>

            <View style={[styles.welcomeSubtitleWrapper, { flex: 1, minWidth: 0 }]}>
              <Text style={styles.welcomeSubtitle} numberOfLines={1}>
                {t('home.greeting', 'HOLA')}, {profile?.full_name?.split(' ')[0]?.toUpperCase() || 'ALUMNO'}
              </Text>
              {user?.id && (
                <View style={styles.systemIdBadge}>
                  <Text style={styles.systemIdBadgeText}>
                    ID: {user.id.slice(0, 8)}...
                  </Text>
                </View>
              )}

              {/* Indicador discreto de modo sin conexión / sincronización */}
              {!syncStatus.isOnline && (
                <View style={styles.offlineStatusBadge}>
                  <Text style={styles.offlineStatusBadgeText}>📶 Sin conexión</Text>
                </View>
              )}
              {syncStatus.isSyncing && (
                <View style={styles.syncingStatusBadge}>
                  <Text style={styles.syncingStatusBadgeText}>🔄 Sincronizando</Text>
                </View>
              )}
              {showSyncedToast && (
                <View style={styles.syncedStatusBadge}>
                  <Text style={styles.syncedStatusBadgeText}>✓ Sincronizado</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.langSelectorRow}>
            {/* Botón rápido de Música / Spotify */}
            <TouchableOpacity
              style={styles.topBarMusicBtn}
              onPress={() => setShowMusicModal(true)}
              activeOpacity={0.8}
            >
              <Disc size={13} color="#1DB954" />
              <Text style={styles.topBarMusicText}>MÚSICA</Text>
            </TouchableOpacity>

            <View style={styles.langPillWrapper}>
              <TouchableOpacity
                style={[
                  styles.langOptionBtn,
                  language === 'es' && styles.langOptionActive,
                ]}
                onPress={() => handleSelectLanguageAndUnits('es')}
                activeOpacity={0.75}
              >
                <Text style={styles.langFlag}>🇪🇸</Text>
                <Text
                  style={[
                    styles.langOptionText,
                    language === 'es' && styles.langOptionTextActive,
                  ]}
                >
                  ESP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.langOptionBtn,
                  language === 'en' && styles.langOptionActive,
                ]}
                onPress={() => handleSelectLanguageAndUnits('en')}
                activeOpacity={0.75}
              >
                <Text style={styles.langFlag}>🇺🇸</Text>
                <Text
                  style={[
                    styles.langOptionText,
                    language === 'en' && styles.langOptionTextActive,
                  ]}
                >
                  ENG
                </Text>
              </TouchableOpacity>
            </View>

            {/* Badge secundario para alternar kg / lbs individualmente si se desea */}
            <TouchableOpacity
              style={styles.unitIndicatorBadge}
              onPress={toggleUnit}
              activeOpacity={0.7}
            >
              <Text style={styles.unitIndicatorText}>{unit.toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Si hay un día de rutina abierto, mostrar su título en la barra superior */}
        {selectedRoutineDay && (
          <View style={styles.screenTitleRow}>
            <Text
              style={styles.screenTitle}
              numberOfLines={1}
              adjustsFontSizeToFit
            >
              {translateDayName(selectedRoutineDay.name, language)}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#10b981"
            colors={['#10b981']}
          />
        }
      >
        {!selectedRoutineDay ? (
          <View style={styles.dashboardSection}>
            {/* 2 Botones pequeños uno al lado del otro por encima de "Entrenamiento de Hoy" */}
            <View style={styles.topMiniActionsRow}>
              {/* Botón 1: Asesorías 1 a 1 */}
              <TouchableOpacity
                style={styles.topMiniActionBtnCoaching}
                onPress={() => setShowCoachingModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.topMiniActionIconCircleCoaching}>
                  <BicepsFlexed size={14} color="#38bdf8" />
                </View>
                <Text style={styles.topMiniActionTextCoaching} numberOfLines={1}>
                  {language === 'es' ? 'Asesorías 1 a 1' : '1-on-1 Coaching'}
                </Text>
                <ChevronRight size={13} color="#38bdf8" />
              </TouchableOpacity>

              {/* Botón 2: BioHacker Péptidos */}
              <TouchableOpacity
                style={styles.topMiniActionBtnPeptides}
                onPress={() => setShowBioHackerModal(true)}
                activeOpacity={0.8}
              >
                <View style={styles.topMiniActionIconCirclePeptides}>
                  <Sparkles size={14} color="#34d399" />
                </View>
                <Text style={styles.topMiniActionTextPeptides} numberOfLines={1}>
                  {language === 'es' ? 'BioHacker Péptidos' : 'BioHacker Peptides'}
                </Text>
                <ChevronRight size={13} color="#34d399" />
              </TouchableOpacity>
            </View>

            {/* Título "Entrenamiento de Hoy" - Ahora debajo de los 2 botones pequeños */}
            <View style={styles.screenTitleRow}>
              <Text
                style={styles.screenTitle}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {t('home.today_workout', 'Entrenamiento de Hoy')}
              </Text>
            </View>

            {/* 1. SESIONES ASIGNADAS POR TU COACH (PRIMERO ARRIBA) */}
            <View style={styles.coachSection}>
              <View style={styles.coachSectionHeader}>
                <Text style={styles.coachSectionTitle}>
                  {language === 'es' ? 'Rutinas del Coach' : 'Coach Routines'}
                </Text>
                <Text style={styles.coachSectionSub}>
                  {routineDaysList.length > 0
                    ? language === 'es'
                      ? `${routineDaysList.length} ${routineDaysList.length === 1 ? 'sesión lista' : 'sesiones listas'} para entrenar`
                      : `${routineDaysList.length} ${routineDaysList.length === 1 ? 'session ready' : 'sessions ready'} to train`
                    : language === 'es'
                      ? 'Planes a medida y periodización'
                      : 'Custom plans & periodization'}
                </Text>
              </View>

              {routineDaysList.length > 0 ? (
                <View style={styles.routineCardsList}>
                  {routineDaysList.map((day) => (
                    <RoutineSplitCard
                      key={day.id}
                      day={day}
                      onSelect={handleSelectRoutineDay}
                      onEdit={(d) => {
                        const parentRoutine = assignedRoutinesList.find((r) => r.id === d.routine_id);
                        if (parentRoutine) {
                          handleOpenEditRoutine(parentRoutine, d);
                        } else if (activeRoutine && activeRoutine.id === d.routine_id) {
                          handleOpenEditRoutine(activeRoutine, d);
                        } else {
                          handleOpenEditRoutine({ id: d.routine_id, title: d.name } as Routine, d);
                        }
                      }}
                      onDelete={(d) => {
                        const parentRoutine = assignedRoutinesList.find((r) => r.id === d.routine_id);
                        const rTitle = parentRoutine?.title || activeRoutine?.title || d.name;
                        handleDeleteRoutine(d.routine_id, rTitle);
                      }}
                      completionCount={completionCounts[day.id] || day.completion_count || 0}
                      lastCompletedAt={lastCompletedDates[day.id] || day.last_completed_at || null}
                    />
                  ))}
                </View>
              ) : (
                /* Tarjeta cuando no hay rutinas asignadas: Solicita tus rutinas personalizadas aquí */
                <TouchableOpacity
                  style={styles.requestCoachCard}
                  onPress={handleRequestPersonalizedRoutineWhatsApp}
                  activeOpacity={0.82}
                >
                  <View style={styles.requestCoachIconWrap}>
                    <MessageCircle size={22} color="#10b981" />
                  </View>
                  <View style={styles.requestCoachContent}>
                    <Text style={styles.requestCoachTitle}>
                      {language === 'es'
                        ? 'Solicita tus rutinas personalizadas aquí'
                        : 'Request your custom routines here'}
                    </Text>
                    <Text style={styles.requestCoachSub}>
                      {language === 'es'
                        ? 'Toca para contactar a tu Coach por WhatsApp (+54 9 3364 25 4391) y recibir tu rutina exclusiva.'
                        : 'Tap to contact your Coach on WhatsApp (+54 9 3364 25 4391) and receive your exclusive routine.'}
                    </Text>
                    <View style={styles.requestCoachBtnBadge}>
                      <Text style={styles.requestCoachBtnBadgeText}>
                        {language === 'es' ? '💬 Chatear con Coach' : '💬 Chat with Coach'}
                      </Text>
                      <ChevronRight size={13} color="#10b981" />
                    </View>
                  </View>
                </TouchableOpacity>
              )}
            </View>

            {/* 2. MIS RUTINAS DE ENTRENAMIENTO (DEBAJO DE SESIONES ASIGNADAS) */}
            <View style={styles.dashboardHeader}>
              <View style={styles.dashboardTitleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.dashboardTitle}>
                    {t('routines.dashboard_title', 'Mis Rutinas')}
                  </Text>
                  <Text style={styles.dashboardSubtitle}>
                    {language === 'es'
                      ? 'Elige un grupo o crea tu rutina'
                      : 'Choose a muscle group or create your routine'}
                  </Text>
                </View>

                {totalCompletedWorkouts > 0 && (
                  <View style={styles.totalWorkoutsBadge}>
                    <Flame size={13} color="#10b981" />
                    <Text style={styles.totalWorkoutsBadgeText}>
                      {t('routines.total_workouts', '{count} entrenamientos').replace(
                        '{count}',
                        totalCompletedWorkouts.toString()
                      )}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Botón Principal de Historial de Entrenamientos */}
            <TouchableOpacity
              style={styles.historyWorkoutsBtn}
              onPress={() => setShowWorkoutHistoryModal(true)}
              activeOpacity={0.82}
            >
              <View style={styles.historyWorkoutsBtnLeft}>
                <View style={styles.historyWorkoutsIconWrap}>
                  <History size={18} color="#10b981" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.historyWorkoutsBtnTitle}>
                    {language === 'es' ? 'Historial de Entrenamientos' : 'Workout History'}
                  </Text>
                  <Text style={styles.historyWorkoutsBtnSub}>
                    {language === 'es'
                      ? 'Revisa cada sesión con fecha, pesos y repeticiones'
                      : 'Review dates, past routines, weights and reps'}
                  </Text>
                </View>
              </View>
              <View style={styles.historyWorkoutsBadge}>
                <Text style={styles.historyWorkoutsBadgeText}>
                  {language === 'es' ? 'Ver Historial' : 'View Log'}
                </Text>
                <ChevronRight size={13} color="#10b981" />
              </View>
            </TouchableOpacity>

            {/* Listado de Botones de Grupos Musculares en 2 Columnas */}
            <View style={styles.muscleGroupsGrid}>
              {orderedMuscleGroups.map((mg) => {
                const assignedDay = muscleToDayMap.get(mg.id);
                const count =
                  (assignedDay ? completionCounts[assignedDay.id] : 0) ||
                  completionCounts[mg.id] ||
                  (assignedDay?.completion_count || 0);
                const lastDate =
                  (assignedDay ? lastCompletedDates[assignedDay.id] : null) ||
                  lastCompletedDates[mg.id] ||
                  assignedDay?.last_completed_at ||
                  null;

                return (
                  <MuscleGroupCard
                    key={mg.id}
                    muscleGroup={mg}
                    routineDay={assignedDay || null}
                    completionCount={count}
                    lastCompletedAt={lastDate}
                    onSelect={handleSelectMuscleGroup}
                    isFullWidth={mg.id === 'Cuerpo Completo'}
                  />
                );
              })}
            </View>

            {/* Acciones para el alumno: Crear su propia rutina o explorar el catálogo */}
            <View style={styles.emptyActionsContainer}>
              <TouchableOpacity
                style={styles.createMyRoutineBtn}
                onPress={() => {
                  setRoutineToEdit(null);
                  setRoutineDaysToEdit(null);
                  setShowCreateRoutineModal(true);
                }}
                activeOpacity={0.8}
              >
                <Sparkles size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.createMyRoutineBtnText}>
                  {t('routines.create_custom_split', '+ Crear mi Rutina')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.exploreLibraryBtn}
                onPress={() => {
                  setSubstitutingExerciseIndex(null);
                  setShowInventoryModal(true);
                }}
                activeOpacity={0.7}
              >
                <BookOpen size={14} color="#38bdf8" style={{ marginRight: 6 }} />
                <Text style={styles.exploreLibraryBtnText}>
                  {t('routines.explore_catalog', 'Catálogo de Ejercicios')}
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.refreshBtn}
              onPress={loadTodayWorkout}
              activeOpacity={0.7}
            >
              <RefreshCw size={14} color="#10b981" style={{ marginRight: 6 }} />
              <Text style={styles.refreshBtnText}>{t('home.check_again', 'Sincronizar')}</Text>
            </TouchableOpacity>

            {/* Aún sin rutina activa seleccionada, el alumno puede registrar o cronometrar cardio, caminatas o deportes */}
            <CardioExtrasSection
              cardioItems={cardioActivities}
              biometrics={biometrics}
              onAddCardio={handleAddCardio}
              onToggleCardio={handleToggleCardio}
              onRemoveCardio={handleRemoveCardio}
              onUpdateCardio={handleUpdateCardio}
            />
          </View>
        ) : (
          <View style={styles.workoutContainer}>
            {/* Botón superior para volver al panel de rutinas */}
            <TouchableOpacity
              style={styles.backToDashboardBtn}
              onPress={handleBackToDashboard}
              activeOpacity={0.75}
            >
              <ChevronLeft size={16} color="#38bdf8" />
              <Text style={styles.backToDashboardBtnText}>
                {t('routines.back_to_dashboard', '← Volver a Mis Rutinas')}
              </Text>
            </TouchableOpacity>

            {/* Aviso de Modo Activo Inmediato */}
            {isFallbackRoutine && (
              <View style={styles.fallbackNotice}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.fallbackNoticeTitle}>{t('home.fallback_title', '⚡ Rutina de Inicio Pro Activa')}</Text>
                  <Text style={styles.fallbackNoticeSubtitle}>
                    {t('home.fallback_sub', 'Entrena y registra series con normalidad. Pulsa sincronizar para verificar nuevas asignaciones de tu Coach.')}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.syncBtn}
                  onPress={loadTodayWorkout}
                  activeOpacity={0.7}
                >
                  <RefreshCw size={12} color="#34d399" style={{ marginRight: 4 }} />
                  <Text style={styles.syncBtnText}>{t('home.sync', 'Sincronizar')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Banner del Grupo Muscular y Timer */}
            <View style={styles.dayBanner}>
              <View style={styles.dayBannerInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <View style={styles.dayBadge}>
                    <Text style={styles.dayBadgeText}>
                      {(selectedMuscleGroup || selectedRoutineDay?.muscle_group || selectedRoutineDay?.name?.replace(/^D[ií]a\s*\d+\s*[-:]?\s*/i, '') || 'RUTINA').toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.headerCounterBadge}>
                    <Flame size={12} color="#F59E0B" />
                    <Text style={styles.headerCounterBadgeText}>
                      {`${Math.max(
                        completionCounts[selectedRoutineDay?.id || ''] || 0,
                        (selectedMuscleGroup ? completionCounts[selectedMuscleGroup] : 0) || 0,
                        (selectedRoutineDay?.muscle_group ? completionCounts[selectedRoutineDay.muscle_group] : 0) || 0
                      )}x`}
                    </Text>
                  </View>
                </View>
                <Text style={styles.dayName}>
                  {translateDayName(selectedRoutineDay.name.replace(/^D[ií]a\s*\d+\s*[-:]?\s*/i, ''), language)}
                </Text>
                <Text style={styles.routineTitle}>{translateRoutineTitle(activeRoutine?.title || "", language)}</Text>

                {/* Botones de gestión de rutina y plan original */}
                <View style={styles.routineBannerActionsRow}>
                  <TouchableOpacity
                    style={styles.viewOriginalBtn}
                    onPress={() => setShowOriginalModal(true)}
                    activeOpacity={0.7}
                  >
                    <ClipboardList size={12} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={styles.viewOriginalBtnText}>
                      {t('workout.view_original_plan', 'Plan Original')}
                    </Text>
                    {Object.keys(progressionOverrides).length > 0 && (
                      <View style={styles.modIndicatorDot} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.historyBannerBtn}
                    onPress={() => setShowWorkoutHistoryModal(true)}
                    activeOpacity={0.7}
                  >
                    <History size={12} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={styles.historyBannerBtnText}>
                      {language === 'es' ? 'Historial' : 'History'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.routineBannerBtnEdit}
                    onPress={() => {
                      if (activeRoutine) {
                        handleOpenEditRoutine(activeRoutine, selectedRoutineDay || undefined);
                      } else if (selectedRoutineDay) {
                        const parent = assignedRoutinesList.find((r) => r.id === selectedRoutineDay.routine_id);
                        if (parent) {
                          handleOpenEditRoutine(parent, selectedRoutineDay);
                        } else {
                          handleOpenEditRoutine({ id: selectedRoutineDay.routine_id, title: selectedRoutineDay.name } as Routine, selectedRoutineDay);
                        }
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Edit3 size={12} color="#38bdf8" style={{ marginRight: 4 }} />
                    <Text style={styles.routineBannerBtnEditText}>
                      {language === 'es' ? 'Modificar' : 'Edit'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.routineBannerBtnDelete}
                    onPress={() => {
                      const rId = activeRoutine?.id || selectedRoutineDay?.routine_id;
                      const rTitle = activeRoutine?.title || selectedRoutineDay?.name || 'Rutina';
                      if (rId) {
                        handleDeleteRoutine(rId, rTitle);
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={12} color="#ef4444" style={{ marginRight: 4 }} />
                    <Text style={styles.routineBannerBtnDeleteText}>
                      {language === 'es' ? 'Eliminar' : 'Delete'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {isSessionActive ? (
                <View style={styles.activeTimerSection}>
                  <View style={styles.liveClock}>
                    <Clock size={14} color="#34d399" style={{ marginRight: 4 }} />
                    <Text style={styles.clockText}>{formatElapsed(elapsedSeconds)}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.finishBtn}
                    onPress={handleFinishSession}
                    activeOpacity={0.8}
                  >
                    <CheckCircle2 size={14} color="#ffffff" style={{ marginRight: 4 }} />
                    <Text style={styles.finishBtnText}>{t('home.finish_btn', 'Finalizar')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.startBtn}
                  onPress={handleStartSession}
                  activeOpacity={0.8}
                >
                  <Play size={16} color="#ffffff" fill="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.startBtnText}>{t('home.start_btn', 'Iniciar Sesión')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Tira de Métricas en Tiempo Real */}
            <View style={styles.liveMetricsStrip}>
              <View style={styles.liveMetricItem}>
                <Flame size={15} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={styles.liveMetricValue}>{currentStats.totalKcal}</Text>
                <Text style={styles.liveMetricLabel}> {t('home.stat_calories', 'kcal')}</Text>
              </View>
              <View style={styles.liveMetricDivider} />
              <View style={styles.liveMetricItem}>
                <CheckCircle2 size={15} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.liveMetricValue}>
                  {currentStats.completedCount}/{currentStats.totalTargetSets}
                </Text>
                <Text style={styles.liveMetricLabel}> {t('home.stat_sets', 'series')}</Text>
              </View>
              <View style={styles.liveMetricDivider} />
              <View style={styles.liveMetricItem}>
                <Dumbbell size={15} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.liveMetricValue}>
                  {toDisplayWeight(currentStats.totalVolumeKg)}
                </Text>
                <Text style={styles.liveMetricLabel}> {unit.toUpperCase()}</Text>
              </View>
            </View>

            {/* Widget de Música en Entrenamiento */}
            <View style={{ marginBottom: 12 }}>
              <WorkoutMusicWidget
                onPress={() => setShowMusicModal(true)}
                isSessionActive={isSessionActive}
              />
            </View>

            {/* Ejercicios */}
            {workingExercises.map((rx: WorkingExerciseItem, exIdx: number) => {
              const exInfo = rx.exercise;
              const isExerciseCompleted = rx.sets.length > 0 && rx.sets.every((s) => completedSets[s.id]?.completed);
              const completedCountForEx = rx.sets.filter((s) => completedSets[s.id]?.completed).length;

              return (
                <View key={rx.id || exIdx} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    {/* Línea 1: Título completo del ejercicio y grupo muscular a todo lo ancho de la pantalla */}
                    <View style={styles.exerciseTitleRow}>
                      <View style={styles.exerciseTitleCol}>
                        <View style={styles.exerciseTitleBadgesRow}>
                          <Text style={styles.exerciseName}>
                            {exIdx + 1}. {translateExerciseName(exInfo?.name || 'Ejercicio', language)}
                          </Text>
                          {isExerciseCompleted ? (
                            <View style={styles.completedExerciseBadge}>
                              <Check size={10} color="#10b981" strokeWidth={3} style={{ marginRight: 3 }} />
                              <Text style={styles.completedExerciseBadgeText}>
                                {language === 'en' ? 'DONE' : 'LISTO'}
                              </Text>
                            </View>
                          ) : completedCountForEx > 0 ? (
                            <View style={styles.progressExerciseBadge}>
                              <Text style={styles.progressExerciseBadgeText}>
                                {completedCountForEx}/{rx.sets.length}
                              </Text>
                            </View>
                          ) : null}
                          {(exInfo?.is_custom || exInfo?.created_by === user?.id) && (
                            <View style={styles.customExerciseBadge}>
                              <Sparkles size={10} color="#f59e0b" style={{ marginRight: 3 }} />
                              <Text style={styles.customExerciseBadgeText}>
                                {t('workout.custom_badge', 'Propio')}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.muscleGroupText}>
                          {translateMuscleGroup(exInfo?.muscle_group || 'General', language)}
                        </Text>
                      </View>
                    </View>

                    {/* Línea 2: Barra de botones de acción y estado ordenados de forma prolija debajo del título */}
                    <View style={styles.exerciseActionsBar}>
                      <View style={styles.exerciseHeaderActionsRow}>
                        {/* Historial y marcas previas */}
                        <TouchableOpacity
                          style={[styles.actionIconBtn, { borderColor: 'rgba(56, 189, 248, 0.4)', backgroundColor: 'rgba(56, 189, 248, 0.12)' }]}
                          onPress={() => {
                            setHistoryExId(rx.exercise_id || rx.id);
                            setHistoryExName(translateExerciseName(exInfo?.name || 'Ejercicio', language));
                            setHistoryMuscleGroup(exInfo?.muscle_group || 'General');
                            setHistoryModalVisible(true);
                          }}
                          activeOpacity={0.7}
                        >
                          <TrendingUp size={12} color="#38bdf8" />
                          <Text style={[styles.actionIconText, { color: '#38bdf8' }]}>
                            {language === 'en' ? 'History' : 'Historial'}
                          </Text>
                        </TouchableOpacity>

                        {/* Calculadora de Discos de Barra Olímpica (configurable en ajustes) */}
                        {preferences.barbellCalcEnabled && (
                          <TouchableOpacity
                            style={[styles.actionIconBtn, { borderColor: 'rgba(168, 85, 247, 0.4)', backgroundColor: 'rgba(168, 85, 247, 0.12)' }]}
                            onPress={() => {
                              const firstSet = rx.sets && rx.sets.length > 0 ? rx.sets[0] : null;
                              const initialKg = firstSet?.target_weight_kg || 60;
                              setBarbellInitialWeight(initialKg);
                              setBarbellExName(translateExerciseName(exInfo?.name || 'Ejercicio', language));
                              setBarbellModalVisible(true);
                            }}
                            activeOpacity={0.7}
                          >
                            <Scale size={12} color="#c084fc" />
                            <Text style={[styles.actionIconText, { color: '#c084fc' }]}>
                              {language === 'en' ? 'Plates' : 'Discos'}
                            </Text>
                          </TouchableOpacity>
                        )}

                        {/* Sustituir ejercicio */}
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleOpenSubstituteExercise(exIdx)}
                          activeOpacity={0.7}
                        >
                          <Repeat size={12} color="#38bdf8" />
                          <Text style={styles.actionIconText}>
                            {t('workout.replace_exercise', 'Sustituir')}
                          </Text>
                        </TouchableOpacity>

                        {/* Personalizar ejercicio */}
                        <TouchableOpacity
                          style={styles.actionIconBtn}
                          onPress={() => handleOpenCustomizeExercise(exIdx)}
                          activeOpacity={0.7}
                        >
                          <Sparkles size={12} color="#f59e0b" />
                          <Text style={[styles.actionIconText, { color: '#f59e0b' }]}>
                            {t('workout.customize_exercise', 'Personalizar')}
                          </Text>
                        </TouchableOpacity>

                        {/* Distintivo de Plan del Coach vs Progresión Adaptada */}
                        {progressionOverrides[rx.exercise_id || rx.id] ? (
                          <View style={styles.adaptedBadgeRow}>
                            <View style={styles.adaptedBadge}>
                              <Zap size={11} color="#fbbf24" style={{ marginRight: 4 }} />
                              <Text style={styles.adaptedBadgeText}>
                                {t('workout.adapted_badge', '⚡ Adaptado')}
                              </Text>
                            </View>
                            <TouchableOpacity
                              style={styles.quickResetBtn}
                              onPress={() => handleResetExerciseToOriginal(rx.exercise_id || rx.id)}
                              activeOpacity={0.7}
                            >
                              <RotateCcw size={10} color="#38bdf8" style={{ marginRight: 3 }} />
                              <Text style={styles.quickResetText}>
                                {t('workout.reset_exercise_btn', 'Original')}
                              </Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <View style={styles.coachBadge}>
                            <BicepsFlexed size={11} color="#34d399" style={{ marginRight: 4 }} />
                            <Text style={styles.coachBadgeText}>
                              {t('workout.coach_plan_badge', '💪 Plan Oficial')}
                            </Text>
                          </View>
                        )}

                        {/* Eliminar ejercicio de la sesión */}
                        <TouchableOpacity
                          style={[styles.actionIconBtn, styles.deleteActionIconBtn]}
                          onPress={() => handleRemoveExercise(exIdx)}
                          activeOpacity={0.7}
                        >
                          <Trash2 size={12} color="#f87171" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {rx.notes && (
                    <View style={styles.notesBox}>
                      <Text style={styles.notesText}>💡 {translateWorkoutNotes(rx.notes, language)}</Text>
                    </View>
                  )}

                  <ExerciseMediaViewer
                    videoUrl={exInfo?.video_url}
                    gifUrl={exInfo?.gif_url}
                    imageUrls={exInfo?.image_urls}
                  />

                  {/* Series Objetivo vs Reales */}
                  <View style={styles.setsContainer}>
                    {rx.sets.map((set, setIdx) => {
                      const isCompleted = completedSets[set.id]?.completed || false;

                      return (
                        <InteractiveSetRow
                          key={set.id}
                          set={set}
                          isCompleted={isCompleted}
                          onComplete={(reps, weightLogged, isCompletedBool) =>
                            handleCompleteSet(
                              set.id,
                              set.routine_exercise_set_id,
                              set.set_number,
                              reps,
                              weightLogged,
                              isCompletedBool !== undefined ? isCompletedBool : true,
                              set.rest_seconds || 60
                            )
                          }
                          onChangeActual={(reps, weight) => {
                            const updated = [...workingExercises];
                            if (updated[exIdx]?.sets[setIdx]) {
                              updated[exIdx].sets[setIdx].target_reps = reps;
                              updated[exIdx].sets[setIdx].target_weight_kg = toStandardKg(weight, unit);
                              setWorkingExercises(updated);
                              AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));
                              if (todayDay && user?.id) {
                                saveDayWorkoutSnapshot(
                                  user.id,
                                  todayDay.id,
                                  updated,
                                  completedSets,
                                  unit,
                                  toStandardKg,
                                  todayDay.name
                                ).catch(() => {});
                              }
                            }
                          }}
                          onChangeSuperset={(isSuperset, count, reps, weightsKg) => {
                            const updated = [...workingExercises];
                            if (updated[exIdx]?.sets[setIdx]) {
                              updated[exIdx].sets[setIdx].is_superset = isSuperset;
                              updated[exIdx].sets[setIdx].superset_count = count;
                              updated[exIdx].sets[setIdx].superset_reps = reps;
                              if (weightsKg && weightsKg.length > 0) {
                                updated[exIdx].sets[setIdx].superset_weights_kg = weightsKg;
                                if (weightsKg[0] > 0) {
                                  updated[exIdx].sets[setIdx].target_weight_kg = weightsKg[0];
                                }
                              }
                              const sum = reps.reduce((a, b) => a + b, 0);
                              if (sum > 0) {
                                updated[exIdx].sets[setIdx].target_reps = sum;
                              }
                              setWorkingExercises(updated);
                              AsyncStorage.setItem('@fitnesspro_working_exercises', JSON.stringify(updated));
                              if (todayDay && user?.id) {
                                saveDayWorkoutSnapshot(
                                  user.id,
                                  todayDay.id,
                                  updated,
                                  completedSets,
                                  unit,
                                  toStandardKg,
                                  todayDay.name
                                ).catch(() => {});
                              }
                            }
                          }}
                          onRemoveSet={
                            rx.sets.length > 1
                              ? () => handleRemoveSet(exIdx, setIdx)
                              : undefined
                          }
                          onLaunchTimer={(rest) => handleLaunchRestTimer(rest)}
                        />
                      );
                    })}

                    {/* Botón para Añadir Serie Extra a este ejercicio */}
                    <TouchableOpacity
                      style={styles.addExtraSetBtn}
                      onPress={() => handleAddExtraSet(exIdx)}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color="#38bdf8" style={{ marginRight: 4 }} />
                      <Text style={styles.addExtraSetBtnText}>
                        {t('home.add_extra_set', '+ Agregar Serie Extra')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}

            {/* Botón Principal para Agregar Ejercicio a esta sesión */}
            <TouchableOpacity
              style={styles.addExerciseToSessionBtn}
              onPress={handleOpenAddExercise}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#10b981" style={{ marginRight: 8 }} />
              <Text style={styles.addExerciseToSessionBtnText}>
                {t('workout.add_exercise_to_session', '+ Agregar Ejercicio a esta sesión')}
              </Text>
            </TouchableOpacity>

            {/* Sección de Cardio y Actividades Extra */}
            <CardioExtrasSection
              cardioItems={cardioActivities}
              biometrics={biometrics}
              onAddCardio={handleAddCardio}
              onToggleCardio={handleToggleCardio}
              onRemoveCardio={handleRemoveCardio}
              onUpdateCardio={handleUpdateCardio}
            />
          </View>
        )}
      </ScrollView>

      {restTimerConfig !== null && (
        <FloatingRestTimer
          key={restTimerConfig.id}
          initialSeconds={restTimerConfig.seconds}
          onDismiss={handleDismissRestTimer}
          onComplete={() => {
            isRestingRef.current = false;
          }}
        />
      )}

      <WorkoutSummaryModal
        visible={showSummaryModal}
        durationMinutes={summaryStats.durationMinutes}
        exerciseMinutes={summaryStats.exerciseMinutes}
        restMinutes={summaryStats.restMinutes}
        completionRate={summaryStats.completionRate}
        totalVolumeKg={summaryStats.totalVolumeKg}
        totalCaloriesBurned={summaryStats.totalCaloriesBurned}
        onClose={() => {
          setShowSummaryModal(false);
          setSelectedRoutineDay(null);
          setSelectedMuscleGroup(null);
          loadTodayWorkout();
        }}
      />

      <OriginalRoutineModal
        visible={showOriginalModal}
        onClose={() => setShowOriginalModal(false)}
        dayName={translateDayName(todayDay?.name || 'Entrenamiento', language)}
        routineTitle={translateRoutineTitle(activeRoutine?.title || '', language)}
        originalExercises={originalExercises}
        currentExercises={workingExercises}
        hasModifications={Object.keys(progressionOverrides).length > 0}
        onResetAll={handleResetAllToOriginal}
        onResetExercise={handleResetExerciseToOriginal}
      />

      <WorkoutHistoryModal
        visible={showWorkoutHistoryModal}
        onClose={() => setShowWorkoutHistoryModal(false)}
        userId={user?.id || ''}
        onLoadRoutineIntoSession={handleLoadRoutineFromHistory}
      />

      <BioHackerPeptidesModal
        visible={showBioHackerModal}
        onClose={() => setShowBioHackerModal(false)}
      />

      <CoachingVipModal
        visible={showCoachingModal}
        onClose={() => setShowCoachingModal(false)}
      />

      <ExerciseInventoryModal
        visible={showInventoryModal}
        onClose={() => {
          setShowInventoryModal(false);
          setSubstitutingExerciseIndex(null);
        }}
        onSelectExercise={handleSelectExerciseFromInventory}
        userId={user?.id || ''}
        actionTitle={
          substitutingExerciseIndex !== null
            ? t('workout.replace_exercise', 'Sustituir ejercicio')
            : t('workout.library_title', 'Biblioteca de Ejercicios')
        }
      />

      <CreateCustomExerciseModal
        visible={showCustomizeModal}
        onClose={() => {
          setShowCustomizeModal(false);
          setCustomizingExerciseIndex(null);
        }}
        onExerciseCreated={handleExerciseCustomized}
        userId={user?.id || ''}
        initialExercise={
          customizingExerciseIndex !== null
            ? workingExercises[customizingExerciseIndex]?.exercise
            : null
        }
      />

      <CreateRoutineModal
        visible={showCreateRoutineModal}
        onClose={handleCloseCreateRoutineModal}
        onRoutineCreated={(newRoutine) => {
          handleRoutineCreated(newRoutine);
          handleCloseCreateRoutineModal();
        }}
        onRoutineUpdated={(updatedRoutine) => {
          handleRoutineUpdated(updatedRoutine);
          handleCloseCreateRoutineModal();
        }}
        onRoutineDeleted={(deletedRoutineId) => {
          handleRoutineDeleted(deletedRoutineId);
          handleCloseCreateRoutineModal();
        }}
        userId={user?.id || ''}
        initialRoutine={routineToEdit}
        initialDays={routineDaysToEdit}
      />

      <BarbellCalculatorModal
        visible={barbellModalVisible}
        onClose={() => setBarbellModalVisible(false)}
        initialWeightKg={barbellInitialWeight}
        exerciseName={barbellExName}
      />

      <ExerciseHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        exerciseId={historyExId}
        exerciseName={historyExName}
        muscleGroup={historyMuscleGroup}
        userId={user?.id || ''}
      />

      <WorkoutMusicModal
        visible={showMusicModal}
        onClose={() => setShowMusicModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBarAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  topBarAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  topBarMusicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.4)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginRight: 6,
    gap: 4,
  },
  topBarMusicText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#1DB954',
    letterSpacing: 0.5,
  },
  viewOriginalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  viewOriginalBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
  },
  routineBannerActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
  },
  routineBannerBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
  },
  routineBannerBtnEditText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
  },
  routineBannerBtnDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.35)',
  },
  routineBannerBtnDeleteText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#ef4444',
  },
  modIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fbbf24',
    marginLeft: 6,
  },
  adaptedBadgeCol: {
    alignItems: 'flex-end',
    gap: 4,
  },
  adaptedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  adaptedBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
  },
  quickResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  quickResetText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  coachBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
  },
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
    fontWeight: '600',
  },
  topBar: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(2, 6, 4, 0.94)',
    gap: 8,
  },
  topBarHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  welcomeSubtitleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  welcomeSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#00ff87',
  },
  systemIdBadge: {
    backgroundColor: '#051209',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  systemIdBadgeText: {
    color: '#94a3b8',
    fontSize: 9.5,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  screenTitleRow: {
    width: '100%',
    paddingVertical: 1,
    marginBottom: 10,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  topMiniActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    marginTop: 2,
  },
  topMiniActionBtnCoaching: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#081c2f',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 9,
    shadowColor: '#0284c7',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  topMiniActionIconCircleCoaching: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  topMiniActionTextCoaching: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.1,
  },
  topMiniActionBtnPeptides: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#061612',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 9,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  topMiniActionIconCirclePeptides: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  topMiniActionTextPeptides: {
    flex: 1,
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.1,
  },
  peptidesBannerBtn: {
    backgroundColor: '#061612',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 11,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  peptidesGlowBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  peptidesBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  peptidesTitilandoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#34d399',
  },
  peptidesTitilandoBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  peptidesSciencePill: {
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  peptidesSciencePillText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.4,
  },
  peptidesBannerBodyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  peptidesBannerTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: 2,
  },
  peptidesAnchorMessage: {
    fontSize: 10.5,
    color: '#a7f3d0',
    lineHeight: 14.5,
    fontWeight: '600',
  },
  peptidesArrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#10b981',
    marginLeft: 6,
  },
  langSelectorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  langPillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051209',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 3,
    gap: 2,
  },
  langOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  langOptionActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.22)',
    borderWidth: 1,
    borderColor: '#10b981',
  },
  langFlag: {
    fontSize: 12,
    marginRight: 4,
  },
  langOptionText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  langOptionTextActive: {
    color: '#34d399',
    fontWeight: '900',
  },
  unitIndicatorBadge: {
    backgroundColor: '#051209',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 7,
    paddingVertical: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unitIndicatorText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  unitToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#051209',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  unitToggleLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    marginRight: 6,
  },
  unitPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  unitPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  unitDivider: {
    fontSize: 10,
    color: '#475569',
    marginHorizontal: 2,
  },
  unitActive: {
    color: '#34d399',
  },
  unitInactive: {
    color: '#64748b',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  emptyCard: {
    backgroundColor: '#051209',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 32,
    alignItems: 'center',
    marginVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 20,
    lineHeight: 18,
  },
  refreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  refreshBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  workoutContainer: {
    gap: 16,
  },
  dayBanner: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dayBannerInfo: {
    flex: 1,
  },
  dayBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  dayBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#34d399',
  },
  dayName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  routineTitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  startBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  activeTimerSection: {
    alignItems: 'flex-end',
    gap: 6,
  },
  liveClock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020503',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  clockText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#34d399',
    fontVariant: ['tabular-nums'],
  },
  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  finishBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
  },
  exerciseCard: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 14,
  },
  exerciseHeader: {
    flexDirection: 'column',
    marginBottom: 8,
    width: '100%',
  },
  exerciseTitleRow: {
    width: '100%',
    marginBottom: 6,
  },
  exerciseTitleCol: {
    width: '100%',
  },
  exerciseTitleBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  muscleGroupText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  exerciseActionsBar: {
    width: '100%',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.45)',
  },
  notesBox: {
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    borderRadius: 10,
    padding: 8,
    marginVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#10b981',
  },
  notesText: {
    fontSize: 11,
    color: '#cbd5e1',
    lineHeight: 16,
  },
  setsContainer: {
    marginTop: 8,
    gap: 4,
  },
  addExtraSetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 8,
    marginTop: 4,
  },
  addExtraSetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#38bdf8',
  },
  fallbackNotice: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 4,
  },
  fallbackNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
  },
  fallbackNoticeSubtitle: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 14,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  syncBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  liveMetricsStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: -4,
    marginBottom: 8,
  },
  liveMetricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveMetricValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
  },
  liveMetricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  liveMetricDivider: {
    width: 1,
    height: 16,
    backgroundColor: '#334155',
  },
  peptideTopBanner: {
    backgroundColor: '#0a101d',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  peptideTopGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#10b981',
  },
  peptideTopContent: {
    padding: 14,
  },
  peptideTopBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  peptideTopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  peptideTopBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  peptideTopExploreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  peptideTopExploreText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38bdf8',
  },
  peptideTopTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
    marginBottom: 4,
    lineHeight: 18,
  },
  peptideTopSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15.5,
  },
  headerPeptidesLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    marginTop: 2,
  },
  headerPeptidesLinkText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.3,
  },
  headerCoachingLink: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    marginTop: 3,
  },
  headerCoachingLinkText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.3,
  },
  peptideTopCtaBtn: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 9,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  peptideTopCtaBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.3,
  },
  customPlanVipBanner: {
    backgroundColor: '#0a1020',
    borderRadius: 16,
    borderWidth: 1.2,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    marginBottom: 14,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 3,
  },
  vipBannerLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4.5,
    backgroundColor: '#25D366',
  },
  vipBannerContent: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    paddingLeft: 18,
  },
  vipBannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  vipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  vipBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.4,
  },
  vipWhatsappPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 211, 102, 0.12)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.35)',
  },
  vipWhatsappPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#25D366',
  },
  vipBannerTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 18,
    marginBottom: 4,
    letterSpacing: 0.1,
  },
  vipBannerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 15,
    marginBottom: 10,
  },
  vipBannerCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vipBannerCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16a34a',
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 10,
    shadowColor: '#16a34a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  vipBannerCtaBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  emptyActionsContainer: {
    width: '100%',
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  createMyRoutineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  createMyRoutineBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  exploreLibraryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.35)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  exploreLibraryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
  },
  customExerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customExerciseBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  completedExerciseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  completedExerciseBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  progressExerciseBadge: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 6,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  progressExerciseBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
  exerciseHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    width: '100%',
  },
  actionIconBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    gap: 4,
  },
  deleteActionIconBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingHorizontal: 8,
    marginLeft: 'auto',
  },
  actionIconText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#38bdf8',
  },
  adaptedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  addExerciseToSessionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingVertical: 14,
    marginVertical: 12,
  },
  addExerciseToSessionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#10b981',
  },
  dashboardSection: {
    width: '100%',
    marginBottom: 20,
  },
  dashboardHeader: {
    marginBottom: 16,
  },
  dashboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dashboardTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  dashboardSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  totalWorkoutsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    gap: 4,
  },
  totalWorkoutsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  historyWorkoutsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  historyWorkoutsBtnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  historyWorkoutsIconWrap: {
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
  historyWorkoutsBtnTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.1,
  },
  historyWorkoutsBtnSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  historyWorkoutsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 3,
  },
  historyWorkoutsBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  historyBannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    gap: 4,
  },
  historyBannerBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#10b981',
  },
  routineCardsList: {
    gap: 12,
    marginBottom: 14,
  },
  backToDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginBottom: 14,
    gap: 5,
  },
  backToDashboardBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  headerCounterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  headerCounterBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },
  muscleGroupsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  coachSection: {
    marginBottom: 20,
  },
  coachSectionHeader: {
    marginBottom: 12,
  },
  coachSectionTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#10b981',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 3,
  },
  coachSectionSub: {
    fontSize: 12,
    color: '#94a3b8',
    fontWeight: '500',
  },
  requestCoachCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.35)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  requestCoachIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  requestCoachContent: {
    flex: 1,
  },
  requestCoachTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
    lineHeight: 18,
  },
  requestCoachSub: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 8,
  },
  requestCoachBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  requestCoachBtnBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#34d399',
  },
  offlineStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#475569',
  },
  offlineStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#94a3b8',
  },
  syncingStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  syncingStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },
  syncedStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  syncedStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
  },
});


