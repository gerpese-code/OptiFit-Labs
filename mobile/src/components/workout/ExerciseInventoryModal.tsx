import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Search,
  Dumbbell,
  Plus,
  Sparkles,
  ShieldCheck,
  User,
  Filter,
  Check,
  Edit3,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { translateExerciseName, translateMuscleGroup } from '@/lib/workoutTranslator';
import { supabase } from '@/lib/supabase';
import { offlineQueue } from '@/lib/offlineQueue';
import { Exercise } from '@/types/database';
import CreateCustomExerciseModal from './CreateCustomExerciseModal';

interface ExerciseInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectExercise: (exercise: Exercise) => void;
  userId: string;
  actionTitle?: string;
}

type TabType = 'all' | 'defaults' | 'my_exercises';

const MUSCLE_FILTER_OPTIONS = [
  'Todos',
  'Pecho',
  'Espalda',
  'Hombros',
  'Bíceps',
  'Tríceps',
  'Cuádriceps',
  'Isquiotibiales',
  'Glúteos',
  'Abdomen',
  'Cardio',
];

export default function ExerciseInventoryModal({
  visible,
  onClose,
  onSelectExercise,
  userId,
  actionTitle,
}: ExerciseInventoryModalProps) {
  const { t, language } = useLanguage();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [selectedMuscle, setSelectedMuscle] = useState('Todos');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedExerciseToCustomize, setSelectedExerciseToCustomize] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      // 1. Carga inmediata desde la memoria local (offline-first)
      const cached = await offlineQueue.getCachedExercises();
      if (cached && cached.length > 0) {
        setExercises(cached as Exercise[]);
        setLoading(false);
      }

      // 2. Si hay conexión a internet, refrescar con Supabase y actualizar caché
      const isOnline = await offlineQueue.isOnline();
      if (isOnline) {
        const { data, error } = await supabase
          .from('exercises')
          .select('*')
          .order('name', { ascending: true });

        if (!error && data && data.length > 0) {
          setExercises(data as Exercise[]);
          await offlineQueue.cacheExercises(data);
        }
      }
    } catch (err) {
      console.warn('Catálogo cargado desde caché local offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchExercises();
    }
  }, [visible]);

  const handleExerciseCreated = (newEx: Exercise) => {
    setExercises((prev) => {
      const idx = prev.findIndex((e) => e.id === newEx.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = newEx;
        return copy;
      }
      return [newEx, ...prev];
    });
    setActiveTab('my_exercises');
    // Automáticamente seleccionar el ejercicio recién creado o personalizado
    onSelectExercise(newEx);
    onClose();
  };

  const handleOpenCustomize = (ex: Exercise) => {
    setSelectedExerciseToCustomize(ex);
    setShowCreateModal(true);
  };

  const defaultsCount = exercises.filter((e) => !e.is_custom && !e.created_by).length;
  const myExercisesCount = exercises.filter(
    (e) => e.is_custom === true || e.created_by === userId
  ).length;

  const filteredExercises = exercises.filter((e) => {
    const isMine = e.is_custom === true || e.created_by === userId;

    if (activeTab === 'defaults' && isMine) return false;
    if (activeTab === 'my_exercises' && !isMine) return false;

    if (selectedMuscle !== 'Todos' && e.muscle_group !== selectedMuscle) return false;

    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = e.name.toLowerCase().includes(q);
      const matchMuscle = e.muscle_group.toLowerCase().includes(q);
      const matchDesc = e.description?.toLowerCase().includes(q);
      if (!matchName && !matchMuscle && !matchDesc) return false;
    }

    return true;
  });

  const renderExerciseItem = ({ item }: { item: Exercise }) => {
    const isMine = item.is_custom === true || item.created_by === userId;
    const thumbnail =
      item.image_urls && item.image_urls.length > 0
        ? item.image_urls[0]
        : item.gif_url || null;

    return (
      <TouchableOpacity
        style={styles.exerciseCard}
        onPress={() => {
          onSelectExercise(item);
          onClose();
        }}
        activeOpacity={0.7}
      >
        {/* Imagen / Miniatura */}
        <View style={styles.thumbnailBox}>
          {thumbnail ? (
            <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
          ) : (
            <Dumbbell size={24} color="#64748b" />
          )}
        </View>

        {/* Info */}
        <View style={styles.exerciseInfo}>
          <View style={styles.exerciseBadgesRow}>
            <View style={styles.muscleBadge}>
              <Text style={styles.muscleBadgeText}>
                {translateMuscleGroup(item.muscle_group, language)}
              </Text>
            </View>

            {isMine ? (
              <View style={styles.mineBadge}>
                <Sparkles size={9} color="#f59e0b" style={{ marginRight: 3 }} />
                <Text style={styles.mineBadgeText}>
                  {t('workout.custom_badge', 'Propio')}
                </Text>
              </View>
            ) : (
              <View style={styles.coachBadge}>
                <ShieldCheck size={9} color="#10b981" style={{ marginRight: 3 }} />
                <Text style={styles.coachBadgeText}>Coach</Text>
              </View>
            )}
          </View>

          <Text style={styles.exerciseName} numberOfLines={2}>
            {translateExerciseName(item.name, language)}
          </Text>

          {item.description ? (
            <Text style={styles.exerciseDesc} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
        </View>

        {/* Acciones Rápidas: Personalizar y Seleccionar */}
        <View style={styles.cardActionsCol}>
          <TouchableOpacity
            style={[
              styles.customizeCardBtn,
              isMine && { backgroundColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' },
            ]}
            onPress={() => handleOpenCustomize(item)}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Edit3 size={11} color={isMine ? '#10b981' : '#f59e0b'} />
            <Text
              style={[
                styles.customizeCardBtnText,
                { color: isMine ? '#10b981' : '#f59e0b' },
              ]}
            >
              {isMine ? t('common.edit', 'Editar') : t('workout.customize_exercise', 'Personalizar')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.addBtnCircle}
            onPress={() => {
              onSelectExercise(item);
              onClose();
            }}
            activeOpacity={0.7}
            hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
          >
            <Plus size={16} color="#10b981" />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.modalContainer}>
          {/* Cabecera */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <View style={styles.tag}>
                <Dumbbell size={11} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.tagText}>
                  {t('workout.library_subtitle', 'CATÁLOGO DE EJERCICIOS')}
                </Text>
              </View>
              <Text style={styles.title}>
                {actionTitle || t('workout.library_title', 'Catálogo de Ejercicios')}
              </Text>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Barra de Acciones: Buscador y Botón Crear Ejercicio */}
          <View style={styles.toolbar}>
            <View style={styles.searchBar}>
              <Search size={16} color="#64748b" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder={t('workout.search_placeholder', 'Buscar por nombre o músculo...')}
                placeholderTextColor="#64748b"
                clearButtonMode="while-editing"
              />
            </View>

            <TouchableOpacity
              style={styles.createExerciseBtn}
              onPress={() => {
                setSelectedExerciseToCustomize(null);
                setShowCreateModal(true);
              }}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.createExerciseBtnText}>
                {t('workout.create_custom_btn', '+ Crear Ejercicio')}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Selector de Pestañas (Todos / Predeterminados / Mis Ejercicios) */}
          <View style={styles.tabsRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'all' && styles.tabActive]}
              onPress={() => setActiveTab('all')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                {t('workout.tab_all', 'Todos')} ({exercises.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 'defaults' && styles.tabActive]}
              onPress={() => setActiveTab('defaults')}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, activeTab === 'defaults' && styles.tabTextActive]}>
                {t('workout.tab_defaults', 'Predeterminados')} ({defaultsCount})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                styles.myTab,
                activeTab === 'my_exercises' && styles.myTabActive,
              ]}
              onPress={() => setActiveTab('my_exercises')}
              activeOpacity={0.7}
            >
              <Sparkles
                size={12}
                color={activeTab === 'my_exercises' ? '#ffffff' : '#f59e0b'}
                style={{ marginRight: 4 }}
              />
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'my_exercises' && styles.tabTextActive,
                ]}
              >
                {t('workout.tab_my_exercises', 'Mis Ejercicios')} ({myExercisesCount})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Filtro horizontal de grupos musculares */}
          <View style={styles.muscleFiltersContainer}>
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={MUSCLE_FILTER_OPTIONS}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.muscleChipsScroll}
              renderItem={({ item }) => {
                const isSelected = item === selectedMuscle;
                return (
                  <TouchableOpacity
                    style={[styles.muscleChip, isSelected && styles.muscleChipSelected]}
                    onPress={() => setSelectedMuscle(item)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.muscleChipText,
                        isSelected && styles.muscleChipTextSelected,
                      ]}
                    >
                      {item === 'Todos' ? t('workout.tab_all', 'Todos') : translateMuscleGroup(item, language)}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Lista de Ejercicios */}
          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color="#10b981" />
              <Text style={styles.loadingText}>{t('common.loading', 'Cargando...')}</Text>
            </View>
          ) : filteredExercises.length === 0 ? (
            <View style={styles.centerBox}>
              <Dumbbell size={42} color="#475569" />
              <Text style={styles.emptyTitle}>
                {activeTab === 'my_exercises'
                  ? 'Aún no has creado ejercicios propios'
                  : 'No se encontraron ejercicios'}
              </Text>
              <Text style={styles.emptySub}>
                {activeTab === 'my_exercises'
                  ? 'Toca el botón "+ Crear Ejercicio Propio" arriba para agregar tu primer ejercicio personalizado.'
                  : 'Prueba buscar con otro término o selecciona otro grupo muscular.'}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredExercises}
              keyExtractor={(item) => item.id}
              renderItem={renderExerciseItem}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
            />
          )}

          {/* Modal para Crear / Personalizar Ejercicio */}
          <CreateCustomExerciseModal
            visible={showCreateModal}
            onClose={() => {
              setShowCreateModal(false);
              setSelectedExerciseToCustomize(null);
            }}
            onExerciseCreated={handleExerciseCreated}
            userId={userId}
            initialExercise={selectedExerciseToCustomize}
          />
        </View>
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
  modalContainer: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    height: '92%',
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
    paddingBottom: 12,
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
    color: '#10b981',
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
  toolbar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#ffffff',
    padding: 0,
  },
  createExerciseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#d97706',
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    shadowColor: '#d97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  createExerciseBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  tabsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  tabActive: {
    backgroundColor: '#10b981',
    borderColor: '#059669',
  },
  myTab: {
    borderColor: '#b45309',
  },
  myTabActive: {
    backgroundColor: '#d97706',
    borderColor: '#b45309',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  muscleFiltersContainer: {
    paddingVertical: 6,
  },
  muscleChipsScroll: {
    paddingHorizontal: 16,
    gap: 6,
  },
  muscleChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
  },
  muscleChipSelected: {
    backgroundColor: '#334155',
    borderColor: '#38bdf8',
  },
  muscleChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94a3b8',
  },
  muscleChipTextSelected: {
    color: '#38bdf8',
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 10,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 16,
    padding: 12,
  },
  thumbnailBox: {
    width: 54,
    height: 54,
    borderRadius: 12,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#334155',
    marginRight: 12,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  exerciseInfo: {
    flex: 1,
    marginRight: 8,
  },
  exerciseBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  muscleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
  },
  muscleBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
    textTransform: 'uppercase',
  },
  mineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
  },
  mineBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#f59e0b',
    textTransform: 'uppercase',
  },
  coachBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  coachBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#10b981',
    textTransform: 'uppercase',
  },
  exerciseName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 18,
  },
  exerciseDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  addBtnCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardActionsCol: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 8,
    marginLeft: 6,
  },
  customizeCardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    gap: 4,
  },
  customizeCardBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 8,
  },
  loadingText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});
