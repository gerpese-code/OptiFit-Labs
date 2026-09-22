'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Exercise } from '@/types/database';
import ExerciseCard from '@/components/exercises/ExerciseCard';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';
import ExerciseEditModal from '@/components/exercises/ExerciseEditModal';
import { DEFAULT_EXERCISES } from '@/lib/data/defaultExercises';
import { Plus, Search, Dumbbell, Filter, Loader2, Sparkles, User, ShieldCheck, BookOpen, Users } from 'lucide-react';

type ExerciseTab = 'all' | 'coach' | 'students';

export default function ExercisesPage() {
  const supabase = createClient();

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<ExerciseTab>('all');
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [exerciseToEdit, setExerciseToEdit] = useState<Exercise | null>(null);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      // Intentar cargar con los datos del perfil del creador si existen las columnas
      const { data: dataWithCreator, error: errWithCreator } = await supabase
        .from('exercises')
        .select('*, creator:profiles!created_by(id, full_name, client_code)')
        .order('name', { ascending: true });

      if (!errWithCreator && dataWithCreator) {
        setExercises(dataWithCreator as Exercise[]);
      } else {
        // Fallback defensivo si la migración de clave foránea aún no se ha ejecutado
        const { data: fallbackData, error: fallbackErr } = await supabase
          .from('exercises')
          .select('*')
          .order('name', { ascending: true });

        if (fallbackErr) throw fallbackErr;
        setExercises((fallbackData as Exercise[]) || []);
      }
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExercises();
  }, []);

  const handleSeedDatabase = async () => {
    if (!confirm('¿Deseas precargar los ejercicios oficiales predeterminados que falten en el catálogo? (No se borrará ni sobreescribirá ninguna modificación que hayas realizado).')) return;
    setSeeding(true);
    try {
      // 1. Obtener ejercicios existentes
      const { data: existing, error: fetchErr } = await supabase
        .from('exercises')
        .select('id, name, image_urls');
      if (fetchErr) throw fetchErr;

      const existingMap = new Map((existing || []).map((e: any) => [e.name.toLowerCase().trim(), e]));

      const toInsert: any[] = [];
      const toUpdate: { id: string; payload: any }[] = [];

      for (const ex of DEFAULT_EXERCISES) {
        const key = ex.name.toLowerCase().trim();
        const existingEx = existingMap.get(key);

        if (existingEx) {
          // Si el ejercicio existe pero no tiene imágenes técnicas, agregar las predeterminadas
          const hasImages = existingEx.image_urls && existingEx.image_urls.length > 0;
          if (!hasImages && ex.image_urls && ex.image_urls.length > 0) {
            toUpdate.push({
              id: existingEx.id,
              payload: {
                image_urls: ex.image_urls,
                updated_at: new Date().toISOString(),
              },
            });
          }
        } else {
          // Si no existe, insertar como ejercicio oficial
          toInsert.push({
            name: ex.name,
            muscle_group: ex.muscle_group,
            description: ex.description,
            video_url: ex.video_url,
            gif_url: ex.gif_url,
            image_urls: ex.image_urls,
            is_custom: false,
            created_by: null,
            updated_at: new Date().toISOString(),
          });
        }
      }

      // Inserción en lotes
      if (toInsert.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const batch = toInsert.slice(i, i + batchSize);
          const { error: insErr } = await supabase.from('exercises').insert(batch);
          if (insErr) throw insErr;
        }
      }

      // Actualizar existentes sin imágenes
      for (const item of toUpdate) {
        await supabase.from('exercises').update(item.payload).eq('id', item.id);
      }

      await fetchExercises();
      alert(`¡Catálogo sincronizado con éxito! (${toInsert.length} añadidos nuevos, ${toUpdate.length} completados con fotos de técnica). Tus modificaciones previas se mantuvieron intactas.`);
    } catch (err: any) {
      alert(`Error al sincronizar catálogo: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const handleDelete = async (id: string, exerciseName?: string) => {
    try {
      // 1. Verificar si el ejercicio está asignado en alguna rutina activa de alumnos
      const { count, error: countErr } = await supabase
        .from('routine_exercises')
        .select('*', { count: 'exact', head: true })
        .eq('exercise_id', id);

      if (!countErr && count && count > 0) {
        const confirmCascade = confirm(
          `⚠️ ATENCIÓN:\n\nEl ejercicio "${exerciseName || 'seleccionado'}" actualmente forma parte de ${count} rutina(s) activa(s) asignadas a alumnos.\n\n¿Deseas desvincularlo automáticamente de esas rutinas y eliminarlo permanentemente de la base de datos?`
        );
        if (!confirmCascade) return;

        // Desvincular de las rutinas primero (las series se eliminan en cascada por foreign key)
        const { error: cascadeErr } = await supabase
          .from('routine_exercises')
          .delete()
          .eq('exercise_id', id);

        if (cascadeErr) {
          throw new Error(`Error al desvincular de rutinas: ${cascadeErr.message}`);
        }
      } else {
        if (!confirm(`¿Seguro que deseas eliminar el ejercicio "${exerciseName || 'este ejercicio'}" del catálogo? Esta acción no se puede deshacer.`)) {
          return;
        }
      }

      // 2. Eliminar de la tabla exercises de Supabase
      const { error } = await supabase.from('exercises').delete().eq('id', id);
      if (error) throw error;

      setExercises((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      console.error('Error al eliminar ejercicio:', err);
      alert(`No se pudo eliminar el ejercicio: ${err.message}`);
    }
  };

  const coachCount = exercises.filter((e) => !e.is_custom && !e.created_by).length;
  const studentsCount = exercises.filter((e) => e.is_custom || !!e.created_by).length;

  const muscleGroups = Array.from(
    new Set(exercises.map((e) => e.muscle_group))
  ).sort();

  const filteredExercises = exercises.filter((ex) => {
    const isCustom = ex.is_custom || !!ex.created_by;
    
    // Filtro por pestaña
    if (activeTab === 'coach' && isCustom) return false;
    if (activeTab === 'students' && !isCustom) return false;

    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description?.toLowerCase().includes(search.toLowerCase()) ||
      ex.creator?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      ex.creator?.client_code?.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'all' || ex.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Dumbbell className="w-6 h-6 mr-2.5 text-emerald-400" />
            Catálogo Multimedia de Ejercicios
          </h2>
          <p className="text-sm text-gray-400">
            Gestiona videos explicativos, GIFs y recursos técnicos para los entrenamientos.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/30 transition disabled:opacity-50"
            title="Sincronizar los más de 115 ejercicios predeterminados con imágenes técnicas oficiales"
          >
            {seeding ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                Sincronizando Catálogo...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-1.5 text-emerald-400" />
                ⚡ Sincronizar Catálogo (115+ Ejercicios)
              </>
            )}
          </button>

          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Nuevo Ejercicio
          </button>
        </div>
      </div>

      {/* Tabs Selector: Todos / Predeterminados del Coach / Ejercicios de Alumnos */}
      <div className="flex flex-wrap items-center gap-2 border-b border-gray-800 pb-3">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'all'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4 mr-2" />
          Todos los Ejercicios
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'all' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'
          }`}>
            {exercises.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('coach')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'coach'
              ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
              : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-2 text-emerald-400" />
          Predeterminados del Coach
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] ${
            activeTab === 'coach' ? 'bg-emerald-700 text-white' : 'bg-gray-800 text-gray-400'
          }`}>
            {coachCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'students'
              ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/20'
              : 'bg-gray-900 text-gray-400 hover:text-amber-300 hover:bg-gray-800'
          }`}
        >
          <Users className="w-4 h-4 mr-2 text-amber-400" />
          Ejercicios Propios de Alumnos
          <span className={`ml-2 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
            activeTab === 'students' ? 'bg-amber-700 text-white' : 'bg-amber-950/80 text-amber-400 border border-amber-800/60'
          }`}>
            {studentsCount}
          </span>
        </button>
      </div>

      {/* Banner Informativo para el Coach en la pestaña de alumnos */}
      {activeTab === 'students' && (
        <div className="bg-amber-950/30 border border-amber-800/50 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
          <Users className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-amber-300">Auditoría de Ejercicios Creados por Alumnos:</span>
            <p className="mt-0.5 text-amber-200/90 leading-relaxed">
              En este apartado se concentran todos los ejercicios creados por los alumnos desde la app móvil. Cada ejercicio indica el nombre y código del autor. Puedes editar la técnica, descripción o eliminarlo si consideras necesario. Los demás alumnos no tienen acceso a ver los ejercicios creados por otros alumnos.
            </p>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder={
              activeTab === 'students'
                ? "Buscar por nombre, técnica o nombre/código de alumno..."
                : "Buscar por nombre o descripción técnica..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center space-x-2 w-full md:w-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedMuscle}
            onChange={(e) => setSelectedMuscle(e.target.value)}
            className="bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition w-full md:w-auto"
          >
            <option value="all">Todos los grupos musculares</option>
            {muscleGroups.map((mg) => (
              <option key={mg} value={mg}>
                {mg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Exercises */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs">Cargando biblioteca multimedia...</span>
        </div>
      ) : filteredExercises.length === 0 ? (
        activeTab === 'students' ? (
          <div className="h-72 border border-dashed border-amber-900/50 bg-amber-950/10 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Users className="w-12 h-12 text-amber-500/70" />
            <h3 className="text-base font-bold text-white">No hay ejercicios propios de alumnos aún</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Cuando los alumnos creen sus propios ejercicios personalizados desde la app móvil, aparecerán listados aquí para tu supervisión directa.
            </p>
          </div>
        ) : (
          <div className="h-72 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Dumbbell className="w-12 h-12 text-gray-600" />
            <h3 className="text-base font-bold text-white">No se encontraron ejercicios</h3>
            <p className="text-xs text-gray-400 max-w-md">
              Intenta cambiar los términos de búsqueda o grupo muscular seleccionado.
            </p>
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={handleSeedDatabase}
                disabled={seeding}
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition"
              >
                <Sparkles className="w-4 h-4 mr-1.5" />
                ⚡ Cargar Catálogo Base
              </button>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="inline-flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Crear Ejercicio Manual
              </button>
            </div>
          </div>
        )
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onEdit={(ex) => setExerciseToEdit(ex)}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Modal Crear */}
      <ExerciseFormModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newEx) => setExercises((prev) => [newEx, ...prev])}
      />

      {/* Modal Editar */}
      <ExerciseEditModal
        exercise={exerciseToEdit}
        isOpen={!!exerciseToEdit}
        onClose={() => setExerciseToEdit(null)}
        onSuccess={(updatedEx) => {
          setExercises((prev) =>
            prev.map((e) => (e.id === updatedEx.id ? updatedEx : e))
          );
        }}
      />
    </div>
  );
}
