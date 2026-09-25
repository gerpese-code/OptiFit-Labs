import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import {
  X,
  Music,
  ExternalLink,
  Flame,
  Radio,
  Plus,
  Check,
  Disc,
  Headphones,
  Sparkles,
} from 'lucide-react-native';
import {
  DEFAULT_WORKOUT_PLAYLISTS,
  WorkoutPlaylist,
  parseSpotifyEmbedUrl,
  getCustomSpotifyPlaylist,
  saveCustomSpotifyPlaylist,
  getActivePlaylistId,
  saveActivePlaylistId,
  openSpotifyApp,
  openYouTubeMusic,
  openAppleMusic,
} from '@/lib/musicService';

interface WorkoutMusicModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function WorkoutMusicModal({ visible, onClose }: WorkoutMusicModalProps) {
  const [activePlaylistId, setActivePlaylistId] = useState<string>('beast-mode');
  const [customUrl, setCustomUrl] = useState<string>('');
  const [savedCustomUrl, setSavedCustomUrl] = useState<string | null>(null);
  const [showCustomInput, setShowCustomInput] = useState<boolean>(false);
  const [webViewLoading, setWebViewLoading] = useState<boolean>(true);

  useEffect(() => {
    if (visible) {
      loadInitialState();
    }
  }, [visible]);

  const loadInitialState = async () => {
    const savedActive = await getActivePlaylistId();
    const custom = await getCustomSpotifyPlaylist();
    setActivePlaylistId(savedActive);
    setSavedCustomUrl(custom);
    if (custom) {
      setCustomUrl(custom);
    }
  };

  const handleSelectPlaylist = async (playlist: WorkoutPlaylist) => {
    setActivePlaylistId(playlist.id);
    setWebViewLoading(true);
    await saveActivePlaylistId(playlist.id);
  };

  const handleSaveCustomPlaylist = async () => {
    if (!customUrl.trim()) {
      await saveCustomSpotifyPlaylist(null);
      setSavedCustomUrl(null);
      setActivePlaylistId('beast-mode');
      await saveActivePlaylistId('beast-mode');
      setShowCustomInput(false);
      return;
    }

    const parsed = parseSpotifyEmbedUrl(customUrl);
    if (!parsed) {
      Alert.alert(
        'Enlace no válido',
        'Ingresa un enlace válido de Spotify (ej: https://open.spotify.com/playlist/...)'
      );
      return;
    }

    await saveCustomSpotifyPlaylist(customUrl);
    setSavedCustomUrl(customUrl);
    setActivePlaylistId('custom');
    await saveActivePlaylistId('custom');
    setShowCustomInput(false);
    setWebViewLoading(true);
  };

  // Determinar la URL actual del embed de Spotify
  let currentEmbedUrl = DEFAULT_WORKOUT_PLAYLISTS[0].embedUrl;
  let currentPlaylistName = DEFAULT_WORKOUT_PLAYLISTS[0].name;

  if (activePlaylistId === 'custom' && savedCustomUrl) {
    const parsed = parseSpotifyEmbedUrl(savedCustomUrl);
    if (parsed) {
      currentEmbedUrl = parsed.embedUrl;
      currentPlaylistName = 'Mi Playlist Personal';
    }
  } else {
    const found = DEFAULT_WORKOUT_PLAYLISTS.find((p) => p.id === activePlaylistId);
    if (found) {
      currentEmbedUrl = found.embedUrl;
      currentPlaylistName = found.name;
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View style={styles.spotifyIconBox}>
                <Disc size={20} color="#1DB954" />
              </View>
              <View>
                <Text style={styles.headerTitle}>MÚSICA EN ENTRENAMIENTO</Text>
                <Text style={styles.headerSubtitle}>
                  Reproduce sin salir de tu rutina
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Selector de Playlists */}
          <View style={styles.playlistsSection}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistsScroll}
            >
              {DEFAULT_WORKOUT_PLAYLISTS.map((p) => {
                const isActive = activePlaylistId === p.id;
                return (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.playlistPill, isActive && styles.playlistPillActive]}
                    onPress={() => handleSelectPlaylist(p)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.playlistIcon}>{p.icon}</Text>
                    <Text
                      style={[
                        styles.playlistPillText,
                        isActive && styles.playlistPillTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {p.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {/* Botón para Playlist Personal */}
              <TouchableOpacity
                style={[
                  styles.playlistPill,
                  activePlaylistId === 'custom' && styles.playlistPillActive,
                  { borderColor: activePlaylistId === 'custom' ? '#1DB954' : '#334155' },
                ]}
                onPress={() => {
                  if (savedCustomUrl) {
                    setActivePlaylistId('custom');
                    saveActivePlaylistId('custom');
                    setWebViewLoading(true);
                  } else {
                    setShowCustomInput(true);
                  }
                }}
                activeOpacity={0.75}
              >
                <Text style={styles.playlistIcon}>🎧</Text>
                <Text
                  style={[
                    styles.playlistPillText,
                    activePlaylistId === 'custom' && styles.playlistPillTextActive,
                  ]}
                >
                  {savedCustomUrl ? 'Mi Playlist' : '+ Tu Playlist'}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Formulario para añadir playlist personalizada si está visible */}
          {showCustomInput && (
            <View style={styles.customInputCard}>
              <Text style={styles.customInputTitle}>Pegar enlace de Spotify</Text>
              <Text style={styles.customInputDesc}>
                Copia el enlace de cualquier playlist, canción o álbum de Spotify y pégalo aquí:
              </Text>
              <TextInput
                style={styles.customTextInput}
                placeholder="https://open.spotify.com/playlist/..."
                placeholderTextColor="#64748b"
                value={customUrl}
                onChangeText={setCustomUrl}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <View style={styles.customBtnRow}>
                <TouchableOpacity
                  style={styles.cancelCustomBtn}
                  onPress={() => setShowCustomInput(false)}
                >
                  <Text style={styles.cancelCustomText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.saveCustomBtn}
                  onPress={handleSaveCustomPlaylist}
                >
                  <Check size={14} color="#000000" style={{ marginRight: 4 }} />
                  <Text style={styles.saveCustomText}>Guardar Playlist</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Contenedor del Reproductor Web de Spotify */}
          <View style={styles.playerContainer}>
            {webViewLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#1DB954" />
                <Text style={styles.loadingText}>Cargando Spotify...</Text>
              </View>
            )}

            <WebView
              key={currentEmbedUrl}
              source={{ uri: currentEmbedUrl }}
              style={styles.webView}
              onLoadStart={() => setWebViewLoading(true)}
              onLoadEnd={() => setWebViewLoading(false)}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              scrollEnabled={true}
            />
          </View>

          {/* Botones de acción rápida: Abrir en apps externas si el alumno prefiere */}
          <View style={styles.quickAppsSection}>
            <Text style={styles.quickAppsTitle}>O ABRIR EN TU APP PREFERIDA:</Text>
            <View style={styles.quickAppsRow}>
              <TouchableOpacity
                style={[styles.quickAppBtn, { backgroundColor: '#1DB954' }]}
                onPress={() => openSpotifyApp(savedCustomUrl || undefined)}
                activeOpacity={0.8}
              >
                <Music size={14} color="#000000" style={{ marginRight: 6 }} />
                <Text style={styles.quickAppBtnTextSpotify}>Spotify App</Text>
                <ExternalLink size={12} color="#000000" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAppBtn, { backgroundColor: '#FF0000' }]}
                onPress={openYouTubeMusic}
                activeOpacity={0.8}
              >
                <Radio size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.quickAppBtnTextWhite}>YT Music</Text>
                <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.quickAppBtn, { backgroundColor: '#FC3C44' }]}
                onPress={openAppleMusic}
                activeOpacity={0.8}
              >
                <Headphones size={14} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.quickAppBtnTextWhite}>Apple Music</Text>
                <ExternalLink size={12} color="#ffffff" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Opción de configurar playlist propia si ya existe una activa */}
            {savedCustomUrl && !showCustomInput && (
              <TouchableOpacity
                style={styles.changeCustomPlaylistLink}
                onPress={() => setShowCustomInput(true)}
              >
                <Text style={styles.changeCustomPlaylistText}>
                  ✏️ Cambiar mi enlace personal de Spotify
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#0a0f14',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.35)',
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
    maxHeight: '88%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  spotifyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(29, 185, 84, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(29, 185, 84, 0.3)',
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playlistsSection: {
    paddingVertical: 12,
  },
  playlistsScroll: {
    gap: 8,
    paddingRight: 10,
  },
  playlistPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#334155',
    gap: 6,
  },
  playlistPillActive: {
    backgroundColor: 'rgba(29, 185, 84, 0.2)',
    borderColor: '#1DB954',
  },
  playlistIcon: {
    fontSize: 14,
  },
  playlistPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  playlistPillTextActive: {
    color: '#1DB954',
    fontWeight: '800',
  },
  customInputCard: {
    backgroundColor: '#111827',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1DB954',
    marginBottom: 10,
  },
  customInputTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  customInputDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    marginBottom: 8,
  },
  customTextInput: {
    backgroundColor: '#030712',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#ffffff',
    marginBottom: 10,
  },
  customBtnRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  cancelCustomBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1f2937',
  },
  cancelCustomText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  saveCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1DB954',
  },
  saveCustomText: {
    fontSize: 11,
    color: '#000000',
    fontWeight: '800',
  },
  playerContainer: {
    height: 352,
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#1f2937',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#121212',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#121212',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#1DB954',
    fontWeight: '700',
  },
  quickAppsSection: {
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  quickAppsTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  quickAppsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  quickAppBtnTextSpotify: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
  },
  quickAppBtnTextWhite: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
  changeCustomPlaylistLink: {
    alignItems: 'center',
    marginTop: 10,
  },
  changeCustomPlaylistText: {
    fontSize: 11,
    color: '#38bdf8',
    fontWeight: '600',
  },
});
