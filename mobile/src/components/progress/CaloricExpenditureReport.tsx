import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  Flame,
  TrendingUp,
  Calendar,
  Activity,
  Zap,
  Dumbbell,
  Footprints,
  Award,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  DailyCalorieRecord,
  UserBiometrics,
  calculateBMR,
  calculateTDEE,
} from '@/lib/calorieCalculator';

interface CaloricExpenditureReportProps {
  history: DailyCalorieRecord[];
  todayWorkoutLive?: {
    calories_burned?: number;
    strength_calories?: number;
    cardio_calories?: number;
    totalVolumeKg?: number;
    duration_minutes?: number;
  } | null;
  biometrics: UserBiometrics;
}

type PeriodTab = 'day' | 'week' | 'month';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function CaloricExpenditureReport({
  history,
  todayWorkoutLive,
  biometrics,
}: CaloricExpenditureReportProps) {
  const [period, setPeriod] = useState<PeriodTab>('day');
  const { t, language } = useLanguage();

  const bmr = calculateBMR(biometrics);
  const tdee = calculateTDEE(biometrics);

  // Unificar historial asegurando que el día de hoy incluya los datos en vivo si existen
  const todayStr = new Date().toISOString().split('T')[0];
  const combinedHistory: DailyCalorieRecord[] = [...history];

  if (todayWorkoutLive && (todayWorkoutLive.calories_burned || 0) > 0) {
    const existingIdx = combinedHistory.findIndex((h) => h.date === todayStr);
    const liveKcal = todayWorkoutLive.calories_burned || 0;
    const strKcal = todayWorkoutLive.strength_calories || Math.round(liveKcal * 0.7);
    const carKcal = todayWorkoutLive.cardio_calories || (liveKcal - strKcal);

    if (existingIdx >= 0) {
      combinedHistory[existingIdx] = {
        ...combinedHistory[existingIdx],
        totalKcal: Math.max(combinedHistory[existingIdx].totalKcal, liveKcal),
        strengthKcal: Math.max(combinedHistory[existingIdx].strengthKcal, strKcal),
        cardioKcal: Math.max(combinedHistory[existingIdx].cardioKcal, carKcal),
      };
    } else {
      combinedHistory.push({
        date: todayStr,
        totalKcal: liveKcal,
        strengthKcal: strKcal,
        cardioKcal: carKcal,
        totalDurationMin: todayWorkoutLive.duration_minutes || 45,
        volumeKg: todayWorkoutLive.totalVolumeKg || 0,
        workoutsCount: 1,
      });
    }
  }

  // Helper para generar los últimos 7 días
  const getLast7DaysData = () => {
    const days: { date: string; label: string; record: DailyCalorieRecord }[] = [];
    const dayNames = language === 'en' ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().split('T')[0];
      const found = combinedHistory.find((h) => h.date === dStr);

      const record: DailyCalorieRecord = found || {
        date: dStr,
        totalKcal: 0,
        strengthKcal: 0,
        cardioKcal: 0,
        totalDurationMin: 0,
        volumeKg: 0,
        workoutsCount: 0,
      };

      days.push({
        date: dStr,
        label: i === 0 ? (language === 'en' ? 'Today' : 'Hoy') : dayNames[d.getDay()],
        record,
      });
    }
    return days;
  };

  // Helper para agrupar en las últimas 4 semanas
  const getLast4WeeksData = () => {
    const weeks: { label: string; totalKcal: number; workoutsCount: number; strengthKcal: number; cardioKcal: number }[] = [];
    const now = new Date();

    for (let w = 3; w >= 0; w--) {
      const start = new Date(now);
      start.setDate(start.getDate() - (w * 7 + 6));
      start.setHours(0, 0, 0, 0);

      const end = new Date(now);
      end.setDate(end.getDate() - (w * 7));
      end.setHours(23, 59, 59, 999);

      let totalKcal = 0;
      let strengthKcal = 0;
      let cardioKcal = 0;
      let workoutsCount = 0;

      combinedHistory.forEach((h) => {
        const hDate = new Date(h.date + 'T12:00:00');
        if (hDate >= start && hDate <= end) {
          totalKcal += h.totalKcal;
          strengthKcal += h.strengthKcal;
          cardioKcal += h.cardioKcal;
          workoutsCount += h.workoutsCount || 1;
        }
      });

      const label = w === 0 ? (language === 'en' ? 'This Wk' : 'Esta Sem') : (language === 'en' ? `Wk -${w}` : `Sem -${w}`);
      weeks.push({ label, totalKcal, workoutsCount, strengthKcal, cardioKcal });
    }
    return weeks;
  };

  // Helper para agrupar en los últimos 4 meses
  const getLast4MonthsData = () => {
    const months: { label: string; totalKcal: number; workoutsCount: number; strengthKcal: number; cardioKcal: number }[] = [];
    const monthNames = language === 'en' ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'] : ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const now = new Date();

    for (let m = 3; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const year = d.getFullYear();
      const month = d.getMonth();

      let totalKcal = 0;
      let strengthKcal = 0;
      let cardioKcal = 0;
      let workoutsCount = 0;

      combinedHistory.forEach((h) => {
        const hDate = new Date(h.date + 'T12:00:00');
        if (hDate.getFullYear() === year && hDate.getMonth() === month) {
          totalKcal += h.totalKcal;
          strengthKcal += h.strengthKcal;
          cardioKcal += h.cardioKcal;
          workoutsCount += h.workoutsCount || 1;
        }
      });

      months.push({
        label: monthNames[month],
        totalKcal,
        workoutsCount,
        strengthKcal,
        cardioKcal,
      });
    }
    return months;
  };

  const daysData = getLast7DaysData();
  const weeksData = getLast4WeeksData();
  const monthsData = getLast4MonthsData();

  // Estadísticas del período seleccionado
  let currentTotalKcal = 0;
  let currentStrengthKcal = 0;
  let currentCardioKcal = 0;
  let currentWorkoutsCount = 0;
  let maxKcal = 1;
  let barItems: { label: string; kcal: number; isHighlight?: boolean }[] = [];

  if (period === 'day') {
    barItems = daysData.map((d) => ({
      label: d.label,
      kcal: d.record.totalKcal,
      isHighlight: d.label === (language === 'en' ? 'Today' : 'Hoy'),
    }));
    currentTotalKcal = daysData.reduce((sum, d) => sum + d.record.totalKcal, 0);
    currentStrengthKcal = daysData.reduce((sum, d) => sum + d.record.strengthKcal, 0);
    currentCardioKcal = daysData.reduce((sum, d) => sum + d.record.cardioKcal, 0);
    currentWorkoutsCount = daysData.filter((d) => d.record.totalKcal > 0).length;
    maxKcal = Math.max(...barItems.map((b) => b.kcal), 500);
  } else if (period === 'week') {
    barItems = weeksData.map((w) => ({
      label: w.label,
      kcal: w.totalKcal,
      isHighlight: w.label === (language === 'en' ? 'This Wk' : 'Esta Sem'),
    }));
    currentTotalKcal = weeksData.reduce((sum, w) => sum + w.totalKcal, 0);
    currentStrengthKcal = weeksData.reduce((sum, w) => sum + w.strengthKcal, 0);
    currentCardioKcal = weeksData.reduce((sum, w) => sum + w.cardioKcal, 0);
    currentWorkoutsCount = weeksData.reduce((sum, w) => sum + w.workoutsCount, 0);
    maxKcal = Math.max(...barItems.map((b) => b.kcal), 2000);
  } else {
    barItems = monthsData.map((m) => ({
      label: m.label,
      kcal: m.totalKcal,
      isHighlight: m.label === monthsData[monthsData.length - 1].label,
    }));
    currentTotalKcal = monthsData.reduce((sum, m) => sum + m.totalKcal, 0);
    currentStrengthKcal = monthsData.reduce((sum, m) => sum + m.strengthKcal, 0);
    currentCardioKcal = monthsData.reduce((sum, m) => sum + m.cardioKcal, 0);
    currentWorkoutsCount = monthsData.reduce((sum, m) => sum + m.workoutsCount, 0);
    maxKcal = Math.max(...barItems.map((b) => b.kcal), 8000);
  }

  const avgKcalPerWorkout = currentWorkoutsCount > 0 ? Math.round(currentTotalKcal / currentWorkoutsCount) : 0;
  const strengthPercent = currentTotalKcal > 0 ? Math.round((currentStrengthKcal / currentTotalKcal) * 100) : 60;
  const cardioPercent = 100 - strengthPercent;

  // Equivalente en tejido adiposo quemado (~7,700 kcal = 1 kg de grasa metabólica)
  const fatEquivalentKg = (currentTotalKcal / 7700).toFixed(2);

  return (
    <View style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.titleGroup}>
          <Flame size={20} color="#f59e0b" />
          <View style={{ marginLeft: 8 }}>
            <Text style={styles.title}>{t('progress.caloric_exp_title', 'Gasto Calórico & Reportes')}</Text>
            <Text style={styles.subtitle}>{t('progress.caloric_exp_sub', 'Consumo energético en pesas y cardio')}</Text>
          </View>
        </View>

        {/* Selector de Rango */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabBtn, period === 'day' && styles.tabBtnActive]}
            onPress={() => setPeriod('day')}
          >
            <Text style={[styles.tabBtnText, period === 'day' && styles.tabBtnTextActive]}>
              {t('progress.period_day', 'Día')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, period === 'week' && styles.tabBtnActive]}
            onPress={() => setPeriod('week')}
          >
            <Text style={[styles.tabBtnText, period === 'week' && styles.tabBtnTextActive]}>
              {t('progress.period_week', 'Semana')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, period === 'month' && styles.tabBtnActive]}
            onPress={() => setPeriod('month')}
          >
            <Text style={[styles.tabBtnText, period === 'month' && styles.tabBtnTextActive]}>
              {t('progress.period_month', 'Mes')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tarjeta de Resumen Grande */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summarySubLabel}>
            {language === 'en' ? `TOTAL BURNED (${period === 'day' ? 'LAST 7 DAYS' : period === 'week' ? 'LAST 4 WEEKS' : 'LAST 4 MONTHS'})` : `TOTAL QUEMADO (${period === 'day' ? 'ÚLTIMOS 7 DÍAS' : period === 'week' ? 'ÚLTIMAS 4 SEMANAS' : 'ÚLTIMOS 4 MESES'})`}
          </Text>
          <Text style={styles.summaryBigKcal}>
            {currentTotalKcal.toLocaleString()}
            <Text style={styles.summaryKcalUnit}> kcal</Text>
          </Text>
          <Text style={styles.summaryFatEq}>
            🔥 {language === 'en' ? `Equivalent to ${fatEquivalentKg} kg of oxidized body fat` : `Equivalente a ${fatEquivalentKg} kg de tejido adiposo oxidado`}
          </Text>
        </View>

        <View style={styles.summaryRightBadge}>
          <Text style={styles.avgLabel}>{language === 'en' ? 'AVG / SESSION' : 'PROMEDIO/SESIÓN'}</Text>
          <Text style={styles.avgValue}>{avgKcalPerWorkout} kcal</Text>
          <Text style={styles.workoutsCountBadge}>{language === 'en' ? `${currentWorkoutsCount} workouts` : `${currentWorkoutsCount} entrenamientos`}</Text>
        </View>
      </View>

      {/* Gráfico de Barras Responsivo */}
      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {barItems.map((bar, idx) => {
            const heightPercent = maxKcal > 0 ? Math.min(100, Math.max(8, (bar.kcal / maxKcal) * 100)) : 8;

            return (
              <View key={idx} style={styles.barCol}>
                <Text style={styles.barValueText}>
                  {bar.kcal > 0 ? (bar.kcal > 999 ? `${(bar.kcal / 1000).toFixed(1)}k` : bar.kcal) : ''}
                </Text>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      { height: `${heightPercent}%` },
                      bar.isHighlight ? styles.barHighlight : styles.barNormal,
                      bar.kcal === 0 && styles.barZero,
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.barLabel,
                    bar.isHighlight && styles.barLabelHighlight,
                  ]}
                >
                  {bar.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Desglose de Origen: Fuerza vs Cardio */}
      <View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>{language === 'en' ? 'ENERGY EXPENDITURE BREAKDOWN' : 'DISTRIBUCIÓN DEL GASTO ENERGÉTICO'}</Text>

        <View style={styles.ratioBarContainer}>
          <View style={[styles.ratioSegmentStrength, { flex: Math.max(0.05, strengthPercent / 100) }]} />
          <View style={[styles.ratioSegmentCardio, { flex: Math.max(0.05, cardioPercent / 100) }]} />
        </View>

        <View style={styles.breakdownLegend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
            <Dumbbell size={14} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.legendLabel}>{language === 'en' ? 'Strength / Weights:' : 'Fuerza / Pesas:'}</Text>
            <Text style={styles.legendValue}>
              {currentStrengthKcal.toLocaleString()} kcal ({strengthPercent}%)
            </Text>
          </View>

          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
            <Footprints size={14} color="#f59e0b" style={{ marginRight: 4 }} />
            <Text style={styles.legendLabel}>{language === 'en' ? 'Cardio & Extras:' : 'Cardio & Extras:'}</Text>
            <Text style={styles.legendValue}>
              {currentCardioKcal.toLocaleString()} kcal ({cardioPercent}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Indicadores Profesionales Adicionales */}
      <View style={styles.proIndicatorsGrid}>
        <View style={styles.proIndicatorItem}>
          <View style={styles.proIndicatorHeader}>
            <Activity size={14} color="#38bdf8" />
            <Text style={styles.proIndicatorTitle}>{language === 'en' ? 'METABOLIC RATE (BMR)' : 'TASA METABÓLICA (TMB)'}</Text>
          </View>
          <Text style={styles.proIndicatorValue}>{bmr.toLocaleString()} kcal</Text>
          <Text style={styles.proIndicatorDesc}>{language === 'en' ? 'Resting vital expenditure' : 'Gasto mínimo vital en reposo'}</Text>
        </View>

        <View style={styles.proIndicatorItem}>
          <View style={styles.proIndicatorHeader}>
            <Zap size={14} color="#f59e0b" />
            <Text style={styles.proIndicatorTitle}>{language === 'en' ? 'DAILY GOAL (TDEE)' : 'META DIARIA (TDEE)'}</Text>
          </View>
          <Text style={styles.proIndicatorValue}>{tdee.toLocaleString()} kcal</Text>
          <Text style={styles.proIndicatorDesc}>{language === 'en' ? 'Daily maintenance calories' : 'Calorías de mantenimiento diario'}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tabBtnActive: {
    backgroundColor: '#10b981',
  },
  tabBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ffffff',
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  summaryLeft: {
    flex: 1,
  },
  summarySubLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  summaryBigKcal: {
    fontSize: 24,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  summaryKcalUnit: {
    fontSize: 13,
    color: '#f59e0b',
    fontWeight: '800',
  },
  summaryFatEq: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '600',
  },
  summaryRightBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
  },
  avgLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  avgValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  workoutsCountBadge: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 2,
    fontWeight: '600',
  },
  chartContainer: {
    backgroundColor: '#020617',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    height: 170,
    justifyContent: 'flex-end',
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: 140,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  barValueText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94a3b8',
    marginBottom: 4,
  },
  barTrack: {
    width: 14,
    height: 90,
    backgroundColor: '#0f172a',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barNormal: {
    backgroundColor: '#10b981',
  },
  barHighlight: {
    backgroundColor: '#f59e0b',
  },
  barZero: {
    backgroundColor: '#1e293b',
    height: 4,
  },
  barLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 6,
  },
  barLabelHighlight: {
    color: '#f59e0b',
    fontWeight: '900',
  },
  breakdownCard: {
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  breakdownTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  ratioBarContainer: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
    marginBottom: 10,
  },
  ratioSegmentStrength: {
    backgroundColor: '#10b981',
  },
  ratioSegmentCardio: {
    backgroundColor: '#f59e0b',
  },
  breakdownLegend: {
    gap: 6,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  legendLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '700',
    marginRight: 4,
  },
  legendValue: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '800',
  },
  proIndicatorsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  proIndicatorItem: {
    flex: 1,
    backgroundColor: '#020617',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  proIndicatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  proIndicatorTitle: {
    fontSize: 9,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  proIndicatorValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 4,
  },
  proIndicatorDesc: {
    fontSize: 9,
    color: '#64748b',
    marginTop: 2,
  },
});
