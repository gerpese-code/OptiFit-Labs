import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Sparkles, Check, Edit3 } from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { supabase } from '@/lib/supabase';
import { offlineQueue, generateUUID } from '@/lib/offlineQueue';
import { Exercise } from '@/types/database';

interface CreateCustomExerciseModalProps {
  visible: boolean;
  onClose: () => void;
  onExerciseCreated: (newExercise: Exercise) => void;
  userId: string;
  initialExercise?: Exercise | null;
}

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Abdomen',
  'Gemelos',
  'Cardio',
  'Cuerpo Completo',
];

export default function CreateCustomExerciseModal({
  visible,
  onClose,
  onExerciseCreated,
  userId,
  initialExercise,
}: CreateCustomExerciseModalProps) {
  const { t } = useLanguage();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('Pecho');
  const [description, setDescription] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Determinar si estamos editando un ejercicio propio o personalizando una copia de uno existente
  const isEditingOwn = Boolean(initialExercise && initialExercise.created_by === userId);
  const isCustomizingCopy = Boolean(initialExercise && !isEditingOwn);

  useEffect(() => {
    if (visible) {
      if (initialExercise) {
        setName(initialExercise.name || '');
        setMuscleGroup(initialExercise.muscle_group || 'Pecho');
        setDescription(initialExercise.description || '');
        const existingMedia =
          (initialExercise.image_urls && initialExercise.image_urls[0]) ||
          initialExercise.gif_url ||
          initialExercise.video_url ||
          '';
        setMediaUrl(existingMedia);
      } else {
        resetForm();
      }
    }
  }, [visible, initialExercise]);

  const resetForm = () => {
    setName('');
    setMuscleGroup('Pecho');
    setDescription('');
    setMediaUrl('');
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert(
        t('common.error', 'Error'),
        t('workout.name_required', 'Por favor ingresa el nombre del ejercicio.')
      );
      return;
    }

    setIsSaving(true);
    try {
      const trimmedMedia = mediaUrl.trim();
      const isVideo =
        trimmedMedia.includes('.mp4') ||
        trimmedMedia.includes('youtube') ||
        trimmedMedia.includes('vimeo');
      const isGif = trimmedMedia.includes('.gif');

      // ID del ejercicio: si editamos uno propio, mantenemos el ID; si personalizamos o creamos nuevo, UUID nuevo
      const targetId = isEditingOwn && initialExercise?.id ? initialExercise.id : generateUUID();

      const imageList =
        trimmedMedia && !isVideo && !isGif
          ? [trimmedMedia]
          : isCustomizingCopy && initialExercise?.image_urls
          ? initialExercise.image_urls
          : [];

      const exercisePayload: Exercise = {
        id: targetId,
        name: trimmedName,
        muscle_group: muscleGroup,
        description: description.trim() || null,
        video_url: isVideo
          ? trimmedMedia
          : isCustomizingCopy
          ? initialExercise?.video_url || null
          : null,
        gif_url: isGif
          ? trimmedMedia
          : isCustomizingCopy
          ? initialExercise?.gif_url || null
          : null,
        image_urls: imageList,
        created_by: userId,
        is_custom: true,
        created_at: initialExercise?.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // 1. Guardar de inmediato en la caché local del dispositivo
      await offlineQueue.upsertCachedExercise(exercisePayload);

      // 2. Comprobar si hay internet para sincronizar con Supabase
      const isOnline = await offlineQueue.isOnline();

      if (isOnline) {
        try {
          if (isEditingOwn) {
            const { error } = await supabase
              .from('exercises')
              .update(exercisePayload)
              .eq('id', exercisePayload.id);
            if (error) throw error;
          } else {
            const { error } = await supabase.from('exercises').insert(exercisePayload);
            if (error) throw error;
          }
        } catch (dbErr) {
          console.warn('Error de red al sincronizar ejercicio, encolando offline:', dbErr);
          await offlineQueue.enqueue({
            type: isEditingOwn ? 'UPDATE_EXERCISE' : 'CREATE_EXERCISE',
            payload: exercisePayload,
          });
        }
      } else {
        // Encolar para auto-sincronizar cuando regrese la señal
        await offlineQueue.enqueue({
          type: isEditingOwn ? 'UPDATE_EXERCISE' : 'CREATE_EXERCISE',
          payload: exercisePayload,
        });
      }

      resetForm();
      onExerciseCreated(exercisePayload);
      onClose();
    } catch (err: any) {
      console.error('Error al guardar ejercicio:', err);
      Alert.alert(
        t('common.error', 'Error'),
        err.message || 'No se pudo guardar el ejercicio.'
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          {/* Encabezado */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tag}>
                {isCustomizingCopy ? (
                  <Sparkles size={11} color="#f59e0b" style={{ marginRight: 4 }} />
                ) : (
                  <Edit3 size={11} color="#10b981" style={{ marginRight: 4 }} />
                )}
                <Text style={[styles.tagText, isCustomizingCopy ? { color: '#f59e0b' } : { color: '#10b981' }]}>
                  {isCustomizingCopy
                    ? 'PERSONALIZAR'
                    : isEditingOwn
                    ? 'EDITAR EJERCICIO'
                    : 'NUEVO EJERCICIO'}
                </Text>
              </View>
              <Text style={styles.title}>
                {isCustomizingCopy
                  ? 'Personalizar Ejercicio'
                  : isEditingOwn
                  ? 'Editar Ejercicio'
                  : t('workout.new_exercise_title', 'Crear Ejercicio')}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Formulario */}
          <ScrollView style={styles.formContainer} keyboardShouldPersistTaps="handled">
            {/* Nombre */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('workout.exercise_name_label', 'Nombre del Ejercicio')} *
              </Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={t(
                  'workout.exercise_name_placeholder',
                  'Ej. Curl de bíceps concentrado en polea'
                )}
                placeholderTextColor="#64748b"
                autoCapitalize="sentences"
              />
            </View>

            {/* Grupo Muscular */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('workout.muscle_group_label', 'Grupo Muscular')} *
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipsRow}>
                {MUSCLE_GROUPS.map((mg) => {
                  const isSelected = mg === muscleGroup;
                  return (
                    <TouchableOpacity
                      key={mg}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => setMuscleGroup(mg)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {mg}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Descripción Técnica */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('workout.description_label', 'Descripción / Técnica de Ejecución (Opcional)')}
              </Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder={t(
                  'workout.description_placeholder',
                  'Indicaciones clave, postura, tempo o respiración...'
                )}
                placeholderTextColor="#64748b"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* URL Multimedia */}
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>
                {t('workout.media_url_label', 'URL de Video o Foto (Opcional)')}
              </Text>
              <TextInput
                style={styles.input}
                value={mediaUrl}
                onChangeText={setMediaUrl}
                placeholder={t('workout.media_url_placeholder', 'https://ejemplo.com/video.mp4')}
                placeholderTextColor="#64748b"
                autoCapitalize="none"
                keyboardType="url"
              />
            </View>
          </ScrollView>

          {/* Botón Guardar */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={isSaving}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>{t('common.cancel', 'Cancelar')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.saveBtn, isSaving && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={isSaving}
              activeOpacity={0.8}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Check size={16} color="#ffffff" style={{ marginRight: 6 }} />
                  <Text style={styles.saveBtnText}>
                    {t('common.save', 'Guardar Ejercicio')}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: '#1e293b',
  },
  formContainer: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#e2e8f0',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#ffffff',
  },
  textArea: {
    minHeight: 70,
  },
  chipsRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  chipTextSelected: {
    color: '#ffffff',
    fontWeight: '800',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    backgroundColor: '#090d16',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#10b981',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
});

