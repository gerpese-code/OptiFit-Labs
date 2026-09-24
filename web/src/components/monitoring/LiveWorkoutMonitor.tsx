'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { WorkoutLogSet, WorkoutSession } from '@/types/database';
import { useUnit } from '@/context/UnitContext';
import { Activity, CheckCircle2, Dumbbell, Radio, Flame } from 'lucide-react';

interface LiveWorkoutMonitorProps {
  clientId: string;
  initialSession?: WorkoutSession | null;
  exerciseMap?: Record<string, { name: string; muscleGroup: string; imgUrl: string | null }>;
}

export default function LiveWorkoutMonitor({
  clientId,
  initialSession = null,
  exerciseMap,
}: LiveWorkoutMonitorProps) {
  const supabase = createClient();
  const { formatWeight, unit } = useUnit();

  const [activeSession, setActiveSession] = useState<WorkoutSession | null>(
    initialSession
  );
  const [liveSets, setLiveSets] = useState<WorkoutLogSet[]>([]);
  const [lastEventMsg, setLastEventMsg] = useState<string | null>(null);

  // Cargar sesión del día si existe
  useEffect(() => {
    const fetchTodaySession = async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data: session } = await supabase
        .from('workout_sessions')
        .select('*')
        .eq('client_id', clientId)
        .eq('scheduled_date', today)
        .maybeSingle();

      if (session) {
        setActiveSession(session as WorkoutSession);

        // Cargar series registradas para esta sesión
        const { data: sets } = await supabase
          .from('workout_log_sets')
          .select('*')
          .eq('session_id', session.id)
          .order('created_at', { ascending: true });

        if (sets) {
          setLiveSets(sets as WorkoutLogSet[]);
        }
      }
    };

    fetchTodaySession();
  }, [clientId]);

  // Suscripción Realtime a workout_sessions y workout_log_sets
  useEffect(() => {
    const channel = supabase
      .channel(`client-live-workout-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'workout_sessions',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const updated = payload.new as WorkoutSession;
            setActiveSession(updated);
            setLastEventMsg(
              `Estado de sesión actualizado: ${updated.status.toUpperCase()} (${new Date().toLocaleTimeString()})`
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'workout_log_sets',
        },
        (payload) => {
          const newSet = payload.new as WorkoutLogSet;
          if (activeSession && newSet.session_id === activeSession.id) {
            setLiveSets((prev) => [...prev, newSet]);
            const exName = (newSet.routine_exercise_set_id && exerciseMap?.[newSet.routine_exercise_set_id]?.name) || 'Ejercicio';
            setLastEventMsg(
              `¡Nueva serie! [${exName}] #${newSet.set_number}: ${newSet.reps_completed} reps @ ${newSet.weight_logged} ${newSet.unit_logged}`
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'workout_log_sets',
        },
        (payload) => {
          const updatedSet = payload.new as WorkoutLogSet;
          if (activeSession && updatedSet.session_id === activeSession.id) {
            setLiveSets((prev) =>
              prev.map((s) => (s.id === updatedSet.id ? updatedSet : s))
            );
            setLastEventMsg(
              `Serie #${updatedSet.set_number} actualizada (${new Date().toLocaleTimeString()})`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, activeSession]);

  const completedSetsCount = liveSets.filter((s) => s.is_completed).length;

  let parsedNotes: any = null;
  if (activeSession?.notes) {
    try {
      parsedNotes = JSON.parse(activeSession.notes);
    } catch (_) {}
  }

  const durationMin = activeSession?.duration_minutes || 0;
  const restMin = parsedNotes?.rest_minutes ?? Math.round((parsedNotes?.rest_seconds || 0) / 60);
  const exerciseMin = parsedNotes?.exercise_minutes ?? (durationMin > restMin ? durationMin - restMin : durationMin);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-xl space-y-4">
      {/* Header con indicador de Realtime */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-emerald-950 text-emerald-400 border border-emerald-800/50 rounded-lg">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center">
              Monitoreo en Tiempo Real
              <span className="ml-2 px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                LIVE
              </span>
            </h3>
            <p className="text-[11px] text-gray-400">
              Suscrito vía Supabase Realtime a cambios de series y sesiones.
            </p>
          </div>
        </div>

        {activeSession && (
          <div className="text-right">
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-lg uppercase ${
                activeSession.status === 'completed'
                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                  : activeSession.status === 'partial'
                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                  : 'bg-gray-800 text-gray-400'
              }`}
            >
              {activeSession.status}
            </span>
          </div>
        )}
      </div>

      {/* Ticker de último evento recibido en vivo */}
      {lastEventMsg && (
        <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl px-3 py-2 flex items-center space-x-2 text-xs text-emerald-300 animate-fadeIn">
          <Activity className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span className="font-mono text-[11px]">{lastEventMsg}</span>
        </div>
      )}

      {/* Contenido de la sesión activa */}
      {!activeSession ? (
        <div className="py-8 text-center text-gray-500 text-xs border border-dashed border-gray-800 rounded-xl">
          El alumno no tiene sesiones activas registradas para hoy.
        </div>
      ) : (
        <div className="space-y-4">
          {/* Métricas Principales */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-center">
              <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                Total
              </span>
              <p className="text-sm font-bold text-white mt-0.5">
                {durationMin} min
              </p>
            </div>
            <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-center">
              <span className="text-[9px] text-sky-400 uppercase font-bold tracking-wider">
                Ejercicio
              </span>
              <p className="text-sm font-bold text-sky-400 mt-0.5">
                {exerciseMin} min
              </p>
            </div>
            <div className="bg-gray-950 p-2.5 rounded-xl border border-gray-800 text-center">
              <span className="text-[9px] text-purple-400 uppercase font-bold tracking-wider">
                Descanso
              </span>
              <p className="text-sm font-bold text-purple-400 mt-0.5">
                {restMin} min
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-gray-950/80 p-2 rounded-xl border border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 font-semibold">
                Cumplimiento:
              </span>
              <span className="text-xs font-bold text-emerald-400 ml-1.5">
                {activeSession.completion_rate}%
              </span>
            </div>
            <div className="bg-gray-950/80 p-2 rounded-xl border border-gray-800 text-center">
              <span className="text-[10px] text-gray-400 font-semibold">
                Series:
              </span>
              <span className="text-xs font-bold text-amber-400 ml-1.5">
                {completedSetsCount} / {liveSets.length}
              </span>
            </div>
          </div>

          {/* Feed de series registradas */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              Registro en Directo de Series
            </h4>

            {liveSets.length === 0 ? (
              <p className="text-xs text-gray-500 py-3 text-center">
                Esperando que el alumno inicie su primera serie...
              </p>
            ) : (
              <div className="divide-y divide-gray-800/80 max-h-56 overflow-y-auto pr-1">
                {liveSets.map((s) => {
                  const exDetails = s.routine_exercise_set_id && exerciseMap ? exerciseMap[s.routine_exercise_set_id] : null;
                  return (
                    <div
                      key={s.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-2.5">
                        <span className="w-6 h-6 rounded-lg bg-gray-950 border border-gray-800 flex items-center justify-center font-mono font-bold text-gray-300 text-[11px]">
                          #{s.set_number}
                        </span>
                        <div>
                          {exDetails && (
                            <span className="block text-[11px] font-medium text-emerald-400">
                              {exDetails.name}
                            </span>
                          )}
                          <span className="font-semibold text-white">
                            {s.reps_completed} reps @ {formatWeight(s.weight_kg)}
                          </span>
                        </div>
                        {s.rpe && (
                          <span className="text-[10px] text-gray-400 font-mono bg-gray-950 px-1.5 py-0.5 rounded border border-gray-800">
                            RPE {s.rpe}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-1.5">
                        {s.is_completed ? (
                          <span className="inline-flex items-center text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded-md border border-emerald-800/40">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Completada
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-500">Pendiente</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
