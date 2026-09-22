import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Dumbbell,
  Flame,
  Sparkles,
  ChevronRight,
  Activity,
  ShieldCheck,
  Zap,
  RotateCcw,
  Target,
  TrendingUp,
  Plus,
  BicepsFlexed,
} from 'lucide-react-native';
import { RoutineDay } from '@/types/database';
import { MuscleGroupDefinition, filterRoutineExercisesByMuscleGroup } from '@/lib/constants/muscleGroups';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';

interface MuscleGroupCardProps {
  muscleGroup: MuscleGroupDefinition;
  routineDay?: RoutineDay | null;
  completionCount: number;
  lastCompletedAt?: string | null;
  onSelect: (muscleGroup: MuscleGroupDefinition, day?: RoutineDay | null) => void;
  isFullWidth?: boolean;
}

export default function MuscleGroupCard({
  muscleGroup,
  routineDay,
  completionCount,
  lastCompletedAt,
  onSelect,
  isFullWidth = false,
}: MuscleGroupCardProps) {
  const { t, language } = useLanguage();

  const groupExercises = React.useMemo(() => {
    if (!routineDay || !routineDay.routine_exercises) return [];
    if (routineDay.muscle_group === muscleGroup.id) {
      return routineDay.routine_exercises;
    }
    return filterRoutineExercisesByMuscleGroup(routineDay.routine_exercises, muscleGroup.id);
  }, [routineDay, muscleGroup.id]);

  const isAssigned = groupExercises.length > 0;
  const exerciseCount = groupExercises.length;
  const hasCompletions = completionCount > 0;
  const title = language === 'en' ? muscleGroup.nameEn : muscleGroup.nameEs;

  const handlePress = () => {
    triggerHaptic('tap');
    onSelect(muscleGroup, routineDay || null);
  };

  const renderIcon = (size = 17) => {
    const color = isAssigned ? muscleGroup.color : '#94a3b8';

    switch (muscleGroup.icon) {
      case 'Dumbbell':
        return <Dumbbell size={size} color={color} />;
      case 'Activity':
        return <Activity size={size} color={color} />;
      case 'Flame':
        return <Flame size={size} color={color} />;
      case 'Sparkles':
        return <Sparkles size={size} color={color} />;
      case 'RotateCcw':
        return <RotateCcw size={size} color={color} />;
      case 'Zap':
        return <Zap size={size} color={color} />;
      case 'BicepsFlexed':
      case 'Target':
        return <BicepsFlexed size={size} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={size} color={color} />;
      case 'TrendingUp':
        return <TrendingUp size={size} color={color} />;
      default:
        return <Dumbbell size={size} color={color} />;
    }
  };

  if (isFullWidth) {
    return (
      <TouchableOpacity
        activeOpacity={0.75}
        onPress={handlePress}
        style={[
          styles.tileFullWidth,
          isAssigned
            ? hasCompletions
              ? styles.tileAssignedActive
              : styles.tileAssigned
            : styles.tileEmpty,
        ]}
      >
        <View style={styles.fullWidthLeft}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor: isAssigned ? muscleGroup.badgeBg : 'rgba(51, 65, 85, 0.25)',
                borderColor: isAssigned ? muscleGroup.badgeBorder : 'rgba(71, 85, 105, 0.4)',
              },
            ]}
          >
            {renderIcon(18)}
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.groupTitleFull} numberOfLines={1}>
              {title.toUpperCase()}
            </Text>
            <Text style={styles.groupSubFull} numberOfLines={1}>
              {isAssigned
                ? `${exerciseCount} ${exerciseCount === 1 ? (language === 'en' ? 'exercise' : 'ejercicio') : (language === 'en' ? 'exercises' : 'ejercicios')} • ${language === 'en' ? 'Start routine' : 'Entrenar'}`
                : language === 'en' ? '+ Create routine' : '+ Crear tu propia rutina'}
            </Text>
          </View>
        </View>

        <View style={styles.fullWidthRight}>
          <View
            style={[
              styles.counterBadge,
              hasCompletions ? styles.counterBadgeActive : styles.counterBadgeZero,
            ]}
          >
            {hasCompletions ? (
              <Flame size={12} color="#f59e0b" style={{ marginRight: 3 }} />
            ) : (
              <Sparkles size={11} color="#10b981" style={{ marginRight: 3 }} />
            )}
            <Text
              style={[
                styles.counterBadgeText,
                hasCompletions ? styles.counterBadgeTextActive : styles.counterBadgeTextZero,
              ]}
            >
              {completionCount}x
            </Text>
          </View>
          <ChevronRight size={14} color={isAssigned ? muscleGroup.color : '#64748b'} style={{ marginLeft: 6 }} />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={handlePress}
      style={[
        styles.tileContainer,
        isAssigned
          ? hasCompletions
            ? styles.tileAssignedActive
            : styles.tileAssigned
          : styles.tileEmpty,
      ]}
    >
      {/* Fila Superior: Icono a la izquierda y Contador a la derecha */}
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: isAssigned ? muscleGroup.badgeBg : 'rgba(51, 65, 85, 0.25)',
              borderColor: isAssigned ? muscleGroup.badgeBorder : 'rgba(71, 85, 105, 0.4)',
            },
          ]}
        >
          {renderIcon(17)}
        </View>

        {/* Contador +1 de veces realizadas */}
        <View
          style={[
            styles.counterBadge,
            hasCompletions ? styles.counterBadgeActive : styles.counterBadgeZero,
          ]}
        >
          {hasCompletions ? (
            <Flame size={12} color="#f59e0b" style={{ marginRight: 3 }} />
          ) : (
            <Sparkles size={11} color="#10b981" style={{ marginRight: 3 }} />
          )}
          <Text
            style={[
              styles.counterBadgeText,
              hasCompletions ? styles.counterBadgeTextActive : styles.counterBadgeTextZero,
            ]}
          >
            {completionCount}x
          </Text>
        </View>
      </View>

      {/* Título del Grupo Muscular */}
      <View style={styles.titleWrapper}>
        <Text style={styles.groupTitle} numberOfLines={1}>
          {title.toUpperCase()}
        </Text>
      </View>

      {/* Fila Inferior: Estado (ejercicios asignados o crear rutina) */}
      <View style={styles.bottomRow}>
        {isAssigned ? (
          <View style={styles.assignedBadgeRow}>
            <View style={[styles.statusDot, { backgroundColor: muscleGroup.color }]} />
            <Text style={styles.assignedStatusText} numberOfLines={1}>
              {exerciseCount} {exerciseCount === 1 ? (language === 'en' ? 'ex' : 'ej') : (language === 'en' ? 'exs' : 'ejs')}
            </Text>
            <ChevronRight size={12} color={muscleGroup.color} style={{ marginLeft: 'auto' }} />
          </View>
        ) : (
          <View style={styles.emptyBadgeRow}>
            <Plus size={10} color="#38bdf8" style={{ marginRight: 3 }} />
            <Text style={styles.emptyStatusText} numberOfLines={1}>
              {language === 'en' ? 'Create' : 'Crear'}
            </Text>
            <ChevronRight size={12} color="#475569" style={{ marginLeft: 'auto' }} />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tileContainer: {
    width: '48.5%',
    backgroundColor: '#090e1a',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    padding: 12,
    marginBottom: 10,
    justifyContent: 'space-between',
    minHeight: 102,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  tileFullWidth: {
    width: '100%',
    backgroundColor: '#090e1a',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  fullWidthLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  fullWidthRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  groupTitleFull: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  groupSubFull: {
    fontSize: 10.5,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  tileAssigned: {
    borderColor: 'rgba(56, 189, 248, 0.3)',
    backgroundColor: '#0a1020',
  },
  tileAssignedActive: {
    borderColor: 'rgba(16, 185, 129, 0.45)',
    backgroundColor: '#0a1222',
  },
  tileEmpty: {
    borderColor: 'rgba(30, 41, 59, 0.65)',
    backgroundColor: '#070b14',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  counterBadgeActive: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  counterBadgeZero: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  counterBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
  counterBadgeTextActive: {
    color: '#f59e0b',
  },
  counterBadgeTextZero: {
    color: '#10b981',
  },
  titleWrapper: {
    marginBottom: 8,
  },
  groupTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.4,
  },
  bottomRow: {
    width: '100%',
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(30, 41, 59, 0.5)',
  },
  assignedBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  assignedStatusText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  emptyBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  emptyStatusText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748b',
  },
});
