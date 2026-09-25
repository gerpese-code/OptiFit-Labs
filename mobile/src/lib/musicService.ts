import AsyncStorage from '@react-native-async-storage/async-storage';
import { Linking, Platform } from 'react-native';

export interface WorkoutPlaylist {
  id: string;
  name: string;
  genre: string;
  icon: string;
  spotifyId: string;
  type: 'playlist' | 'album' | 'track';
  embedUrl: string;
}

export const DEFAULT_WORKOUT_PLAYLISTS: WorkoutPlaylist[] = [
  {
    id: 'beast-mode',
    name: 'Beast Mode',
    genre: 'Gym Motivation / Heavy',
    icon: '🔥',
    spotifyId: '37i9dQZF1DX76Wlfdnj7AP',
    type: 'playlist',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76Wlfdnj7AP?utm_source=generator&theme=0',
  },
  {
    id: 'techno-hardstyle',
    name: 'Hardstyle & Techno Gym',
    genre: 'High BPM / High Energy',
    icon: '⚡',
    spotifyId: '37i9dQZF1DX4eRPd9frC1m',
    type: 'playlist',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX4eRPd9frC1m?utm_source=generator&theme=0',
  },
  {
    id: 'hiphop-gym',
    name: 'Hip-Hop Workout Beats',
    genre: 'Rap & Urban Power',
    icon: '🥊',
    spotifyId: '37i9dQZF1DX76t638V649v',
    type: 'playlist',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DX76t638V649v?utm_source=generator&theme=0',
  },
  {
    id: 'reggaeton-gym',
    name: 'Entreno Fuego Latino',
    genre: 'Reggaeton & Dembow',
    icon: '🌴',
    spotifyId: '37i9dQZF1DWZq9lqE8PfgK',
    type: 'playlist',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWZq9lqE8PfgK?utm_source=generator&theme=0',
  },
  {
    id: 'rock-metal-gym',
    name: 'Metal & Rock Workout',
    genre: 'Adrenaline & Heavy Riffs',
    icon: '🎸',
    spotifyId: '37i9dQZF1DWXIcbzpLauPS',
    type: 'playlist',
    embedUrl: 'https://open.spotify.com/embed/playlist/37i9dQZF1DWXIcbzpLauPS?utm_source=generator&theme=0',
  },
];

const CUSTOM_PLAYLIST_STORAGE_KEY = '@fitnesspro_custom_playlist_url';
const ACTIVE_PLAYLIST_STORAGE_KEY = '@fitnesspro_active_playlist_id';

/**
 * Convierte un link normal de Spotify (web o URI) en una URL válida de embed
 */
export function parseSpotifyEmbedUrl(input: string): { embedUrl: string; type: 'playlist' | 'album' | 'track'; id: string } | null {
  if (!input) return null;
  const clean = input.trim();

  // Caso: URI spotify:playlist:37i9dQZF1DX...
  if (clean.startsWith('spotify:')) {
    const parts = clean.split(':');
    if (parts.length >= 3) {
      const type = parts[1] as 'playlist' | 'album' | 'track';
      const id = parts[2];
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        type,
        id,
      };
    }
  }

  // Caso: URL web https://open.spotify.com/playlist/37i9dQZF1DX...?si=...
  try {
    const regex = /open\.spotify\.com\/(playlist|album|track)\/([a-zA-Z0-9]+)/;
    const match = clean.match(regex);
    if (match && match[1] && match[2]) {
      const type = match[1] as 'playlist' | 'album' | 'track';
      const id = match[2];
      return {
        embedUrl: `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`,
        type,
        id,
      };
    }
  } catch (e) {
    console.warn('Error parsing Spotify URL:', e);
  }

  return null;
}

/**
 * Obtiene la URL personalizada guardada por el usuario
 */
export async function getCustomSpotifyPlaylist(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(CUSTOM_PLAYLIST_STORAGE_KEY);
  } catch {
    return null;
  }
}

/**
 * Guarda la URL de playlist personalizada del usuario
 */
export async function saveCustomSpotifyPlaylist(url: string | null): Promise<void> {
  try {
    if (!url) {
      await AsyncStorage.removeItem(CUSTOM_PLAYLIST_STORAGE_KEY);
    } else {
      await AsyncStorage.setItem(CUSTOM_PLAYLIST_STORAGE_KEY, url.trim());
    }
  } catch (e) {
    console.warn('Error saving custom playlist:', e);
  }
}

/**
 * Obtiene la playlist activa actual
 */
export async function getActivePlaylistId(): Promise<string> {
  try {
    const saved = await AsyncStorage.getItem(ACTIVE_PLAYLIST_STORAGE_KEY);
    return saved || 'beast-mode';
  } catch {
    return 'beast-mode';
  }
}

/**
 * Guarda la playlist activa seleccionada
 */
export async function saveActivePlaylistId(id: string): Promise<void> {
  try {
    await AsyncStorage.setItem(ACTIVE_PLAYLIST_STORAGE_KEY, id);
  } catch (e) {
    console.warn('Error saving active playlist id:', e);
  }
}

/**
 * Abre directamente la aplicación nativa de Spotify en el teléfono
 */
export async function openSpotifyApp(optionalUriOrUrl?: string): Promise<void> {
  try {
    const nativeUri = optionalUriOrUrl && optionalUriOrUrl.startsWith('spotify:')
      ? optionalUriOrUrl
      : 'spotify://';

    const canOpen = await Linking.canOpenURL(nativeUri);
    if (canOpen) {
      await Linking.openURL(nativeUri);
      return;
    }
  } catch (err) {
    console.warn('Could not open native Spotify app, opening web fallback', err);
  }

  // Fallback web
  const webUrl = optionalUriOrUrl?.startsWith('http')
    ? optionalUriOrUrl
    : 'https://open.spotify.com';
  await Linking.openURL(webUrl);
}

/**
 * Abre YouTube Music
 */
export async function openYouTubeMusic(): Promise<void> {
  try {
    const nativeUri = Platform.OS === 'ios' ? 'youtubemusic://' : 'https://music.youtube.com';
    const canOpen = await Linking.canOpenURL('youtubemusic://');
    if (canOpen) {
      await Linking.openURL('youtubemusic://');
      return;
    }
  } catch (err) {
    // fallback
  }
  await Linking.openURL('https://music.youtube.com');
}

/**
 * Abre Apple Music
 */
export async function openAppleMusic(): Promise<void> {
  try {
    const nativeUri = 'music://';
    const canOpen = await Linking.canOpenURL(nativeUri);
    if (canOpen) {
      await Linking.openURL(nativeUri);
      return;
    }
  } catch (err) {
    // fallback
  }
  await Linking.openURL('https://music.apple.com');
}
