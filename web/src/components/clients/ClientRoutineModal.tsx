'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Routine } from '@/types/database';
import {
  X,
  Dumbbell,
  Calendar,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Search,
  Layers,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Info,
  Check,
  ListChecks,
} from 'lucide-react';
import { formatClientNameWithCode } from '@/lib/utils/clientCode';
import { STANDARD_MUSCLE_GROUPS, StandardMuscleGroup } from '@/lib/constants/muscleGroups';
import Link from 'next/link';

const MUSCLE_ALIASES: Record<string, string[]> = {
  Pecho: ['pecho', 'pectoral', 'pectorales', 'chest'],
  Espalda: ['espalda', 'dorsal', 'dorsales', 'back', 'lats'],
  Cuádriceps: ['cuadriceps', 'cuadricep', 'quads', 'quad', 'pierna'],
  Glúteos: ['gluteos', 'gluteo', 'glutes', 'glute', 'cadera'],
  Isquiosurales: ['isquiosurales', 'isquios', 'isquiotibiales', 'femorales', 'femoral', 'hamstrings', 'hamstring'],
  Hombros: ['hombros', 'hombro', 'deltoides', 'deltoide', 'shoulders', 'shoulder'],
  Bíceps: ['biceps', 'bicep'],
  Tríceps: ['triceps', 'tricep'],
  Core: ['core', 'abs', 'abdominales', 'abdomen', 'abdominal'],
  Pantorrillas: ['pantorrillas', 'pantorrilla', 'gemelos', 'gemelo', 'calves', 'calf'],
  'Cuerpo Completo': ['cuerpo completo', 'full body', 'fullbody', 'total body'],
};

interface RoutineTemplateWithDetails extends Routine {
  routine_days?: {
    id: string;
    name: string;
    day_number: number;
    muscle_group?: string | null;
    routine_exercises?: {
      id: string;
      exercise_id: string;
      exercise?: {
        name: string;
        muscle_group: string;
      } | null;
    }[];
  }[];
}

interface ClientRoutineModalProps {
  client: (Profile & { assignedRoutineTitle?: string | null; clientCode?: string }) | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activeRoutineTitle?: string | null;
}

export default function ClientRoutineModal({
  client,
  isOpen,
  onClose,
  onSuccess,
  activeRoutineTitle,
}: ClientRoutineModalProps) {
  const supabase = createClient();

  const [availableRoutines, setAvailableRoutines] = useState<RoutineTemplateWithDetails[]>([]);
  // Selección múltiple de rutinas
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);

  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingRoutines, setFetchingRoutines] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filtros
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMuscleFilter, setSelectedMuscleFilter] = useState<string>('Todos');

  useEffect(() => {
    if (!isOpen || !client) {
      setSelectedRoutineIds([]);
      return;
    }

    setSelectedRoutineIds([]);
    const fetchRoutines = async () => {
      setFetchingRoutines(true);
      setErrorMsg(null);
      try {
        // Cargar todas las rutinas maestras y plantillas disponibles con sus días y ejercicios
        const { data, error } = await supabase
          .from('routines')
          .select(`
            id,
            title,
            description,
            is_template,
            created_at,
            routine_days (
              id,
              name,
              day_number,
              routine_exercises (
                id,
                exercise_id,
                exercise:exercise_id (name, muscle_group)
              )
            )
          `)
          .is('client_id', null)
          .order('title', { ascending: true });

        if (error) throw error;
        const list = (data as RoutineTemplateWithDetails[]) || [];
        setAvailableRoutines(list);
      } catch (err: any) {
        console.error('Error al cargar rutinas:', err);
        setErrorMsg('No se pudieron obtener las rutinas maestras de la biblioteca.');
      } finally {
        setFetchingRoutines(false);
      }
    };

    fetchRoutines();
  }, [isOpen, client]);

  // Filtrado de rutinas
  const filteredRoutines = useMemo(() => {
    return availableRoutines.filter((r) => {
      // Filtro de texto
      const matchesSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Filtro de grupo muscular
      if (selectedMuscleFilter === 'Todos') return true;

      const aliases = MUSCLE_ALIASES[selectedMuscleFilter] || [
        selectedMuscleFilter.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      ];
      const matchesAny = (text?: string | null) => {
        if (!text) return false;
        const norm = text.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        return aliases.some((a) => norm.includes(a));
      };

      if (matchesAny(r.title)) return true;
      if (matchesAny(r.description)) return true;

      const hasDay = r.routine_days?.some((d) => matchesAny(d.name));
      if (hasDay) return true;

      const hasExercise = r.routine_days?.some((d) =>
        d.routine_exercises?.some((rx) =>
          matchesAny(rx.exercise?.muscle_group) || matchesAny(rx.exercise?.name)
        )
      );
      return !!hasExercise;
    });
  }, [availableRoutines, searchQuery, selectedMuscleFilter]);

  // Rutinas seleccionadas completas
  const selectedRoutines = useMemo(() => {
    return availableRoutines.filter((r) => selectedRoutineIds.includes(r.id));
  }, [availableRoutines, selectedRoutineIds]);

  // Estadísticas globales de las rutinas seleccionadas
  const totalSelectedDays = useMemo(() => {
    return selectedRoutines.reduce((acc, r) => acc + (r.routine_days?.length || 0), 0);
  }, [selectedRoutines]);

  const totalSelectedExercises = useMemo(() => {
    return selectedRoutines.reduce(
      (acc, r) =>
        acc +
        (r.routine_days?.reduce(
          (dAcc, d) => dAcc + (d.routine_exercises?.length || 0),
          0
        ) || 0),
      0
    );
  }, [selectedRoutines]);

  if (!isOpen || !client) return null;

  const toggleRoutineSelection = (id: string) => {
    setSelectedRoutineIds((prev) => {
      const exists = prev.includes(id);
      return exists ? prev.filter((rId) => rId !== id) : [...prev, id];
    });
  };

  const selectAllVisible = () => {
    const visibleIds = filteredRoutines.map((r) => r.id);
    setSelectedRoutineIds((prev) => Array.from(new Set([...prev, ...visibleIds])));
  };

  const deselectAll = () => {
    setSelectedRoutineIds([]);
  };

  const handleRemoveRoutine = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedRoutineIds((prev) => prev.filter((rId) => rId !== id));
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRoutineIds.length === 0) {
      setErrorMsg('Selecciona al menos una rutina para asignar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/routines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          routineIds: selectedRoutineIds,
          startDate,
          replaceExisting,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al asignar las rutinas.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al asignar rutinas:', err);
      setErrorMsg(err.message || 'Error al procesar la asignación de rutinas.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl my-8 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="px-6 py-5 border-b border-gray-800 flex items-center justify-between bg-gray-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-white flex items-center space-x-2">
                <span>Asignar Rutinas a {client.full_name}</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono text-[10px] border border-gray-700">
                  ID: {client.id.slice(0, 8)}...
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Selecciona una o varias Rutinas Maestras para asignarlas juntas a{' '}
                <strong className="text-white">{client.full_name}</strong>.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-2 rounded-xl hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMsg && (
            <div className="p-3.5 bg-red-950/60 border border-red-500/50 rounded-2xl text-xs text-red-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Barra de Búsqueda y Filtro de Grupos Musculares */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar rutina por nombre o palabra clave (ej. Pecho, Espalda, Hipertrofia)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Chips de Grupos Musculares */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-800">
              <button
                type="button"
                onClick={() => setSelectedMuscleFilter('Todos')}
                className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                  selectedMuscleFilter === 'Todos'
                    ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                    : 'bg-gray-800/80 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                Todos ({availableRoutines.length})
              </button>
              {STANDARD_MUSCLE_GROUPS.map((mg) => {
                const isSelected = selectedMuscleFilter === mg.id;
                return (
                  <button
                    key={mg.id}
                    type="button"
                    onClick={() => setSelectedMuscleFilter(mg.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap transition ${
                      isSelected
                        ? 'bg-emerald-500 text-gray-950 shadow-md shadow-emerald-500/20'
                        : 'bg-gray-950 text-gray-400 hover:text-white border border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    {mg.nameEs}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Listado de Rutinas Disponibles con Selección Múltiple */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
              <div className="flex items-center space-x-2">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center space-x-1.5">
                  <ListChecks className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Rutinas Disponibles ({filteredRoutines.length})</span>
                </label>
                {selectedRoutineIds.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[10px] font-black">
                    {selectedRoutineIds.length} seleccionada{selectedRoutineIds.length === 1 ? '' : 's'}
                  </span>
                )}
              </div>

              <div className="flex items-center space-x-2 text-[11px]">
                <button
                  type="button"
                  onClick={selectAllVisible}
                  className="text-emerald-400 hover:text-emerald-300 font-bold transition hover:underline"
                >
                  Seleccionar visibles ({filteredRoutines.length})
                </button>
                {selectedRoutineIds.length > 0 && (
                  <>
                    <span className="text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={deselectAll}
                      className="text-gray-400 hover:text-red-400 font-bold transition hover:underline"
                    >
                      Limpiar selección
                    </button>
                  </>
                )}
              </div>
            </div>

            {fetchingRoutines ? (
              <div className="h-40 flex flex-col items-center justify-center text-gray-500 space-y-2 bg-gray-950 border border-gray-800 rounded-2xl">
                <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                <span className="text-xs">Cargando biblioteca de rutinas maestras...</span>
              </div>
            ) : filteredRoutines.length === 0 ? (
              <div className="p-6 text-center bg-gray-950 border border-gray-800 rounded-2xl space-y-2">
                <p className="text-xs font-bold text-amber-400">
                  No se encontraron rutinas para el filtro seleccionado.
                </p>
                <p className="text-[11px] text-gray-500">
                  Prueba cambiando el grupo muscular o limpiando la búsqueda.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-gray-800">
                {filteredRoutines.map((r) => {
                  const isSelected = selectedRoutineIds.includes(r.id);
                  const totalDays = r.routine_days?.length || 0;
                  const totalExercises =
                    r.routine_days?.reduce(
                      (acc, d) => acc + (d.routine_exercises?.length || 0),
                      0
                    ) || 0;

                  return (
                    <div
                      key={r.id}
                      onClick={() => toggleRoutineSelection(r.id)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between group ${
                        isSelected
                          ? 'bg-emerald-950/50 border-emerald-500 shadow-lg shadow-emerald-950/40 ring-1 ring-emerald-500/50'
                          : 'bg-gray-950/80 border-gray-800 hover:border-gray-700 hover:bg-gray-950'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <h4
                            className={`text-xs font-black transition line-clamp-1 ${
                              isSelected ? 'text-emerald-300' : 'text-white group-hover:text-emerald-300'
                            }`}
                          >
                            {r.title}
                          </h4>
                          {r.description && (
                            <p className="text-[11px] text-gray-400 line-clamp-2 mt-1 leading-snug">
                              {r.description}
                            </p>
                          )}
                        </div>

                        {/* Checkbox de Selección Múltiple */}
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center shrink-0 transition ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-400 text-gray-950 shadow-md shadow-emerald-500/30'
                              : 'border-gray-700 bg-gray-900 group-hover:border-gray-500'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3] text-gray-950" />}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-800/60 text-[10px] text-gray-400 font-medium">
                        <div className="flex items-center space-x-1.5">
                          <span className="bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800">
                            📅 {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
                          </span>
                          <span className="bg-gray-900 px-2 py-0.5 rounded-md border border-gray-800">
                            🏋️ {totalExercises} {totalExercises === 1 ? 'Ej.' : 'Ejercicios'}
                          </span>
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-extrabold text-emerald-400 flex items-center gap-1">
                            <span>✓ Seleccionada</span>
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Bandeja Resumen de Selección Múltiple */}
          {selectedRoutines.length > 0 && (
            <div className="bg-gradient-to-r from-emerald-950/40 via-gray-950 to-gray-950 p-4 rounded-2xl border border-emerald-500/30 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-xs font-black text-white">
                    {selectedRoutines.length === 1
                      ? '1 Rutina seleccionada para asignar:'
                      : `${selectedRoutines.length} Rutinas seleccionadas para asignar:`}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px]">
                  <span className="bg-gray-900/90 px-2.5 py-1 rounded-lg border border-gray-800 text-emerald-300 font-bold">
                    Total Días: {totalSelectedDays}
                  </span>
                  <span className="bg-gray-900/90 px-2.5 py-1 rounded-lg border border-gray-800 text-emerald-300 font-bold">
                    Total Ejercicios: {totalSelectedExercises}
                  </span>
                </div>
              </div>

              {/* Chips de rutinas seleccionadas con botón para remover */}
              <div className="flex flex-wrap gap-2 pt-1">
                {selectedRoutines.map((r) => (
                  <div
                    key={r.id}
                    className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs bg-emerald-950/60 border-emerald-500/50 text-emerald-300 font-bold shadow-sm"
                  >
                    <span className="truncate max-w-[220px]">{r.title}</span>
                    <button
                      type="button"
                      onClick={(e) => handleRemoveRoutine(r.id, e)}
                      title="Remover de la selección"
                      className="p-0.5 rounded-md hover:bg-emerald-500/20 text-emerald-400 hover:text-red-400 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Opciones de Asignación: Fecha y Reemplazo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-950/40 p-4 rounded-2xl border border-gray-800">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1 flex items-center">
                <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
                Fecha de Inicio *
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
              <p className="text-[10.5px] text-gray-500 mt-1">
                Fecha a partir de la cual se planifican las sesiones en el calendario.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-start space-x-2.5 cursor-pointer mt-2 sm:mt-0">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="mt-0.5 rounded bg-gray-900 border-gray-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <div>
                  <span className="text-xs font-bold text-gray-200 block">
                    Reemplazar otras rutinas activas previas
                  </span>
                  <span className="text-[11px] text-gray-500 leading-snug block">
                    Desmarca para conservar las rutinas anteriores asignadas a este alumno en simultáneo.
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Enlace para diseñar rutina desde cero */}
          <div className="flex items-center justify-between text-xs text-gray-400 bg-gray-950/60 px-4 py-2.5 rounded-xl border border-gray-800/80">
            <span>¿Deseas armar una rutina 100% personalizada para este alumno?</span>
            <Link
              href={`/admin/routines/new?clientId=${client.id}`}
              onClick={onClose}
              className="font-bold text-emerald-400 hover:text-emerald-300 inline-flex items-center space-x-1 transition ml-2 shrink-0"
            >
              <span>Diseñar desde cero</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Botones de Acción */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || selectedRoutineIds.length === 0}
              className="px-5 py-2 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center space-x-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Asignando {selectedRoutineIds.length} Rutina(s)...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {selectedRoutineIds.length === 0
                      ? 'Selecciona Rutinas'
                      : `Asignar ${selectedRoutineIds.length} ${
                          selectedRoutineIds.length === 1 ? 'Rutina' : 'Rutinas'
                        } al Alumno`}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
