import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Flame,
  TrendingDown,
  TrendingUp,
  Calendar,
  X,
  Dumbbell,
  Utensils,
  Award,
  Info,
  Archive,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  generateCalorieBalanceReport,
  CalorieBalanceReportSummary,
  getMonthlyCalorieArchives,
  saveMonthlyCalorieArchive,
  MonthlyCalorieArchive,
} from '@/lib/nutritionTracker';
import { UserBiometrics, calculateBaseLifestyleExpenditure } from '@/lib/calorieCalculator';

interface Props {
  visible: boolean;
  onClose: () => void;
  userId: string;
  biometrics: UserBiometrics;
}

type PeriodTab = '1' | '7' | '14' | '30' | 'month';

export default function CaloricBalanceReportModal({
  visible,
  onClose,
  userId,
  biometrics,
}: Props) {
  const { t, language } = useLanguage();
  const insets = useSafeAreaInsets();
  const safeBottom = Math.max(insets.bottom, Platform.OS === 'android' ? 36 : 16);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodTab>('7');
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<CalorieBalanceReportSummary | null>(null);
  const [archives, setArchives] = useState<MonthlyCalorieArchive[]>([]);
  const [savedArchiveSuccess, setSavedArchiveSuccess] = useState(false);

  // Generar lista de los últimos 6 meses (YYYY-MM)
  const availableMonths = useMemo(() => {
    const months: { key: string; label: string }[] = [];
    const now = new Date();
    const monthNamesEs = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const monthNamesEn = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const names = language === 'en' ? monthNamesEn : monthNamesEs;

    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${names[d.getMonth()]} ${d.getFullYear()}`;
      months.push({ key, label });
    }
    return months;
  }, [language]);

  useEffect(() => {
    if (!selectedMonth && availableMonths.length > 0) {
      setSelectedMonth(availableMonths[0].key);
    }
  }, [availableMonths, selectedMonth]);

  const loadReport = useCallback(async () => {
    if (!visible) return;
    setLoading(true);
    setSavedArchiveSuccess(false);
    try {
      const baseDaily = calculateBaseLifestyleExpenditure(biometrics);
      const data = await generateCalorieBalanceReport(
        userId,
        baseDaily,
        selectedPeriod,
        selectedPeriod === 'month' ? selectedMonth : undefined
      );
      setReport(data);

      const archs = await getMonthlyCalorieArchives(userId);
      setArchives(archs);
    } catch (e) {
      console.warn('Error loading calorie report:', e);
    } finally {
      setLoading(false);
    }
  }, [visible, biometrics, userId, selectedPeriod, selectedMonth]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const handleSaveMonthArchive = async () => {
    if (!report || selectedPeriod !== 'month') return;
    const currentMonthObj = availableMonths.find((m) => m.key === selectedMonth);
    const archive: MonthlyCalorieArchive = {
      monthKey: selectedMonth,
      monthTitle: currentMonthObj?.label || selectedMonth,
      totalIntake: report.totalIntake,
      totalExpenditure: report.totalExpenditure,
      totalExerciseCalories: report.totalExerciseCalories,
      netKcal: report.totalNet,
      isDeficit: report.isCumulativeDeficit,
      daysTracked: report.daysCount,
      estimatedFatLossKg: report.estimatedFatKgChange,
    };
    await saveMonthlyCalorieArchive(userId, archive);
    const archs = await getMonthlyCalorieArchives(userId);
    setArchives(archs);
    setSavedArchiveSuccess(true);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { paddingBottom: safeBottom + 20 }]}>
          {/* Barra Superior */}
          <View style={styles.topBar}>
            <View>
              <Text style={styles.topBarSubtitle}>
                {t('report.subtitle', 'BALANCE ENERGÉTICO & AHORRO')}
              </Text>
              <Text style={styles.topBarTitle}>
                {t('report.title', 'Reporte Calórico Acumulado')}
              </Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Selector de Períodos */}
          <View style={styles.periodTabsRow}>
            {[
              { key: '1', label: t('report.tab_1d', '1 Día') },
              { key: '7', label: t('report.tab_7d', '7 Días') },
              { key: '14', label: t('report.tab_14d', '14 Días') },
              { key: '30', label: t('report.tab_30d', '30 Días') },
              { key: 'month', label: t('report.tab_months', 'Meses') },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.periodTab,
                  selectedPeriod === tab.key && styles.periodTabActive,
                ]}
                onPress={() => setSelectedPeriod(tab.key as PeriodTab)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.periodTabText,
                    selectedPeriod === tab.key && styles.periodTabTextActive,
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selector de Mes Específico (si está en pestaña 'Meses') */}
          {selectedPeriod === 'month' && (
            <View style={styles.monthSelectorContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.monthPillsScroll}
              >
                {availableMonths.map((m) => (
                  <TouchableOpacity
                    key={m.key}
                    style={[
                      styles.monthPill,
                      selectedMonth === m.key && styles.monthPillActive,
                    ]}
                    onPress={() => setSelectedMonth(m.key)}
                    activeOpacity={0.7}
                  >
                    <Calendar
                      size={13}
                      color={selectedMonth === m.key ? '#10b981' : '#64748b'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.monthPillText,
                        selectedMonth === m.key && styles.monthPillTextActive,
                      ]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>
                {t('common.loading', 'Calculando balance energético...')}
              </Text>
            </View>
          ) : report ? (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Tarjeta de Ahorro o Superávit Acumulado */}
              <View
                style={[
                  styles.heroBanner,
                  report.isCumulativeDeficit ? styles.heroBannerDeficit : styles.heroBannerSurplus,
                ]}
              >
                <View style={styles.heroBannerHeader}>
                  {report.isCumulativeDeficit ? (
                    <TrendingDown size={28} color="#10b981" />
                  ) : (
                    <TrendingUp size={28} color="#f59e0b" />
                  )}
                  <View style={{ marginLeft: 12, flex: 1 }}>
                    <Text
                      style={[
                        styles.heroBannerBadge,
                        { color: report.isCumulativeDeficit ? '#10b981' : '#f59e0b' },
                      ]}
                    >
                      {report.isCumulativeDeficit
                        ? t('report.deficit_badge', '¡AHORRO CALÓRICO ACUMULADO!')
                        : t('report.surplus_badge', 'SUPERÁVIT ENERGÉTICO ACUMULADO')}
                    </Text>
                    <Text style={styles.heroBannerAmount}>
                      {report.isCumulativeDeficit ? '-' : '+'}
                      {report.cumulativeSavingsOrSurplus.toLocaleString()} kcal
                    </Text>
                    <Text style={styles.heroBannerPeriod}>{report.periodLabel}</Text>
                  </View>
                </View>

                <View style={styles.heroBannerDivider} />

                <Text style={styles.heroBannerExplanation}>
                  {report.isCumulativeDeficit
                    ? t(
                        'report.deficit_explanation',
                        `En este período consumiste menos de lo que gastaste. Este ahorro equivale a aproximadamente ~${report.estimatedFatKgChange} kg de grasa corporal reducida (basado en ~7,700 kcal por kg de grasa).`
                      )
                    : t(
                        'report.surplus_explanation',
                        `En este período consumiste un exceso neto de ${report.cumulativeSavingsOrSurplus.toLocaleString()} kcal por encima de tu gasto. Idóneo para fase de volumen o hipertrofia muscular.`
                      )}
                </Text>
              </View>

              {/* Grid de 4 Métricas Clave */}
              <View style={styles.metricsGrid}>
                {/* 1. Consumo Total */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Utensils size={16} color="#38bdf8" />
                    <Text style={styles.metricCardLabel}>
                      {t('report.intake_label', 'CONSUMO TOTAL')}
                    </Text>
                  </View>
                  <Text style={[styles.metricCardValue, { color: '#38bdf8' }]}>
                    {report.totalIntake.toLocaleString()}
                    <Text style={styles.metricCardUnit}> kcal</Text>
                  </Text>
                  <Text style={styles.metricCardSub}>
                    {t('report.avg_label', 'Media:')} {report.avgIntake.toLocaleString()} kcal/día
                  </Text>
                </View>

                {/* 2. Gasto Total */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Flame size={16} color="#10b981" />
                    <Text style={styles.metricCardLabel}>
                      {t('report.expenditure_label', 'GASTO TOTAL')}
                    </Text>
                  </View>
                  <Text style={[styles.metricCardValue, { color: '#10b981' }]}>
                    {report.totalExpenditure.toLocaleString()}
                    <Text style={styles.metricCardUnit}> kcal</Text>
                  </Text>
                  <Text style={styles.metricCardSub}>
                    {t('report.avg_label', 'Media:')} {report.avgExpenditure.toLocaleString()} kcal/día
                  </Text>
                </View>

                {/* 3. Base Cotidiana (NEAT) */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Award size={16} color="#a78bfa" />
                    <Text style={styles.metricCardLabel}>
                      {t('report.base_label', 'BASE COTIDIANA')}
                    </Text>
                  </View>
                  <Text style={[styles.metricCardValue, { color: '#a78bfa' }]}>
                    {(calculateBaseLifestyleExpenditure(biometrics) * report.daysCount).toLocaleString()}
                    <Text style={styles.metricCardUnit}> kcal</Text>
                  </Text>
                  <Text style={styles.metricCardSub}>
                    {calculateBaseLifestyleExpenditure(biometrics)} kcal/día (TMB+Trabajo)
                  </Text>
                </View>

                {/* 4. Ejercicio y Cardio Quemados */}
                <View style={styles.metricCard}>
                  <View style={styles.metricCardHeader}>
                    <Dumbbell size={16} color="#f59e0b" />
                    <Text style={styles.metricCardLabel}>
                      {t('report.exercise_label', 'EJERCICIO TOTAL')}
                    </Text>
                  </View>
                  <Text style={[styles.metricCardValue, { color: '#f59e0b' }]}>
                    +{report.totalExerciseCalories.toLocaleString()}
                    <Text style={styles.metricCardUnit}> kcal</Text>
                  </Text>
                  <Text style={styles.metricCardSub}>
                    {t('report.strength_cardio_sum', 'Rutinas + Cardio sumados')}
                  </Text>
                </View>
              </View>

              {/* Botón de Guardar Cierre Mensual (si está en mes) */}
              {selectedPeriod === 'month' && (
                <View style={styles.saveArchiveCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.saveArchiveTitle}>
                      {t('report.archive_month_title', 'Guardar Cierre de este Mes')}
                    </Text>
                    <Text style={styles.saveArchiveDesc}>
                      {t(
                        'report.archive_month_desc',
                        'Almacena el registro histórico mensual para consultar tu progreso a largo plazo.'
                      )}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.saveArchiveBtn,
                      savedArchiveSuccess && { backgroundColor: '#059669' },
                    ]}
                    onPress={handleSaveMonthArchive}
                    activeOpacity={0.8}
                  >
                    <Archive size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.saveArchiveBtnText}>
                      {savedArchiveSuccess
                        ? t('report.saved_btn', '¡Guardado!')
                        : t('report.save_btn', 'Guardar Mes')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Desglose Diario */}
              <View style={styles.dailySection}>
                <Text style={styles.sectionTitle}>
                  {t('report.daily_breakdown_title', 'DESGLOSE DÍA POR DÍA')}
                </Text>

                {report.dailyItems.map((item) => {
                  const maxBar = Math.max(item.intakeCalories, item.totalExpenditure, 1);
                  const intakePct = Math.min(100, Math.round((item.intakeCalories / maxBar) * 100));
                  const expPct = Math.min(100, Math.round((item.totalExpenditure / maxBar) * 100));

                  return (
                    <View key={item.date} style={styles.dayRowCard}>
                      <View style={styles.dayRowHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                          <Text style={styles.dayRowDate}>{item.date}</Text>
                          <Text style={styles.dayRowName}>({item.dayName})</Text>
                        </View>
                        <View
                          style={[
                            styles.dayBadge,
                            item.isDeficit ? styles.dayBadgeDeficit : styles.dayBadgeSurplus,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayBadgeText,
                              { color: item.isDeficit ? '#10b981' : '#f59e0b' },
                            ]}
                          >
                            {item.isDeficit
                              ? `Ahorro: -${Math.abs(item.netCalories)} kcal`
                              : `Exceso: +${item.netCalories} kcal`}
                          </Text>
                        </View>
                      </View>

                      {/* Comparativa Visual de Barras */}
                      <View style={styles.barsContainer}>
                        {/* Barra Consumo */}
                        <View style={styles.barLine}>
                          <Text style={styles.barLabel}>Consumo:</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${intakePct}%`, backgroundColor: '#38bdf8' },
                              ]}
                            />
                          </View>
                          <Text style={[styles.barNumber, { color: '#38bdf8' }]}>
                            {item.intakeCalories} kcal
                          </Text>
                        </View>

                        {/* Barra Gasto */}
                        <View style={styles.barLine}>
                          <Text style={styles.barLabel}>Gasto:</Text>
                          <View style={styles.barTrack}>
                            <View
                              style={[
                                styles.barFill,
                                { width: `${expPct}%`, backgroundColor: '#10b981' },
                              ]}
                            />
                          </View>
                          <Text style={[styles.barNumber, { color: '#10b981' }]}>
                            {item.totalExpenditure} kcal
                          </Text>
                        </View>
                      </View>

                      {/* Detalles de Ejercicio de ese día */}
                      {item.exerciseCalories > 0 && (
                        <View style={styles.exerciseRowNotice}>
                          <Dumbbell size={12} color="#f59e0b" style={{ marginRight: 5 }} />
                          <Text style={styles.exerciseRowNoticeText}>
                            Incluye +{item.exerciseCalories} kcal quemadas en entrenamiento/cardio
                          </Text>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>

              {/* Registro Histórico de Meses Guardados */}
              {archives.length > 0 && (
                <View style={styles.archivesSection}>
                  <Text style={styles.sectionTitle}>
                    {t('report.archives_title', 'HISTORIAL DE MESES ARCHIVADOS')}
                  </Text>
                  {archives.map((arch) => (
                    <View key={arch.monthKey} style={styles.archiveCard}>
                      <View style={styles.archiveCardHeader}>
                        <Text style={styles.archiveMonthTitle}>{arch.monthTitle}</Text>
                        <View
                          style={[
                            styles.dayBadge,
                            arch.isDeficit ? styles.dayBadgeDeficit : styles.dayBadgeSurplus,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayBadgeText,
                              { color: arch.isDeficit ? '#10b981' : '#f59e0b' },
                            ]}
                          >
                            {arch.isDeficit
                              ? `Ahorro: -${Math.abs(arch.netKcal).toLocaleString()} kcal`
                              : `Superávit: +${arch.netKcal.toLocaleString()} kcal`}
                          </Text>
                        </View>
                      </View>
                      <Text style={styles.archiveDetails}>
                        Consumo: {arch.totalIntake.toLocaleString()} kcal | Gasto:{' '}
                        {arch.totalExpenditure.toLocaleString()} kcal
                      </Text>
                      {arch.isDeficit && arch.estimatedFatLossKg > 0 && (
                        <Text style={styles.archiveFatText}>
                          🌱 Grasa corporal reducida estimada: ~{arch.estimatedFatLossKg} kg
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Nota Científica de Referencia */}
              <View style={styles.scienceNoteCard}>
                <Info size={16} color="#38bdf8" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.scienceNoteTitle}>¿Cómo interpretar este reporte?</Text>
                  <Text style={styles.scienceNoteDesc}>
                    Para reducir 1 kg de grasa corporal se requiere un déficit neto acumulado de
                    aproximadamente 7,700 kcal. Al contrastar tu gasto real con tus alimentos
                    registrados, podrás saber exactamente si vas a buen ritmo para tu objetivo.
                  </Text>
                </View>
              </View>
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    minHeight: '80%',
    paddingBottom: 25,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  topBarSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#10b981',
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  periodTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodTabActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  periodTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
  },
  periodTabTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  monthSelectorContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  monthPillsScroll: {
    gap: 8,
  },
  monthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  monthPillActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  monthPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  monthPillTextActive: {
    color: '#10b981',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
    color: '#94a3b8',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  heroBanner: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1.5,
  },
  heroBannerDeficit: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: '#10b981',
  },
  heroBannerSurplus: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: '#f59e0b',
  },
  heroBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  heroBannerBadge: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  heroBannerAmount: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  heroBannerPeriod: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  heroBannerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 12,
  },
  heroBannerExplanation: {
    fontSize: 13,
    lineHeight: 18,
    color: '#cbd5e1',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    flex: 1,
    minWidth: '47%',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  metricCardLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#64748b',
  },
  metricCardValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricCardUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  metricCardSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  saveArchiveCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 12,
  },
  saveArchiveTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  saveArchiveDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  saveArchiveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10b981',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
  },
  saveArchiveBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    color: '#64748b',
    marginBottom: 8,
  },
  dailySection: {
    gap: 10,
  },
  dayRowCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 8,
  },
  dayRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayRowDate: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  dayRowName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginLeft: 6,
  },
  dayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  dayBadgeDeficit: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  dayBadgeSurplus: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: '#f59e0b',
  },
  dayBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  barsContainer: {
    gap: 6,
  },
  barLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barLabel: {
    width: 60,
    fontSize: 11,
    fontWeight: '600',
    color: '#64748b',
  },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1e293b',
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
  },
  barNumber: {
    width: 68,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '700',
  },
  exerciseRowNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginTop: 2,
  },
  exerciseRowNoticeText: {
    fontSize: 11,
    color: '#f59e0b',
    fontWeight: '600',
  },
  archivesSection: {
    gap: 10,
  },
  archiveCard: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 4,
  },
  archiveCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  archiveMonthTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  archiveDetails: {
    fontSize: 11,
    color: '#94a3b8',
  },
  archiveFatText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '700',
    marginTop: 2,
  },
  scienceNoteCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
  },
  scienceNoteTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 2,
  },
  scienceNoteDesc: {
    fontSize: 11,
    lineHeight: 16,
    color: '#94a3b8',
  },
});
