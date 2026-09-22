import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Dumbbell, Sparkles, Plus, Minus, Info } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { useUnit } from '@/context/UnitContext';

interface BarbellCalculatorModalProps {
  visible: boolean;
  onClose: () => void;
  initialWeightKg?: number;
  exerciseName?: string;
}

interface PlateConfig {
  weight: number;
  color: string;
  labelColor: string;
  height: number;
}

const KG_PLATES: PlateConfig[] = [
  { weight: 25, color: '#ef4444', labelColor: '#ffffff', height: 80 },
  { weight: 20, color: '#3b82f6', labelColor: '#ffffff', height: 74 },
  { weight: 15, color: '#eab308', labelColor: '#000000', height: 66 },
  { weight: 10, color: '#22c55e', labelColor: '#ffffff', height: 58 },
  { weight: 5, color: '#f8fafc', labelColor: '#000000', height: 48 },
  { weight: 2.5, color: '#0f172a', labelColor: '#ffffff', height: 40 },
  { weight: 1.25, color: '#64748b', labelColor: '#ffffff', height: 32 },
];

const LBS_PLATES: PlateConfig[] = [
  { weight: 45, color: '#ef4444', labelColor: '#ffffff', height: 80 },
  { weight: 35, color: '#3b82f6', labelColor: '#ffffff', height: 74 },
  { weight: 25, color: '#eab308', labelColor: '#000000', height: 66 },
  { weight: 10, color: '#22c55e', labelColor: '#ffffff', height: 58 },
  { weight: 5, color: '#f8fafc', labelColor: '#000000', height: 48 },
  { weight: 2.5, color: '#0f172a', labelColor: '#ffffff', height: 40 },
];

export default function BarbellCalculatorModal({
  visible,
  onClose,
  initialWeightKg = 60,
  exerciseName,
}: BarbellCalculatorModalProps) {
  const { t } = useLanguage();
  const { unit, toDisplayWeight, toStandardKg } = useUnit();

  const [inputWeight, setInputWeight] = useState<string>(
    Math.round(toDisplayWeight(initialWeightKg)).toString()
  );
  const [barWeightKg, setBarWeightKg] = useState<number>(20); // 20kg olímpica estándar

  // Peso de la barra en la unidad actual
  const currentBarWeight = unit === 'kg' ? barWeightKg : (barWeightKg === 20 ? 45 : 35);

  const numericTarget = parseFloat(inputWeight) || currentBarWeight;
  const plateList = unit === 'kg' ? KG_PLATES : LBS_PLATES;

  // Cálculo de discos por lado
  const calculation = useMemo(() => {
    const weightToLoad = Math.max(0, numericTarget - currentBarWeight);
    const weightPerSide = weightToLoad / 2;

    let remaining = weightPerSide;
    const loadedPlates: { plate: PlateConfig; count: number }[] = [];

    for (const p of plateList) {
      if (remaining >= p.weight) {
        const count = Math.floor(remaining / p.weight);
        loadedPlates.push({ plate: p, count });
        remaining = Math.round((remaining - count * p.weight) * 100) / 100;
      }
    }

    return {
      weightToLoad,
      weightPerSide,
      loadedPlates,
      unloadedWeight: remaining * 2,
    };
  }, [numericTarget, currentBarWeight, plateList]);

  const handleAdjustWeight = (delta: number) => {
    const current = parseFloat(inputWeight) || 0;
    const next = Math.max(currentBarWeight, current + delta);
    setInputWeight(Math.round(next).toString());
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tag}>
                <Dumbbell size={11} color="#38bdf8" style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>CALCULADORA DE CARGAS EN BARRA</Text>
              </View>
              <Text style={styles.title}>
                {exerciseName ? `Discos para: ${exerciseName}` : 'Calculadora de Discos'}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Input de Peso Objetivo */}
            <View style={styles.weightCard}>
              <Text style={styles.weightLabel}>PESO TOTAL OBJETIVO ({unit.toUpperCase()})</Text>

              <View style={styles.weightRow}>
                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustWeight(-5)}
                  activeOpacity={0.7}
                >
                  <Minus size={18} color="#38bdf8" />
                </TouchableOpacity>

                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.weightInput}
                    value={inputWeight}
                    onChangeText={setInputWeight}
                    keyboardType="numeric"
                    selectTextOnFocus
                  />
                  <Text style={styles.unitSuffix}>{unit.toUpperCase()}</Text>
                </View>

                <TouchableOpacity
                  style={styles.adjustBtn}
                  onPress={() => handleAdjustWeight(5)}
                  activeOpacity={0.7}
                >
                  <Plus size={18} color="#38bdf8" />
                </TouchableOpacity>
              </View>

              {/* Selector de barra */}
              <View style={styles.barSelectorRow}>
                <Text style={styles.barSelectorLabel}>Tipo de Barra:</Text>
                <TouchableOpacity
                  style={[styles.barOptionBtn, barWeightKg === 20 && styles.barOptionActive]}
                  onPress={() => setBarWeightKg(20)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.barOptionText, barWeightKg === 20 && styles.barOptionTextActive]}>
                    {unit === 'kg' ? 'Olímpica 20 kg' : 'Olímpica 45 lbs'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.barOptionBtn, barWeightKg === 15 && styles.barOptionActive]}
                  onPress={() => setBarWeightKg(15)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.barOptionText, barWeightKg === 15 && styles.barOptionTextActive]}>
                    {unit === 'kg' ? 'Técnica 15 kg' : 'Técnica 35 lbs'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Resumen por lado */}
            <View style={styles.summaryStrip}>
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>
                  {Math.round(calculation.weightPerSide * 10) / 10} {unit}
                </Text>
                <Text style={styles.summaryLabel}>Por Cada Lado</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{currentBarWeight} {unit}</Text>
                <Text style={styles.summaryLabel}>Peso Barra</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryValue, { color: '#10b981' }]}>
                  {Math.round(numericTarget)} {unit}
                </Text>
                <Text style={styles.summaryLabel}>Total Barra + Discos</Text>
              </View>
            </View>

            {/* Representación Visual de la Barra y los Discos */}
            <View style={styles.barbellVisualBox}>
              <Text style={styles.visualTitle}>CARGA VISUAL POR LADO:</Text>
              <View style={styles.barbellSleeveContainer}>
                {/* Manga de la barra */}
                <View style={styles.collarStop} />
                <View style={styles.barbellSleeve} />

                {/* Discos montados */}
                <View style={styles.platesStack}>
                  {calculation.loadedPlates.map((item, idx) => (
                    <View key={`plate-group-${idx}`} style={{ flexDirection: 'row', gap: 2 }}>
                      {Array.from({ length: item.count }).map((_, cIdx) => (
                        <View
                          key={`plate-${idx}-${cIdx}`}
                          style={[
                            styles.plateGraphic,
                            {
                              height: item.plate.height,
                              backgroundColor: item.plate.color,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.plateGraphicText,
                              { color: item.plate.labelColor },
                            ]}
                          >
                            {item.plate.weight}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))}
                </View>
              </View>
            </View>

            {/* Lista Desglosada de Discos a Colocar */}
            <View style={styles.breakdownSection}>
              <Text style={styles.breakdownTitle}>DISCOS A COLOCAR EN CADA LADO:</Text>
              {calculation.loadedPlates.length === 0 ? (
                <View style={styles.emptyPlatesBox}>
                  <Text style={styles.emptyPlatesText}>
                    Solo la barra vacía ({currentBarWeight} {unit})
                  </Text>
                </View>
              ) : (
                <View style={styles.platesGrid}>
                  {calculation.loadedPlates.map((item, idx) => (
                    <View key={`list-item-${idx}`} style={styles.plateRowItem}>
                      <View
                        style={[
                          styles.plateBadgeIndicator,
                          { backgroundColor: item.plate.color },
                        ]}
                      >
                        <Text
                          style={[
                            styles.plateBadgeText,
                            { color: item.plate.labelColor },
                          ]}
                        >
                          {item.plate.weight} {unit}
                        </Text>
                      </View>
                      <Text style={styles.plateCountText}>
                        × {item.count} {item.count === 1 ? 'disco' : 'discos'}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Aviso si queda un remanente */}
            {calculation.unloadedWeight > 0 && (
              <View style={styles.unloadedWarning}>
                <Info size={14} color="#f59e0b" style={{ marginRight: 6 }} />
                <Text style={styles.unloadedWarningText}>
                  Remanente no divisible: {Math.round(calculation.unloadedWeight * 10) / 10} {unit} (usa microdiscos si los tienes disponibles).
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.readyBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.readyBtnText}>Listo, Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  content: {
    padding: 20,
  },
  weightCard: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  weightLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  adjustBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  weightInput: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    minWidth: 70,
  },
  unitSuffix: {
    fontSize: 14,
    fontWeight: '800',
    color: '#38bdf8',
    marginLeft: 6,
  },
  barSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  barSelectorLabel: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  barOptionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
  },
  barOptionActive: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderColor: '#38bdf8',
  },
  barOptionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  barOptionTextActive: {
    color: '#38bdf8',
  },
  summaryStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  summaryLabel: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  summaryDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#334155',
  },
  barbellVisualBox: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 16,
    marginBottom: 16,
  },
  visualTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 14,
  },
  barbellSleeveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 90,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    paddingHorizontal: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  collarStop: {
    width: 12,
    height: 50,
    backgroundColor: '#475569',
    borderRadius: 3,
    marginRight: 2,
  },
  barbellSleeve: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: 12,
    backgroundColor: '#94a3b8',
    borderRadius: 6,
  },
  platesStack: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 2,
  },
  plateGraphic: {
    width: 22,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateGraphicText: {
    fontSize: 8,
    fontWeight: '900',
    transform: [{ rotate: '-90deg' }],
  },
  breakdownSection: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.6,
    marginBottom: 10,
  },
  platesGrid: {
    gap: 8,
  },
  plateRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  plateBadgeIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plateBadgeText: {
    fontSize: 12,
    fontWeight: '900',
  },
  plateCountText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  emptyPlatesBox: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  emptyPlatesText: {
    fontSize: 12,
    color: '#64748b',
    fontStyle: 'italic',
  },
  unloadedWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  unloadedWarningText: {
    fontSize: 11,
    color: '#fbbf24',
    flex: 1,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  readyBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
  },
  readyBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});
