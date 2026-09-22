import React from 'react';
import { View, Text, Modal, StyleSheet, TouchableOpacity } from 'react-native';
import { Trophy, Clock, CheckCircle2, Dumbbell, Flame } from 'lucide-react-native';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';

interface WorkoutSummaryModalProps {
  visible: boolean;
  durationMinutes: number;
  exerciseMinutes?: number;
  restMinutes?: number;
  completionRate: number;
  totalVolumeKg: number;
  totalCaloriesBurned?: number;
  onClose: () => void;
}

export default function WorkoutSummaryModal({
  visible,
  durationMinutes,
  exerciseMinutes = 0,
  restMinutes = 0,
  completionRate,
  totalVolumeKg,
  totalCaloriesBurned = 0,
  onClose,
}: WorkoutSummaryModalProps) {
  const { unit, toDisplayWeight } = useUnit();
  const { t } = useLanguage();

  const volumeInUnit = Math.round(toDisplayWeight(totalVolumeKg));

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Trophy Icon */}
          <View style={styles.iconCircle}>
            <Trophy size={40} color="#10b981" />
          </View>

          <Text style={styles.title}>{t('summary.title', '¡Entrenamiento Completado!')}</Text>
          <Text style={styles.subtitle}>
            {t(
              'summary.subtitle',
              'Excelente trabajo. Cada serie y minuto te acerca más a tu mejor versión.'
            )}
          </Text>

          {/* Desglose de Tiempos */}
          <View style={styles.timeBreakdownCard}>
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>{t('summary.total_time', 'Tiempo Total')}</Text>
              <Text style={styles.timeVal}>{durationMinutes} min</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>{t('summary.exercise_time', 'Ejercicio')}</Text>
              <Text style={[styles.timeVal, { color: '#38bdf8' }]}>{exerciseMinutes} min</Text>
            </View>
            <View style={styles.timeDivider} />
            <View style={styles.timeItem}>
              <Text style={styles.timeLabel}>{t('summary.rest_time', 'Descanso')}</Text>
              <Text style={[styles.timeVal, { color: '#a78bfa' }]}>{restMinutes} min</Text>
            </View>
          </View>

          {/* Estadísticas */}
          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <Flame size={16} color="#f59e0b" />
              <Text style={[styles.statValue, { color: '#f59e0b' }]}>{totalCaloriesBurned}</Text>
              <Text style={styles.statLabel}>{t('summary.calories', 'KCAL')}</Text>
            </View>

            <View style={styles.statBox}>
              <CheckCircle2 size={16} color="#34d399" />
              <Text style={styles.statValue}>{completionRate}%</Text>
              <Text style={styles.statLabel}>{t('summary.success', 'ÉXITO')}</Text>
            </View>

            <View style={styles.statBox}>
              <Dumbbell size={16} color="#34d399" />
              <Text style={styles.statValue}>
                {volumeInUnit.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>{unit.toUpperCase()}</Text>
            </View>
          </View>

          {/* Botón de Salida */}
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onClose}
            activeOpacity={0.8}
          >
            <Text style={styles.actionBtnText}>{t('summary.continue_btn', 'Continuar al Inicio')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 2,
    borderColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  timeBreakdownCard: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  timeVal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  timeDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#1e293b',
  },
  statsGrid: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  actionBtn: {
    width: '100%',
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
});
