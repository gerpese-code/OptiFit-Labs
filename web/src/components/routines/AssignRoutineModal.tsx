'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Routine } from '@/types/database';
import { X, Calendar, UserCheck, Loader2 } from 'lucide-react';

interface AssignRoutineModalProps {
  routine?: Routine | null;
  routines?: Routine[];
  isOpen: boolean;
  initialClientId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignRoutineModal({
  routine,
  routines,
  isOpen,
  initialClientId,
  onClose,
  onSuccess,
}: AssignRoutineModalProps) {
  const supabase = createClient();

  const routinesList = useMemo(() => {
    if (routines && routines.length > 0) return routines;
    if (routine) return [routine];
    return [];
  }, [routines, routine]);

  const [clients, setClients] = useState<Profile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    const fetchClients = async () => {
      setFetchingClients(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .neq('id', '1e838c07-f020-4694-b0f7-b4d44bb0b61a') // Excluir bot del sistema admin@optifitlabs.com
          .is('deleted_at', null)
          .order('created_at', { ascending: true });

        if (error) throw error;
        const list = data || [];
        setClients(list);
        if (initialClientId) {
          setSelectedClientId(initialClientId);
        } else if (list.length > 0) {
          setSelectedClientId(list[0].id);
        }
      } catch (err: any) {
        console.error('Error al cargar clientes:', err);
        setErrorMsg('No se pudieron obtener los alumnos registrados.');
      } finally {
        setFetchingClients(false);
      }
    };

    fetchClients();
  }, [isOpen, initialClientId]);

  if (!isOpen || routinesList.length === 0) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMsg('Selecciona un alumno para continuar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/routines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: selectedClientId,
          routineIds: routinesList.map((r: Routine) => r.id),
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
      setErrorMsg(err.message || 'Error al asignar la(s) rutina(s) al alumno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {routinesList.length === 1
                ? 'Asignar Rutina a Alumno'
                : `Asignar ${routinesList.length} Rutinas a Alumno`}
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleAssign} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div>
            <span className="text-xs text-gray-400 block mb-1.5">
              {routinesList.length === 1
                ? 'Rutina seleccionada:'
                : `Rutinas seleccionadas (${routinesList.length}):`}
            </span>
            {routinesList.length === 1 ? (
              <p className="text-sm font-bold text-white bg-gray-950 p-3 rounded-xl border border-gray-800">
                {routinesList[0].title}
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 bg-gray-950 rounded-xl border border-gray-800">
                {routinesList.map((r: Routine) => (
                  <span
                    key={r.id}
                    className="px-2.5 py-1 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs font-bold"
                  >
                    {r.title}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Seleccionar Alumno *
            </label>
            {fetchingClients ? (
              <div className="text-xs text-gray-400 flex items-center py-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-emerald-400" />
                Cargando lista de alumnos...
              </div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-amber-400 py-2">
                No hay alumnos registrados con rol 'client'.
              </p>
            ) : (
              <select
                value={selectedClientId}
                onChange={(e) => setSelectedClientId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name} (ID: {c.id.slice(0, 8)}...) — Pref: {c.weight_unit_preference.toUpperCase()}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5 flex items-center">
              <Calendar className="w-3.5 h-3.5 mr-1 text-emerald-400" />
              Fecha de Inicio Programada *
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Las sesiones de entrenamiento se planificarán a partir de esta fecha.
            </p>
          </div>

          <div>
            <label className="flex items-start space-x-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={replaceExisting}
                onChange={(e) => setReplaceExisting(e.target.checked)}
                className="mt-0.5 rounded bg-gray-950 border-gray-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
              />
              <div>
                <span className="text-xs font-bold text-gray-200 block">
                  Reemplazar otras rutinas activas previas
                </span>
                <span className="text-[11px] text-gray-500 leading-snug block">
                  Desmarca para mantener las rutinas ya asignadas en simultáneo.
                </span>
              </div>
            </label>
          </div>

          <div className="pt-3 border-t border-gray-800 flex justify-end space-x-3">
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
              disabled={loading || clients.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Asignando...
                </>
              ) : (
                `Asignar ${routinesList.length === 1 ? 'Rutina' : `${routinesList.length} Rutinas`}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
