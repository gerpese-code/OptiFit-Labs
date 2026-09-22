import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WorkoutSession } from '@/types/database';
import { useLanguage } from '@/context/LanguageContext';

interface AttendanceCalendarProps {
  sessions: WorkoutSession[];
}

export default function AttendanceCalendar({ sessions }: AttendanceCalendarProps) {
  const { language, t } = useLanguage();
  const isEn = language === 'en';
  const DAYS_OF_WEEK = isEn ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const monthNames = isEn
    ? ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    : ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();

  // Primer día del mes y total de días
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Ajustar día de la semana (0 = Domingo en JS -> convertir a Lunes = 0)
  let startingDayIndex = firstDayOfMonth.getDay() - 1;
  if (startingDayIndex === -1) startingDayIndex = 6;

  // Mapear sesiones por fecha (formato YYYY-MM-DD)
  const sessionMap = new Map<string, WorkoutSession>();
  sessions.forEach((s) => {
    sessionMap.set(s.scheduled_date, s);
  });

// monthNames configurado dinámicamente según idioma

  const calendarDays = [];
  for (let i = 0; i < startingDayIndex; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(d);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.monthTitle}>
          {monthNames[currentMonth]} {currentYear}
        </Text>
        <Text style={styles.headerSubtitle}>{t('progress.attendance_title', 'Registro de Asistencia')}</Text>
      </View>

      {/* Días de la semana */}
      <View style={styles.weekDaysRow}>
        {DAYS_OF_WEEK.map((dw, idx) => (
          <Text key={idx} style={styles.weekDayText}>
            {dw}
          </Text>
        ))}
      </View>

      {/* Grilla de días */}
      <View style={styles.daysGrid}>
        {calendarDays.map((day, idx) => {
          if (day === null) {
            return <View key={`empty-${idx}`} style={styles.dayCell} />;
          }

          const dateStr = `${currentYear}-${(currentMonth + 1)
            .toString()
            .padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

          const session = sessionMap.get(dateStr);
          const isToday = day === today.getDate();

          let dotColor = null;
          if (session) {
            if (session.status === 'completed' || session.completion_rate >= 100) {
              dotColor = '#10b981'; // Verde: 100%
            } else if (session.status === 'partial' || session.completion_rate > 0) {
              dotColor = '#f59e0b'; // Amarillo: Parcial
            } else if (session.status === 'missed') {
              dotColor = '#ef4444'; // Rojo: Faltó
            }
          }

          return (
            <View key={`day-${day}`} style={styles.dayCell}>
              <View
                style={[
                  styles.dayBadge,
                  isToday && styles.todayBadge,
                  dotColor ? { backgroundColor: dotColor } : null,
                ]}
              >
                <Text
                  style={[
                    styles.dayNumber,
                    dotColor ? styles.dayNumberActive : null,
                    isToday && !dotColor ? styles.dayNumberToday : null,
                  ]}
                >
                  {day}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Leyenda */}
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#10b981' }]} />
          <Text style={styles.legendText}>{isEn ? '100% Completed' : '100% Cumplido'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={styles.legendText}>{isEn ? 'Partial' : 'Parcial'}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
          <Text style={styles.legendText}>{isEn ? 'Missed' : 'Faltó'}</Text>
        </View>
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
    marginBottom: 12,
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748b',
  },
  weekDaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 8,
  },
  weekDayText: {
    width: 36,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dayCell: {
    width: '14.28%',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBadge: {
    borderWidth: 1.5,
    borderColor: '#10b981',
  },
  dayNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#cbd5e1',
  },
  dayNumberActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  dayNumberToday: {
    color: '#10b981',
    fontWeight: '800',
  },
  legendRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94a3b8',
  },
});
