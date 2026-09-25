import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

const AVATAR_CACHE_KEY_PREFIX = '@fitnesspro_avatar_url_';

/**
 * Obtiene la URL de la foto de perfil en caché o en los metadatos del usuario
 */
export async function getStoredAvatarUrl(userId: string): Promise<string | null> {
  if (!userId) return null;
  try {
    const cached = await AsyncStorage.getItem(`${AVATAR_CACHE_KEY_PREFIX}${userId}`);
    if (cached) return cached;

    // Si no está en caché local, buscar en los metadatos de Supabase Auth
    const { data } = await supabase.auth.getUser();
    const metaAvatar = data.user?.user_metadata?.avatar_url;
    if (metaAvatar && typeof metaAvatar === 'string') {
      await AsyncStorage.setItem(`${AVATAR_CACHE_KEY_PREFIX}${userId}`, metaAvatar);
      return metaAvatar;
    }
  } catch (e) {
    console.warn('Error al leer avatar en caché:', e);
  }
  return null;
}

/**
 * Guarda la URL de la foto de perfil en la caché local
 */
export async function setStoredAvatarUrl(userId: string, url: string): Promise<void> {
  if (!userId || !url) return;
  try {
    await AsyncStorage.setItem(`${AVATAR_CACHE_KEY_PREFIX}${userId}`, url);
  } catch (e) {
    console.warn('Error al guardar avatar en caché:', e);
  }
}

/**
 * Elimina la foto de perfil del usuario
 */
export async function removeAvatar(userId: string): Promise<void> {
  if (!userId) return;
  try {
    await AsyncStorage.removeItem(`${AVATAR_CACHE_KEY_PREFIX}${userId}`);
    await supabase.auth.updateUser({
      data: { avatar_url: null },
    });
  } catch (e) {
    console.warn('Error al eliminar avatar:', e);
  }
}

/**
 * Sube una imagen (URI local) al bucket 'avatars' de Supabase
 * y actualiza los metadatos de usuario en Supabase Auth
 */
export async function uploadAvatarImage(userId: string, localUri: string): Promise<string> {
  if (!userId) throw new Error('Usuario no identificado');
  if (!localUri) throw new Error('No se seleccionó ninguna imagen');

  // Convertir URI local a Blob
  const response = await fetch(localUri);
  const blob = await response.blob();

  const fileExt = localUri.split('.').pop()?.toLowerCase() || 'jpg';
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;

  // Subir al bucket 'avatars' de Supabase
  const { data: uploadData, error: uploadErr } = await supabase.storage
    .from('avatars')
    .upload(filePath, blob, {
      contentType: `image/${fileExt === 'png' ? 'png' : 'jpeg'}`,
      upsert: true,
    });

  if (uploadErr) {
    console.error('Error al subir avatar a Supabase Storage:', uploadErr);
    throw new Error(uploadErr.message || 'No se pudo subir la foto de perfil');
  }

  // Obtener URL pública directa
  const { data: publicData } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  const publicUrl = `${publicData.publicUrl}?t=${Date.now()}`;

  // Actualizar avatar_url en user_metadata de Supabase Auth
  try {
    await supabase.auth.updateUser({
      data: { avatar_url: publicUrl },
    });
  } catch (metaErr) {
    console.warn('Aviso: no se pudo actualizar user_metadata:', metaErr);
  }

  // Guardar en caché local para carga instantánea
  await setStoredAvatarUrl(userId, publicUrl);

  return publicUrl;
}

/**
 * Abre el selector de la galería del teléfono
 */
export async function pickImageFromGallery(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se requiere permiso para acceder a tus fotos.');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const selectedAsset = result.assets[0];
  return await uploadAvatarImage(userId, selectedAsset.uri);
}

/**
 * Abre la cámara para tomar una foto de perfil
 */
export async function takePhotoWithCamera(userId: string): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Se requiere permiso para acceder a la cámara.');
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled || !result.assets || result.assets.length === 0) {
    return null;
  }

  const selectedAsset = result.assets[0];
  return await uploadAvatarImage(userId, selectedAsset.uri);
}
