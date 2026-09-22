import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface GymBackgroundProps {
  children?: React.ReactNode;
}

export default function GymBackground({ children }: GymBackgroundProps) {
  const backgroundDecorations = (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* 1. Base negra obsidiana profunda */}
      <View style={styles.baseDark} />

      {/* 2. Cono de luz difusa cenital superior (Glow ambiental de techo) */}
      <LinearGradient
        colors={['rgba(0, 255, 135, 0.16)', 'rgba(5, 150, 105, 0.06)', 'transparent']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.topAmbientGlow}
      />

      {/* 3. Tubo LED Neón 1: Barra de techo angulada principal (estilo gimnasio subterráneo) */}
      <View style={styles.ledTubeWrapper1}>
        <LinearGradient
          colors={['transparent', 'rgba(0, 255, 135, 0.7)', '#ffffff', 'rgba(0, 255, 135, 0.7)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.ledTube1}
        />
      </View>

      {/* 4. Tubo LED Neón 2: Barra secundaria en diagonal opuesta */}
      <View style={styles.ledTubeWrapper2}>
        <LinearGradient
          colors={['transparent', 'rgba(16, 185, 129, 0.5)', 'rgba(0, 255, 135, 0.9)', 'rgba(16, 185, 129, 0.5)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.ledTube2}
        />
      </View>

      {/* 5. Tira LED Cenital en el filo superior de la pantalla */}
      <LinearGradient
        colors={['transparent', '#00ff87', '#bbf7d0', '#00ff87', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topLedStrip}
      />

      {/* 6. Reflejo verde en el suelo de goma de gimnasio (Glow inferior) */}
      <LinearGradient
        colors={['transparent', 'rgba(5, 150, 105, 0.04)', 'rgba(0, 255, 135, 0.09)']}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.bottomFloorGlow}
      />
    </View>
  );

  if (!children) {
    return backgroundDecorations;
  }

  return (
    <View style={styles.container}>
      {backgroundDecorations}
      {/* Contenido de la pantalla */}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020503',
  },
  baseDark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#020503',
  },
  topAmbientGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height * 0.45,
  },
  ledTubeWrapper1: {
    position: 'absolute',
    top: -20,
    right: -60,
    width: width * 0.9,
    transform: [{ rotate: '-16deg' }],
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.85,
    shadowRadius: 16,
    elevation: 10,
  },
  ledTube1: {
    height: 3,
    borderRadius: 2,
  },
  ledTubeWrapper2: {
    position: 'absolute',
    top: height * 0.28,
    left: -80,
    width: width * 0.7,
    transform: [{ rotate: '28deg' }],
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  ledTube2: {
    height: 2.5,
    borderRadius: 2,
  },
  topLedStrip: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    shadowColor: '#00ff87',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 8,
  },
  bottomFloorGlow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.25,
  },
});
