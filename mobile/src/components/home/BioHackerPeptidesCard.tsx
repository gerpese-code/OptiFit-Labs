import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Sparkles, ChevronRight, Zap, ShieldCheck, Heart } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';

interface BioHackerPeptidesCardProps {
  onPress: () => void;
}

export default function BioHackerPeptidesCard({ onPress }: BioHackerPeptidesCardProps) {
  const { t, language } = useLanguage();

  const glowAnim = useRef(new Animated.Value(0.35)).current;
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.9, duration: 1300, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.35, duration: 1300, useNativeDriver: true }),
      ])
    );
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 700, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.015, duration: 1500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ])
    );

    glow.start();
    blink.start();
    pulse.start();

    return () => {
      glow.stop();
      blink.stop();
      pulse.stop();
    };
  }, [glowAnim, blinkAnim, pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        activeOpacity={0.88}
      >
        <Animated.View style={[styles.glowOverlay, { opacity: glowAnim }]} pointerEvents="none" />
        <View style={styles.glowTopLine} />
        
        {/* Encabezado e insignias con titileo */}
        <View style={styles.headerRow}>
          <Animated.View style={[styles.badgeSpa, { opacity: blinkAnim }]}>
            <Sparkles size={12} color="#10b981" style={{ marginRight: 4 }} />
            <Text style={styles.badgeSpaText}>
              {language === 'es' ? '🔥 NOVEDAD • BIOHACKING & RECUPERACIÓN' : '🔥 NEW • BIOHACKING & RECOVERY'}
            </Text>
          </Animated.View>
          <View style={styles.badgeScience}>
            <Text style={styles.badgeScienceText}>
              {language === 'es' ? '🧬 CIENCIA ÉLITE' : '🧬 ELITE SCIENCE'}
            </Text>
          </View>
        </View>

        {/* Título Principal y Mensaje de Ancla que despierta curiosidad */}
        <Text style={styles.title}>
          {language === 'es'
            ? 'BIOHACKER PEPTIDES: La Nueva Frontera del Rendimiento.'
            : 'BIOHACKER PEPTIDES: The New Performance Frontier.'}
        </Text>
        <Text style={styles.anchorText}>
          {language === 'es'
            ? 'Lleva tus resultados más allá del entrenamiento convencional. Descubre la ciencia de la reparación celular, la hipertrofia acelerada y la recuperación de tejidos.'
            : 'Take your results beyond conventional training. Discover the science of cellular repair, accelerated hypertrophy, and tissue recovery.'}
        </Text>

        {/* Mini Chips de Temas Clave */}
        <View style={styles.chipsRow}>
          <View style={styles.chipItem}>
            <Zap size={11} color="#f59e0b" style={{ marginRight: 3 }} />
            <Text style={styles.chipText}>
              {language === 'es' ? 'Metabolismo & Energía' : 'Metabolism & Energy'}
            </Text>
          </View>
          <View style={styles.chipItem}>
            <Heart size={11} color="#38bdf8" style={{ marginRight: 3 }} />
            <Text style={styles.chipText}>
              {language === 'es' ? 'Salud Celular' : 'Cellular Health'}
            </Text>
          </View>
          <View style={styles.chipItem}>
            <ShieldCheck size={11} color="#10b981" style={{ marginRight: 3 }} />
            <Text style={styles.chipText}>
              {language === 'es' ? 'Reparación Tisular' : 'Tissue Repair'}
            </Text>
          </View>
        </View>

        {/* Barra de acción inferior */}
        <View style={styles.footerRow}>
          <Text style={styles.ctaText}>
            {language === 'es' ? 'Explorar Guía Profesional' : 'Explore Professional Guide'}
          </Text>
          <View style={styles.arrowCircle}>
            <ChevronRight size={14} color="#34d399" />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#061612',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#10b981',
    padding: 16,
    marginVertical: 14,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
    position: 'relative',
  },
  glowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  glowTopLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#34d399',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  badgeSpa: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  badgeSpaText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  badgeScience: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  badgeScienceText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  anchorText: {
    fontSize: 12,
    color: '#a7f3d0',
    lineHeight: 17,
    marginBottom: 12,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131c2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  chipText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  ctaText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
