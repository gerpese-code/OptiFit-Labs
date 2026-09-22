'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Routine } from '@/types/database';
import AssignRoutineModal from '@/components/routines/AssignRoutineModal';
import {
  CalendarDays,
  Plus,
  UserCheck,
  Bookmark,
  Layers,
  Trash2,
  Edit3,
  Copy,
  Loader2,
  Sparkles,
  Check,
  ListChecks,
} from 'lucide-react';

export default function RoutinesListPage() {
  const supabase = createClient();

  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Modal para asignar
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Selección múltiple para asignación por lote
  const [selectedRoutineIds, setSelectedRoutineIds] = useState<string[]>([]);
  const [routinesToAssignBatch, setRoutinesToAssignBatch] = useState<Routine[]>([]);

  const toggleSelectRoutine = (id: string) => {
    setSelectedRoutineIds((prev) =>
      prev.includes(id) ? prev.filter((rId) => rId !== id) : [...prev, id]
    );
  };

  const handleOpenBatchAssign = () => {
    const list = routines.filter((r) => selectedRoutineIds.includes(r.id));
    if (list.length === 0) return;
    setRoutinesToAssignBatch(list);
    setSelectedRoutineToAssign(null);
    setIsAssignModalOpen(true);
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('routines')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRoutines(data || []);
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar esta rutina? Se eliminarán también sus días y series programadas.')) return;
    try {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      setRoutines((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  const handleDuplicateRoutine = async (routine: Routine) => {
    setDuplicatingId(routine.id);
    try {
      // 1. Obtener los días de la rutina original
      const { data: days, error: daysError } = await supabase
        .from('routine_days')
        .select(`
          name,
          day_number,
          order_index,
          routine_exercises (
            exercise_id,
            order_index,
            notes,
            routine_exercise_sets (
              set_number,
              target_reps,
              target_weight_kg,
              target_rpe,
              rest_seconds
            )
          )
        `)
        .eq('routine_id', routine.id)
        .order('order_index', { ascending: true });

      if (daysError) throw daysError;

      // 2. Crear nueva rutina duplicada
      const { data: newRoutine, error: rErr } = await supabase
        .from('routines')
        .insert({
          title: `${routine.title} (Copia)`,
          description: routine.description,
          is_template: routine.is_template,
          is_active: true,
          client_id: null,
        })
        .select()
        .single();

      if (rErr) throw rErr;

      // 3. Replicar días, ejercicios y sets
      for (const day of days || []) {
        const { data: newDay, error: ndErr } = await supabase
          .from('routine_days')
          .insert({
            routine_id: newRoutine.id,
            name: day.name,
            day_number: day.day_number,
            order_index: day.order_index,
          })
          .select()
          .single();

        if (ndErr) throw ndErr;

        for (const rx of (day as any).routine_exercises || []) {
          const { data: newRx, error: nrxErr } = await supabase
            .from('routine_exercises')
            .insert({
              routine_day_id: newDay.id,
              exercise_id: rx.exercise_id,
              order_index: rx.order_index,
              notes: rx.notes,
            })
            .select()
            .single();

          if (nrxErr) throw nrxErr;

          if (rx.routine_exercise_sets && rx.routine_exercise_sets.length > 0) {
            const setsToInsert = rx.routine_exercise_sets.map((s: any) => ({
              routine_exercise_id: newRx.id,
              set_number: s.set_number,
              target_reps: s.target_reps,
              target_weight_kg: s.target_weight_kg,
              target_rpe: s.target_rpe,
              rest_seconds: s.rest_seconds,
            }));

            await supabase.from('routine_exercise_sets').insert(setsToInsert);
          }
        }
      }

      await fetchRoutines();
    } catch (err: any) {
      alert(`Error al duplicar rutina: ${err.message}`);
    } finally {
      setDuplicatingId(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
            <CalendarDays className="w-6 h-6 mr-2.5 text-emerald-400" />
            Programas y Rutinas de Entrenamiento
          </h2>
          <p className="text-sm text-gray-400">
            Crea, edita y duplica programas divididos por días y asígnalos a tus alumnos.
          </p>
        </div>

        <Link
          href="/admin/routines/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Rutina
        </Link>
      </div>

      {/* Barra de Selección Múltiple si hay rutinas seleccionadas */}
      {selectedRoutineIds.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/80 via-gray-900 to-gray-900 border border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
              {selectedRoutineIds.length}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {selectedRoutineIds.length} {selectedRoutineIds.length === 1 ? 'rutina seleccionada' : 'rutinas seleccionadas'}
              </span>
              <span className="text-[11px] text-gray-400">
                Puedes asignarlas todas juntas a un mismo alumno en un solo paso.
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedRoutineIds([])}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-semibold transition"
            >
              Deseleccionar
            </button>
            <button
              type="button"
              onClick={handleOpenBatchAssign}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 transition flex items-center space-x-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Asignar {selectedRoutineIds.length} a un Alumno</span>
            </button>
          </div>
        </div>
      )}

      {/* Routine Cards Grid */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs">Cargando programas de entrenamiento...</span>
        </div>
      ) : routines.length === 0 ? (
        <div className="h-64 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Layers className="w-10 h-10 text-gray-600" />
          <h3 className="text-sm font-semibold text-white">No hay rutinas creadas</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Diseña tu primera rutina dividida por días y objetivos haciendo clic en "Nueva Rutina".
          </p>
          <Link
            href="/admin/routines/new"
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Crear Primera Rutina
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {routines.map((routine) => {
            const isSelected = selectedRoutineIds.includes(routine.id);

            return (
              <div
                key={routine.id}
                className={`border rounded-2xl p-5 flex flex-col justify-between transition shadow-lg group ${
                  isSelected
                    ? 'bg-emerald-950/30 border-emerald-500/70 shadow-emerald-950/30'
                    : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={() => toggleSelectRoutine(routine.id)}
                        title={isSelected ? 'Deseleccionar' : 'Seleccionar para asignación por lote'}
                        className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                          isSelected
                            ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                            : 'border-gray-700 bg-gray-950 hover:border-emerald-500/60'
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center ${
                          routine.is_template
                            ? 'bg-purple-950/60 text-purple-400 border border-purple-800/40'
                            : 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        <Bookmark className="w-3 h-3 mr-1" />
                        {routine.is_template ? 'Plantilla Maestra' : 'Personalizada'}
                      </span>
                    </div>

                    {/* Acciones de Edición, Duplicación y Borrado */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => handleDuplicateRoutine(routine)}
                        disabled={duplicatingId === routine.id}
                        className="text-gray-400 hover:text-sky-400 p-1 rounded-md transition hover:bg-gray-800"
                        title="Duplicar rutina"
                      >
                        {duplicatingId === routine.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <Link
                        href={`/admin/routines/${routine.id}/edit`}
                        className="text-gray-400 hover:text-emerald-400 p-1 rounded-md transition hover:bg-gray-800"
                        title="Editar estructura de rutina"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="button"
                        onClick={() => handleDelete(routine.id)}
                        className="text-gray-400 hover:text-red-400 p-1 rounded-md transition hover:bg-gray-800"
                        title="Eliminar rutina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition">
                    {routine.title}
                  </h3>

                  <p className="text-xs text-gray-400 mt-1.5 line-clamp-3 leading-relaxed">
                    {routine.description || 'Sin notas descriptivas agregadas.'}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    {new Date(routine.created_at).toLocaleDateString()}
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedRoutineToAssign(routine);
                      setRoutinesToAssignBatch([]);
                      setIsAssignModalOpen(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/50 transition"
                  >
                    <UserCheck className="w-3.5 h-3.5 mr-1" />
                    Asignar a Alumno
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal para asignar */}
      <AssignRoutineModal
        routine={selectedRoutineToAssign}
        routines={routinesToAssignBatch}
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRoutineToAssign(null);
          setRoutinesToAssignBatch([]);
        }}
        onSuccess={() => {
          alert('¡Rutina(s) asignada(s) y calendario planificado con éxito!');
          setSelectedRoutineIds([]);
          fetchRoutines();
        }}
      />
    </div>
  );
}
