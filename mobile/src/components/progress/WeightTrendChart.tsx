import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { ClientMetric } from '@/types/database';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';

interface WeightTrendChartProps {
  metrics: ClientMetric[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - 64;
const CHART_HEIGHT = 160;
const PADDING = 20;

export default function WeightTrendChart({ metrics }: WeightTrendChartProps) {
  const { unit, toDisplayWeight } = useUnit();
  const { t, language } = useLanguage();

  if (!metrics || metrics.length === 0) {
    return (
      <View style={styles.emptyCard}>
        <Text style={styles.emptyTitle}>{t('progress.no_weight_records', 'Sin registros de peso aún')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('progress.no_weight_sub', 'Registra tu peso corporal hoy para ver tu evolución gráfica en {unit}.').replace('{unit}', unit.toUpperCase())}
        </Text>
      </View>
    );
  }

  // Ordenar cronológicamente
  const sorted = [...metrics].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const values = sorted.map((m) => toDisplayWeight(m.weight_kg));
  const minVal = Math.min(...values) - 1;
  const maxVal = Math.max(...values) + 1;
  const range = maxVal - minVal || 1;

  const currentWeight = values[values.length - 1];
  const initialWeight = values[0];
  const diff = Math.round((currentWeight - initialWeight) * 10) / 10;

  // Generar puntos para el path de SVG
  const points = values.map((val, idx) => {
    const x = PADDING + (idx / Math.max(values.length - 1, 1)) * (CHART_WIDTH - PADDING * 2);
    const y = CHART_HEIGHT - PADDING - ((val - minVal) / range) * (CHART_HEIGHT - PADDING * 2);
    return { x, y, val };
  });

  let pathD = '';
  points.forEach((pt, i) => {
    if (i === 0) {
      pathD += `M ${pt.x} ${pt.y}`;
    } else {
      pathD += ` L ${pt.x} ${pt.y}`;
    }
  });

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{t('progress.weight_chart_title', 'Evolución de Peso Corporal')}</Text>
          <Text style={styles.subtitle}>{language === 'en' ? 'Progress towards your goal' : 'Progreso hacia tu objetivo'}</Text>
        </View>

        <View style={styles.currentCol}>
          <Text style={styles.currentVal}>
            {currentWeight} {unit}
          </Text>
          <Text
            style={[
              styles.diffText,
              diff > 0 ? styles.diffUp : diff < 0 ? styles.diffDown : null,
            ]}
          >
            {diff > 0 ? `+${diff}` : diff} {unit}
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <Svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {/* Líneas de guía horizontales */}
          <Line
            x1={PADDING}
            y1={PADDING}
            x2={CHART_WIDTH - PADDING}
            y2={PADDING}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
          <Line
            x1={PADDING}
            y1={CHART_HEIGHT - PADDING}
            x2={CHART_WIDTH - PADDING}
            y2={CHART_HEIGHT - PADDING}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />

          {/* Línea de tendencia */}
          <Path
            d={pathD}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Puntos */}
          {points.map((pt, i) => (
            <Circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r={i === points.length - 1 ? 5 : 3.5}
              fill={i === points.length - 1 ? '#34d399' : '#10b981'}
              stroke="#0f172a"
              strokeWidth="1.5"
            />
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  currentCol: {
    alignItems: 'flex-end',
  },
  currentVal: {
    fontSize: 18,
    fontWeight: '900',
    color: '#10b981',
  },
  diffText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  diffUp: {
    color: '#38bdf8',
  },
  diffDown: {
    color: '#f59e0b',
  },
  chartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 24,
    alignItems: 'center',
    marginVertical: 10,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    maxWidth: 240,
  },
});
