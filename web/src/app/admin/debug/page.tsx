'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Users,
  Dumbbell,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Zap,
  RefreshCw,
  Copy,
  Sparkles,
} from 'lucide-react';

export default function DebugAdminPage() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [exercises, setExercises] = useState<any[]>([]);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [fixing, setFixing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const loadData = async () => {
    setLoading(true);
    setStatusMsg(null);
    try {
      const { data: pData } = await supabase.from('profiles').select('*');
      setProfiles(pData || []);

      const { data: rData } = await supabase.from('routines').select('*').order('created_at', { ascending: false });
      setRoutines(rData || []);

      const { data: dData } = await supabase.from('routine_days').select('*, routine:routine_id(title)');
      setDays(dData || []);

      const { data: eData } = await supabase.from('exercises').select('id, name').limit(10);
      setExercises(eData || []);
    } catch (err: any) {
      console.error('Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Función mágica para forzar asignación y garantizar que la app móvil la vea
  const handleFixAndAssignToGerman = async (targetClientId?: string) => {
    setFixing(true);
    setStatusMsg(null);
    try {
      // 1. Determinar el cliente Germán (el ID exacto que usa en su teléfono)
      const clientId = targetClientId || '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c';

      // 2. Asegurar que el perfil exista en profiles
      await supabase.from('profiles').upsert({
        id: clientId,
        full_name: 'Germán',
        role: 'client',
      });

      // 3. Tomar la primera rutina creada o crear una completa
      let routineToUse = routines[0];

      // Asignar TODAS las rutinas existentes directamente a este cliente para garantizar que aparezcan
      const { error: updAllErr } = await supabase
        .from('routines')
        .update({
          client_id: clientId,
          is_active: true,
        })
        .neq('id', '00000000-0000-0000-0000-000000000000');

      if (updAllErr) console.warn('Aviso al actualizar rutinas:', updAllErr);

      if (!routineToUse) {
        // Crear una nueva rutina si no había ninguna
        const { data: createdR, error: crErr } = await supabase
          .from('routines')
          .insert({
            title: 'Rutina Pro: Fuerza e Hipertrofia',
            description: 'Programa oficial prescrito por tu Coach',
            client_id: clientId,
            is_active: true,
            is_template: false,
          })
          .select()
          .single();

        if (crErr) throw crErr;
        routineToUse = createdR;
      }

      // 4. Verificar si la rutina tiene días, si no los tiene, crearlos
      const { data: existingDays } = await supabase
        .from('routine_days')
        .select('*')
        .eq('routine_id', routineToUse.id);

      let dayId: string;

      if (!existingDays || existingDays.length === 0) {
        const { data: newDay, error: dayErr } = await supabase
          .from('routine_days')
          .insert({
            routine_id: routineToUse.id,
            name: 'Día 1: Torso y Fuerza',
            day_number: 1,
            order_index: 0,
          })
          .select()
          .single();

        if (dayErr) throw dayErr;
        dayId = newDay.id;

        // Agregar 3 ejercicios
        const { data: exList } = await supabase.from('exercises').select('id, name').limit(3);
        if (exList && exList.length > 0) {
          for (let idx = 0; idx < exList.length; idx++) {
            const ex = exList[idx];
            const { data: rx } = await supabase
              .from('routine_exercises')
              .insert({
                routine_day_id: dayId,
                exercise_id: ex.id,
                order_index: idx,
                notes: 'Control excéntrico 3s y máxima contracción',
              })
              .select()
              .single();

            if (rx) {
              await supabase.from('routine_exercise_sets').insert([
                { routine_exercise_id: rx.id, set_number: 1, target_reps: 12, target_weight_kg: 50, rest_seconds: 90 },
                { routine_exercise_id: rx.id, set_number: 2, target_reps: 10, target_weight_kg: 60, rest_seconds: 90 },
                { routine_exercise_id: rx.id, set_number: 3, target_reps: 8, target_weight_kg: 70, rest_seconds: 120 },
              ]);
            }
          }
        }
      } else {
        dayId = existingDays[0].id;
      }

      // 5. Programar sesión de hoy en el calendario
      const todayStr = new Date().toISOString().split('T')[0];
      await supabase.from('workout_sessions').insert({
        client_id: clientId,
        routine_day_id: dayId,
        scheduled_date: todayStr,
        status: 'partial',
        completion_rate: 0,
      });

      setStatusMsg(`¡ÉXITO! La rutina "${routineToUse.title}" quedó asignada y activa para Germán (ID: ${clientId}). Ya puedes pulsar "Comprobar Nuevamente" en el celular.`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      setStatusMsg(`Error al asignar: ${err.message}`);
    } finally {
      setFixing(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Herramienta de Diagnóstico y Sincronización
          </span>
          <h1 className="text-2xl font-black text-white mt-1">
            Estado de Alumnos y Rutinas en Base de Datos
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Revisa exactamente qué alumnos y qué rutinas existen actualmente en Supabase.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-bold rounded-xl transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualizar Datos
        </button>
      </div>

      {/* Botón de Acción Directa */}
      <div className="bg-gradient-to-r from-emerald-950/70 to-gray-900 border border-emerald-800/40 rounded-3xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center">
              <Zap className="w-4 h-4 mr-1.5" />
              Sincronizador Instantáneo
            </span>
            <h3 className="text-lg font-black text-white mt-1">
              Forzar Asignación de Rutina a Germán (pesedagger@gmail.com)
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-xl">
              Este botón toma tu rutina o genera una con 3 ejercicios del catálogo, vincula los días, series y sesiones con tu usuario de alumno, y la deja lista para que aparezca al segundo en tu teléfono.
            </p>
          </div>

          <button
            onClick={() => handleFixAndAssignToGerman()}
            disabled={fixing}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center shrink-0"
          >
            {fixing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Asignando...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Vincular a Germán Ahora
              </>
            )}
          </button>
        </div>

        {statusMsg && (
          <div
            className={`mt-4 p-4 rounded-xl text-xs font-medium border ${
              statusMsg.startsWith('¡ÉXITO!')
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-red-950/60 border-red-500/40 text-red-300'
            }`}
          >
            {statusMsg}
          </div>
        )}
      </div>

      {/* Tarjeta con Script SQL para Supabase */}
      <div className="bg-gray-900/90 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase flex items-center">
              <Sparkles className="w-4 h-4 mr-1.5" />
              Solución Definitiva (1-Click SQL para Supabase)
            </span>
            <h3 className="text-sm font-bold text-white mt-0.5">
              Script SQL de Asignación y Permisos de Administrador
            </h3>
          </div>
          <button
            onClick={() => {
              const sql = `-- 1. Otorgar rol de Coach / Admin a gerpese.fitness@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gerpese.fitness@gmail.com'
);

-- 2. Vincular todas las rutinas a Germán (pesedagger@gmail.com)
UPDATE public.routines
SET client_id = '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c',
    is_active = true;

UPDATE public.workout_sessions
SET client_id = '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c';

-- 3. Habilitar borrado de cuenta definitivo (Apple Guideline 5.1.1(v))
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`;
              navigator.clipboard.writeText(sql);
              setCopiedSql(true);
              setTimeout(() => setCopiedSql(false), 2000);
            }}
            className="flex items-center px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition shadow"
          >
            {copiedSql ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                ¡Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 mr-1.5" />
                Copiar SQL
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400">
          Si prefieres resolverlo directamente en el backend sin depender del navegador, pega este comando en el <strong>SQL Editor</strong> de Supabase. Otorga rol de Coach a tu cuenta, vincula todas las rutinas existentes a Germán y habilita el borrado de cuenta definitivo.
        </p>
        <pre className="p-4 bg-gray-950 border border-gray-800 rounded-xl text-[11px] text-emerald-300 font-mono overflow-x-auto whitespace-pre">
{`-- 1. Otorgar rol de Coach / Admin a gerpese.fitness@gmail.com
UPDATE public.profiles
SET role = 'admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'gerpese.fitness@gmail.com'
);

-- 2. Vincular todas las rutinas a Germán (pesedagger@gmail.com)
UPDATE public.routines
SET client_id = '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c',
    is_active = true;

UPDATE public.workout_sessions
SET client_id = '8c9ea92f-e2b9-4da1-8378-08cffbdbd86c';

-- 3. Habilitar borrado de cuenta definitivo (Apple Guideline 5.1.1(v))
CREATE OR REPLACE FUNCTION public.delete_own_user_account()
RETURNS VOID AS $$
BEGIN
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`}
        </pre>
      </div>

      {/* Grid de 2 Columnas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Columna 1: Alumnos */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Users className="w-4 h-4 mr-2 text-emerald-400" />
              Alumnos Registrados ({profiles.length})
            </h3>
          </div>

          {profiles.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay alumnos en profiles.</p>
          ) : (
            <div className="space-y-2">
              {profiles.map((p) => (
                <div
                  key={p.id}
                  className="p-3 bg-gray-950 border border-gray-800/80 rounded-xl flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-bold text-white block">{p.full_name}</span>
                    <span className="text-[10px] text-gray-500 font-mono block">ID: {p.id}</span>
                    <span className="text-[10px] text-emerald-400 uppercase font-semibold">Rol: {p.role}</span>
                  </div>

                  <button
                    onClick={() => handleFixAndAssignToGerman(p.id)}
                    disabled={fixing}
                    className="px-3 py-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-800/40 text-emerald-300 text-[11px] font-bold rounded-lg transition"
                  >
                    Asignar Rutina a este Alumno
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Columna 2: Rutinas */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-800 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center">
              <Dumbbell className="w-4 h-4 mr-2 text-sky-400" />
              Rutinas Existentes ({routines.length})
            </h3>
          </div>

          {routines.length === 0 ? (
            <p className="text-xs text-gray-500 py-4 text-center">No hay rutinas creadas en routines.</p>
          ) : (
            <div className="space-y-2">
              {routines.map((r) => {
                const assignedClient = profiles.find((p) => p.id === r.client_id);
                return (
                  <div
                    key={r.id}
                    className="p-3 bg-gray-950 border border-gray-800/80 rounded-xl space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{r.title}</span>
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          r.is_active
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {r.is_active ? 'Activa' : 'Inactiva'}
                      </span>
                    </div>
                    <span className="text-[10px] text-gray-500 font-mono block">ID Rutina: {r.id}</span>
                    <span className="text-[10px] text-sky-400 block font-semibold">
                      Asignada a: {assignedClient ? `${assignedClient.full_name} (${assignedClient.id})` : r.client_id ? r.client_id : 'Plantilla Maestra (Sin asignar)'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
