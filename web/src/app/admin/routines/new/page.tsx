'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Exercise } from '@/types/database';
import { useUnit } from '@/context/UnitContext';
import ExerciseSetEditor, { SetDraft } from '@/components/routines/ExerciseSetEditor';
import ExerciseSelectorModal from '@/components/routines/ExerciseSelectorModal';
import { LBS_PER_KG, KG_PER_LB } from '@/lib/utils/units';
import {
  CalendarDays,
  Plus,
  Trash2,
  Dumbbell,
  ArrowLeft,
  Save,
  Loader2,
  Copy,
  ChevronUp,
  ChevronDown,
  Film,
  Image as ImageIcon,
  UploadCloud,
  Play,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { STANDARD_MUSCLE_GROUPS, StandardMuscleGroup } from '@/lib/constants/muscleGroups';

export interface DraftExercise {
  exercise_id: string;
  custom_name: string;
  notes: string;
  video_url: string | null;
  gif_url: string | null;
  image_url: string | null;
  muscle_group: string;
  sets: SetDraft[];
}

export interface DraftDay {
  name: string;
  muscle_group: StandardMuscleGroup;
  day_number: number;
  exercises: DraftExercise[];
}

const QUICK_CUES = [
  'Tempo 3-0-1-0 (bajada lenta)',
  'Pausa de 2s en máxima contracción',
  'Drop-set al fallo en última serie',
  'Codos a 45° respecto al torso',
  'Rango completo de movimiento',
  'Mantener arco y escápulas retraídas',
  '1-2 reps en reserva (RIR 1-2)',
];

function NewRoutineContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const clientId = searchParams.get('clientId') || searchParams.get('client_id');
  const supabase = createClient();
  const { unit, toStandardKg } = useUnit();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(!clientId);
  const [assignedClient, setAssignedClient] = useState<{ id: string; name: string } | null>(null);

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Modal selector de ejercicio
  const [selectorTargetDayIndex, setSelectorTargetDayIndex] = useState<number | null>(null);

  // Estado para adjuntar multimedia a un ejercicio específico
  const [mediaTarget, setMediaTarget] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [mediaUploadLoading, setMediaUploadLoading] = useState(false);

  const [days, setDays] = useState<DraftDay[]>([
    {
      name: 'Pecho',
      muscle_group: 'Pecho',
      day_number: 1,
      exercises: [],
    },
  ]);

  const loadExercises = async () => {
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableExercises((data as Exercise[]) || []);
    } catch (err) {
      console.error('Error al cargar ejercicios:', err);
    } finally {
      setLoadingExercises(false);
    }
  };

  useEffect(() => {
    loadExercises();
    if (clientId) {
      setIsTemplate(false);
      supabase
        .from('profiles')
        .select('id, full_name')
        .eq('id', clientId)
        .single()
        .then(({ data }) => {
          if (data) {
            setAssignedClient({ id: data.id, name: data.full_name });
          }
        });
    }
  }, [clientId]);

  const handleAddDay = () => {
    const nextNumber = days.length + 1;
    const nextMuscle = STANDARD_MUSCLE_GROUPS[(nextNumber - 1) % STANDARD_MUSCLE_GROUPS.length].id;
    setDays([
      ...days,
      {
        name: nextMuscle,
        muscle_group: nextMuscle,
        day_number: nextNumber,
        exercises: [],
      },
    ]);
  };

  const handleDuplicateDay = (dayIndex: number) => {
    const source = days[dayIndex];
    const duplicated: DraftDay = {
      name: `${source.name} (Copia)`,
      muscle_group: source.muscle_group,
      day_number: days.length + 1,
      exercises: source.exercises.map((ex) => ({
        ...ex,
        sets: ex.sets.map((s) => ({ ...s })),
      })),
    };
    setDays([...days, duplicated]);
  };

  const handleMuscleGroupChange = (dayIndex: number, newMuscle: StandardMuscleGroup) => {
    const updated = [...days];
    const oldMuscle = updated[dayIndex].muscle_group;
    updated[dayIndex].muscle_group = newMuscle;
    if (!updated[dayIndex].name || updated[dayIndex].name === oldMuscle) {
      updated[dayIndex].name = newMuscle;
    }
    setDays(updated);
  };

  const handleMoveDay = (index: number, direction: 'up' | 'down') => {
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= days.length) return;

    const updated = [...days];
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    updated.forEach((d, idx) => {
      d.day_number = idx + 1;
    });
    setDays(updated);
  };

  const handleRemoveDay = (dayIndex: number) => {
    setDays(
      days
        .filter((_, i) => i !== dayIndex)
        .map((d, idx) => ({ ...d, day_number: idx + 1 }))
    );
  };

  const handleDayNameChange = (dayIndex: number, newName: string) => {
    const updated = [...days];
    updated[dayIndex].name = newName;
    setDays(updated);
  };

  // Añadir ejercicio con valores por defecto y autoconversión de KG / LBS
  const handleSelectExerciseForDay = (exerciseId: string) => {
    if (selectorTargetDayIndex === null || !exerciseId) return;
    const found = availableExercises.find((e) => e.id === exerciseId);

    const defaultKg = 20;
    const defaultLbs = Math.round(defaultKg * LBS_PER_KG);

    const updated = [...days];
    updated[selectorTargetDayIndex].exercises.push({
      exercise_id: exerciseId,
      custom_name: found ? found.name : 'Nuevo Ejercicio',
      muscle_group: found ? found.muscle_group : 'General',
      notes: '',
      video_url: found?.video_url || null,
      gif_url: found?.gif_url || null,
      image_url: found?.image_urls?.[0] || null,
      sets: [
        {
          set_number: 1,
          target_reps: 10,
          target_weight_kg: defaultKg,
          target_weight_lbs: defaultLbs,
          target_rpe: 8,
          rest_seconds: 90,
        },
        {
          set_number: 2,
          target_reps: 10,
          target_weight_kg: defaultKg,
          target_weight_lbs: defaultLbs,
          target_rpe: 8,
          rest_seconds: 90,
        },
        {
          set_number: 3,
          target_reps: 10,
          target_weight_kg: defaultKg,
          target_weight_lbs: defaultLbs,
          target_rpe: 8.5,
          rest_seconds: 90,
        },
      ],
    });
    setDays(updated);
  };

  // Edición del nombre del ejercicio directamente en la rutina
  const handleExerciseNameChange = (dayIdx: number, exIdx: number, newName: string) => {
    const updated = [...days];
    updated[dayIdx].exercises[exIdx].custom_name = newName;
    setDays(updated);
  };

  // Inserción de indicación rápida (chip)
  const handleAddQuickCue = (dayIdx: number, exIdx: number, cue: string) => {
    const updated = [...days];
    const currentNotes = updated[dayIdx].exercises[exIdx].notes;
    updated[dayIdx].exercises[exIdx].notes = currentNotes
      ? `${currentNotes} • ${cue}`
      : cue;
    setDays(updated);
  };

  const handleMoveExercise = (
    dayIndex: number,
    exIndex: number,
    direction: 'up' | 'down'
  ) => {
    const target = direction === 'up' ? exIndex - 1 : exIndex + 1;
    if (target < 0 || target >= days[dayIndex].exercises.length) return;

    const updated = [...days];
    const temp = updated[dayIndex].exercises[exIndex];
    updated[dayIndex].exercises[exIndex] = updated[dayIndex].exercises[target];
    updated[dayIndex].exercises[target] = temp;
    setDays(updated);
  };

  const handleRemoveExercise = (dayIndex: number, exIndex: number) => {
    const updated = [...days];
    updated[dayIndex].exercises = updated[dayIndex].exercises.filter(
      (_, i) => i !== exIndex
    );
    setDays(updated);
  };

  const handleSetsChange = (
    dayIndex: number,
    exIndex: number,
    newSets: SetDraft[]
  ) => {
    const updated = [...days];
    updated[dayIndex].exercises[exIndex].sets = newSets;
    setDays(updated);
  };

  // Carga directa de multimedia para un ejercicio en la rutina
  const handleUploadMediaForExercise = async (
    file: File,
    type: 'video' | 'gif' | 'image'
  ) => {
    if (!mediaTarget) return;
    setMediaUploadLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'routines');

      const res = await fetch('/api/admin/exercises/upload', {
        method: 'POST',
        body: formData,
      });

      const resData = await res.json();
      if (!res.ok || !resData.url) {
        throw new Error(resData.message || 'Error al subir archivo');
      }

      const publicUrl = resData.url;

      const updated = [...days];
      const ex = updated[mediaTarget.dayIdx].exercises[mediaTarget.exIdx];

      if (type === 'video') ex.video_url = publicUrl;
      else if (type === 'gif') ex.gif_url = publicUrl;
      else ex.image_url = publicUrl;

      setDays(updated);
    } catch (err: any) {
      alert(`Error al subir archivo: ${err.message}`);
    } finally {
      setMediaUploadLoading(false);
      setMediaTarget(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título de la rutina es obligatorio.');
      return;
    }

    if (days.length === 0 || days.some((d) => d.exercises.length === 0)) {
      setErrorMsg('Cada día debe contener al menos un ejercicio prescrito.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Insertar rutina
      const primaryMuscleGroup = days[0]?.muscle_group || null;
      const { data: routineData, error: routineErr } = await supabase
        .from('routines')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          is_template: clientId ? false : isTemplate,
          is_active: true,
          client_id: clientId || null,
          muscle_group: primaryMuscleGroup,
        })
        .select()
        .single();

      if (routineErr) throw routineErr;

      // 2. Insertar días
      for (const [dayIdx, day] of days.entries()) {
        const dayPayload: any = {
          routine_id: routineData.id,
          name: day.name,
          muscle_group: day.muscle_group,
          day_number: day.day_number,
          order_index: dayIdx,
        };

        let { data: dayData, error: dayErr } = await supabase
          .from('routine_days')
          .insert(dayPayload)
          .select()
          .single();

        if (dayErr && dayErr.message?.includes('muscle_group')) {
          delete dayPayload.muscle_group;
          const fallbackRes = await supabase.from('routine_days').insert(dayPayload).select().single();
          dayData = fallbackRes.data;
          dayErr = fallbackRes.error;
        }

        if (dayErr) throw dayErr;

        // 3. Insertar ejercicios del día
        for (const [exIdx, ex] of day.exercises.entries()) {
          // Si el coach modificó el nombre del ejercicio o agregó multimedia específica, actualizar o persistir
          let targetExerciseId = ex.exercise_id;

          const { data: routineExData, error: exErr } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: dayData.id,
              exercise_id: targetExerciseId,
              order_index: exIdx,
              notes: ex.notes ? `[${ex.custom_name}] ${ex.notes}` : ex.custom_name,
            })
            .select()
            .single();

          if (exErr) throw exErr;

          // 4. Insertar series con peso estándar en KG
          const setsPayload = ex.sets.map((s: any) => ({
            routine_exercise_id: routineExData.id,
            set_number: s.set_number,
            target_reps: s.target_reps,
            target_weight_kg: s.target_weight_kg,
            target_rpe: s.target_rpe,
            rest_seconds: s.rest_seconds,
          }));

          const { error: setsErr } = await supabase
            .from('routine_exercise_sets')
            .insert(setsPayload);

          if (setsErr) throw setsErr;
        }
      }

      if (clientId) {
        router.push(`/admin/clients/${clientId}`);
      } else {
        router.push('/admin/routines');
      }
    } catch (err: any) {
      console.error('Error al guardar rutina:', err);
      setErrorMsg(err.message || 'Error al guardar la rutina completa.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form noValidate onSubmit={handleSubmit} className="space-y-6 max-w-5xl pb-20">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href={clientId ? `/admin/clients/${clientId}` : '/admin/routines'}
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">Diseñador de Rutina Profesional</h2>
              {assignedClient && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                  Para: {assignedClient.name}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Personaliza nombres, multimedia, notas técnicas y pesos en KG y LBS simultáneos.
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Rutina
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Routine Metadata Card */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Título del Programa / Rutina *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Hipertrofia Avanzada 4 Días (Push/Pull/Legs)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex items-end pb-2">
            <label className="flex items-center space-x-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isTemplate}
                onChange={(e) => setIsTemplate(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-500 bg-gray-950 border-gray-800 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-gray-300">
                Guardar como Plantilla Maestra
              </span>
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Descripción / Enfoque del Mesociclo
          </label>
          <textarea
            rows={2}
            placeholder="Objetivo de progresión, recomendaciones de descarga o descansos semanales..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Days / Splits List */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white flex items-center">
              <CalendarDays className="w-5 h-5 mr-2 text-emerald-400" />
              Grupos Musculares y Divisiones (Splits)
            </h3>
            <p className="text-xs text-gray-400 mt-0.5">
              Cada grupo muscular funciona como una rutina independiente con contador de finalizaciones para el alumno.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddDay}
            className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center bg-emerald-950/40 border border-emerald-800/40 px-3 py-1.5 rounded-xl transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1" />
            + Agregar Grupo Muscular
          </button>
        </div>

        {days.map((day, dayIdx) => (
          <div
            key={dayIdx}
            className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4 shadow-md"
          >
            {/* Day / Muscle Group Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <div className="flex items-center space-x-2.5 flex-1 max-w-xl">
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold border border-emerald-500/20 whitespace-nowrap">
                  RUTINA {day.day_number}
                </span>

                {/* Selector Obligatorio de Grupo Muscular */}
                <div className="flex items-center space-x-1.5">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider hidden sm:inline">
                    Grupo:
                  </span>
                  <select
                    value={day.muscle_group}
                    onChange={(e) => handleMuscleGroupChange(dayIdx, e.target.value as StandardMuscleGroup)}
                    className="bg-gray-950 border border-emerald-500/40 hover:border-emerald-400 focus:border-emerald-400 rounded-xl px-2.5 py-1 text-xs font-bold text-emerald-300 focus:outline-none transition cursor-pointer shadow-inner"
                  >
                    {STANDARD_MUSCLE_GROUPS.map((mg) => (
                      <option key={mg.id} value={mg.id} className="bg-gray-900 text-white font-medium">
                        {mg.nameEs}
                      </option>
                    ))}
                  </select>
                </div>

                <input
                  type="text"
                  value={day.name}
                  onChange={(e) => handleDayNameChange(dayIdx, e.target.value)}
                  className="bg-transparent border-b border-gray-700 hover:border-emerald-500 focus:border-emerald-500 px-1 py-0.5 text-sm font-bold text-white focus:outline-none flex-1 transition ml-1"
                  placeholder="Título o enfoque (ej. Hipertrofia & Fuerza)"
                />
              </div>

              {/* Acciones de Rutina */}
              <div className="flex items-center space-x-1.5">
                <button
                  type="button"
                  onClick={() => handleMoveDay(dayIdx, 'up')}
                  disabled={dayIdx === 0}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 rounded transition"
                  title="Mover rutina hacia arriba"
                >
                  <ChevronUp className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMoveDay(dayIdx, 'down')}
                  disabled={dayIdx === days.length - 1}
                  className="p-1 text-gray-500 hover:text-white disabled:opacity-30 rounded transition"
                  title="Mover rutina hacia abajo"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDuplicateDay(dayIdx)}
                  className="p-1 text-gray-500 hover:text-emerald-400 rounded transition"
                  title="Duplicar grupo muscular completo"
                >
                  <Copy className="w-4 h-4" />
                </button>
                {days.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDay(dayIdx)}
                    className="p-1 text-gray-500 hover:text-red-400 rounded transition"
                    title="Eliminar grupo muscular"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Exercises in this Day */}
            <div className="space-y-4">
              {day.exercises.length === 0 ? (
                <div className="py-6 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500">
                  No hay ejercicios asignados a este grupo muscular aún.
                </div>
              ) : (
                day.exercises.map((ex, exIdx) => {
                  return (
                    <div
                      key={exIdx}
                      className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3.5 shadow-sm"
                    >
                      {/* Fila 1: Nombre editable del ejercicio + Badge Músculo + Multimedia + Acciones */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2 flex-1">
                          <Dumbbell className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          
                          {/* NOMBRE EDITABLE DEL EJERCICIO DIRECTO EN LA RUTINA */}
                          <input
                            type="text"
                            value={ex.custom_name}
                            onChange={(e) =>
                              handleExerciseNameChange(dayIdx, exIdx, e.target.value)
                            }
                            placeholder="Nombre del ejercicio..."
                            className="bg-transparent border-b border-gray-700 hover:border-emerald-500 focus:border-emerald-500 px-1 py-0.5 text-sm font-bold text-white focus:outline-none flex-1 transition"
                          />

                          <span className="text-[10px] text-gray-400 bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800 uppercase font-semibold">
                            {ex.muscle_group}
                          </span>
                        </div>

                        {/* Botón y miniaturas multimedia de este ejercicio */}
                        <div className="flex items-center space-x-2">
                          {/* Miniatura visual si existe */}
                          {ex.video_url ? (
                            <span className="inline-flex items-center text-[10px] bg-emerald-950/80 border border-emerald-800 text-emerald-400 px-2 py-0.5 rounded-lg">
                              <Film className="w-3 h-3 mr-1" /> Video adjunto
                            </span>
                          ) : ex.gif_url ? (
                            <span className="inline-flex items-center text-[10px] bg-amber-950/80 border border-amber-800 text-amber-400 px-2 py-0.5 rounded-lg">
                              GIF adjunto
                            </span>
                          ) : ex.image_url ? (
                            <span className="inline-flex items-center text-[10px] bg-sky-950/80 border border-sky-800 text-sky-400 px-2 py-0.5 rounded-lg">
                              <ImageIcon className="w-3 h-3 mr-1" /> Foto
                            </span>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setMediaTarget({ dayIdx, exIdx })}
                            className="text-xs font-semibold text-gray-400 hover:text-emerald-400 bg-gray-900 hover:bg-gray-850 border border-gray-800 px-2.5 py-1 rounded-lg transition flex items-center"
                            title="Adjuntar o cambiar video/GIF/foto"
                          >
                            <UploadCloud className="w-3.5 h-3.5 mr-1" />
                            Multimedia
                          </button>

                          {/* Reordenar / Eliminar */}
                          <div className="flex items-center space-x-1 border-l border-gray-800 pl-2">
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(dayIdx, exIdx, 'up')}
                              disabled={exIdx === 0}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-30 rounded transition"
                              title="Subir"
                            >
                              <ChevronUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveExercise(dayIdx, exIdx, 'down')}
                              disabled={exIdx === day.exercises.length - 1}
                              className="p-1 text-gray-500 hover:text-white disabled:opacity-30 rounded transition"
                              title="Bajar"
                            >
                              <ChevronDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveExercise(dayIdx, exIdx)}
                              className="p-1 text-gray-500 hover:text-red-400 rounded transition"
                              title="Eliminar ejercicio de la rutina"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Fila 2: Indicaciones y Cues de técnica con atajos rápidos */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-gray-400 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1 text-emerald-400" />
                            Comentarios e Indicaciones Técnicas
                          </label>
                          <span className="text-[10px] text-gray-500">
                            (Atajos rápidos abajo)
                          </span>
                        </div>

                        <textarea
                          rows={2}
                          placeholder="Escribe indicaciones sobre tempo, respiración, pausa o intensidad..."
                          value={ex.notes}
                          onChange={(e) => {
                            const updated = [...days];
                            updated[dayIdx].exercises[exIdx].notes = e.target.value;
                            setDays(updated);
                          }}
                          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition"
                        />

                        {/* Chips de indicaciones rápidas */}
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {QUICK_CUES.map((cue, cIdx) => (
                            <button
                              key={cIdx}
                              type="button"
                              onClick={() => handleAddQuickCue(dayIdx, exIdx, cue)}
                              className="text-[10px] bg-gray-900/90 hover:bg-emerald-950 text-gray-400 hover:text-emerald-300 border border-gray-800 hover:border-emerald-700/50 px-2 py-0.5 rounded-md transition select-none"
                            >
                              + {cue}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Fila 3: Editor de series con autoconversión simultánea KG / LBS */}
                      <ExerciseSetEditor
                        sets={ex.sets}
                        onChange={(newSets) => handleSetsChange(dayIdx, exIdx, newSets)}
                      />
                    </div>
                  );
                })
              )}

              {/* Botón para Añadir Ejercicio con el Selector Visual */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectorTargetDayIndex(dayIdx)}
                  className="w-full py-2.5 border border-dashed border-gray-800 hover:border-emerald-500/60 rounded-xl text-xs font-bold text-gray-400 hover:text-emerald-400 bg-gray-950/40 hover:bg-emerald-950/20 transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Seleccionar o Crear Ejercicio del Catálogo para esta Rutina</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Modal para adjuntar multimedia a un ejercicio en la rutina */}
      {mediaTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-gray-800">
              <h3 className="text-sm font-bold text-white flex items-center">
                <UploadCloud className="w-4 h-4 mr-2 text-emerald-400" />
                Adjuntar Video / GIF / Foto al Ejercicio
              </h3>
              <button
                type="button"
                onClick={() => setMediaTarget(null)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Subir Video Demostrativo (.mp4, .webm)
                </label>
                <input
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadMediaForExercise(e.target.files[0], 'video');
                    }
                  }}
                  className="file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Subir GIF Animado (.gif)
                </label>
                <input
                  type="file"
                  accept="image/gif"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadMediaForExercise(e.target.files[0], 'gif');
                    }
                  }}
                  className="file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-semibold mb-1">
                  Subir Foto / Infografía (.jpg, .png, .webp)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleUploadMediaForExercise(e.target.files[0], 'image');
                    }
                  }}
                  className="file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
                />
              </div>
            </div>

            {mediaUploadLoading && (
              <div className="py-2 text-xs text-emerald-400 flex items-center justify-center animate-pulse font-medium">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Subiendo archivo al almacenamiento...
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setMediaTarget(null)}
                className="px-4 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Selector & Creación Rápida */}
      <ExerciseSelectorModal
        isOpen={selectorTargetDayIndex !== null}
        onClose={() => setSelectorTargetDayIndex(null)}
        exercises={availableExercises}
        initialMuscleGroup={selectorTargetDayIndex !== null ? days[selectorTargetDayIndex]?.muscle_group : undefined}
        onSelectExercise={handleSelectExerciseForDay}
        onExerciseCreated={(newEx) => {
          setAvailableExercises((prev) => [newEx, ...prev]);
        }}
        onRefreshExercises={loadExercises}
      />
    </form>
  );
}

export default function NewRoutinePage() {
  return (
    <React.Suspense
      fallback={
        <div className="h-96 flex flex-col items-center justify-center text-gray-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs">Cargando diseñador de rutina...</span>
        </div>
      }
    >
      <NewRoutineContent />
    </React.Suspense>
  );
}
