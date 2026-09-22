import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  AppState,
  Animated,
} from 'react-native';
import { Play, Pause, X, Plus } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';

interface FloatingRestTimerProps {
  initialSeconds: number;
  onDismiss: () => void;
  onComplete?: () => void;
}

export default function FloatingRestTimer({
  initialSeconds,
  onDismiss,
  onComplete,
}: FloatingRestTimerProps) {
  const { language } = useLanguage();

  const safeInitialSec = Math.max(1, initialSeconds || 90);

  // Timestamp objetivo en milisegundos basado en el reloj del sistema (wall-clock)
  const targetEndTimeRef = useRef<number>(Date.now() + safeInitialSec * 1000);
  // Milisegundos restantes preservados cuando el usuario pausa
  const remainingMsOnPauseRef = useRef<number>(safeInitialSec * 1000);

  // Callbacks en refs estables para evitar re-creación de timers y desincronizaciones
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const [secondsLeft, setSecondsLeft] = useState<number>(safeInitialSec);
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [isFinished, setIsFinished] = useState<boolean>(false);

  // Animación de entrada suave
  const slideAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // 1. Ciclo de Conteo Regresivo Ultra-Preciso basado en Date.now()
  // Se evalúa cada 100ms para asegurar fluidez perfecta y cero desfase
  useEffect(() => {
    if (!isRunning || isFinished) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const diffMs = targetEndTimeRef.current - now;

      if (diffMs <= 0) {
        clearInterval(interval);
        setSecondsLeft(0);
        setIsFinished(true);
        setIsRunning(false);
        triggerHaptic('timer');
        if (onCompleteRef.current) {
          onCompleteRef.current();
        }
        return;
      }

      const exactSec = Math.ceil(diffMs / 1000);
      setSecondsLeft((prev) => (prev !== exactSec ? exactSec : prev));
    }, 100);

    return () => clearInterval(interval);
  }, [isRunning, isFinished]);

  // 2. Resincronización inmediata si el usuario minimiza la app o bloquea el teléfono
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active' && isRunning && !isFinished) {
        const now = Date.now();
        const diffMs = targetEndTimeRef.current - now;
        if (diffMs <= 0) {
          setSecondsLeft(0);
          setIsFinished(true);
          setIsRunning(false);
          triggerHaptic('timer');
          if (onCompleteRef.current) {
            onCompleteRef.current();
          }
        } else {
          setSecondsLeft(Math.ceil(diffMs / 1000));
        }
      }
    });

    return () => subscription.remove();
  }, [isRunning, isFinished]);

  // 3. Auto-cierre discreto tras 3.5 segundos de haber llegado a 0 (¡A ENTRENAR!)
  useEffect(() => {
    if (isFinished) {
      const timer = setTimeout(() => {
        if (onDismissRef.current) {
          onDismissRef.current();
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isFinished]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const addThirtySeconds = () => {
    triggerHaptic('tap');
    if (isFinished) {
      // Si ya finalizó, reiniciar con 30s de descanso adicional
      setIsFinished(false);
      targetEndTimeRef.current = Date.now() + 30000;
      remainingMsOnPauseRef.current = 30000;
      setSecondsLeft(30);
      setIsRunning(true);
      return;
    }

    if (isRunning) {
      targetEndTimeRef.current += 30000;
      const now = Date.now();
      const exactSec = Math.max(1, Math.ceil((targetEndTimeRef.current - now) / 1000));
      setSecondsLeft(exactSec);
    } else {
      remainingMsOnPauseRef.current += 30000;
      const exactSec = Math.max(1, Math.ceil(remainingMsOnPauseRef.current / 1000));
      setSecondsLeft(exactSec);
    }
  };

  const toggleRunning = () => {
    triggerHaptic('tap');
    if (isFinished) return;

    if (isRunning) {
      // Pausar: calcular y congelar el tiempo exacto restante en ms
      const now = Date.now();
      const rem = Math.max(0, targetEndTimeRef.current - now);
      remainingMsOnPauseRef.current = rem;
      setIsRunning(false);
    } else {
      // Reanudar: fijar nuevo timestamp objetivo a partir de ahora
      targetEndTimeRef.current = Date.now() + remainingMsOnPauseRef.current;
      setIsRunning(true);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={[styles.innerCard, isFinished && styles.innerCardFinished]}>
        {/* Indicador de tiempo */}
        <View style={styles.timeSection}>
          <Text style={[styles.label, isFinished && styles.labelFinished]}>
            {isFinished
              ? language === 'en'
                ? 'REST COMPLETED'
                : 'DESCANSO COMPLETADO'
              : language === 'en'
              ? 'REST TIME'
              : 'DESCANSO'}
          </Text>
          <Text
            style={[
              styles.timerText,
              isFinished && styles.timerFinishedText,
            ]}
          >
            {isFinished
              ? language === 'en'
                ? 'TIME TO TRAIN!'
                : '¡A ENTRENAR!'
              : formatTime(secondsLeft)}
          </Text>
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          {!isFinished && (
            <>
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={addThirtySeconds}
                activeOpacity={0.7}
              >
                <Plus size={16} color="#34d399" />
                <Text style={styles.actionBtnText}>+30s</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, styles.playPauseBtn]}
                onPress={toggleRunning}
                activeOpacity={0.7}
              >
                {isRunning ? (
                  <Pause size={16} color="#ffffff" />
                ) : (
                  <Play size={16} color="#ffffff" />
                )}
              </TouchableOpacity>
            </>
          )}

          {isFinished && (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={addThirtySeconds}
              activeOpacity={0.7}
            >
              <Plus size={16} color="#34d399" />
              <Text style={styles.actionBtnText}>+30s</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onDismiss}
            activeOpacity={0.7}
          >
            <X size={18} color="#9ca3af" />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  innerCard: {
    backgroundColor: '#0f172a',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10b981',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  innerCardFinished: {
    borderColor: '#34d399',
    backgroundColor: '#064e3b',
    shadowColor: '#34d399',
    shadowOpacity: 0.6,
  },
  timeSection: {
    flexDirection: 'column',
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#34d399',
    marginBottom: 2,
  },
  labelFinished: {
    color: '#a7f3d0',
  },
  timerText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    fontVariant: ['tabular-nums'],
  },
  timerFinishedText: {
    color: '#ffffff',
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  actionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
    marginLeft: 2,
  },
  playPauseBtn: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
    paddingHorizontal: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
});
