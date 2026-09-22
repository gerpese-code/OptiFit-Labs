'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Profile, WorkoutSession, WorkoutLogSet } from '@/types/database';
import LiveWorkoutMonitor from '@/components/monitoring/LiveWorkoutMonitor';
import ClientAnalyticsCharts from '@/components/monitoring/ClientAnalyticsCharts';
import { useUnit } from '@/context/UnitContext';
import {
  User,
  Activity,
  Calendar,
  Weight,
  ArrowLeft,
  Loader2,
  TrendingUp,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Download,
  Lock,
  Unlock,
  Trash2,
  AlertTriangle,
  Dumbbell,
  Plus,
  Edit3,
  RefreshCw,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  CheckCircle2,
  RotateCcw,
} from 'lucide-react';
import Link from 'next/link';
import { getClientActivityInfo } from '@/lib/utils/activity';
import { getClientCode, formatClientBadge } from '@/lib/utils/clientCode';
import { STANDARD_MUSCLE_GROUPS } from '@/lib/constants/muscleGroups';
import ClientRoutineModal from '@/components/clients/ClientRoutineModal';
import ResetProgressModal from '@/components/clients/ResetProgressModal';

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const supabase = createClient();
  const { unit, formatWeight } = useUnit();

  const [client, setClient] = useState<Profile | null>(null);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [tonnageHistory, setTonnageHistory] = useState<
    { date: string; tonnage_kg: number }[]
  >([]);
  const [oneRMHistory, setOneRMHistory] = useState<
    { date: string; weight_kg: number; reps: number; exercise_name: string }[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingClient, setDeletingClient] = useState(false);
  const [isResetProgressModalOpen, setIsResetProgressModalOpen] = useState(false);

  // Estados de Línea de Tiempo y Filtro de Fechas (Desde - Hasta)
  const [timelinePreset, setTimelinePreset] = useState<'7d' | '30d' | '90d' | '1y' | 'all' | 'custom'>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const [assignedRoutines, setAssignedRoutines] = useState<any[]>([]);
  const [activeRoutine, setActiveRoutine] = useState<any | null>(null);
  const [togglingRoutineId, setTogglingRoutineId] = useState<string | null>(null);
  const [deletingRoutineId, setDeletingRoutineId] = useState<string | null>(null);
  const [expandedRoutineIds, setExpandedRoutineIds] = useState<Set<string>>(new Set());
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [clientCode, setClientCode] = useState('');

  const handleDeleteClient = async () => {
    if (!client) return;
    setDeletingClient(true);
    try {
      const res = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: client.id }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar alumno.');
      }
      router.push('/admin/clients');
    } catch (err: any) {
      alert(err.message || 'No se pudo eliminar al alumno.');
      setDeletingClient(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!client) return;
    const isCurrentlyActive = client.is_active !== false;
    const nextStatus = !isCurrentlyActive;
    setTogglingStatus(true);
    try {
      await supabase
        .from('profiles')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', client.id);

      await supabase
        .from('routines')
        .update({ is_active: nextStatus })
        .eq('client_id', client.id);

      setClient({ ...client, is_active: nextStatus });
    } catch (err) {
      console.error('Error al alternar estado del alumno:', err);
    } finally {
      setTogglingStatus(false);
    }
  };

  const loadClientData = React.useCallback(async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      // 1. Cargar perfil del alumno
      const { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', clientId)
        .single();

      if (profileErr) throw profileErr;
      setClient(profileData as Profile);

      // Cargar código único de alumno desde la API de administración
      let assignedCode = getClientCode(profileData);
      try {
        const codesRes = await fetch('/api/admin/clients');
        const codesData = await codesRes.json();
        if (codesData?.codes?.[clientId]) {
          assignedCode = codesData.codes[clientId];
        }
      } catch (e) {
        // Fallback al código determinista
      }
      setClientCode(assignedCode);

        // 1.1 Cargar todas las rutinas asignadas al alumno (activas e inactivas)
        const { data: routinesData } = await supabase
          .from('routines')
          .select(`
            *,
            routine_days (
              *,
              routine_exercises (
                *,
                exercise:exercise_id (
                  id,
                  name,
                  muscle_group
                ),
                routine_exercise_sets (
                  *
                )
              )
            )
          `)
          .eq('client_id', clientId)
          .order('created_at', { ascending: false });

        const routinesList = routinesData || [];
        setAssignedRoutines(routinesList);
        const activeOne = routinesList.find((r: any) => r.is_active) || (routinesList.length > 0 ? routinesList[0] : null);
        setActiveRoutine(activeOne);

        // 2. Cargar sesiones de entrenamiento
        const { data: sessionsData } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('client_id', clientId)
          .order('scheduled_date', { ascending: true });

        const loadedSessions = (sessionsData as WorkoutSession[]) || [];
        setSessions(loadedSessions);

        // 3. Cargar series registradas para tonelaje y 1RM
        if (loadedSessions.length > 0) {
          const sessionIds = loadedSessions.map((s) => s.id);

          const { data: logsData } = await supabase
            .from('workout_log_sets')
            .select(`
              id,
              session_id,
              set_number,
              reps_completed,
              weight_kg,
              is_completed,
              created_at,
              routine_exercise_set_id
            `)
            .in('session_id', sessionIds)
            .eq('is_completed', true)
            .order('created_at', { ascending: true });

          const sets = (logsData as WorkoutLogSet[]) || [];

          // Agrupar tonelaje por fecha de sesión
          const sessionDateMap: { [id: string]: string } = {};
          loadedSessions.forEach((s) => {
            sessionDateMap[s.id] = s.scheduled_date;
          });

          // Mapa de nombre de ejercicio por routine_exercise_set_id para mostrar nombre real en el 1RM
          const exerciseNameBySetId: { [setId: string]: string } = {};
          routinesList.forEach((r: any) => {
            r.routine_days?.forEach((d: any) => {
              d.routine_exercises?.forEach((rx: any) => {
                const exName = rx.exercise?.name || 'Ejercicio';
                rx.routine_exercise_sets?.forEach((st: any) => {
                  exerciseNameBySetId[st.id] = exName;
                });
              });
            });
          });

          const tonnageMap: { [date: string]: number } = {};
          const oneRMPoints: {
            date: string;
            weight_kg: number;
            reps: number;
            exercise_name: string;
          }[] = [];

          sets.forEach((set) => {
            const date = sessionDateMap[set.session_id] || set.created_at.split('T')[0];
            const load = set.reps_completed * (set.weight_kg || 0);
            tonnageMap[date] = (tonnageMap[date] || 0) + load;

            if (set.weight_kg > 0 && set.reps_completed > 0) {
              const matchedName = (set.routine_exercise_set_id && exerciseNameBySetId[set.routine_exercise_set_id]) || 'Ejercicio';
              oneRMPoints.push({
                date,
                weight_kg: set.weight_kg,
                reps: set.reps_completed,
                exercise_name: matchedName,
              });
            }
          });

          const tonnageList = Object.entries(tonnageMap).map(([date, tonnage_kg]) => ({
            date,
            tonnage_kg: Math.round(tonnage_kg * 100) / 100,
          }));

          setTonnageHistory(tonnageList);
          setOneRMHistory(oneRMPoints);
        } else {
          // Si no hay sesiones o han sido reseteadas, vaciar inmediatamente tonelaje y 1RM
          setTonnageHistory([]);
          setOneRMHistory([]);
        }
      } catch (err) {
        console.error('Error al cargar datos del alumno:', err);
      } finally {
        setLoading(false);
      }
  }, [clientId, supabase]);

  useEffect(() => {
    loadClientData();
  }, [loadClientData]);

  // Cálculo dinámico del rango de fechas activo según el preset o fechas personalizadas
  const activeDateRange = React.useMemo(() => {
    const today = new Date();
    const formatYMD = (d: Date) => d.toISOString().split('T')[0];
    const end = formatYMD(today);

    if (timelinePreset === '7d') {
      const s = new Date(today);
      s.setDate(s.getDate() - 7);
      return { start: formatYMD(s), end, label: 'Últimos 7 Días' };
    }
    if (timelinePreset === '30d') {
      const s = new Date(today);
      s.setDate(s.getDate() - 30);
      return { start: formatYMD(s), end, label: 'Últimos 30 Días' };
    }
    if (timelinePreset === '90d') {
      const s = new Date(today);
      s.setDate(s.getDate() - 90);
      return { start: formatYMD(s), end, label: 'Últimos 90 Días (3 Meses)' };
    }
    if (timelinePreset === '1y') {
      const s = new Date(today);
      s.setFullYear(s.getFullYear() - 1);
      return { start: formatYMD(s), end, label: 'Último Año' };
    }
    if (timelinePreset === 'custom') {
      const s = customStartDate || '2020-01-01';
      const e = customEndDate || end;
      return {
        start: s,
        end: e,
        label: `Personalizado (${s} a ${e})`,
      };
    }
    // 'all'
    return { start: '2020-01-01', end, label: 'Historial Completo' };
  }, [timelinePreset, customStartDate, customEndDate]);

  // Filtrar sesiones, tonelaje y 1RM en memoria reactivamente según el periodo seleccionado
  const filteredSessions = React.useMemo(() => {
    return sessions.filter((s) => {
      const d = s.scheduled_date || (s.created_at ? s.created_at.split('T')[0] : '');
      return d >= activeDateRange.start && d <= activeDateRange.end;
    });
  }, [sessions, activeDateRange]);

  const filteredTonnageHistory = React.useMemo(() => {
    return tonnageHistory.filter(
      (t) => t.date >= activeDateRange.start && t.date <= activeDateRange.end
    );
  }, [tonnageHistory, activeDateRange]);

  const filteredOneRMHistory = React.useMemo(() => {
    return oneRMHistory.filter(
      (o) => o.date >= activeDateRange.start && o.date <= activeDateRange.end
    );
  }, [oneRMHistory, activeDateRange]);

  const toggleExpandRoutine = (id: string) => {
    setExpandedRoutineIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleRoutineActive = async (routineId: string, currentActive: boolean) => {
    setTogglingRoutineId(routineId);
    try {
      const res = await fetch('/api/admin/routines/assignments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          routineId,
          isActive: !currentActive,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadClientData();
    } catch (e: any) {
      alert(e.message || 'Error al actualizar estado de la rutina.');
    } finally {
      setTogglingRoutineId(null);
    }
  };

  const handleDeleteAssignedRoutine = async (routineId: string, routineTitle: string) => {
    if (!client) return;
    if (!confirm(`¿Seguro que deseas eliminar la rutina "${routineTitle}" de este alumno? Esta acción no se puede deshacer.`)) {
      return;
    }
    setDeletingRoutineId(routineId);
    try {
      const res = await fetch('/api/admin/routines/assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: client.id,
          routineId,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);
      await loadClientData();
    } catch (e: any) {
      alert(e.message || 'Error al eliminar la rutina asignada.');
    } finally {
      setDeletingRoutineId(null);
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center text-gray-400 space-y-2">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-xs">Cargando métricas y expediente del alumno...</span>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-8 text-center text-gray-400">
        <p>No se encontró el alumno solicitado.</p>
        <Link
          href="/admin"
          className="text-emerald-400 text-xs font-bold mt-2 inline-block"
        >
          Volver al panel general
        </Link>
      </div>
    );
  }

  const activityInfo = client ? getClientActivityInfo(client, sessions.length > 0 ? sessions[sessions.length - 1] : null) : null;

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/admin/clients"
            className="p-2 bg-gray-900 border border-gray-800 rounded-xl text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl font-black text-white flex items-center space-x-2">
                <User className="w-5 h-5 mr-1 text-emerald-400" />
                <span>{client.full_name}</span>
                <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 font-mono text-xs border border-gray-700">
                  ID: {client.id.slice(0, 8)}...
                </span>
              </h2>
              {activityInfo && (
                <span
                  className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-lg border text-xs font-bold ${activityInfo.badgeClass}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${activityInfo.dotColor}`}></span>
                  <span>{activityInfo.label}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mt-0.5">
              Expediente integral, monitoreo de sesiones y analítica biométrica.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto flex-wrap gap-2">
          {/* Botón de alternar membresía */}
          {client.is_active !== false ? (
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-950/60 hover:bg-amber-950/80 text-emerald-400 hover:text-amber-300 border border-emerald-800 hover:border-amber-700/60 rounded-xl text-xs font-bold transition"
              title="Pausar membresía (limitará las rutinas y progreso del alumno)"
            >
              {togglingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Membresía Activa (Pausar)</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleToggleStatus}
              disabled={togglingStatus}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-950/70 hover:bg-emerald-950/80 text-red-400 hover:text-emerald-300 border border-red-800 hover:border-emerald-700 rounded-xl text-xs font-bold transition"
              title="Reactivar membresía con acceso total"
            >
              {togglingStatus ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>Membresía Inactiva (Reactivar)</span>
                </>
              )}
            </button>
          )}

          {/* Botón Descargar Manual PDF */}
          <a
            href="/Manual_Fitness_Pro.pdf"
            download="Manual_Fitness_Pro.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 rounded-xl text-xs font-bold transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manual PDF</span>
          </a>

          {/* Botón Resetear Progreso (Exclusivo Administrador / Coach) */}
          <button
            onClick={() => setIsResetProgressModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 hover:text-white border border-red-800/60 rounded-xl text-xs font-bold transition shadow-sm"
            title="Resetear historial, series y métricas de este alumno (Solo Coach)"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-400" />
            <span>Resetear Progreso</span>
          </button>

          {/* Botón Eliminar Alumno */}
          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gray-900 hover:bg-red-950 text-gray-400 hover:text-red-400 border border-gray-800 hover:border-red-800/80 rounded-xl text-xs font-bold transition"
            title="Eliminar este alumno del gimnasio"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eliminar</span>
          </button>

          <span className="text-xs text-gray-400 bg-gray-900 border border-gray-800 px-3 py-2 rounded-xl font-mono">
            Unidad: <strong>{client.weight_unit_preference.toUpperCase()}</strong>
          </span>
        </div>
      </div>

      {/* Banner de Aviso si la Membresía está Inactiva */}
      {client.is_active === false && (
        <div className="bg-red-950/40 border border-red-800/60 rounded-2xl p-4 flex items-start space-x-3 text-xs text-red-200">
          <ShieldAlert className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-red-300 block text-sm">
              Membresía Inactiva / En Pausa
            </span>
            <p className="text-red-300/80 leading-relaxed">
              Este alumno puede ingresar a la aplicación pero tiene bloqueadas sus rutinas de entrenamiento, el registro interactivo de series y sus gráficos de progreso. Haz clic en <strong>"Membresía Inactiva (Reactivar)"</strong> arriba para restablecer su acceso completo de inmediato.
            </p>
          </div>
        </div>
      )}

      {/* Sección de Rutinas de Entrenamiento Asignadas */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-900 to-gray-950 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-5">
        {/* Cabecera de la Sección */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-800/80">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400 shrink-0">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-lg font-black text-white">
                  Rutinas de Entrenamiento Asignadas
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  {assignedRoutines.length} {assignedRoutines.length === 1 ? 'Rutina' : 'Rutinas'}
                </span>
                {assignedRoutines.some((r) => r.is_active) && (
                  <span className="hidden md:inline-flex items-center space-x-1 px-2 py-0.5 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    <span>
                      {assignedRoutines.filter((r) => r.is_active).length} activa(s)
                    </span>
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Gestiona, modifica ejercicios, pausa o asigna nuevas rutinas para este alumno.
              </p>
            </div>
          </div>

          {/* Botones de acción principales */}
          <div className="flex items-center space-x-2.5 self-start sm:self-auto flex-wrap">
            <Link
              href={`/admin/routines/new?clientId=${client.id}`}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold border border-gray-700 transition shadow-sm"
              title="Diseñar una rutina desde cero para este alumno"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Crear desde Cero</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 transition"
              title="Asignar una rutina maestra o plantilla existente"
            >
              <Plus className="w-4 h-4" />
              <span>+ Asignar Rutina</span>
            </button>
          </div>
        </div>

        {/* Lista de Rutinas Asignadas */}
        {assignedRoutines.length === 0 ? (
          <div className="p-8 text-center bg-gray-950/60 border border-gray-800/80 rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center mx-auto text-gray-500">
              <Dumbbell className="w-6 h-6" />
            </div>
            <div className="space-y-1 max-w-md mx-auto">
              <h4 className="text-sm font-black text-white">Sin rutinas asignadas</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Este alumno no tiene ninguna rutina de entrenamiento adjudicada actualmente. Asigna una de las 11 Rutinas Maestras o diseña un programa personalizado.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsRoutineModalOpen(true)}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black shadow-lg shadow-emerald-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Asignar Primera Rutina</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {assignedRoutines.map((routine) => {
              const isExpanded = expandedRoutineIds.has(routine.id);
              const totalDays = routine.routine_days?.length || 0;
              const totalExercises =
                routine.routine_days?.reduce(
                  (acc: number, d: any) => acc + (d.routine_exercises?.length || 0),
                  0
                ) || 0;
              const totalSets =
                routine.routine_days?.reduce(
                  (acc: number, d: any) =>
                    acc +
                    (d.routine_exercises?.reduce(
                      (sAcc: number, rx: any) => sAcc + (rx.routine_exercise_sets?.length || 0),
                      0
                    ) || 0),
                  0
                ) || 0;

              // Detectar grupos musculares de esta rutina
              const detectedGroups = new Set<string>();
              routine.routine_days?.forEach((d: any) => {
                const dayGroup = STANDARD_MUSCLE_GROUPS.find(
                  (mg) =>
                    (d.muscle_group && d.muscle_group.toLowerCase() === mg.id.toLowerCase()) ||
                    d.name?.toLowerCase().includes(mg.id.toLowerCase())
                );
                if (dayGroup) detectedGroups.add(dayGroup.id);

                d.routine_exercises?.forEach((rx: any) => {
                  const exMg = rx.exercise?.muscle_group;
                  const match = STANDARD_MUSCLE_GROUPS.find(
                    (m) => exMg && exMg.toLowerCase().includes(m.id.toLowerCase())
                  );
                  if (match) detectedGroups.add(match.id);
                });
              });

              const isToggling = togglingRoutineId === routine.id;
              const isDeleting = deletingRoutineId === routine.id;

              return (
                <div
                  key={routine.id}
                  className={`border rounded-2xl transition overflow-hidden ${
                    routine.is_active
                      ? 'bg-gray-950/80 border-gray-800 hover:border-gray-700'
                      : 'bg-gray-950/40 border-gray-800/40 opacity-75 hover:opacity-100'
                  }`}
                >
                  {/* Fila Principal de la Rutina */}
                  <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1 min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <h4 className="text-base font-black text-white line-clamp-1">
                          {routine.title}
                        </h4>

                        {routine.is_active ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                            ACTIVA
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                            PAUSADA
                          </span>
                        )}

                        {/* Badges de Grupos Musculares */}
                        {Array.from(detectedGroups).map((gId) => {
                          const def = STANDARD_MUSCLE_GROUPS.find((m) => m.id === gId);
                          return (
                            <span
                              key={gId}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold border"
                              style={{
                                backgroundColor: def?.badgeBg || 'rgba(56, 189, 248, 0.15)',
                                borderColor: def?.badgeBorder || 'rgba(56, 189, 248, 0.35)',
                                color: def?.color || '#38bdf8',
                              }}
                            >
                              {def?.nameEs || gId}
                            </span>
                          );
                        })}
                      </div>

                      {routine.description && (
                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                          {routine.description}
                        </p>
                      )}

                      {/* Pills de Métricas */}
                      <div className="flex items-center space-x-3 text-xs text-gray-300 flex-wrap gap-y-1">
                        <span className="bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 font-semibold">
                          📅 {totalDays} {totalDays === 1 ? 'Día de entreno' : 'Días de entreno'}
                        </span>
                        <span className="bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 font-semibold">
                          🏋️ {totalExercises} {totalExercises === 1 ? 'Ejercicio' : 'Ejercicios'}
                        </span>
                        <span className="bg-gray-900 px-2.5 py-1 rounded-lg border border-gray-800 font-semibold">
                          🔢 {totalSets} Series efectivas
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleExpandRoutine(routine.id)}
                          className="text-emerald-400 hover:text-emerald-300 text-xs font-bold inline-flex items-center space-x-1 ml-1 transition"
                        >
                          <span>{isExpanded ? 'Ocultar Ejercicios' : 'Ver Ejercicios'}</span>
                          {isExpanded ? (
                            <ChevronUp className="w-3.5 h-3.5" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Barra de Acciones por Rutina */}
                    <div className="flex items-center space-x-2 shrink-0 self-start md:self-auto flex-wrap gap-y-1">
                      {/* Alternar Activa / Pausada */}
                      <button
                        type="button"
                        onClick={() => handleToggleRoutineActive(routine.id, routine.is_active)}
                        disabled={isToggling}
                        className={`inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition ${
                          routine.is_active
                            ? 'bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border-amber-800/60'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 border-emerald-800/60'
                        }`}
                        title={routine.is_active ? 'Pausar esta rutina' : 'Activar esta rutina'}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : routine.is_active ? (
                          <>
                            <Pause className="w-3.5 h-3.5" />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>Activar</span>
                          </>
                        )}
                      </button>

                      {/* Editar Rutina */}
                      <Link
                        href={`/admin/routines/${routine.id}/edit`}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold border border-gray-700 transition"
                        title="Modificar ejercicios, series, pesos y notas para este alumno"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Modificar</span>
                      </Link>

                      {/* Eliminar Rutina Asignada */}
                      <button
                        type="button"
                        onClick={() => handleDeleteAssignedRoutine(routine.id, routine.title)}
                        disabled={isDeleting}
                        className="inline-flex items-center space-x-1.5 px-3 py-2 bg-red-950/30 hover:bg-red-900/60 text-red-400 hover:text-red-200 rounded-xl text-xs font-bold border border-red-800/40 transition"
                        title="Eliminar esta rutina del alumno"
                      >
                        {isDeleting ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                        <span>Eliminar</span>
                      </button>
                    </div>
                  </div>

                  {/* Acordeón Desplegable con el Detalle de Ejercicios */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-2 border-t border-gray-800/80 bg-gray-950/40 space-y-4">
                      {routine.routine_days?.map((day: any) => (
                        <div key={day.id} className="space-y-2">
                          <div className="flex items-center space-x-2 text-xs font-black text-emerald-400 uppercase tracking-wider">
                            <span>{day.name}</span>
                            <span className="text-gray-600">•</span>
                            <span className="text-gray-400 lowercase font-normal">
                              {day.routine_exercises?.length || 0} ejercicio(s)
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {day.routine_exercises?.map((rx: any, rxIdx: number) => {
                              const setsCount = rx.routine_exercise_sets?.length || 0;
                              const firstSet = rx.routine_exercise_sets?.[0];
                              const kg = firstSet?.target_weight_kg || 0;
                              const reps = firstSet?.target_reps || 10;

                              return (
                                <div
                                  key={rx.id || rxIdx}
                                  className="p-3 bg-gray-900 border border-gray-800 rounded-xl space-y-1"
                                >
                                  <div className="flex items-start justify-between gap-2">
                                    <span className="text-xs font-bold text-white line-clamp-1">
                                      {rx.exercise?.name || 'Ejercicio'}
                                    </span>
                                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 shrink-0">
                                      {setsCount} x {reps} reps ({kg} kg)
                                    </span>
                                  </div>
                                  {rx.notes && (
                                    <p className="text-[10.5px] text-gray-400 line-clamp-1 font-mono">
                                      {rx.notes}
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selector de Línea de Tiempo y Periodo en Fechas (Desde - Hasta) */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">
                Periodo de Análisis y Línea de Tiempo
              </h3>
              <p className="text-xs text-gray-400">
                Selecciona el intervalo de fechas para filtrar gráficos de progreso, tonelaje y sesiones.
              </p>
            </div>
          </div>

          {/* Badge del Periodo Activo */}
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-950 border border-emerald-800/40 text-emerald-300 rounded-xl text-xs font-bold self-start md:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>{activeDateRange.label}</span>
          </div>
        </div>

        {/* Presets y Selector Desde - Hasta */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-2 border-t border-gray-800/80">
          {/* Botones de Preset */}
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 lg:pb-0">
            {[
              { id: '7d', label: '7 Días' },
              { id: '30d', label: '30 Días' },
              { id: '90d', label: '90 Días (3M)' },
              { id: '1y', label: '1 Año' },
              { id: 'all', label: 'Todo el Historial' },
              { id: 'custom', label: 'Personalizado' },
            ].map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setTimelinePreset(preset.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                  timelinePreset === preset.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/40'
                    : 'bg-gray-800/70 text-gray-400 hover:text-white hover:bg-gray-800'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Inputs de Fechas Desde - Hasta */}
          <div className="flex items-center space-x-2 text-xs flex-wrap gap-y-2">
            <div className="flex items-center space-x-1.5 bg-gray-950 border border-gray-800 px-2.5 py-1.5 rounded-xl">
              <span className="text-gray-500 font-semibold">Desde:</span>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => {
                  setCustomStartDate(e.target.value);
                  setTimelinePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none font-mono text-xs cursor-pointer"
              />
            </div>

            <div className="flex items-center space-x-1.5 bg-gray-950 border border-gray-800 px-2.5 py-1.5 rounded-xl">
              <span className="text-gray-500 font-semibold">Hasta:</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => {
                  setCustomEndDate(e.target.value);
                  setTimelinePreset('custom');
                }}
                className="bg-transparent text-white focus:outline-none font-mono text-xs cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Tarjetas de Resumen del Periodo Seleccionado */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-gray-400 uppercase block">
              Entrenamientos
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-white">{filteredSessions.length}</span>
              <span className="text-[10px] text-gray-500">en periodo</span>
            </div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-emerald-400 uppercase block">
              Completadas
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">
                {filteredSessions.filter((s) => s.status === 'completed').length}
              </span>
              <span className="text-[10px] text-gray-500">
                ({filteredSessions.length > 0
                  ? Math.round(
                      (filteredSessions.filter((s) => s.status === 'completed').length /
                        filteredSessions.length) *
                        100
                    )
                  : 0}
                %)
              </span>
            </div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-sky-400 uppercase block">
              Volumen Acumulado
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-sky-400">
                {formatWeight(
                  filteredTonnageHistory.reduce((acc, t) => acc + (t.tonnage_kg || 0), 0)
                )}
              </span>
            </div>
          </div>

          <div className="bg-gray-950/80 border border-gray-800/80 rounded-2xl p-3.5">
            <span className="text-[10px] font-bold text-amber-400 uppercase block">
              Calorías Estimadas
            </span>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-2xl font-black text-amber-400">
                {filteredSessions.reduce((acc, s) => {
                  try {
                    const p = JSON.parse(s.notes || '{}');
                    return acc + (p?.calories_burned || 0);
                  } catch {
                    return acc;
                  }
                }, 0)}{' '}
                <span className="text-xs font-normal">kcal</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Live Monitor + Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Izquierda: Monitoreo en Vivo (Realtime) */}
        <div className="lg:col-span-1 space-y-6">
          <LiveWorkoutMonitor clientId={client.id} />

          {/* Tarjeta de Resumen Rápido */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Datos Generales del Alumno
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-500">ID Usuario:</span>
                <span className="text-gray-300 font-mono text-[11px] truncate max-w-[140px]">
                  {client.id}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-500">Registrado el:</span>
                <span className="text-gray-300 font-medium">
                  {activityInfo?.registeredFormatted || new Date(client.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-500">Última Actividad:</span>
                <span className="text-gray-200 font-bold">
                  {activityInfo?.lastActiveFormatted || 'Sin registros'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-500">Total Sesiones Históricas:</span>
                <span className="text-emerald-400 font-bold">{sessions.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Gráficos Recharts (Cumplimiento, Tonelaje, 1RM) */}
        <div className="lg:col-span-2">
          <ClientAnalyticsCharts
            sessions={filteredSessions}
            tonnageHistory={filteredTonnageHistory}
            oneRMHistory={filteredOneRMHistory}
            periodLabel={activeDateRange.label}
          />
        </div>
      </div>

      {/* Historial Detallado de Sesiones de Entrenamiento Registradas */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                Historial de Entrenamientos Registrados
              </h3>
              <p className="text-xs text-gray-400">
                Sesiones completadas desde la app móvil con desglose de tiempos y series.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-gray-400 bg-gray-950 px-3 py-1.5 rounded-xl border border-gray-800">
            Mostrando: <strong className="text-emerald-400">{filteredSessions.length}</strong> de {sessions.length} sesiones ({activeDateRange.label})
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="py-10 text-center text-gray-500 text-xs border border-dashed border-gray-800 rounded-2xl">
            Este alumno todavía no tiene sesiones de entrenamiento registradas en la base de datos.
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="py-10 text-center text-gray-400 text-xs border border-dashed border-gray-800 rounded-2xl space-y-1">
            <p className="font-bold text-gray-300">Sin entrenamientos en el periodo seleccionado</p>
            <p className="text-gray-500">
              No hay sesiones registradas entre {activeDateRange.start} y {activeDateRange.end}. Prueba seleccionando "Todo el Historial" o un rango más amplio.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-800 text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-3">Fecha</th>
                  <th className="py-3 px-3">Rutina / Día</th>
                  <th className="py-3 px-3">Estado</th>
                  <th className="py-3 px-3">Tiempo Total</th>
                  <th className="py-3 px-3">Ejercicio Activo</th>
                  <th className="py-3 px-3">Descanso</th>
                  <th className="py-3 px-3">Cumplimiento</th>
                  <th className="py-3 px-3">Volumen</th>
                  <th className="py-3 px-3">Calorías</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredSessions.slice().reverse().map((s) => {
                  let parsed: any = null;
                  if (s.notes) {
                    try {
                      parsed = JSON.parse(s.notes);
                    } catch (_) {}
                  }

                  const totalMin = s.duration_minutes || 0;
                  const restMin = parsed?.rest_minutes ?? Math.round((parsed?.rest_seconds || 0) / 60);
                  const exerciseMin = parsed?.exercise_minutes ?? (totalMin > restMin ? totalMin - restMin : totalMin);
                  const dayTitle = parsed?.dayName || (typeof s.notes === 'string' && !parsed ? s.notes : 'Entrenamiento');
                  const volumeVal = parsed?.volume_kg ? formatWeight(parsed.volume_kg) : '---';
                  const caloriesVal = parsed?.calories_burned ? `${parsed.calories_burned} kcal` : '---';

                  return (
                    <tr key={s.id} className="hover:bg-gray-800/40 transition">
                      <td className="py-3.5 px-3 font-semibold text-white whitespace-nowrap">
                        {s.scheduled_date}
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-200">
                        {dayTitle}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase border ${
                            s.status === 'completed'
                              ? 'bg-emerald-950 text-emerald-400 border-emerald-800/50'
                              : 'bg-amber-950 text-amber-400 border-amber-800/50'
                          }`}
                        >
                          {s.status === 'completed' ? 'Completado' : 'Parcial'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-white whitespace-nowrap">
                        {totalMin} min
                      </td>
                      <td className="py-3.5 px-3 font-bold text-sky-400 whitespace-nowrap">
                        {exerciseMin} min
                      </td>
                      <td className="py-3.5 px-3 font-bold text-purple-400 whitespace-nowrap">
                        {restMin} min
                      </td>
                      <td className="py-3.5 px-3 font-bold text-emerald-400 whitespace-nowrap">
                        {s.completion_rate}%
                      </td>
                      <td className="py-3.5 px-3 font-mono text-gray-300 whitespace-nowrap">
                        {volumeVal}
                      </td>
                      <td className="py-3.5 px-3 text-amber-400 font-semibold whitespace-nowrap">
                        {caloriesVal}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ===================================================== */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2.5 bg-red-950/70 border border-red-800 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">¿Eliminar alumno?</h3>
                <p className="text-xs text-red-400 font-bold">{client.full_name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Esta acción revocará su acceso a la aplicación móvil y desactivará sus rutinas asociadas. ¿Deseas continuar?
            </p>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                disabled={deletingClient}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={deletingClient}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/50 transition disabled:opacity-50"
              >
                {deletingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingClient ? 'Eliminando...' : 'Sí, Eliminar Alumno'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {client && (
        <ClientRoutineModal
          isOpen={isRoutineModalOpen}
          onClose={() => setIsRoutineModalOpen(false)}
          client={{ ...client, clientCode }}
          activeRoutineTitle={activeRoutine?.title || null}
          onSuccess={() => {
            loadClientData();
          }}
        />
      )}

      {client && (
        <ResetProgressModal
          isOpen={isResetProgressModalOpen}
          onClose={() => setIsResetProgressModalOpen(false)}
          clientId={client.id}
          clientName={client.full_name}
          clientCode={clientCode}
          totalSessions={sessions.length}
          onSuccess={() => {
            setSessions([]);
            setTonnageHistory([]);
            setOneRMHistory([]);
            loadClientData();
          }}
        />
      )}
    </div>
  );
}
