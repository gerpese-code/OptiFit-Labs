'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, WorkoutSession } from '@/types/database';
import { useUnit } from '@/context/UnitContext';
import { getClientActivityInfo, ClientActivityInfo } from '@/lib/utils/activity';
import Link from 'next/link';
import {
  Users,
  Dumbbell,
  CalendarDays,
  Activity,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  Clock,
  Calendar,
} from 'lucide-react';

interface ClientWithActivity extends Profile {
  activityInfo: ClientActivityInfo;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const { unit } = useUnit();

  const [clients, setClients] = useState<ClientWithActivity[]>([]);
  const [exercisesCount, setExercisesCount] = useState(0);
  const [routinesCount, setRoutinesCount] = useState(0);
  const [todaySessions, setTodaySessions] = useState<WorkoutSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOverviewData = async () => {
      setLoading(true);
      try {
        // 1. Clientes
        const { data: clientsData } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', '1e838c07-f020-4694-b0f7-b4d44bb0b61a') // Excluir bot/cuenta técnica admin@optifitlabs.com
          .is('deleted_at', null)
          .order('created_at', { ascending: false });

        const rawClients: Profile[] = clientsData || [];

        // 2. Sesiones para calcular última actividad
        const { data: sessionsDataAll } = await supabase
          .from('workout_sessions')
          .select('*')
          .order('created_at', { ascending: false });

        const allSessions: WorkoutSession[] = sessionsDataAll || [];

        const enrichedClients: ClientWithActivity[] = rawClients.map((client) => {
          const clientSession = allSessions.find((s) => s.client_id === client.id) || null;
          const activityInfo = getClientActivityInfo(client, clientSession);
          return {
            ...client,
            activityInfo,
          };
        });

        // Ordenar primero alumnos en línea / activos hoy
        enrichedClients.sort((a, b) => {
          if (a.activityInfo.isOnline && !b.activityInfo.isOnline) return -1;
          if (!a.activityInfo.isOnline && b.activityInfo.isOnline) return 1;
          return new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime();
        });

        setClients(enrichedClients);

        // 3. Conteo de ejercicios
        const { count: exCount } = await supabase
          .from('exercises')
          .select('*', { count: 'exact', head: true });

        setExercisesCount(exCount || 0);

        // 4. Conteo de rutinas
        const { count: rtCount } = await supabase
          .from('routines')
          .select('*', { count: 'exact', head: true });

        setRoutinesCount(rtCount || 0);

        // 5. Sesiones de hoy
        const today = new Date().toISOString().split('T')[0];
        const { data: sessionsData } = await supabase
          .from('workout_sessions')
          .select('*')
          .eq('scheduled_date', today);

        setTodaySessions((sessionsData as WorkoutSession[]) || []);
      } catch (err) {
        console.error('Error al cargar datos del dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    loadOverviewData();
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-950/70 via-[#05140b] to-[#020704] border border-emerald-800/40 rounded-3xl p-6 lg:p-8 shadow-[0_4px_30px_rgba(0,0,0,0.7)] relative overflow-hidden after:content-[''] after:absolute after:top-0 after:left-0 after:right-0 after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-[#00ff87]/60 after:to-transparent">
        <span className="text-xs font-bold text-[#00ff87] uppercase tracking-wider">
          Panel de Control Central
        </span>
        <h2 className="text-2xl lg:text-3xl font-black text-white mt-1">
          Bienvenido, Entrenador
        </h2>
        <p className="text-sm text-gray-400 mt-2 max-w-2xl">
          Monitorea el progreso de tus alumnos en vivo, planifica mesociclos y administra
          la prescripción nutricional en tiempo real con estandarización en {unit.toUpperCase()}.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-[#040f08]/90 hover:bg-[#07190d] border border-emerald-950/80 hover:border-emerald-700/50 rounded-2xl p-5 shadow-xl shadow-black/50 backdrop-blur-sm transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Alumnos Activos
            </span>
            <div className="p-2 bg-emerald-950/60 text-[#00ff87] rounded-xl border border-emerald-800/40 shadow-[0_0_10px_rgba(0,255,135,0.15)]">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{clients.length}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Registrados con rol 'client'
          </span>
        </div>

        <div className="bg-[#040f08]/90 hover:bg-[#07190d] border border-emerald-950/80 hover:border-emerald-700/50 rounded-2xl p-5 shadow-xl shadow-black/50 backdrop-blur-sm transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Ejercicios en Catálogo
            </span>
            <div className="p-2 bg-sky-950/60 text-sky-400 rounded-xl border border-sky-800/40">
              <Dumbbell className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{exercisesCount}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Videos, GIFs y fotos multimedia
          </span>
        </div>

        <div className="bg-[#040f08]/90 hover:bg-[#07190d] border border-emerald-950/80 hover:border-emerald-700/50 rounded-2xl p-5 shadow-xl shadow-black/50 backdrop-blur-sm transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Rutinas Creadas
            </span>
            <div className="p-2 bg-purple-950/60 text-purple-400 rounded-xl border border-purple-800/40">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">{routinesCount}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Plantillas y planes asignados
          </span>
        </div>

        <div className="bg-[#040f08]/90 hover:bg-[#07190d] border border-emerald-950/80 hover:border-emerald-700/50 rounded-2xl p-5 shadow-xl shadow-black/50 backdrop-blur-sm transition-all group relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Sesiones de Hoy
            </span>
            <div className="p-2 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
              <Activity className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-3">
            {todaySessions.length}
          </p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Planificadas en el calendario
          </span>
        </div>
      </div>

      {/* Lista de Alumnos para monitoreo */}
      <div className="bg-[#040f08]/90 border border-emerald-950/80 rounded-2xl p-6 shadow-2xl shadow-black/60 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-white">
              Expedientes y Monitoreo de Alumnos
            </h3>
            <p className="text-xs text-gray-400">
              Supervisa la última vez que abrieron la app o registraron series, y su fecha de registro.
            </p>
          </div>

          <Link
            href="/admin/clients"
            className="text-xs font-bold text-[#00ff87] hover:text-emerald-300 flex items-center space-x-1 bg-emerald-950/40 hover:bg-emerald-950 px-3 py-1.5 rounded-xl border border-emerald-800/40 transition"
          >
            <span>Directorio Completo ({clients.length})</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="h-40 flex items-center justify-center space-x-2 text-gray-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[#00ff87]" />
            <span>Cargando alumnos y estados de actividad...</span>
          </div>
        ) : clients.length === 0 ? (
          <div className="py-12 text-center text-xs text-gray-500">
            Aún no hay alumnos registrados. Los nuevos registros aparecerán aquí automáticamente vía trigger.
          </div>
        ) : (
          <div className="divide-y divide-emerald-950/50">
            {clients.map((client) => (
              <div
                key={client.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#07170e]/70 px-3 rounded-xl transition"
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-[#00ff87] font-black flex items-center justify-center text-sm border border-emerald-500/30 shadow-[0_0_10px_rgba(0,255,135,0.1)]">
                      {client.full_name.charAt(0).toUpperCase()}
                    </div>
                    {client.activityInfo.isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#00ff87] border-2 border-[#040f08] shadow-[0_0_6px_#00ff87]"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="text-sm font-bold text-white">
                        {client.full_name}
                      </h4>
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md border text-[10px] font-bold ${client.activityInfo.badgeClass}`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${client.activityInfo.dotColor}`}
                        ></span>
                        <span>{client.activityInfo.label}</span>
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 text-[11px] text-gray-500 font-mono mt-0.5">
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3 h-3 text-gray-600" />
                        <span>Reg: {client.activityInfo.registeredFormatted}</span>
                      </span>
                      <span>•</span>
                      <span>Pref: {client.weight_unit_preference.toUpperCase()}</span>
                      <span>•</span>
                      <span className="text-gray-400">
                        {client.activityInfo.lastActiveFormatted}
                      </span>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/admin/clients/${client.id}`}
                  className="inline-flex items-center justify-center px-4 py-2 bg-[#06160d] hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-900/50 hover:border-emerald-500 text-xs font-bold rounded-xl transition space-x-1.5 self-start sm:self-auto"
                >
                  <span>Ver Expediente y Monitoreo</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
