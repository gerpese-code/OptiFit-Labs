import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Calendar, X, Check, Clock } from 'lucide-react-native';

export type TimelinePreset = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

export interface DateRange {
  start: string; // YYYY-MM-DD
  end: string;   // YYYY-MM-DD
  label: string;
  preset: TimelinePreset;
}

interface DateRangeFilterBarProps {
  activeRange: DateRange;
  onSelectPreset: (preset: TimelinePreset) => void;
  onApplyCustomRange: (start: string, end: string) => void;
  language?: 'es' | 'en';
}

export default function DateRangeFilterBar({
  activeRange,
  onSelectPreset,
  onApplyCustomRange,
  language = 'es',
}: DateRangeFilterBarProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [tempStart, setTempStart] = useState(activeRange.start);
  const [tempEnd, setTempEnd] = useState(activeRange.end);

  const presets: { id: TimelinePreset; labelEs: string; labelEn: string }[] = [
    { id: '7d', labelEs: '7 Días', labelEn: '7 Days' },
    { id: '30d', labelEs: '30 Días', labelEn: '30 Days' },
    { id: '90d', labelEs: '90 Días (3M)', labelEn: '90 Days (3M)' },
    { id: '1y', labelEs: '1 Año', labelEn: '1 Year' },
    { id: 'all', labelEs: 'Todo', labelEn: 'All Time' },
    { id: 'custom', labelEs: '📅 Rango', labelEn: '📅 Custom' },
  ];

  const handleOpenCustom = () => {
    setTempStart(activeRange.start);
    setTempEnd(activeRange.end);
    setModalVisible(true);
  };

  const handleSaveCustom = () => {
    // Validar formato YYYY-MM-DD
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(tempStart) || !dateRegex.test(tempEnd)) {
      Alert.alert(
        language === 'en' ? 'Invalid Date' : 'Fecha Inválida',
        language === 'en'
          ? 'Please enter dates in YYYY-MM-DD format (e.g., 2026-08-15).'
          : 'Por favor ingresa las fechas en formato AAAA-MM-DD (ej: 2026-08-15).'
      );
      return;
    }

    if (tempStart > tempEnd) {
      Alert.alert(
        language === 'en' ? 'Invalid Range' : 'Rango Inválido',
        language === 'en'
          ? 'Start date cannot be after end date.'
          : 'La fecha "Desde" no puede ser posterior a la fecha "Hasta".'
      );
      return;
    }

    onApplyCustomRange(tempStart, tempEnd);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      {/* Indicador de Rango Activo */}
      <View style={styles.headerRow}>
        <View style={styles.titleRow}>
          <Clock size={13} color="#10b981" style={{ marginRight: 5 }} />
          <Text style={styles.headerLabel}>
            {language === 'en' ? 'TIMELINE & PERIOD' : 'LÍNEA DE TIEMPO Y PERIODO'}
          </Text>
        </View>

        <View style={styles.activeBadge}>
          <View style={styles.activeDot} />
          <Text style={styles.activeBadgeText}>{activeRange.label}</Text>
        </View>
      </View>

      {/* Píldoras Horizontales de Presets */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollPills}
      >
        {presets.map((item) => {
          const isSelected = activeRange.preset === item.id;
          const label = language === 'en' ? item.labelEn : item.labelEs;

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.pillBtn, isSelected && styles.pillBtnActive]}
              onPress={() => {
                if (item.id === 'custom') {
                  handleOpenCustom();
                } else {
                  onSelectPreset(item.id);
                }
              }}
              activeOpacity={0.75}
            >
              <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Modal para Seleccionar Rango Personalizado */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Calendar size={18} color="#10b981" style={{ marginRight: 8 }} />
                <Text style={styles.modalTitle}>
                  {language === 'en' ? 'Select Date Range' : 'Seleccionar Periodo'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={20} color="#64748b" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>
                {language === 'en' ? 'FROM (YYYY-MM-DD)' : 'DESDE (AAAA-MM-DD)'}
              </Text>
              <TextInput
                style={styles.dateInput}
                placeholder="2026-01-01"
                placeholderTextColor="#475569"
                value={tempStart}
                onChangeText={setTempStart}
                autoCapitalize="none"
              />

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>
                {language === 'en' ? 'TO (YYYY-MM-DD)' : 'HASTA (AAAA-MM-DD)'}
              </Text>
              <TextInput
                style={styles.dateInput}
                placeholder="2026-12-31"
                placeholderTextColor="#475569"
                value={tempEnd}
                onChangeText={setTempEnd}
                autoCapitalize="none"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.cancelBtnText}>
                    {language === 'en' ? 'Cancel' : 'Cancelar'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.applyBtn}
                  onPress={handleSaveCustom}
                  activeOpacity={0.8}
                >
                  <Check size={14} color="#ffffff" style={{ marginRight: 5 }} />
                  <Text style={styles.applyBtnText}>
                    {language === 'en' ? 'Apply Filter' : 'Aplicar Filtro'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 12,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.8,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#030712',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
    marginRight: 5,
  },
  activeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#34d399',
  },
  scrollPills: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1f2937',
    borderWidth: 1,
    borderColor: '#374151',
  },
  pillBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#10b981',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9ca3af',
  },
  pillTextActive: {
    color: '#ffffff',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#111827',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  modalBody: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  dateInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 20,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#1f2937',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9ca3af',
  },
  applyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#059669',
  },
  applyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
});
