'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  Users,
  Search,
  ExternalLink,
  ChevronRight,
  Dumbbell,
  ShieldCheck,
  Filter,
} from 'lucide-react';

interface RoutineWithDetails extends Routine {
  routine_days?: {
    id: string;
    name: string;
    day_number: number;
    order_index: number;
    routine_exercises?: {
      id: string;
      exercise_id: string;
      routine_exercise_sets?: { id: string }[];
    }[];
  }[];
}

interface RoutineAssignment {
  id: string;
  title: string;
  client_id: string;
  is_active: boolean;
  created_at: string;
  profile?: {
    id: string;
    full_name: string;
    client_code?: string;
    weight_unit_preference: string;
  } | null;
}

export default function RoutinesListPage() {
  const supabase = createClient();

  const [routines, setRoutines] = useState<RoutineWithDetails[]>([]);
  const [assignments, setAssignments] = useState<RoutineAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);

  // Tabs de navegación
  const [activeTab, setActiveTab] = useState<'templates' | 'assignments'>('templates');

  // Filtro de búsqueda
  const [searchQuery, setSearchQuery] = useState('');

  // Modal para asignar
  const [selectedRoutineToAssign, setSelectedRoutineToAssign] = useState<Routine | null>(null);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [preselectedClientId, setPreselectedClientId] = useState<string | undefined>(undefined);

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
    setPreselectedClientId(undefined);
    setIsAssignModalOpen(true);
  };

  const fetchRoutines = async () => {
    setLoading(true);
    try {
      // 1. Cargar ÚNICAMENTE las rutinas maestras (plantillas de la biblioteca, client_id IS NULL)
      // Esto elimina por completo cualquier rutina duplicada generada por asignación a alumnos
      const { data: templatesData, error: tErr } = await supabase
        .from('routines')
        .select(`
          *,
          routine_days (
            id,
            name,
            day_number,
            order_index,
            routine_exercises (
              id,
              exercise_id,
              routine_exercise_sets (id)
            )
          )
        `)
        .is('client_id', null)
        .order('title', { ascending: true });

      if (tErr) throw tErr;

      // Deduplicar en memoria por ID por seguridad
      const uniqueTemplates: RoutineWithDetails[] = [];
      const seenIds = new Set<string>();
      for (const item of (templatesData || []) as RoutineWithDetails[]) {
        if (!seenIds.has(item.id)) {
          seenIds.add(item.id);
          uniqueTemplates.push(item);
        }
      }
      setRoutines(uniqueTemplates);

      // 2. Cargar asignaciones activas de alumnos para mapear quién tiene cada rutina
      const { data: assignmentsData, error: aErr } = await supabase
        .from('routines')
        .select(`
          id,
          title,
          client_id,
          is_active,
          created_at,
          profile:client_id (
            id,
            full_name,
            client_code,
            weight_unit_preference
          )
        `)
        .not('client_id', 'is', null)
        .order('created_at', { ascending: false });

      if (aErr) {
        console.warn('Nota al cargar asignaciones de rutinas:', aErr);
      } else {
        setAssignments((assignmentsData as any) || []);
      }
    } catch (err) {
      console.error('Error al cargar rutinas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutines();
  }, []);

  // Mapear alumnos asignados a cada plantilla maestra por coincidencia de título
  const assignmentsByTemplateTitle = useMemo(() => {
    const map = new Map<string, RoutineAssignment[]>();
    for (const a of assignments) {
      if (!a.title) continue;
      const key = a.title.trim().toLowerCase();
      const existing = map.get(key) || [];
      existing.push(a);
      map.set(key, existing);
    }
    return map;
  }, [assignments]);

  // Agrupar asignaciones por alumno
  const assignmentsByStudent = useMemo(() => {
    const map = new Map<
      string,
      {
        client: { id: string; full_name: string; client_code?: string; weight_unit_preference: string };
        routines: RoutineAssignment[];
      }
    >();

    for (const a of assignments) {
      if (!a.client_id || !a.profile) continue;
      const current = map.get(a.client_id) || {
        client: a.profile,
        routines: [],
      };
      current.routines.push(a);
      map.set(a.client_id, current);
    }

    return Array.from(map.values());
  }, [assignments]);

  // Filtrado de plantillas maestras por búsqueda
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return routines;
    const q = searchQuery.toLowerCase().trim();
    return routines.filter(
      (r) =>
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.routine_days?.some((d) => d.name.toLowerCase().includes(q))
    );
  }, [routines, searchQuery]);

  // Filtrado de alumnos por búsqueda
  const filteredStudentGroups = useMemo(() => {
    if (!searchQuery.trim()) return assignmentsByStudent;
    const q = searchQuery.toLowerCase().trim();
    return assignmentsByStudent.filter(
      (s) =>
        s.client.full_name?.toLowerCase().includes(q) ||
        s.client.client_code?.toLowerCase().includes(q) ||
        s.routines.some((r) => r.title.toLowerCase().includes(q))
    );
  }, [assignmentsByStudent, searchQuery]);

  const handleDelete = async (id: string, title: string) => {
    if (
      !confirm(
        `¿Seguro que deseas eliminar la plantilla maestra "${title}"? Se borrará de la biblioteca.`
      )
    )
      return;
    try {
      const { error } = await supabase.from('routines').delete().eq('id', id);
      if (error) throw error;
      setRoutines((prev) => prev.filter((r) => r.id !== id));
      setSelectedRoutineIds((prev) => prev.filter((rId) => rId !== id));
    } catch (err: any) {
      alert(`Error al eliminar plantilla: ${err.message}`);
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

      // 2. Crear nueva rutina duplicada como plantilla
      const { data: newRoutine, error: rErr } = await supabase
        .from('routines')
        .insert({
          title: `${routine.title} (Copia)`,
          description: routine.description,
          is_template: true,
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
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5">
            <CalendarDays className="w-7 h-7 text-emerald-400" />
            <h2 className="text-2xl font-black text-white tracking-tight">
              Biblioteca de Rutinas de Entrenamiento
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Plantillas maestras únicas. Asígnalas a múltiples alumnos sin duplicar plantillas en la biblioteca.
          </p>
        </div>

        <Link
          href="/admin/routines/new"
          className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto shrink-0"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nueva Rutina Maestra
        </Link>
      </div>

      {/* Tabs y Buscador */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Selector de Pestañas */}
        <div className="flex items-center p-1 bg-gray-900 border border-gray-800 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'templates'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Biblioteca Maestra</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'templates'
                  ? 'bg-emerald-700/80 text-emerald-100'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {routines.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('assignments')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'assignments'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Asignaciones por Alumno</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTab === 'assignments'
                  ? 'bg-emerald-700/80 text-emerald-100'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {assignmentsByStudent.length}
            </span>
          </button>
        </div>

        {/* Buscador */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-gray-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder={
              activeTab === 'templates'
                ? 'Buscar por nombre o músculo...'
                : 'Buscar por alumno o rutina...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-900 border border-gray-800 rounded-xl pl-10 pr-3.5 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>
      </div>

      {/* Barra de Selección Múltiple (Solo en pestaña de plantillas) */}
      {activeTab === 'templates' && selectedRoutineIds.length > 0 && (
        <div className="bg-gradient-to-r from-emerald-950/90 via-gray-900 to-gray-900 border border-emerald-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl animate-in fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-black">
              {selectedRoutineIds.length}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">
                {selectedRoutineIds.length}{' '}
                {selectedRoutineIds.length === 1
                  ? 'rutina maestra seleccionada'
                  : 'rutinas maestras seleccionadas'}
              </span>
              <span className="text-[11px] text-gray-400">
                Puedes asignarlas simultáneamente a uno o varios alumnos sin duplicar plantillas.
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
              <span>Asignar {selectedRoutineIds.length} a Alumno(s)</span>
            </button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs">Cargando biblioteca de rutinas...</span>
        </div>
      ) : activeTab === 'templates' ? (
        /* PESTAÑA 1: BIBLIOTECA MAESTRA (PLANTILLAS ÚNICAS) */
        filteredTemplates.length === 0 ? (
          <div className="h-64 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Layers className="w-10 h-10 text-gray-600" />
            <h3 className="text-sm font-semibold text-white">
              {searchQuery ? 'No se encontraron rutinas con esa búsqueda' : 'No hay rutinas creadas'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              {searchQuery
                ? 'Prueba buscando con otro término o limpia el buscador.'
                : 'Diseña tu primera rutina dividida por días y objetivos haciendo clic en "Nueva Rutina Maestra".'}
            </p>
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl transition"
              >
                Limpiar búsqueda
              </button>
            ) : (
              <Link
                href="/admin/routines/new"
                className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Crear Primera Rutina Maestra
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTemplates.map((routine) => {
              const isSelected = selectedRoutineIds.includes(routine.id);

              // Alumnos que tienen asignada esta rutina
              const assignedClients =
                assignmentsByTemplateTitle.get(routine.title.trim().toLowerCase()) || [];

              const totalDays = routine.routine_days?.length || 0;
              const totalExercises =
                routine.routine_days?.reduce(
                  (acc, d) => acc + (d.routine_exercises?.length || 0),
                  0
                ) || 0;

              return (
                <div
                  key={routine.id}
                  className={`border rounded-2xl p-5 flex flex-col justify-between transition shadow-lg group relative ${
                    isSelected
                      ? 'bg-emerald-950/30 border-emerald-500/70 shadow-emerald-950/30 ring-1 ring-emerald-500/40'
                      : 'bg-gray-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div>
                    {/* Header de la tarjeta */}
                    <div className="flex items-center justify-between mb-2.5">
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => toggleSelectRoutine(routine.id)}
                          title={
                            isSelected
                              ? 'Deseleccionar'
                              : 'Seleccionar para asignación por lote'
                          }
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                            isSelected
                              ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                              : 'border-gray-700 bg-gray-950 hover:border-emerald-500/60'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center bg-purple-950/70 text-purple-300 border border-purple-800/50">
                          <Bookmark className="w-3 h-3 mr-1 text-purple-400" />
                          Plantilla Maestra
                        </span>
                      </div>

                      {/* Acciones de Edición, Duplicación y Borrado */}
                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => handleDuplicateRoutine(routine)}
                          disabled={duplicatingId === routine.id}
                          className="text-gray-400 hover:text-sky-400 p-1.5 rounded-lg transition hover:bg-gray-800"
                          title="Duplicar rutina como plantilla"
                        >
                          {duplicatingId === routine.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        <Link
                          href={`/admin/routines/${routine.id}/edit`}
                          className="text-gray-400 hover:text-emerald-400 p-1.5 rounded-lg transition hover:bg-gray-800"
                          title="Editar estructura de rutina maestra"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>

                        <button
                          type="button"
                          onClick={() => handleDelete(routine.id, routine.title)}
                          className="text-gray-400 hover:text-red-400 p-1.5 rounded-lg transition hover:bg-gray-800"
                          title="Eliminar plantilla maestra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Título de la Rutina */}
                    <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition leading-snug">
                      {routine.title}
                    </h3>

                    {/* Descripción */}
                    <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
                      {routine.description || 'Sin notas descriptivas agregadas.'}
                    </p>

                    {/* Estadísticas de Días y Ejercicios */}
                    <div className="flex items-center space-x-2 mt-3 text-[11px] text-gray-400">
                      <span className="bg-gray-950 px-2 py-0.5 rounded-md border border-gray-800 font-semibold text-gray-300">
                        📅 {totalDays} {totalDays === 1 ? 'Día' : 'Días'}
                      </span>
                      <span className="bg-gray-950 px-2 py-0.5 rounded-md border border-gray-800 font-semibold text-gray-300">
                        🏋️ {totalExercises} {totalExercises === 1 ? 'Ejercicio' : 'Ejercicios'}
                      </span>
                    </div>

                    {/* Estado de Asignaciones a Alumnos */}
                    <div className="mt-3.5 pt-3 border-t border-gray-800/80">
                      {assignedClients.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-emerald-400 font-bold flex items-center space-x-1">
                              <Users className="w-3 h-3 mr-1" />
                              <span>Asignada a {assignedClients.length} {assignedClients.length === 1 ? 'alumno' : 'alumnos'}:</span>
                            </span>
                          </div>

                          {/* Chips de Alumnos con enlace a su ficha para modificar pesos */}
                          <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
                            {assignedClients.map((ac) => (
                              <Link
                                key={ac.id}
                                href={`/admin/clients/${ac.client_id}`}
                                className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-950 hover:bg-emerald-950/80 text-gray-300 hover:text-emerald-300 border border-gray-800 hover:border-emerald-700/60 transition group/chip"
                                title={`Ver ficha de ${ac.profile?.full_name} para modificar sus repeticiones o pesos individuales`}
                              >
                                <span>{ac.profile?.full_name || 'Alumno'}</span>
                                <ExternalLink className="w-2.5 h-2.5 opacity-50 group-hover/chip:opacity-100 text-emerald-400" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-[11px] text-gray-500 flex items-center space-x-1.5 py-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                          <span>Disponible en biblioteca (Sin alumnos asignados)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer de la tarjeta con Botón de Asignación */}
                  <div className="mt-4 pt-3.5 border-t border-gray-800 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-mono">
                      {new Date(routine.created_at).toLocaleDateString()}
                    </span>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoutineToAssign(routine);
                        setRoutinesToAssignBatch([]);
                        setPreselectedClientId(undefined);
                        setIsAssignModalOpen(true);
                      }}
                      className="inline-flex items-center px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/50 hover:border-emerald-700 transition shadow-sm"
                    >
                      <UserCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                      Asignar a Alumno(s)
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )
      ) : (
        /* PESTAÑA 2: ASIGNACIONES ACTIVAS POR ALUMNO */
        filteredStudentGroups.length === 0 ? (
          <div className="h-64 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
            <Users className="w-10 h-10 text-gray-600" />
            <h3 className="text-sm font-semibold text-white">
              {searchQuery
                ? 'No se encontraron alumnos con esa búsqueda'
                : 'Aún no hay rutinas asignadas a alumnos'}
            </h3>
            <p className="text-xs text-gray-400 max-w-sm">
              Selecciona una rutina en la Biblioteca Maestra y haz clic en "Asignar a Alumno(s)".
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-3.5 bg-gray-900/60 border border-gray-800 rounded-2xl text-xs text-gray-400 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>
                  Cada alumno tiene su copia personal de la rutina para registrar pesos y repeticiones sin modificar la plantilla original.
                </span>
              </span>
              <span className="text-[11px] font-bold text-gray-400">
                {filteredStudentGroups.length} {filteredStudentGroups.length === 1 ? 'Alumno con rutinas' : 'Alumnos con rutinas'}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredStudentGroups.map((group) => (
                <div
                  key={group.client.id}
                  className="bg-gray-900 border border-gray-800 hover:border-gray-700 rounded-2xl p-5 shadow-lg transition space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Cabecera del Alumno */}
                    <div className="flex items-center justify-between border-b border-gray-800 pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/20">
                          {group.client.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-white">
                            {group.client.full_name}
                          </h4>
                          <span className="text-[11px] text-gray-400 font-mono">
                            Pref: {group.client.weight_unit_preference?.toUpperCase() || 'KG'}
                          </span>
                        </div>
                      </div>

                      <Link
                        href={`/admin/clients/${group.client.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold transition border border-gray-700"
                        title="Ver ficha completa, series y modificar pesos de este alumno"
                      >
                        <span>Ver Perfil</span>
                        <ChevronRight className="w-3.5 h-3.5 text-emerald-400" />
                      </Link>
                    </div>

                    {/* Lista de Rutinas Asignadas a este Alumno */}
                    <div className="space-y-2">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Rutinas asignadas ({group.routines.length}):
                      </span>

                      <div className="space-y-1.5">
                        {group.routines.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between p-2.5 rounded-xl bg-gray-950 border border-gray-800/80 text-xs"
                          >
                            <div className="flex items-center space-x-2">
                              <span
                                className={`w-2 h-2 rounded-full ${
                                  r.is_active ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'
                                }`}
                              />
                              <span className="font-bold text-white line-clamp-1">
                                {r.title}
                              </span>
                            </div>

                            <div className="flex items-center space-x-2 shrink-0">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  r.is_active
                                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                                    : 'bg-gray-900 text-gray-500 border-gray-800'
                                }`}
                              >
                                {r.is_active ? 'ACTIVA' : 'PAUSADA'}
                              </span>

                              {/* Enlace directo para modificar pesos / repeticiones de este alumno */}
                              <Link
                                href={`/admin/routines/${r.id}/edit`}
                                className="p-1 text-gray-400 hover:text-blue-400 hover:bg-gray-800 rounded-lg transition"
                                title="Modificar pesos y repeticiones de esta rutina para este alumno"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Acciones para este Alumno */}
                  <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
                    <Link
                      href={`/admin/clients/${group.client.id}`}
                      className="text-xs font-bold text-emerald-400 hover:text-emerald-300 transition flex items-center space-x-1"
                    >
                      <span>Modificar pesos & repeticiones</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoutineToAssign(routines[0] || null);
                        setRoutinesToAssignBatch([]);
                        setPreselectedClientId(group.client.id);
                        setIsAssignModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-emerald-950/70 hover:bg-emerald-900/90 text-emerald-300 text-xs font-bold rounded-xl border border-emerald-800/50 transition flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Asignar Rutina</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {/* Modal para asignar */}
      <AssignRoutineModal
        routine={selectedRoutineToAssign}
        routines={routinesToAssignBatch}
        isOpen={isAssignModalOpen}
        initialClientId={preselectedClientId}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedRoutineToAssign(null);
          setRoutinesToAssignBatch([]);
          setPreselectedClientId(undefined);
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
