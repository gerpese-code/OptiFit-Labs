import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Film, Image as ImageIcon, Sparkles, Play } from 'lucide-react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useLanguage } from '@/context/LanguageContext';

interface ExerciseMediaViewerProps {
  videoUrl?: string | null;
  gifUrl?: string | null;
  imageUrls?: string[];
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function ModernVideoPlayer({ url }: { url: string }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = true;
    p.play();
  });

  return (
    <VideoView
      style={styles.mediaElement}
      player={player}
      nativeControls
    />
  );
}

export default function ExerciseMediaViewer({
  videoUrl,
  gifUrl,
  imageUrls = [],
}: ExerciseMediaViewerProps) {
  const { language } = useLanguage();

  // Deduplicar fotos y validar que no contengan valores nulos o vacíos
  const uniquePhotos = Array.from(new Set((imageUrls || []).filter(Boolean)));
  // Validar estrictamente que el gifUrl sea una animación real (.gif) y no la misma foto JPG
  const isRealGif = Boolean(
    gifUrl &&
    typeof gifUrl === 'string' &&
    gifUrl.toLowerCase().includes('.gif') &&
    !uniquePhotos.includes(gifUrl)
  );

  const availableTabs: ('video' | 'gif' | 'photos')[] = [];
  if (videoUrl) availableTabs.push('video');
  if (isRealGif) availableTabs.push('gif');
  if (uniquePhotos.length > 0) availableTabs.push('photos');

  const [activeTab, setActiveTab] = useState<'video' | 'gif' | 'photos'>(
    availableTabs[0] || 'photos'
  );

  if (availableTabs.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <ImageIcon size={24} color="#475569" />
        <Text style={styles.emptyText}>{language === 'en' ? 'No demonstration media available' : 'Sin multimedia demostrativa'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Pestañas de Medios */}
      {availableTabs.length > 1 && (
        <View style={styles.tabsBar}>
          {availableTabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabBtn,
                activeTab === tab && styles.tabBtnActive,
              ]}
              activeOpacity={0.7}
            >
              {tab === 'video' && (
                <Film size={12} color={activeTab === tab ? '#10b981' : '#94a3b8'} />
              )}
              {tab === 'gif' && (
                <Sparkles size={12} color={activeTab === tab ? '#10b981' : '#94a3b8'} />
              )}
              {tab === 'photos' && (
                <ImageIcon size={12} color={activeTab === tab ? '#10b981' : '#94a3b8'} />
              )}
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.tabTextActive,
                ]}
              >
                {tab === 'video' ? 'Video' : tab === 'gif' ? 'GIF' : (language === 'en' ? 'Photos' : 'Fotos')}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Contenido según pestaña */}
      <View style={styles.mediaFrame}>
        {activeTab === 'video' && videoUrl && (
          <ModernVideoPlayer url={videoUrl} />
        )}

        {activeTab === 'gif' && isRealGif && (
          <Image
            source={{ uri: gifUrl! }}
            style={styles.mediaElement}
            contentFit="cover"
            transition={300}
          />
        )}

        {activeTab === 'photos' && uniquePhotos.length > 0 && (
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.photosScroll}
          >
            {uniquePhotos.map((url, index) => (
              <View key={index} style={{ width: SCREEN_WIDTH - 48, height: '100%', position: 'relative' }}>
                <Image
                  source={{ uri: url }}
                  style={styles.mediaElement}
                  contentFit="cover"
                  transition={300}
                />
                {uniquePhotos.length > 1 && (
                  <View style={styles.phaseBadgeContainer}>
                    <Text style={styles.phaseBadgeText}>
                      {index === 0
                        ? (language === 'en' ? '1. Start / Stretch' : '1. Inicio / Descenso')
                        : (language === 'en' ? '2. Contraction / Peak' : '2. Contracción / Final')}
                    </Text>
                    <Text style={styles.phaseBadgeCounter}>
                      {index + 1}/{uniquePhotos.length}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#090d16',
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  tabsBar: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 6,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: 'transparent',
    gap: 5,
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
    textTransform: 'uppercase',
  },
  tabTextActive: {
    color: '#34d399',
    fontWeight: '800',
  },
  mediaFrame: {
    height: 190,
    width: '100%',
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaElement: {
    width: '100%',
    height: '100%',
  },
  photosScroll: {
    width: '100%',
    height: '100%',
  },
  emptyContainer: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    marginVertical: 6,
  },
  emptyText: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 4,
  },
  phaseBadgeContainer: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  phaseBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    textTransform: 'uppercase',
  },
  phaseBadgeCounter: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
