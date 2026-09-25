import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Music, Disc, ChevronUp } from 'lucide-react-native';

interface WorkoutMusicWidgetProps {
  onPress: () => void;
  isSessionActive?: boolean;
}

export default function WorkoutMusicWidget({
  onPress,
  isSessionActive = false,
}: WorkoutMusicWidgetProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSessionActive && styles.containerActiveSession,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.leftGroup}>
        <View style={styles.iconCircle}>
          <Disc size={16} color="#1DB954" />
        </View>
        <View>
          <Text style={styles.widgetTitle}>MÚSICA</Text>
          <Text style={styles.widgetSub}>
            {isSessionActive ? 'Control en vivo' : 'Spotify & Playlists'}
          </Text>
        </View>
      </View>

      <View style={styles.rightGroup}>
        <View style={styles.openPill}>
          <Text style={styles.openPillText}>ABRIR</Text>
          <ChevronUp size={12} color="#1DB954" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f14',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.4)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#1DB954',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  containerActiveSession: {
    borderColor: '#1DB954',
    backgroundColor: 'rgba(10, 15, 20, 0.95)',
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  widgetTitle: {
    fontSize: 10,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  widgetSub: {
    fontSize: 9,
    color: '#94a3b8',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
    gap: 2,
  },
  openPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#1DB954',
    letterSpacing: 0.5,
  },
});
