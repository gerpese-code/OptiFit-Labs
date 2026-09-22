import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  Flame,
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  Activity,
  Footprints,
  Bike,
  TrendingUp,
  Zap,
  Trophy,
  Waves,
  HeartPulse,
  Play,
  Pause,
  Square,
  Timer,
  Edit3,
  Target,
  X,
  Check,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  CardioActivityItem,
  CardioType,
  calculateCardioCalories,
  getCardioMeta,
  updateCardioActivityDuration,
  UserBiometrics,
} from '@/lib/calorieCalculator';

interface CardioExtrasSectionProps {
  cardioItems: CardioActivityItem[];
  biometrics: UserBiometrics;
  onAddCardio: (item: CardioActivityItem) => void;
  onToggleCardio: (id: string) => void;
  onRemoveCardio: (id: string) => void;
  onUpdateCardio?: (item: CardioActivityItem) => void;
}

const ALL_CARDIO_TYPES: CardioType[] = [
  'football',
  'tennis',
  'golf',
  'basketball',
  'boxing',
  'yoga',
  'pilates',
  'outdoor_walk',
  'running',
  'outdoor_cycling',
  'swimming',
  'treadmill',
  'stairmaster',
  'elliptical',
  'bike',
  'other_sport',
];

export default function CardioExtrasSection({
  cardioItems,
  biometrics,
  onAddCardio,
  onToggleCardio,
  onRemoveCardio,
  onUpdateCardio,
}: CardioExtrasSectionProps) {
  const { t, language } = useLanguage();
  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<'timer' | 'manual'>('timer');
  const [selectedType, setSelectedType] = useState<CardioType>('outdoor_walk');

  // Manual form states
  const [durationMin, setDurationMin] = useState('25');
  const [inclineDeg, setInclineDeg] = useState('6');
  const [speedKmH, setSpeedKmH] = useState('5.5');
  const [resistanceLvl, setResistanceLvl] = useState('5');

  // Live Timer (Stopwatch) states
  const [activeTimerRunning, setActiveTimerRunning] = useState(false);
  const [activeTimerType, setActiveTimerType] = useState<CardioType | null>(null);
  const [activeTimerSeconds, setActiveTimerSeconds] = useState(0);
  const [timerIncline, setTimerIncline] = useState(0);
  const [timerSpeed, setTimerSpeed] = useState(5.5);
  const [timerResistance, setTimerResistance] = useState(5);
  const timerIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Edit Existing Activity states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<CardioActivityItem | null>(null);
  const [editDurationMin, setEditDurationMin] = useState('15');
  const [editInclineDeg, setEditInclineDeg] = useState('0');
  const [editSpeedKmH, setEditSpeedKmH] = useState('5');
  const [editResistanceLvl, setEditResistanceLvl] = useState('5');

  // Live Stopwatch Interval
  useEffect(() => {
    if (activeTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setActiveTimerSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [activeTimerRunning]);

  // Format seconds to HH:MM:SS or MM:SS
  const formatStopwatch = (totalSeconds: number): string => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Helper icons
  function getCardioIcon(type: CardioType, size = 18, color = '#10b981') {
    switch (type) {
      case 'football':
        return <Trophy size={size} color={color} />;
      case 'tennis':
        return <Activity size={size} color={color} />;
      case 'golf':
        return <Target size={size} color={color} />;
      case 'basketball':
        return <Flame size={size} color={color} />;
      case 'boxing':
        return <Zap size={size} color={color} />;
      case 'yoga':
        return <HeartPulse size={size} color={color} />;
      case 'pilates':
        return <Activity size={size} color={color} />;
      case 'outdoor_walk':
        return <Footprints size={size} color={color} />;
      case 'running':
        return <Zap size={size} color={color} />;
      case 'outdoor_cycling':
      case 'bike':
        return <Bike size={size} color={color} />;
      case 'swimming':
        return <Waves size={size} color={color} />;
      case 'treadmill':
        return <Footprints size={size} color={color} />;
      case 'stairmaster':
        return <TrendingUp size={size} color={color} />;
      case 'elliptical':
        return <Activity size={size} color={color} />;
      case 'sports':
      case 'other_sport':
      default:
        return <Trophy size={size} color={color} />;
    }
  }

  // Abrir modal para agregar
  const openAddModal = (type: CardioType = 'treadmill', defaultMode: 'timer' | 'manual' = 'manual') => {
    setSelectedType(type);
    setModalMode(defaultMode);
    const meta = getCardioMeta(type, language);
    setDurationMin(meta.defaultMinutes.toString());
    setInclineDeg(type === 'treadmill' ? '6' : '0');
    setSpeedKmH(type === 'running' ? '9.0' : type === 'outdoor_walk' ? '4.8' : '5.5');
    setResistanceLvl('5');
    setModalVisible(true);
  };

  // Iniciar Cronómetro en Vivo
  const handleStartLiveTimer = () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}
    setActiveTimerType(selectedType);
    setActiveTimerSeconds(0);
    setTimerIncline(parseFloat(inclineDeg) || 0);
    setTimerSpeed(parseFloat(speedKmH) || 5);
    setTimerResistance(parseInt(resistanceLvl, 10) || 5);
    setActiveTimerRunning(true);
    setModalVisible(false);
  };

  // Pausar / Reanudar Cronómetro
  const handleTogglePauseTimer = () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch (_) {}
    setActiveTimerRunning((prev) => !prev);
  };

  // Detener y Guardar Cronómetro
  const handleStopAndSaveTimer = () => {
    if (!activeTimerType) return;
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (_) {}

    const meta = getCardioMeta(activeTimerType, language);
    const elapsedMins = Math.max(1, Math.round(activeTimerSeconds / 60));

    const calculatedKcal = calculateCardioCalories(
      {
        type: activeTimerType,
        title: meta.title,
        durationMinutes: activeTimerSeconds / 60,
        inclineDegrees: activeTimerType === 'treadmill' ? timerIncline : undefined,
        speedKmH: ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(activeTimerType)
          ? timerSpeed
          : undefined,
        resistanceLevel: ['stairmaster', 'elliptical', 'bike'].includes(activeTimerType)
          ? timerResistance
          : undefined,
        completed: true,
      },
      biometrics.weightKg
    );

    const newItem: CardioActivityItem = {
      id: `cardio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: activeTimerType,
      title: meta.title,
      durationMinutes: elapsedMins,
      inclineDegrees: activeTimerType === 'treadmill' ? timerIncline : undefined,
      speedKmH: ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(activeTimerType)
        ? timerSpeed
        : undefined,
      resistanceLevel: ['stairmaster', 'elliptical', 'bike'].includes(activeTimerType)
        ? timerResistance
        : undefined,
      caloriesBurned: Math.max(1, calculatedKcal),
      completed: true,
      createdAt: new Date().toISOString(),
    };

    onAddCardio(newItem);
    setActiveTimerRunning(false);
    setActiveTimerType(null);
    setActiveTimerSeconds(0);
  };

  // Guardar entrada manual
  const handleConfirmManualAdd = () => {
    const meta = getCardioMeta(selectedType, language);
    const dur = Math.max(1, parseInt(durationMin, 10) || meta.defaultMinutes);
    const inc = selectedType === 'treadmill' ? Math.max(0, parseFloat(inclineDeg) || 0) : undefined;
    const spd = ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(selectedType)
      ? Math.max(1, parseFloat(speedKmH) || 5)
      : undefined;
    const res = ['stairmaster', 'elliptical', 'bike'].includes(selectedType)
      ? Math.max(1, parseInt(resistanceLvl, 10) || 5)
      : undefined;

    const calculatedKcal = calculateCardioCalories(
      {
        type: selectedType,
        title: meta.title,
        durationMinutes: dur,
        inclineDegrees: inc,
        speedKmH: spd,
        resistanceLevel: res,
        completed: true,
      },
      biometrics.weightKg
    );

    const newItem: CardioActivityItem = {
      id: `cardio-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      type: selectedType,
      title: meta.title,
      durationMinutes: dur,
      inclineDegrees: inc,
      speedKmH: spd,
      resistanceLevel: res,
      caloriesBurned: calculatedKcal,
      completed: true,
      createdAt: new Date().toISOString(),
    };

    onAddCardio(newItem);
    setModalVisible(false);
  };

  // Abrir Modal de Edición de Duración
  const openEditModal = (item: CardioActivityItem) => {
    setEditingItem(item);
    setEditDurationMin(item.durationMinutes.toString());
    setEditInclineDeg((item.inclineDegrees ?? 0).toString());
    setEditSpeedKmH((item.speedKmH ?? 5.5).toString());
    setEditResistanceLvl((item.resistanceLevel ?? 5).toString());
    setEditModalVisible(true);
  };

  // Guardar Edición de Duración y Parámetros
  const handleSaveEdit = () => {
    if (!editingItem) return;
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch (_) {}

    const newDur = Math.max(1, parseInt(editDurationMin, 10) || 1);
    const newInc = editingItem.type === 'treadmill' ? Math.max(0, parseFloat(editInclineDeg) || 0) : undefined;
    const newSpd = ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(editingItem.type)
      ? Math.max(1, parseFloat(editSpeedKmH) || 5)
      : undefined;
    const newRes = ['stairmaster', 'elliptical', 'bike'].includes(editingItem.type)
      ? Math.max(1, parseInt(editResistanceLvl, 10) || 5)
      : undefined;

    const updatedCalculatedKcal = calculateCardioCalories(
      {
        type: editingItem.type,
        title: editingItem.title,
        durationMinutes: newDur,
        inclineDegrees: newInc,
        speedKmH: newSpd,
        resistanceLevel: newRes,
        completed: editingItem.completed,
      },
      biometrics.weightKg
    );

    const updatedItem: CardioActivityItem = {
      ...editingItem,
      durationMinutes: newDur,
      inclineDegrees: newInc,
      speedKmH: newSpd,
      resistanceLevel: newRes,
      caloriesBurned: updatedCalculatedKcal,
    };

    if (onUpdateCardio) {
      onUpdateCardio(updatedItem);
    } else {
      // Fallback: remover y volver a agregar
      onRemoveCardio(editingItem.id);
      onAddCardio(updatedItem);
    }

    setEditModalVisible(false);
    setEditingItem(null);
  };

  // Previsualización de calorías manual
  const previewDuration = Math.max(1, parseInt(durationMin, 10) || 15);
  const previewIncline = Math.max(0, parseFloat(inclineDeg) || 0);
  const previewSpeed = Math.max(1, parseFloat(speedKmH) || 5);
  const previewResistance = Math.max(1, parseInt(resistanceLvl, 10) || 5);

  const previewManualCalories = calculateCardioCalories(
    {
      type: selectedType,
      title: getCardioMeta(selectedType, language).title,
      durationMinutes: previewDuration,
      inclineDegrees: selectedType === 'treadmill' ? previewIncline : undefined,
      speedKmH: ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(selectedType)
        ? previewSpeed
        : undefined,
      resistanceLevel: ['stairmaster', 'elliptical', 'bike'].includes(selectedType)
        ? previewResistance
        : undefined,
      completed: true,
    },
    biometrics.weightKg
  );

  // Previsualización de calorías en vivo para el cronómetro activo
  const liveTimerCalories = activeTimerType
    ? calculateCardioCalories(
        {
          type: activeTimerType,
          title: getCardioMeta(activeTimerType, language).title,
          durationMinutes: activeTimerSeconds / 60,
          inclineDegrees: activeTimerType === 'treadmill' ? timerIncline : undefined,
          speedKmH: ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(activeTimerType)
            ? timerSpeed
            : undefined,
          resistanceLevel: ['stairmaster', 'elliptical', 'bike'].includes(activeTimerType)
            ? timerResistance
            : undefined,
          completed: true,
        },
        biometrics.weightKg
      )
    : 0;

  // Previsualización en modal de edición
  const editPreviewDuration = Math.max(1, parseInt(editDurationMin, 10) || 15);
  const editPreviewIncline = Math.max(0, parseFloat(editInclineDeg) || 0);
  const editPreviewSpeed = Math.max(1, parseFloat(editSpeedKmH) || 5);
  const editPreviewResistance = Math.max(1, parseInt(editResistanceLvl, 10) || 5);

  const editRecalculatedCalories = editingItem
    ? calculateCardioCalories(
        {
          type: editingItem.type,
          title: editingItem.title,
          durationMinutes: editPreviewDuration,
          inclineDegrees: editingItem.type === 'treadmill' ? editPreviewIncline : undefined,
          speedKmH: ['treadmill', 'running', 'outdoor_walk', 'outdoor_cycling'].includes(editingItem.type)
            ? editPreviewSpeed
            : undefined,
          resistanceLevel: ['stairmaster', 'elliptical', 'bike'].includes(editingItem.type)
            ? editPreviewResistance
            : undefined,
          completed: true,
        },
        biometrics.weightKg
      )
    : 0;

  const totalCardioCalories = cardioItems
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.caloriesBurned, 0);

  const totalCardioMinutes = cardioItems
    .filter((c) => c.completed)
    .reduce((sum, c) => sum + c.durationMinutes, 0);

  return (
    <View style={styles.container}>
      {/* Header Principal */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Flame size={18} color="#f59e0b" />
          <Text style={styles.title}>{t('cardio.title', 'Cardio y Deportes')}</Text>
        </View>

        {cardioItems.length > 0 && (
          <View style={styles.badgeTotal}>
            <Text style={styles.badgeTotalText}>
              +{totalCardioCalories} kcal • {totalCardioMinutes} min
            </Text>
          </View>
        )}
      </View>

      <Text style={styles.subtitle}>
        {t('cardio.subtitle', 'Cronómetro en vivo y registro de actividades.')}
      </Text>

      {/* WIDGET CRONÓMETRO EN VIVO (Si hay uno activo) */}
      {activeTimerType && (
        <View style={styles.liveStopwatchCard}>
          <View style={styles.liveStopwatchHeader}>
            <View style={styles.liveStopwatchBadge}>
              <View style={[styles.livePulseDot, activeTimerRunning && styles.livePulseDotActive]} />
              <Text style={styles.liveStopwatchBadgeText}>
                {activeTimerRunning ? t('cardio.live_timer_badge', 'CRONÓMETRO EN VIVO') : t('cardio.paused_timer_badge', 'CRONÓMETRO EN PAUSA')}
              </Text>
            </View>
            <Text style={styles.liveStopwatchActivityTitle}>
              {getCardioMeta(activeTimerType, language).title}
            </Text>
          </View>

          <View style={styles.liveStopwatchBody}>
            <View style={styles.liveTimerDigitsCol}>
              <Text style={styles.liveTimerDigits}>{formatStopwatch(activeTimerSeconds)}</Text>
              <Text style={styles.liveTimerDigitsSub}>{t('cardio.elapsed_time', 'Tiempo transcurrido')}</Text>
            </View>

            <View style={styles.liveCaloriesBurnCol}>
              <View style={styles.liveBurnTag}>
                <Flame size={14} color="#f59e0b" style={{ marginRight: 4 }} />
                <Text style={styles.liveBurnValue}>~{liveTimerCalories}</Text>
                <Text style={styles.liveBurnUnit}>kcal</Text>
              </View>
              <Text style={styles.liveBurnSub}>{t('cardio.estimated_burn', 'Gasto calculado')}</Text>
            </View>
          </View>

          {/* Botones de Control del Cronómetro */}
          <View style={styles.liveStopwatchControls}>
            <TouchableOpacity
              style={[
                styles.liveBtnPause,
                !activeTimerRunning && styles.liveBtnResume,
              ]}
              onPress={handleTogglePauseTimer}
              activeOpacity={0.8}
            >
              {activeTimerRunning ? (
                <>
                  <Pause size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.liveBtnText}>{t('cardio.pause_btn', 'Pausar')}</Text>
                </>
              ) : (
                <>
                  <Play size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.liveBtnText}>{t('cardio.resume_btn', 'Reanudar')}</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.liveBtnStop}
              onPress={handleStopAndSaveTimer}
              activeOpacity={0.8}
            >
              <Square size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.liveBtnText}>{t('cardio.stop_save_btn', 'Detener y Guardar')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Lista de Extras ya Registrados */}
      {cardioItems.length > 0 ? (
        <View style={styles.cardioList}>
          {cardioItems.map((item) => (
            <View
              key={item.id}
              style={[styles.cardioRow, item.completed && styles.cardioRowCompleted]}
            >
              {/* Check de estado */}
              <TouchableOpacity
                style={styles.checkBtn}
                onPress={() => onToggleCardio(item.id)}
                activeOpacity={0.7}
              >
                {item.completed ? (
                  <CheckCircle2 size={22} color="#10b981" />
                ) : (
                  <Circle size={22} color="#64748b" />
                )}
              </TouchableOpacity>

              {/* Datos de la actividad */}
              <View style={styles.cardioInfo}>
                <View style={styles.cardioTitleRow}>
                  {getCardioIcon(item.type, 16, item.completed ? '#10b981' : '#94a3b8')}
                  <Text
                    style={[
                      styles.cardioTitle,
                      item.completed && styles.cardioTitleCompleted,
                    ]}
                  >
                    {item.type ? getCardioMeta(item.type, language).title : item.title}
                  </Text>
                </View>

                <View style={styles.cardioSpecsRow}>
                  <Text style={styles.cardioSpecText}>{item.durationMinutes} min</Text>
                  {item.inclineDegrees !== undefined && item.inclineDegrees > 0 && (
                    <Text style={styles.cardioSpecText}>
                      • Inclinación: {item.inclineDegrees}°
                    </Text>
                  )}
                  {item.speedKmH !== undefined && (
                    <Text style={styles.cardioSpecText}>• {item.speedKmH} km/h</Text>
                  )}
                  {item.resistanceLevel !== undefined && (
                    <Text style={styles.cardioSpecText}>
                      • Nivel: {item.resistanceLevel}
                    </Text>
                  )}
                </View>
              </View>

              {/* Acciones: Calorías + Botón Editar Tiempo (✏️) + Eliminar */}
              <View style={styles.cardioRight}>
                <View style={styles.caloriesTag}>
                  <Flame size={12} color="#f59e0b" style={{ marginRight: 2 }} />
                  <Text style={styles.caloriesTagText}>{item.caloriesBurned} kcal</Text>
                </View>

                <View style={styles.actionsBtnRow}>
                  {/* Botón Editar / Modificar Tiempo */}
                  <TouchableOpacity
                    style={styles.editBtn}
                    onPress={() => openEditModal(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Edit3 size={15} color="#38bdf8" />
                  </TouchableOpacity>

                  {/* Botón Eliminar */}
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => onRemoveCardio(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>
      ) : null}

      {/* Botones de Acción Rápida: Cronómetro en Vivo vs Registro Manual */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => openAddModal('outdoor_walk', 'timer')}
          activeOpacity={0.8}
        >
          <Timer size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.primaryActionBtnText}>{t('cardio.live_timer_btn', 'Iniciar Cronómetro en Vivo')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={() => openAddModal('treadmill', 'manual')}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#34d399" style={{ marginRight: 4 }} />
          <Text style={styles.secondaryActionBtnText}>{t('cardio.manual_reg_btn', 'Registro Manual')}</Text>
        </TouchableOpacity>
      </View>

      {/* Grid de Accesos Rápidos para Deportes y Actividades */}
      <View style={styles.quickGrid}>
        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('football', 'manual')}
          activeOpacity={0.8}
        >
          <Trophy size={18} color="#10b981" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Soccer' : 'Fútbol'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Match / Field' : 'Partido / Cancha'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('tennis', 'manual')}
          activeOpacity={0.8}
        >
          <Activity size={18} color="#f59e0b" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Tennis / Padel' : 'Tenis / Pádel'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Match / Sets' : 'Set o partido'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('golf', 'manual')}
          activeOpacity={0.8}
        >
          <Target size={18} color="#84cc16" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>Golf</Text>
            <Text style={styles.quickBtnDesc}>Caminando campo</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('yoga', 'timer')}
          activeOpacity={0.8}
        >
          <HeartPulse size={18} color="#c084fc" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>Yoga</Text>
            <Text style={styles.quickBtnDesc}>Flexibilidad & core</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('outdoor_walk', 'timer')}
          activeOpacity={0.8}
        >
          <Footprints size={18} color="#34d399" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Outdoor Walk' : 'Caminata'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Fresh air' : 'Al aire libre'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('running', 'timer')}
          activeOpacity={0.8}
        >
          <Zap size={18} color="#f97316" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Running' : 'Running'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Jogging / Outdoor' : 'Carrera exterior'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('boxing', 'manual')}
          activeOpacity={0.8}
        >
          <Zap size={18} color="#ef4444" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Boxing / Martial Arts' : 'Boxeo / Artes M.'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Bag / Sparring' : 'Saco / Sparring'}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCardioBtn}
          onPress={() => openAddModal('treadmill', 'manual')}
          activeOpacity={0.8}
        >
          <Footprints size={18} color="#10b981" />
          <View style={{ marginLeft: 8, flex: 1 }}>
            <Text style={styles.quickBtnTitle}>{language === 'en' ? 'Incline Treadmill' : 'Caminadora'}</Text>
            <Text style={styles.quickBtnDesc}>{language === 'en' ? 'Incline walk' : 'Con inclinación'}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ========================================================= */}
      {/* MODAL: CONFIGURAR / AGREGAR ACTIVIDAD (CRONÓMETRO O MANUAL) */}
      {/* ========================================================= */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>ACTIVIDAD FÍSICA EXTRA</Text>
                <Text style={styles.modalTitle}>{getCardioMeta(selectedType, language).title}</Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            {/* Pestañas de Modo: Cronómetro vs Manual */}
            <View style={styles.tabSelector}>
              <TouchableOpacity
                style={[styles.tabBtn, modalMode === 'timer' && styles.tabBtnActive]}
                onPress={() => setModalMode('timer')}
              >
                <Timer size={14} color={modalMode === 'timer' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabBtnText, modalMode === 'timer' && styles.tabBtnTextActive]}>
                  {language === 'en' ? 'Live Stopwatch' : 'Cronómetro en Vivo'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.tabBtn, modalMode === 'manual' && styles.tabBtnActive]}
                onPress={() => setModalMode('manual')}
              >
                <Edit3 size={14} color={modalMode === 'manual' ? '#ffffff' : '#64748b'} style={{ marginRight: 6 }} />
                <Text style={[styles.tabBtnText, modalMode === 'manual' && styles.tabBtnTextActive]}>
                  {language === 'en' ? 'Manual Entry' : 'Ingreso Manual'}
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Selector de tipo de actividad */}
              <Text style={styles.label}>{t('cardio.select_activity', 'SELECCIONA LA ACTIVIDAD')}</Text>
              <View style={styles.typeSelectorRow}>
                {ALL_CARDIO_TYPES.map((type) => {
                  const meta = getCardioMeta(type, language);
                  const isSel = selectedType === type;
                  return (
                    <TouchableOpacity
                      key={type}
                      style={[styles.typeBadge, isSel && styles.typeBadgeActive]}
                      onPress={() => setSelectedType(type)}
                    >
                      {getCardioIcon(type, 14, isSel ? '#10b981' : '#64748b')}
                      <Text style={[styles.typeBadgeText, isSel && styles.typeBadgeTextActive]}>
                        {meta.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Si está en MODO MANUAL: Input de Minutos */}
              {modalMode === 'manual' && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>{t('cardio.time_done', 'TIEMPO REALIZADO (MINUTOS)')}</Text>
                    <Text style={styles.hint}>{t('cardio.min_time_hint', 'Mínimo 1 min')}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={durationMin}
                    onChangeText={setDurationMin}
                    keyboardType="numeric"
                    placeholder="ej. 25"
                    placeholderTextColor="#64748b"
                  />
                  <View style={styles.presetsRow}>
                    {['15', '20', '30', '45', '60'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.presetBtn, durationMin === t && styles.presetBtnActive]}
                        onPress={() => setDurationMin(t)}
                      >
                        <Text
                          style={[styles.presetBtnText, durationMin === t && styles.presetBtnTextActive]}
                        >
                          {t}m
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Parámetros Específicos: Caminadora con Inclinación */}
              {selectedType === 'treadmill' && (
                <>
                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>GRADOS DE INCLINACIÓN (0° A 15°)</Text>
                      <Text style={styles.hint}>Mayor gasto metabólico</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={inclineDeg}
                      onChangeText={setInclineDeg}
                      keyboardType="numeric"
                      placeholder="ej. 6"
                      placeholderTextColor="#64748b"
                    />
                    <View style={styles.presetsRow}>
                      {['0', '3', '6', '8', '10', '12', '15'].map((deg) => (
                        <TouchableOpacity
                          key={deg}
                          style={[styles.presetBtn, inclineDeg === deg && styles.presetBtnActive]}
                          onPress={() => setInclineDeg(deg)}
                        >
                          <Text
                            style={[
                              styles.presetBtnText,
                              inclineDeg === deg && styles.presetBtnTextActive,
                            ]}
                          >
                            {deg}°
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <View style={styles.labelRow}>
                      <Text style={styles.label}>VELOCIDAD ESTIMADA (KM/H)</Text>
                      <Text style={styles.hint}>Paso continuo</Text>
                    </View>
                    <TextInput
                      style={styles.input}
                      value={speedKmH}
                      onChangeText={setSpeedKmH}
                      keyboardType="numeric"
                      placeholder="ej. 5.5"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </>
              )}

              {/* Parámetros para Running o Caminata Exterior */}
              {(selectedType === 'running' || selectedType === 'outdoor_walk') && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>VELOCIDAD PROMEDIO (KM/H)</Text>
                    <Text style={styles.hint}>
                      {selectedType === 'running' ? 'Trote 8-12 km/h' : 'Caminata 4-6 km/h'}
                    </Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={speedKmH}
                    onChangeText={setSpeedKmH}
                    keyboardType="numeric"
                    placeholder={selectedType === 'running' ? '9.0' : '5.0'}
                    placeholderTextColor="#64748b"
                  />
                </View>
              )}

              {/* Parámetros para Escalador, Elíptica o Bicicleta */}
              {['stairmaster', 'elliptical', 'bike'].includes(selectedType) && (
                <View style={styles.inputGroup}>
                  <View style={styles.labelRow}>
                    <Text style={styles.label}>NIVEL DE RESISTENCIA / INTENSIDAD (1-15)</Text>
                    <Text style={styles.hint}>Nivel en la máquina</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    value={resistanceLvl}
                    onChangeText={setResistanceLvl}
                    keyboardType="numeric"
                    placeholder="ej. 6"
                    placeholderTextColor="#64748b"
                  />
                  <View style={styles.presetsRow}>
                    {['3', '5', '7', '10', '12'].map((lvl) => (
                      <TouchableOpacity
                        key={lvl}
                        style={[styles.presetBtn, resistanceLvl === lvl && styles.presetBtnActive]}
                        onPress={() => setResistanceLvl(lvl)}
                      >
                        <Text
                          style={[
                            styles.presetBtnText,
                            resistanceLvl === lvl && styles.presetBtnTextActive,
                          ]}
                        >
                          Nivel {lvl}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {/* Tarjeta de Cálculo de Gasto Calórico en Vivo */}
              <View style={styles.burnPreviewCard}>
                <View style={styles.burnLeft}>
                  <Flame size={24} color="#f59e0b" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.burnLabel}>
                      {modalMode === 'timer' ? 'RITMO DE QUEMA ESTIMADO' : 'GASTO TOTAL ESTIMADO'}
                    </Text>
                    <Text style={styles.burnFormula}>
                      Según tu peso ({biometrics.weightKg} kg) e intensidad seleccionada
                    </Text>
                  </View>
                </View>
                <View style={styles.burnRight}>
                  <Text style={styles.burnValue}>
                    {modalMode === 'timer'
                      ? `~${Math.round(previewManualCalories / (previewDuration || 1))} kcal/min`
                      : `~${previewManualCalories} kcal`}
                  </Text>
                </View>
              </View>

              {/* Botón de Acción Principal según el modo */}
              {modalMode === 'timer' ? (
                <TouchableOpacity
                  style={styles.startTimerSubmitBtn}
                  onPress={handleStartLiveTimer}
                  activeOpacity={0.8}
                >
                  <Play size={18} color="#ffffff" style={{ marginRight: 8 }} />
                  <Text style={styles.startTimerSubmitBtnText}>Comenzar Cronómetro en Vivo</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.addSubmitBtn}
                  onPress={handleConfirmManualAdd}
                  activeOpacity={0.8}
                >
                  <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.addSubmitBtnText}>Guardar Actividad Realizada</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ========================================================= */}
      {/* MODAL: MODIFICAR TIEMPO / AJUSTES (POR SI OLVIDÓ DETENER) */}
      {/* ========================================================= */}
      <Modal visible={editModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalSubtitle}>MODIFICAR TIEMPO Y AJUSTES</Text>
                <Text style={styles.modalTitle}>{editingItem?.title}</Text>
              </View>
              <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeBtn}>
                <X size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
              {/* Nota informativa amigable */}
              <View style={styles.editNoticeBox}>
                <Text style={styles.editNoticeTitle}>💡 ¿Olvidaste detener el cronómetro a tiempo?</Text>
                <Text style={styles.editNoticeSubtitle}>
                  Ajusta la duración real en minutos. Las calorías quemadas se recalcularán automáticamente en tus reportes del día.
                </Text>
              </View>

              {/* Input de Duración en Minutos */}
              <View style={styles.inputGroup}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>DURACIÓN TOTAL (MINUTOS)</Text>
                  <Text style={styles.hint}>Modifica los minutos</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={editDurationMin}
                  onChangeText={setEditDurationMin}
                  keyboardType="numeric"
                  placeholder="ej. 30"
                  placeholderTextColor="#64748b"
                />

                {/* Chips rápidos de tiempo */}
                <View style={styles.presetsRow}>
                  {['15', '20', '30', '45', '60'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.presetBtn, editDurationMin === t && styles.presetBtnActive]}
                      onPress={() => setEditDurationMin(t)}
                    >
                      <Text
                        style={[styles.presetBtnText, editDurationMin === t && styles.presetBtnTextActive]}
                      >
                        {t}m
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Ajustes específicos según el tipo */}
              {editingItem?.type === 'treadmill' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>GRADOS DE INCLINACIÓN (0° A 15°)</Text>
                  <TextInput
                    style={styles.input}
                    value={editInclineDeg}
                    onChangeText={setEditInclineDeg}
                    keyboardType="numeric"
                  />
                </View>
              )}

              {/* Recálculo en tiempo real */}
              <View style={styles.burnPreviewCard}>
                <View style={styles.burnLeft}>
                  <Flame size={24} color="#f59e0b" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.burnLabel}>NUEVAS CALORÍAS RECALCULADAS</Text>
                    <Text style={styles.burnFormula}>
                      Para {editPreviewDuration} minutos a ritmo estimado
                    </Text>
                  </View>
                </View>
                <View style={styles.burnRight}>
                  <Text style={styles.burnValue}>~{editRecalculatedCalories}</Text>
                  <Text style={styles.burnUnit}>kcal</Text>
                </View>
              </View>

              {/* Botón Guardar Cambios */}
              <TouchableOpacity
                style={styles.saveEditBtn}
                onPress={handleSaveEdit}
                activeOpacity={0.8}
              >
                <Check size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.saveEditBtnText}>Guardar Duración Corregida</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginTop: 14,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 14,
  },
  badgeTotal: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeTotalText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },

  // Widget Cronómetro en Vivo
  liveStopwatchCard: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 14,
    marginBottom: 14,
  },
  liveStopwatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  liveStopwatchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#94a3b8',
  },
  livePulseDotActive: {
    backgroundColor: '#10b981',
  },
  liveStopwatchBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  liveStopwatchActivityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  liveStopwatchBody: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  liveTimerDigitsCol: {
    alignItems: 'flex-start',
  },
  liveTimerDigits: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  liveTimerDigitsSub: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  liveCaloriesBurnCol: {
    alignItems: 'flex-end',
  },
  liveBurnTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  liveBurnValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#f59e0b',
  },
  liveBurnUnit: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    marginLeft: 3,
  },
  liveBurnSub: {
    fontSize: 9.5,
    color: '#64748b',
    fontWeight: '600',
    marginTop: 2,
  },
  liveStopwatchControls: {
    flexDirection: 'row',
    gap: 8,
  },
  liveBtnPause: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
  },
  liveBtnResume: {
    backgroundColor: '#0284c7',
  },
  liveBtnStop: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 10,
    paddingVertical: 10,
  },
  liveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },

  // Lista de actividades
  cardioList: {
    gap: 8,
    marginBottom: 12,
  },
  cardioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  cardioRowCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.4)',
    backgroundColor: 'rgba(16, 185, 129, 0.04)',
  },
  checkBtn: {
    marginRight: 10,
  },
  cardioInfo: {
    flex: 1,
  },
  cardioTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardioTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  cardioTitleCompleted: {
    color: '#ffffff',
  },
  cardioSpecsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 3,
  },
  cardioSpecText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  cardioRight: {
    alignItems: 'flex-end',
    gap: 6,
  },
  caloriesTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  caloriesTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#f59e0b',
  },
  actionsBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editBtn: {
    padding: 4,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 6,
  },
  deleteBtn: {
    padding: 4,
  },

  // Botones de Acción
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  primaryActionBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 11,
  },
  primaryActionBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 11,
  },
  secondaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
  },

  // Grid rápido
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickCardioBtn: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  quickBtnTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#ffffff',
  },
  quickBtnDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 1,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#10b981',
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 4,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 9,
  },
  tabBtnActive: {
    backgroundColor: '#1e293b',
  },
  tabBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  hint: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: '700',
  },
  typeSelectorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 9,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeBadgeActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  typeBadgeTextActive: {
    color: '#10b981',
    fontWeight: '800',
  },
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
    flexWrap: 'wrap',
  },
  presetBtn: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  presetBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  presetBtnTextActive: {
    color: '#10b981',
  },
  burnPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 14,
    marginVertical: 10,
  },
  burnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  burnLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#f59e0b',
    letterSpacing: 0.5,
  },
  burnFormula: {
    fontSize: 9.5,
    color: '#64748b',
    marginTop: 2,
  },
  burnRight: {
    alignItems: 'flex-end',
  },
  burnValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#f59e0b',
  },
  burnUnit: {
    fontSize: 9.5,
    color: '#94a3b8',
    fontWeight: '800',
  },
  startTimerSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  startTimerSubmitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  addSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  addSubmitBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },

  // Edit Modal Notice
  editNoticeBox: {
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    padding: 12,
    marginBottom: 14,
  },
  editNoticeTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 4,
  },
  editNoticeSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  saveEditBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284c7',
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
  },
  saveEditBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
});
