'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';
import { STANDARD_MUSCLE_GROUPS, StandardMuscleGroup } from '@/lib/constants/muscleGroups';

interface DraftExercise {
  id?: string;
  exercise_id: string;
  custom_name: string;
  notes: string;
  video_url: string | null;
  gif_url: string | null;
  image_url: string | null;
  image_urls?: string[];
  muscle_group: string;
  sets: SetDraft[];
}

interface DraftDay {
  id?: string;
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

export default function EditRoutinePage() {
  const params = useParams();
  const routineId = params.id as string;
  const router = useRouter();
  const supabase = createClient();
  const { toStandardKg } = useUnit();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(true);
  const [assignedClientId, setAssignedClientId] = useState<string | null>(null);
  const [assignedClientName, setAssignedClientName] = useState<string | null>(null);

  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectorTargetDayIndex, setSelectorTargetDayIndex] = useState<number | null>(null);
  const [mediaTarget, setMediaTarget] = useState<{ dayIdx: number; exIdx: number } | null>(null);
  const [mediaUploadLoading, setMediaUploadLoading] = useState(false);
  const [days, setDays] = useState<DraftDay[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: exercisesData } = await supabase
        .from('exercises')
        .select('*')
        .order('name', { ascending: true });
      setAvailableExercises(exercisesData || []);

      const { data: routineData, error: routineErr } = await supabase
        .from('routines')
        .select('*')
        .eq('id', routineId)
        .single();

      if (routineErr) throw routineErr;
      setTitle(routineData.title);
      setDescription(routineData.description || '');
      setIsTemplate(routineData.is_template);
      if (routineData.client_id) {
        setAssignedClientId(routineData.client_id);
        const { data: clientProf } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', routineData.client_id)
          .single();
        if (clientProf) {
          setAssignedClientName(clientProf.full_name);
        }
      }

      const { data: daysData, error: daysErr } = await supabase
        .from('routine_days')
        .select(`
          id,
          name,
          day_number,
          order_index,
          routine_exercises (
            id,
            exercise_id,
            order_index,
            notes,
            routine_exercise_sets (
              id,
              set_number,
              target_reps,
              target_weight_kg,
              target_rpe,
              rest_seconds
            )
          )
        `)
        .eq('routine_id', routineId)
        .order('order_index', { ascending: true });

      if (daysErr) throw daysErr;

      const formattedDays: DraftDay[] = (daysData || []).map((d: any) => {
        const sortedExercises = (d.routine_exercises || []).sort(
          (a: any, b: any) => a.order_index - b.order_index
        );

        // Detectar grupo muscular asignado o inferirlo del nombre / primer ejercicio
        let detectedMuscle: StandardMuscleGroup = 'Pecho';
        if (d.muscle_group && STANDARD_MUSCLE_GROUPS.some((m) => m.id === d.muscle_group)) {
          detectedMuscle = d.muscle_group;
        } else {
          const found = STANDARD_MUSCLE_GROUPS.find((m) =>
            d.name?.toLowerCase().includes(m.id.toLowerCase()) ||
            m.nameEs.toLowerCase().includes(d.name?.toLowerCase())
          );
          if (found) {
            detectedMuscle = found.id;
          } else if (sortedExercises.length > 0) {
            const firstEx = (exercisesData || []).find((e) => e.id === sortedExercises[0].exercise_id);
            const exMuscle = STANDARD_MUSCLE_GROUPS.find((m) =>
              firstEx?.muscle_group?.toLowerCase().includes(m.id.toLowerCase())
            );
            if (exMuscle) detectedMuscle = exMuscle.id;
          }
        }

        return {
          id: d.id,
          name: d.name,
          muscle_group: detectedMuscle,
          day_number: d.day_number,
          exercises: sortedExercises.map((rx: any) => {
            const sortedSets = (rx.routine_exercise_sets || []).sort(
              (a: any, b: any) => a.set_number - b.set_number
            );

            // Si las notas guardaban un nombre personalizado entre corchetes [Nombre] notas o metadatos de superset
            let customName = '';
            let rawNotes = rx.notes || '';
            let supersetMap: Record<number, any> = {};
            if (rawNotes.includes('[SUPERSET_CONFIG:')) {
              try {
                const matchSS = rawNotes.match(/\[SUPERSET_CONFIG:(.*?)\]/);
                if (matchSS && matchSS[1]) {
                  const list = JSON.parse(matchSS[1]);
                  list.forEach((item: any) => {
                    supersetMap[item.set_number] = item;
                  });
                }
              } catch (e) {}
              rawNotes = rawNotes.replace(/\[SUPERSET_CONFIG:.*?\]/g, '').trim();
            }

            let parsedNotes = rawNotes;
            const match = parsedNotes.match(/^\[(.*?)\]\s*(.*)$/);
            if (match) {
              customName = match[1];
              parsedNotes = match[2];
            }

            const exInfo = (exercisesData || []).find((e) => e.id === rx.exercise_id)
              || (customName ? (exercisesData || []).find((e) => e.name.toLowerCase() === customName.toLowerCase()) : null);

            if (!customName) {
              customName = exInfo?.name || 'Ejercicio';
            }

            const imgs: string[] = exInfo?.image_urls && exInfo.image_urls.length > 0
              ? exInfo.image_urls
              : (exInfo?.gif_url ? [exInfo.gif_url] : []);

            return {
              id: rx.id,
              exercise_id: rx.exercise_id,
              custom_name: customName,
              muscle_group: exInfo?.muscle_group || 'General',
              notes: parsedNotes,
              video_url: exInfo?.video_url || null,
              gif_url: exInfo?.gif_url || null,
              image_url: imgs[0] || null,
              image_urls: imgs,
              sets: sortedSets.map((s: any) => {
                const ss = supersetMap[s.set_number];
                const kg = s.target_weight_kg || 0;
                const lbs = Math.round(kg * LBS_PER_KG);
                return {
                  id: s.id,
                  set_number: s.set_number,
                  target_reps: s.target_reps,
                  target_weight_kg: kg,
                  target_weight_lbs: lbs,
                  target_rpe: s.target_rpe || 8,
                  rest_seconds: s.rest_seconds || 90,
                  is_superset: ss ? !!ss.is_superset : false,
                  superset_count: ss ? ss.superset_count : undefined,
                  superset_reps: ss ? ss.superset_reps : undefined,
                  superset_weights_kg: ss ? ss.superset_weights_kg : undefined,
                };
              }),
            };
          }),
        };
      });

      setDays(
        formattedDays.length > 0
          ? formattedDays
          : [{ name: 'Pecho', muscle_group: 'Pecho', day_number: 1, exercises: [] }]
      );
    } catch (err: any) {
      console.error('Error al cargar rutina para editar:', err);
      setErrorMsg(err.message || 'No se pudo cargar la rutina.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (routineId) {
      loadData();
    }
  }, [routineId]);

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

  const handleSelectExerciseForDay = (exerciseId: string) => {
    if (selectorTargetDayIndex === null || !exerciseId) return;
    const found = availableExercises.find((e) => e.id === exerciseId);

    const defaultKg = 20;
    const defaultLbs = Math.round(defaultKg * LBS_PER_KG);

    const imgs: string[] = found?.image_urls && found.image_urls.length > 0
      ? found.image_urls
      : (found?.gif_url ? [found.gif_url] : []);

    const updated = [...days];
    updated[selectorTargetDayIndex].exercises.push({
      exercise_id: exerciseId,
      custom_name: found ? found.name : 'Ejercicio',
      muscle_group: found ? found.muscle_group : 'General',
      notes: '',
      video_url: found?.video_url || null,
      gif_url: found?.gif_url || null,
      image_url: imgs[0] || null,
      image_urls: imgs,
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

  const handleExerciseNameChange = (dayIdx: number, exIdx: number, newName: string) => {
    const updated = [...days];
    updated[dayIdx].exercises[exIdx].custom_name = newName;
    setDays(updated);
  };

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

      if (type === 'video') {
        ex.video_url = publicUrl;
      } else if (type === 'gif') {
        ex.gif_url = publicUrl;
      } else {
        ex.image_url = publicUrl;
        if (!ex.image_urls) ex.image_urls = [];
        if (!ex.image_urls.includes(publicUrl)) {
          ex.image_urls.push(publicUrl);
        }
      }

      setDays(updated);
      await syncExerciseMediaToDatabase(ex.exercise_id, ex.custom_name, ex.muscle_group, ex.notes, ex.image_urls || [], ex.gif_url, ex.video_url);
    } catch (err: any) {
      alert(`Error al subir archivo: ${err.message}`);
    } finally {
      setMediaUploadLoading(false);
      setMediaTarget(null);
    }
  };

  const syncExerciseMediaToDatabase = async (exerciseId: string, customName: string, muscleGroup: string, notes: string, imageUrls: string[], gifUrl: string | null, videoUrl: string | null) => {
    if (!exerciseId) return;
    try {
      await fetch('/api/admin/exercises/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exerciseId,
          name: customName,
          muscle_group: muscleGroup,
          description: notes || null,
          image_urls: imageUrls,
          gif_url: gifUrl,
          video_url: videoUrl,
        }),
      });
    } catch (err) {
      console.error('Error al sincronizar multimedia de ejercicio con base de datos:', err);
    }
  };

  const handleDeleteImageFromExercise = async (dayIdx: number, exIdx: number, imgIdx: number) => {
    if (!confirm('¿Seguro que deseas eliminar esta foto del ejercicio? Se quitará de la rutina y del catálogo general.')) return;

    const updated = [...days];
    const ex = updated[dayIdx].exercises[exIdx];
    const currentImgs = Array.from(new Set(((ex.image_urls && ex.image_urls.length > 0) ? ex.image_urls : (ex.image_url ? [ex.image_url] : [])).filter(Boolean)));

    currentImgs.splice(imgIdx, 1);
    ex.image_urls = currentImgs;
    ex.image_url = currentImgs[0] || null;
    setDays(updated);

    await syncExerciseMediaToDatabase(ex.exercise_id, ex.custom_name, ex.muscle_group, ex.notes, currentImgs, ex.gif_url, ex.video_url);
  };

  const handleDeleteGifFromExercise = async (dayIdx: number, exIdx: number) => {
    if (!confirm('¿Seguro que deseas eliminar la animación GIF de este ejercicio? Se quitará de la rutina y del catálogo general.')) return;

    const updated = [...days];
    const ex = updated[dayIdx].exercises[exIdx];
    ex.gif_url = null;
    setDays(updated);

    await syncExerciseMediaToDatabase(ex.exercise_id, ex.custom_name, ex.muscle_group, ex.notes, ex.image_urls || [], null, ex.video_url);
  };

  const handleDeleteVideoFromExercise = async (dayIdx: number, exIdx: number) => {
    if (!confirm('¿Seguro que deseas eliminar el video demostrativo de este ejercicio?')) return;

    const updated = [...days];
    const ex = updated[dayIdx].exercises[exIdx];
    ex.video_url = null;
    setDays(updated);

    await syncExerciseMediaToDatabase(ex.exercise_id, ex.custom_name, ex.muscle_group, ex.notes, ex.image_urls || [], ex.gif_url, null);
  };

  const handleClearAllPhotos = async (dayIdx: number, exIdx: number) => {
    if (!confirm('¿Seguro que deseas eliminar todas las fotos de este ejercicio?')) return;

    const updated = [...days];
    const ex = updated[dayIdx].exercises[exIdx];
    ex.image_urls = [];
    ex.image_url = null;
    setDays(updated);

    await syncExerciseMediaToDatabase(ex.exercise_id, ex.custom_name, ex.muscle_group, ex.notes, [], ex.gif_url, ex.video_url);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título de la rutina es obligatorio.');
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      // 1. Actualizar metadatos de la rutina (sin 'muscle_group' ya que no pertenece a la tabla routines)
      const { error: routineUpdateErr } = await supabase
        .from('routines')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          is_template: isTemplate,
          updated_at: new Date().toISOString(),
        })
        .eq('id', routineId);

      if (routineUpdateErr) throw routineUpdateErr;

      // 2. Cargar días existentes de la rutina ordenados
      const { data: existingDays } = await supabase
        .from('routine_days')
        .select('id, order_index')
        .eq('routine_id', routineId)
        .order('order_index', { ascending: true });

      const existingDayList = existingDays || [];
      const existingDayIds = new Set(existingDayList.map((d) => d.id));
      const keptDayIds = new Set<string>();

      // Paso anti-colisión: desplazar temporalmente los order_index existentes a valores negativos
      // para evitar colisiones con el constraint unique "uq_routine_day_order" (routine_id, order_index)
      for (const [i, ed] of existingDayList.entries()) {
        await supabase
          .from('routine_days')
          .update({ order_index: -1000 - i })
          .eq('id', ed.id);
      }

      for (const [dayIdx, day] of days.entries()) {
        const dayPayload: any = {
          routine_id: routineId,
          name: day.name,
          day_number: day.day_number,
          order_index: dayIdx,
          updated_at: new Date().toISOString(),
        };

        // Identificar día existente: por day.id si existe, o por coincidencia posicional en existingDayList
        let dayId = day.id;
        if (!dayId && existingDayList[dayIdx]) {
          dayId = existingDayList[dayIdx].id;
        }

        if (dayId && existingDayIds.has(dayId)) {
          const { error: dUpdateErr } = await supabase
            .from('routine_days')
            .update(dayPayload)
            .eq('id', dayId);
          if (dUpdateErr) throw dUpdateErr;
          keptDayIds.add(dayId);
        } else {
          const { data: newDay, error: dInsertErr } = await supabase
            .from('routine_days')
            .insert(dayPayload)
            .select()
            .single();
          if (dInsertErr || !newDay) throw dInsertErr || new Error('Error al crear día');
          dayId = newDay.id;
          keptDayIds.add(newDay.id);
        }

        // Obtener ejercicios existentes de este día ordenados
        const { data: existingRx } = await supabase
          .from('routine_exercises')
          .select('id, order_index, exercise_id')
          .eq('routine_day_id', dayId)
          .order('order_index', { ascending: true });

        const existingRxList = existingRx || [];
        const existingRxIds = new Set(existingRxList.map((r) => r.id));
        const keptRxIds = new Set<string>();

        // Paso anti-colisión: desplazar temporalmente order_index de ejercicios existentes
        // para evitar colisión con "uq_routine_exercise_order" (routine_day_id, order_index)
        for (const [i, erx] of existingRxList.entries()) {
          await supabase
            .from('routine_exercises')
            .update({ order_index: -1000 - i })
            .eq('id', erx.id);
        }

        for (const [exIdx, ex] of day.exercises.entries()) {
          // Extraer metadatos de superset / drop-set para persistir en notes
          const supersetMeta = (ex.sets || [])
            .filter((s: any) => s.is_superset)
            .map((s: any, idx: number) => ({
              set_number: s.set_number || idx + 1,
              is_superset: true,
              superset_count: s.superset_count || (s.superset_reps ? s.superset_reps.length : 3),
              superset_reps: s.superset_reps || [6, 6, 6],
              superset_weights_kg: s.superset_weights_kg || [
                s.target_weight_kg || 40,
                Math.round((s.target_weight_kg || 40) * 0.75),
                Math.round((s.target_weight_kg || 40) * 0.5),
              ],
            }));

          let cleanNotes = (ex.notes || '').replace(/\[SUPERSET_CONFIG:.*?\]/g, '').trim();
          let combinedNotes = cleanNotes;
          if (supersetMeta.length > 0) {
            const metaStr = `[SUPERSET_CONFIG:${JSON.stringify(supersetMeta)}]`;
            combinedNotes = combinedNotes ? `${combinedNotes} ${metaStr}` : metaStr;
          }

          const rxPayload = {
            routine_day_id: dayId,
            exercise_id: ex.exercise_id,
            order_index: exIdx,
            notes: combinedNotes ? `[${ex.custom_name}] ${combinedNotes}` : ex.custom_name,
          };

          // Identificar ejercicio existente: por ex.id, o por coincidencia en existingRxList
          let rxId = ex.id;
          if (!rxId && existingRxList[exIdx]) {
            rxId = existingRxList[exIdx].id;
          }

          if (rxId && existingRxIds.has(rxId)) {
            const { error: rxUpdateErr } = await supabase
              .from('routine_exercises')
              .update(rxPayload)
              .eq('id', rxId);
            if (rxUpdateErr) throw rxUpdateErr;
            keptRxIds.add(rxId);
          } else {
            const { data: newRx, error: rxInsertErr } = await supabase
              .from('routine_exercises')
              .insert(rxPayload)
              .select()
              .single();
            if (rxInsertErr || !newRx) throw rxInsertErr || new Error('Error al registrar ejercicio');
            rxId = newRx.id;
            keptRxIds.add(newRx.id);
          }

          // Obtener series existentes para este ejercicio ordenadas
          const { data: existingSets } = await supabase
            .from('routine_exercise_sets')
            .select('id, set_number')
            .eq('routine_exercise_id', rxId)
            .order('set_number', { ascending: true });

          const existingSetList = existingSets || [];
          const existingSetIds = new Set(existingSetList.map((s) => s.id));
          const keptSetIds = new Set<string>();

          // Paso anti-colisión: desplazar temporalmente set_number de series existentes
          // para evitar colisión con "uq_routine_set_number" (routine_exercise_id, set_number)
          for (const [i, est] of existingSetList.entries()) {
            await supabase
              .from('routine_exercise_sets')
              .update({ set_number: -1000 - i })
              .eq('id', est.id);
          }

          for (const [sIdx, s] of ex.sets.entries()) {
            const setPayload = {
              routine_exercise_id: rxId,
              set_number: s.set_number || sIdx + 1,
              target_reps: s.target_reps,
              target_weight_kg: s.target_weight_kg,
              target_rpe: s.target_rpe,
              rest_seconds: s.rest_seconds,
            };

            // Identificar serie existente: por s.id, o por coincidencia en existingSetList
            let sId = s.id;
            if (!sId && existingSetList[sIdx]) {
              sId = existingSetList[sIdx].id;
            }

            if (sId && existingSetIds.has(sId)) {
              const { error: sUpdateErr } = await supabase
                .from('routine_exercise_sets')
                .update(setPayload)
                .eq('id', sId);
              if (sUpdateErr) throw sUpdateErr;
              keptSetIds.add(sId);
            } else {
              const { data: newSet, error: sInsertErr } = await supabase
                .from('routine_exercise_sets')
                .insert(setPayload)
                .select()
                .single();
              if (sInsertErr || !newSet) throw sInsertErr || new Error('Error al registrar serie');
              keptSetIds.add(newSet.id);
            }
          }

          // Eliminar series eliminadas en este ejercicio
          const setsToDelete = Array.from(existingSetIds).filter((id) => !keptSetIds.has(id));
          if (setsToDelete.length > 0) {
            await supabase.from('routine_exercise_sets').delete().in('id', setsToDelete);
          }
        }

        // Eliminar ejercicios retirados de este día
        const rxToDelete = Array.from(existingRxIds).filter((id) => !keptRxIds.has(id));
        if (rxToDelete.length > 0) {
          await supabase.from('routine_exercises').delete().in('id', rxToDelete);
        }
      }

      // Eliminar días eliminados de esta rutina
      const daysToDelete = Array.from(existingDayIds).filter((id) => !keptDayIds.has(id));
      if (daysToDelete.length > 0) {
        await supabase.from('routine_days').delete().in('id', daysToDelete);
      }

      if (assignedClientId) {
        router.push(`/admin/clients/${assignedClientId}`);
      } else {
        router.push('/admin/routines');
      }
    } catch (err: any) {
      console.error('Error al actualizar rutina:', err);
      setErrorMsg(err.message || 'Error al guardar los cambios de la rutina.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-500 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs">Cargando editor de rutina...</span>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={handleSave} className="space-y-6 max-w-5xl pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link
            href={assignedClientId ? `/admin/clients/${assignedClientId}` : '/admin/routines'}
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-xl font-black text-white">Editar Rutina</h2>
              {assignedClientName && (
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700/60 text-emerald-300 text-xs font-bold">
                  Alumno: {assignedClientName}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400">
              Personaliza nombres, multimedia, notas y pesos en KG y LBS simultáneos.
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
              Guardando Cambios...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-1.5" />
              Guardar Cambios
            </>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
          {errorMsg}
        </div>
      )}

      {/* Routine Metadata */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4 shadow-lg">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Título del Programa / Rutina *
            </label>
            <input
              type="text"
              required
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
            {/* Header del grupo muscular */}
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
                  title="Duplicar grupo muscular"
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

            {/* Ejercicios del grupo muscular */}
            <div className="space-y-4">
              {day.exercises.length === 0 ? (
                <div className="py-6 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500">
                  No hay ejercicios en este grupo muscular aún.
                </div>
              ) : (
                day.exercises.map((ex, exIdx) => {
                  return (
                    <div
                      key={exIdx}
                      className="bg-gray-950 border border-gray-800 rounded-xl p-4 space-y-3.5 shadow-sm"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center space-x-2 flex-1">
                          <Dumbbell className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          
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

                        <div className="flex items-center space-x-2">
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
                              title="Quitar ejercicio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Guía de Ejecución Técnica (1 o 2 imágenes de inicio y contracción) */}
                      {((ex.image_urls && ex.image_urls.length > 0) || ex.image_url || ex.gif_url) ? (
                        <div className="bg-gray-900/60 border border-gray-800/80 rounded-xl p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">
                                Fotos de Ejecución Técnica
                              </span>
                              {(ex.image_urls && ex.image_urls.length > 1) && (
                                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 border border-emerald-800/50 px-2 py-0.5 rounded-full">
                                  2 Fases (Inicio & Contracción)
                                </span>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => setMediaTarget({ dayIdx, exIdx })}
                              className="text-[11px] text-gray-400 hover:text-emerald-400 transition flex items-center gap-1 font-semibold hover:underline"
                            >
                              <UploadCloud className="w-3 h-3" />
                              Cambiar multimedia
                            </button>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {(() => {
                              const displayImages = Array.from(new Set(((ex.image_urls && ex.image_urls.length > 0) ? ex.image_urls : (ex.image_url ? [ex.image_url] : [])).filter(Boolean)));
                              const isRealGif = Boolean(ex.gif_url && typeof ex.gif_url === 'string' && ex.gif_url.toLowerCase().includes('.gif') && !displayImages.includes(ex.gif_url));
                              const finalImages = displayImages.length > 0 ? displayImages : (!isRealGif && ex.gif_url ? [ex.gif_url] : []);

                              return (
                                <>
                                  {/* Mostrar las imágenes de ejecución (Fase 1 y Fase 2 sin duplicados) */}
                                  {finalImages.map((imgUrl, imgIdx) => (
                                    <div key={imgIdx} className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 aspect-[4/3] group shadow-inner">
                                      <img
                                        src={imgUrl}
                                        alt={`${ex.custom_name} - Fase ${imgIdx + 1}`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                      {/* Botón eliminar esta foto (Admin) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteImageFromExercise(dayIdx, exIdx, imgIdx);
                                        }}
                                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-md transition opacity-80 group-hover:opacity-100 flex items-center justify-center z-10"
                                        title="Eliminar esta foto del ejercicio"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <span className="absolute bottom-1.5 left-1.5 right-1.5 text-[9px] font-black px-2 py-0.5 rounded bg-gray-950/90 text-emerald-300 border border-emerald-800/50 backdrop-blur truncate">
                                        {imgIdx === 0 ? '1. Fase Inicial / Descenso' : '2. Fase Final / Contracción'}
                                      </span>
                                    </div>
                                  ))}

                                  {/* Si hay un GIF animado real y no es duplicado */}
                                  {isRealGif && (
                                    <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 aspect-[4/3] group shadow-inner">
                                      <img
                                        src={ex.gif_url!}
                                        alt={`${ex.custom_name} Animación`}
                                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                        loading="lazy"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

                                      {/* Botón eliminar GIF (Admin) */}
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteGifFromExercise(dayIdx, exIdx);
                                        }}
                                        className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-md transition opacity-80 group-hover:opacity-100 flex items-center justify-center z-10"
                                        title="Eliminar animación GIF del ejercicio"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>

                                      <span className="absolute bottom-1.5 left-1.5 text-[9px] font-black px-2 py-0.5 rounded bg-gray-950/90 text-amber-300 border border-amber-800/50 backdrop-blur">
                                        GIF Dinámico
                                      </span>
                                    </div>
                                  )}
                                </>
                              );
                            })()}

                            {/* Si hay Video */}
                            {ex.video_url && (
                              <div className="relative rounded-xl overflow-hidden border border-gray-800 bg-gray-950 aspect-[4/3] flex flex-col items-center justify-center p-2 text-center group">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteVideoFromExercise(dayIdx, exIdx);
                                  }}
                                  className="absolute top-1.5 right-1.5 p-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg shadow-md transition opacity-80 group-hover:opacity-100 flex items-center justify-center z-10"
                                  title="Eliminar video del ejercicio"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                                <Film className="w-6 h-6 text-emerald-400 mb-1 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] text-gray-200 font-bold">Video demostrativo</span>
                                <a
                                  href={ex.video_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[9px] text-emerald-400 hover:text-emerald-300 underline mt-1"
                                >
                                  Reproducir video
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between p-3 bg-gray-900/30 border border-dashed border-gray-800 rounded-xl">
                          <div className="flex items-center gap-2.5 text-gray-500 text-xs">
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                            <span>Sin fotos de ejecución asignadas</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setMediaTarget({ dayIdx, exIdx })}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1.5 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-lg"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Subir fotos de ejecución (1 o 2 fotos)
                          </button>
                        </div>
                      )}

                      {/* Indicaciones con chips rápidos */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-semibold text-gray-400 flex items-center">
                            <MessageSquare className="w-3 h-3 mr-1 text-emerald-400" />
                            Comentarios e Indicaciones Técnicas
                          </label>
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

                      {/* Series con autoconversión simultánea KG / LBS */}
                      <ExerciseSetEditor
                        sets={ex.sets}
                        onChange={(newSets) =>
                          handleSetsChange(dayIdx, exIdx, newSets)
                        }
                      />
                    </div>
                  );
                })
              )}

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setSelectorTargetDayIndex(dayIdx)}
                  className="w-full py-2.5 border border-dashed border-gray-800 hover:border-emerald-500/60 rounded-xl text-xs font-bold text-gray-400 hover:text-emerald-400 bg-gray-950/40 hover:bg-emerald-950/20 transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Seleccionar o Crear Ejercicio para esta Rutina</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {mediaTarget && (() => {
        const curDay = days[mediaTarget.dayIdx];
        const curEx = curDay?.exercises[mediaTarget.exIdx];
        if (!curEx) return null;

        const curImages = Array.from(new Set(((curEx.image_urls && curEx.image_urls.length > 0) ? curEx.image_urls : (curEx.image_url ? [curEx.image_url] : [])).filter(Boolean)));
        const hasGif = Boolean(curEx.gif_url && curEx.gif_url.toLowerCase().includes('.gif'));

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-3 border-b border-gray-800">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center">
                    <UploadCloud className="w-4 h-4 mr-2 text-emerald-400" />
                    Gestión Multimedia de Ejercicio
                  </h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    {curEx.custom_name}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setMediaTarget(null)}
                  className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
                >
                  ✕
                </button>
              </div>

              {/* Multimedia Actual con botones de eliminación */}
              {(curImages.length > 0 || hasGif || curEx.video_url) ? (
                <div className="space-y-2.5 p-3 bg-gray-950/80 border border-gray-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
                      Multimedia Actual del Ejercicio
                    </span>
                    {curImages.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleClearAllPhotos(mediaTarget.dayIdx, mediaTarget.exIdx)}
                        className="text-[10px] text-red-400 hover:text-red-300 font-semibold hover:underline flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar todas las fotos
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                    {curImages.map((img, iIdx) => (
                      <div key={iIdx} className="relative aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-900 group">
                        <img src={img} alt={`Foto ${iIdx + 1}`} className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/80 text-emerald-300 px-1 py-0.5 rounded">
                          Fase {iIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteImageFromExercise(mediaTarget.dayIdx, mediaTarget.exIdx, iIdx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded shadow text-[9px] flex items-center gap-0.5"
                          title="Eliminar esta foto"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {hasGif && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-amber-800/60 bg-gray-900 group">
                        <img src={curEx.gif_url!} alt="GIF" className="w-full h-full object-cover" />
                        <span className="absolute bottom-1 left-1 text-[8px] font-bold bg-black/80 text-amber-300 px-1 py-0.5 rounded">
                          GIF
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteGifFromExercise(mediaTarget.dayIdx, mediaTarget.exIdx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded shadow text-[9px] flex items-center gap-0.5"
                          title="Eliminar animación GIF"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    {curEx.video_url && (
                      <div className="relative aspect-video rounded-lg overflow-hidden border border-gray-800 bg-gray-900 flex flex-col items-center justify-center p-1 text-center">
                        <Film className="w-4 h-4 text-emerald-400 mb-0.5" />
                        <span className="text-[9px] text-gray-300 truncate max-w-[80px]">Video</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteVideoFromExercise(mediaTarget.dayIdx, mediaTarget.exIdx)}
                          className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-500 text-white rounded shadow text-[9px]"
                          title="Eliminar video"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-gray-950/60 border border-dashed border-gray-800 rounded-xl text-center text-xs text-gray-500">
                  Este ejercicio no tiene fotos ni GIF asignados actualmente.
                </div>
              )}

              {/* Sección Subir o Reemplazar */}
              <div className="space-y-3 text-xs pt-1">
                <span className="text-[11px] font-bold text-gray-300 uppercase tracking-wider block">
                  Subir o Reemplazar Multimedia
                </span>

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
                    className="w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
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
                    className="w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
                  />
                </div>

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
                    className="w-full file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-gray-800 file:text-emerald-400 cursor-pointer"
                  />
                </div>
              </div>

              {mediaUploadLoading && (
                <div className="py-2 text-xs text-emerald-400 flex items-center justify-center animate-pulse font-medium">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Subiendo archivo al almacenamiento y actualizando catálogo...
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
        );
      })()}

      <ExerciseSelectorModal
        isOpen={selectorTargetDayIndex !== null}
        onClose={() => setSelectorTargetDayIndex(null)}
        exercises={availableExercises}
        initialMuscleGroup={selectorTargetDayIndex !== null ? days[selectorTargetDayIndex]?.muscle_group : undefined}
        onSelectExercise={handleSelectExerciseForDay}
        onExerciseCreated={(newEx) => {
          setAvailableExercises((prev) => [newEx, ...prev]);
        }}
        onRefreshExercises={loadData}
      />
    </form>
  );
}
