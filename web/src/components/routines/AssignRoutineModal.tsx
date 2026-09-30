'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, Routine } from '@/types/database';
import { X, Calendar, UserCheck, Loader2, Users, Check, Search } from 'lucide-react';

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
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearch, setClientSearch] = useState('');
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
          .order('full_name', { ascending: true });

        if (error) throw error;
        const list = data || [];
        setClients(list);
        if (initialClientId) {
          setSelectedClientIds([initialClientId]);
        } else {
          setSelectedClientIds([]);
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

  const filteredClients = useMemo(() => {
    if (!clientSearch.trim()) return clients;
    const q = clientSearch.toLowerCase();
    return clients.filter(
      (c) =>
        c.full_name?.toLowerCase().includes(q) ||
        c.client_code?.toLowerCase().includes(q) ||
        (c as any).email?.toLowerCase().includes(q)
    );
  }, [clients, clientSearch]);

  const toggleSelectClient = (id: string) => {
    setSelectedClientIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const handleSelectAllClients = () => {
    if (selectedClientIds.length === filteredClients.length) {
      setSelectedClientIds([]);
    } else {
      setSelectedClientIds(filteredClients.map((c) => c.id));
    }
  };

  if (!isOpen || routinesList.length === 0) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClientIds.length === 0) {
      setErrorMsg('Selecciona al menos un alumno para continuar.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/routines/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: selectedClientIds,
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <UserCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              {routinesList.length === 1
                ? 'Asignar Rutina a Alumno(s)'
                : `Asignar ${routinesList.length} Rutinas a Alumno(s)`}
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

          {/* Rutina(s) seleccionadas */}
          <div>
            <span className="text-xs text-gray-400 block mb-1.5 font-medium">
              {routinesList.length === 1
                ? 'Rutina seleccionada de la Biblioteca Maestra:'
                : `Rutinas seleccionadas (${routinesList.length}):`}
            </span>
            {routinesList.length === 1 ? (
              <div className="text-sm font-bold text-white bg-gray-950 p-3 rounded-xl border border-gray-800 flex items-center justify-between">
                <span>{routinesList[0].title}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-400 border border-purple-800/50">
                  Plantilla Única
                </span>
              </div>
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
            <p className="text-[11px] text-gray-500 mt-1">
              La rutina se asignará a cada alumno seleccionado sin duplicar fichas en la biblioteca maestra.
            </p>
          </div>

          {/* Selección de Alumnos (Soporta individual o múltiple) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-emerald-400" />
                <span>Seleccionar Alumno(s) *</span>
                {selectedClientIds.length > 0 && (
                  <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-black">
                    {selectedClientIds.length} {selectedClientIds.length === 1 ? 'elegido' : 'elegidos'}
                  </span>
                )}
              </label>

              {filteredClients.length > 0 && (
                <button
                  type="button"
                  onClick={handleSelectAllClients}
                  className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition"
                >
                  {selectedClientIds.length === filteredClients.length
                    ? 'Deseleccionar todos'
                    : 'Seleccionar todos'}
                </button>
              )}
            </div>

            {fetchingClients ? (
              <div className="text-xs text-gray-400 flex items-center py-3 bg-gray-950 px-3 rounded-xl border border-gray-800">
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-emerald-400" />
                Cargando lista de alumnos...
              </div>
            ) : clients.length === 0 ? (
              <p className="text-xs text-amber-400 py-2">
                No hay alumnos registrados.
              </p>
            ) : (
              <div className="space-y-2">
                {/* Buscador de alumnos si hay más de 4 */}
                {clients.length > 4 && (
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-gray-500 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Buscar alumno por nombre o email..."
                      value={clientSearch}
                      onChange={(e) => setClientSearch(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                )}

                {/* Lista de Alumnos con Checkbox */}
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-gray-950 rounded-xl border border-gray-800">
                  {filteredClients.length === 0 ? (
                    <p className="text-xs text-gray-500 p-2 text-center">
                      No se encontraron alumnos con ese nombre.
                    </p>
                  ) : (
                    filteredClients.map((c) => {
                      const isSelected = selectedClientIds.includes(c.id);
                      return (
                        <div
                          key={c.id}
                          onClick={() => toggleSelectClient(c.id)}
                          className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition text-xs border ${
                            isSelected
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-white'
                              : 'bg-gray-900/60 border-gray-800/80 text-gray-300 hover:border-gray-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5">
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition ${
                                isSelected
                                  ? 'bg-emerald-500 border-emerald-400 text-gray-950'
                                  : 'border-gray-700 bg-gray-950'
                              }`}
                            >
                              {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>
                            <span className="font-semibold">{c.full_name}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-mono">
                            {c.weight_unit_preference?.toUpperCase() || 'KG'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Fecha de inicio */}
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

          {/* Reemplazar rutinas anteriores */}
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

          {/* Botones de acción */}
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
              disabled={loading || selectedClientIds.length === 0}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Asignando...
                </>
              ) : selectedClientIds.length === 0 ? (
                'Selecciona al menos un alumno'
              ) : (
                `Asignar a ${selectedClientIds.length} ${
                  selectedClientIds.length === 1 ? 'Alumno' : 'Alumnos'
                }`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
