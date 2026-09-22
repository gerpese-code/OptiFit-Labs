import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Flame, Dumbbell, Clock, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react-native';
import { RoutineDay } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';
import { translateDayName, translateExerciseName } from '@/lib/workoutTranslator';

interface RoutineSplitCardProps {
  day: RoutineDay;
  onSelect: (day: RoutineDay) => void;
  completionCount?: number;
  lastCompletedAt?: string | null;
}

export default function RoutineSplitCard({
  day,
  onSelect,
  completionCount = 0,
  lastCompletedAt,
}: RoutineSplitCardProps) {
  const { t, language } = useLanguage();

  const handlePress = () => {
    triggerHaptic('tap');
    onSelect(day);
  };

  // Limpiar prefijos obsoletos de calendario como "Día 1 - ", "Día 2: "
  const rawName = day.name || 'Rutina';
  const cleanTitle = rawName.replace(/^D[ií]a\s*\d+\s*[-:]?\s*/i, '').trim() || rawName;
  const translatedTitle = translateDayName(cleanTitle, language);

  // Ejercicios incluidos
  const exercises = day.routine_exercises || [];
  const exerciseCount = exercises.length;
  const exerciseNamesSnippet = exercises
    .slice(0, 3)
    .map((re) => translateExerciseName(re.exercise?.name || 'Ejercicio', language))
    .join(' • ');

  // Formatear fecha relativa de última vez realizada
  const getRelativeTime = (): string => {
    if (!lastCompletedAt) {
      return t('routines.last_never');
    }
    const date = new Date(lastCompletedAt);
    if (isNaN(date.getTime())) return t('routines.last_never');

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return t('routines.last_today', 'Hoy');
    } else if (diffDays === 1) {
      return t('routines.last_yesterday', 'Ayer');
    } else {
      return t('routines.last_days_ago', 'Hace {days} días').replace('{days}', diffDays.toString());
    }
  };

  const hasCompletions = completionCount > 0;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={[
        styles.cardContainer,
        hasCompletions ? styles.cardContainerActive : styles.cardContainerUnopened,
      ]}
    >
      {/* Cabecera de la tarjeta: Título de grupo muscular y badge de contador */}
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.routineTitle} numberOfLines={1}>
            {translatedTitle}
          </Text>
          <View style={styles.subtitleRow}>
            <Dumbbell size={12} color="#10B981" />
            <Text style={styles.subtitleText}>
              {t('routines.exercises_count', '{count} ejercicios').replace('{count}', exerciseCount.toString())}
            </Text>
          </View>
        </View>

        {/* Contador +1 Destacado */}
        <View
          style={[
            styles.counterBadge,
            hasCompletions ? styles.counterBadgeActive : styles.counterBadgeZero,
          ]}
        >
          {hasCompletions ? (
            <Flame size={14} color="#F59E0B" style={styles.counterIcon} />
          ) : (
            <Sparkles size={13} color="#10B981" style={styles.counterIcon} />
          )}
          <Text
            style={[
              styles.counterBadgeText,
              hasCompletions ? styles.counterBadgeTextActive : styles.counterBadgeTextZero,
            ]}
          >
            {hasCompletions
              ? completionCount === 1
                ? t('routines.completed_single', '🔥 Realizada 1 vez')
                : t('routines.completed_badge', '🔥 Realizada {count} veces').replace(
                    '{count}',
                    completionCount.toString()
                  )
              : t('routines.completed_zero', '✨ Por estrenar (0 veces)')}
          </Text>
        </View>
      </View>

      {/* Snippet de ejercicios */}
      {exerciseNamesSnippet ? (
        <Text style={styles.exerciseSnippet} numberOfLines={1}>
          {exerciseNamesSnippet}
          {exerciseCount > 3 ? ` • +${exerciseCount - 3}` : ''}
        </Text>
      ) : null}

      {/* Pie de tarjeta: Última vez realizada y Botón Iniciar */}
      <View style={styles.footerRow}>
        <View style={styles.lastTrainedContainer}>
          <Clock size={11} color="#9CA3AF" />
          <Text style={styles.lastTrainedText}>
            {t('routines.last_trained', 'Última vez: {time}').replace('{time}', getRelativeTime())}
          </Text>
        </View>

        <View style={styles.startBtn}>
          <Text style={styles.startBtnText}>
            {t('routines.start_routine_btn', 'Entrenar Rutina ➔')}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: '#111827',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  cardContainerActive: {
    borderColor: '#1F2937',
  },
  cardContainerUnopened: {
    borderColor: '#064E3B',
    backgroundColor: '#062016',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  titleContainer: {
    flex: 1,
  },
  routineTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  subtitleText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  counterBadgeActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  counterBadgeZero: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  counterIcon: {
    marginRight: 4,
  },
  counterBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  counterBadgeTextActive: {
    color: '#FBBF24',
  },
  counterBadgeTextZero: {
    color: '#34D399',
  },
  exerciseSnippet: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    lineHeight: 15,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  lastTrainedContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  lastTrainedText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  startBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
