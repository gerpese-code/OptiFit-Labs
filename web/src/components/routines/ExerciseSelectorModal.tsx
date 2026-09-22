'use client';

import React, { useState } from 'react';
import { Exercise } from '@/types/database';
import { DEFAULT_EXERCISES } from '@/lib/data/defaultExercises';
import { createClient } from '@/lib/supabase/client';
import {
  X,
  Search,
  Plus,
  Dumbbell,
  Check,
  Sparkles,
  Loader2,
  Film,
  Image as ImageIcon,
  Eye,
  Info,
  ChevronRight,
} from 'lucide-react';
import ExerciseFormModal from '@/components/exercises/ExerciseFormModal';

interface ExerciseSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  exercises: Exercise[];
  onSelectExercise: (exerciseId: string) => void;
  onExerciseCreated: (newExercise: Exercise) => void;
  onRefreshExercises: () => Promise<void>;
  initialMuscleGroup?: string;
}

const MUSCLE_TABS = [
  'Todos',
  'Pecho',
  'Espalda',
  'Hombros',
  'Cuádriceps',
  'Isquiosurales',
  'Glúteos',
  'Bíceps',
  'Tríceps',
  'Core / Abdomen',
  'Pantorrillas',
  'Antebrazos',
  'Cardio',
];

export default function ExerciseSelectorModal({
  isOpen,
  onClose,
  exercises,
  onSelectExercise,
  onExerciseCreated,
  onRefreshExercises,
  initialMuscleGroup,
}: ExerciseSelectorModalProps) {
  const supabase = createClient();

  const [search, setSearch] = useState('');
  const [selectedMuscle, setSelectedMuscle] = useState(initialMuscleGroup || 'Todos');

  React.useEffect(() => {
    if (isOpen) {
      if (initialMuscleGroup && MUSCLE_TABS.some(t => t.toLowerCase().includes(initialMuscleGroup.toLowerCase()) || initialMuscleGroup.toLowerCase().includes(t.toLowerCase()))) {
        const matched = MUSCLE_TABS.find(t => t.toLowerCase().includes(initialMuscleGroup.toLowerCase()) || initialMuscleGroup.toLowerCase().includes(t.toLowerCase()));
        setSelectedMuscle(matched || 'Todos');
      } else {
        setSelectedMuscle('Todos');
      }
    }
  }, [isOpen, initialMuscleGroup]);
  const [isQuickCreateOpen, setIsQuickCreateOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [previewExercise, setPreviewExercise] = useState<Exercise | null>(null);
  const [hoveredExId, setHoveredExId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSeed = async () => {
    if (!confirm('¿Deseas precargar o actualizar el catálogo oficial de más de 110 ejercicios con imágenes técnicas?')) return;
    setSeeding(true);
    try {
      // 1. Obtener ejercicios existentes
      const { data: existing, error: fetchErr } = await supabase.from('exercises').select('id, name');
      if (fetchErr) throw fetchErr;

      const existingMap = new Map((existing || []).map((e: any) => [e.name.toLowerCase().trim(), e.id]));

      const toInsert: any[] = [];
      const toUpdate: { id: string; payload: any }[] = [];

      for (const ex of DEFAULT_EXERCISES) {
        const key = ex.name.toLowerCase().trim();
        const payload = {
          name: ex.name,
          muscle_group: ex.muscle_group,
          description: ex.description,
          video_url: ex.video_url,
          gif_url: ex.gif_url,
          image_urls: ex.image_urls,
          updated_at: new Date().toISOString(),
        };

        if (existingMap.has(key)) {
          toUpdate.push({ id: existingMap.get(key)!, payload });
        } else {
          toInsert.push(payload);
        }
      }

      if (toInsert.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < toInsert.length; i += batchSize) {
          const batch = toInsert.slice(i, i + batchSize);
          const { error: insErr } = await supabase.from('exercises').insert(batch);
          if (insErr) throw insErr;
        }
      }

      for (const item of toUpdate) {
        await supabase.from('exercises').update(item.payload).eq('id', item.id);
      }

      await onRefreshExercises();
      alert(`¡Catálogo actualizado! (${toInsert.length} añadidos, ${toUpdate.length} actualizados con imágenes técnicas).`);
    } catch (err: any) {
      alert(`Error al precargar ejercicios: ${err.message}`);
    } finally {
      setSeeding(false);
    }
  };

  const filtered = exercises.filter((ex) => {
    const matchesSearch =
      ex.name.toLowerCase().includes(search.toLowerCase()) ||
      ex.description?.toLowerCase().includes(search.toLowerCase());
    const matchesMuscle =
      selectedMuscle === 'Todos' || ex.muscle_group === selectedMuscle;
    return matchesSearch && matchesMuscle;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-5 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-950/70 border border-emerald-800/50 rounded-xl text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Seleccionar Ejercicio para la Rutina</span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                  {filtered.length} disponibles
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Elige del catálogo técnico con imágenes de ejecución o crea uno personalizado
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsQuickCreateOpen(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Crear Ejercicio</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="p-4 border-b border-gray-800/80 bg-gray-900/90 space-y-3">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre (ej. press, sentadilla, jalón, curl, peso muerto)..."
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleSeed}
              disabled={seeding}
              className="inline-flex items-center justify-center space-x-1.5 px-3.5 py-2 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded-xl text-xs font-bold transition disabled:opacity-50"
              title="Precargar o actualizar catálogo completo con más de 110 ejercicios oficiales"
            >
              <Sparkles className={`w-3.5 h-3.5 text-emerald-400 ${seeding ? 'animate-spin' : ''}`} />
              <span>{seeding ? 'Actualizando...' : '⚡ Actualizar Catálogo (110+)'}</span>
            </button>
          </div>

          {/* Pestañas de Grupos Musculares */}
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {MUSCLE_TABS.map((muscle) => (
              <button
                key={muscle}
                type="button"
                onClick={() => setSelectedMuscle(muscle)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition font-medium ${
                  selectedMuscle === muscle
                    ? 'bg-emerald-500 text-gray-950 font-black shadow-md shadow-emerald-950/40'
                    : 'bg-gray-950 border border-gray-800 text-gray-400 hover:text-white hover:border-gray-700'
                }`}
              >
                {muscle}
              </button>
            ))}
          </div>
        </div>

        {/* Grilla de Ejercicios */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto bg-gray-900/50">
          {exercises.length === 0 ? (
            <div className="h-64 border border-dashed border-gray-800 rounded-3xl flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Dumbbell className="w-12 h-12 text-gray-600" />
              <h3 className="text-sm font-bold text-white">Catálogo de ejercicios vacío</h3>
              <p className="text-xs text-gray-400 max-w-md leading-relaxed">
                Aún no tienes ejercicios cargados en tu base de datos. Puedes cargar la biblioteca profesional de 110+ ejercicios con imágenes técnicas en 1 clic.
              </p>
              <button
                type="button"
                onClick={handleSeed}
                disabled={seeding}
                className="inline-flex items-center px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-950/40 transition"
              >
                {seeding ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                    Cargando 110+ ejercicios...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1.5" />
                    ⚡ Cargar Catálogo Oficial (110+ Ejercicios)
                  </>
                )}
              </button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-center text-xs text-gray-500 space-y-2">
              <Search className="w-8 h-8 text-gray-600" />
              <p>No se encontraron ejercicios para "{search}".</p>
              <button
                onClick={() => setIsQuickCreateOpen(true)}
                className="text-emerald-400 hover:underline font-bold text-xs"
              >
                + ¿Crear este ejercicio ahora?
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((ex) => {
                const hasImages = ex.image_urls && ex.image_urls.length > 0;
                const isHovered = hoveredExId === ex.id;
                // Si el usuario pasa el mouse por encima, mostramos la imagen 2 (contracción) si existe
                const displayImg = isHovered && hasImages && ex.image_urls.length > 1
                  ? ex.image_urls[1]
                  : (ex.gif_url || (hasImages ? ex.image_urls[0] : null));

                return (
                  <div
                    key={ex.id}
                    onMouseEnter={() => setHoveredExId(ex.id)}
                    onMouseLeave={() => setHoveredExId(null)}
                    className="bg-gray-950 border border-gray-800 hover:border-emerald-600/50 rounded-2xl overflow-hidden flex flex-col justify-between group transition shadow-md hover:shadow-xl hover:shadow-emerald-950/20"
                  >
                    {/* Miniatura de Técnica de Ejecución */}
                    <div className="relative aspect-[16/10] bg-gray-900 border-b border-gray-800/80 overflow-hidden flex items-center justify-center">
                      {displayImg ? (
                        <img
                          src={displayImg}
                          alt={ex.name}
                          loading="lazy"
                          className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-gray-600 p-4">
                          <ImageIcon className="w-8 h-8 mb-1 opacity-50" />
                          <span className="text-[10px]">Sin imagen</span>
                        </div>
                      )}

                      {/* Pill de Grupo Muscular */}
                      <span className="absolute top-2 left-2 text-[10px] font-black text-emerald-300 bg-gray-950/90 backdrop-blur border border-emerald-800/50 px-2 py-0.5 rounded-lg uppercase tracking-wider shadow">
                        {ex.muscle_group}
                      </span>

                      {/* Indicador de 2 fases (Inicio/Fin) */}
                      {hasImages && ex.image_urls.length > 1 && (
                        <span className="absolute bottom-2 left-2 text-[9px] font-bold text-gray-300 bg-gray-950/80 backdrop-blur px-1.5 py-0.5 rounded border border-gray-800">
                          {isHovered ? 'Fase: Contracción' : 'Fase: Inicio (Pasa el cursor)'}
                        </span>
                      )}

                      {/* Botón Flotante para Ver Técnica en Grande */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewExercise(ex);
                        }}
                        className="absolute top-2 right-2 p-1.5 rounded-lg bg-gray-950/80 hover:bg-emerald-600 text-gray-300 hover:text-white border border-gray-800 transition"
                        title="Ver técnica y postura completa"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Contenido de Información */}
                    <div className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-white text-xs group-hover:text-emerald-400 transition line-clamp-1">
                          {ex.name}
                        </h4>
                        <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed mt-1">
                          {ex.description || 'Sin notas descriptivas.'}
                        </p>
                      </div>

                      {/* Acciones */}
                      <div className="mt-2.5 pt-2 border-t border-gray-800/80 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => setPreviewExercise(ex)}
                          className="text-[11px] text-gray-400 hover:text-emerald-400 font-medium flex items-center space-x-1"
                        >
                          <Info className="w-3 h-3" />
                          <span>Detalles</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectExercise(ex.id);
                            onClose();
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-xs font-black rounded-xl shadow transition"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Añadir</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================= */}
      {/* MODAL VISTA PREVIA COMPLETA DE TÉCNICA Y BIOMECÁNICA */}
      {/* ======================================================= */}
      {previewExercise && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2.5 py-0.5 rounded-full">
                  {previewExercise.muscle_group}
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  {previewExercise.name}
                </h3>
              </div>
              <button
                onClick={() => setPreviewExercise(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Secuencia de Imágenes de Ejecución (Inicio y Contracción) */}
            {previewExercise.image_urls && previewExercise.image_urls.length > 0 ? (
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Secuencia Técnica Biomecánica:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                    <div className="relative aspect-[4/3]">
                      <img
                        src={previewExercise.image_urls[0]}
                        alt="Fase Inicial"
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-gray-950/80 backdrop-blur px-2 py-0.5 rounded text-emerald-400 border border-gray-800">
                        1. Posición Inicial (Estiramiento)
                      </span>
                    </div>
                  </div>

                  {previewExercise.image_urls.length > 1 ? (
                    <div className="bg-gray-950 border border-gray-800 rounded-2xl overflow-hidden">
                      <div className="relative aspect-[4/3]">
                        <img
                          src={previewExercise.image_urls[1]}
                          alt="Fase de Contracción"
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute bottom-2 left-2 text-[10px] font-bold bg-gray-950/80 backdrop-blur px-2 py-0.5 rounded text-sky-400 border border-gray-800">
                          2. Punto de Máxima Contracción
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {/* Descripción / Consejos Biomecánicos */}
            <div className="bg-gray-950 border border-gray-800 rounded-2xl p-4 space-y-1.5">
              <span className="text-xs font-bold text-emerald-400 block">
                Puntos Clave y Técnica Correcta:
              </span>
              <p className="text-xs text-gray-300 leading-relaxed">
                {previewExercise.description || 'Sin notas adicionales para este ejercicio.'}
              </p>
            </div>

            {/* Footer con Botón Añadir */}
            <div className="pt-2 flex justify-end space-x-2.5">
              <button
                type="button"
                onClick={() => setPreviewExercise(null)}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Cerrar Vista Previa
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectExercise(previewExercise.id);
                  setPreviewExercise(null);
                  onClose();
                }}
                className="inline-flex items-center space-x-1.5 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Añadir este Ejercicio a la Rutina</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para Crear Ejercicio al vuelo */}
      <ExerciseFormModal
        isOpen={isQuickCreateOpen}
        onClose={() => setIsQuickCreateOpen(false)}
        onSuccess={(newEx) => {
          onExerciseCreated(newEx);
          onSelectExercise(newEx.id);
          setIsQuickCreateOpen(false);
          onClose();
        }}
      />
    </div>
  );
}
