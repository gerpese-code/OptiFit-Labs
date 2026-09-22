'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Loader2,
  CheckCircle2,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';

interface ResetProgressModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  clientCode?: string;
  totalSessions: number;
  onSuccess: () => void;
}

export default function ResetProgressModal({
  isOpen,
  onClose,
  clientId,
  clientName,
  clientCode,
  totalSessions,
  onSuccess,
}: ResetProgressModalProps) {
  const [resetting, setResetting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [confirmedCheckbox, setConfirmedCheckbox] = useState(false);

  if (!isOpen) return null;

  const handleReset = async () => {
    if (!confirmedCheckbox) return;
    setResetting(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/admin/clients/progress-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al resetear el progreso.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al resetear progreso:', err);
      setErrorMsg(err.message || 'Ocurrió un error al procesar el reseteo.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-gray-900 border border-red-900/60 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl relative space-y-5 text-left">
        {/* Cabecera */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-red-950/80 border border-red-800/80 rounded-2xl text-red-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white flex items-center space-x-2">
                <span>Resetear Progreso del Alumno</span>
              </h3>
              <p className="text-xs text-red-400/90 font-medium mt-0.5">
                Acción restringida exclusivamente para Administradores / Coaches
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!resetting) onClose();
            }}
            className="p-1 text-gray-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Destinatario */}
        <div className="p-3.5 bg-gray-950 border border-gray-800 rounded-2xl flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/15 text-emerald-400 font-black flex items-center justify-center text-xs border border-emerald-500/30">
              {clientName.charAt(0).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold text-white block">{clientName}</span>
              <span className="text-[11px] text-gray-500 font-mono">
                ID: {clientId.slice(0, 8)}...
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-red-950/50 border border-red-800/40 text-red-400 text-xs font-mono font-bold rounded-xl">
            {totalSessions} {totalSessions === 1 ? 'sesión registrada' : 'sesiones registradas'}
          </span>
        </div>

        {/* Aviso y Qué se borra */}
        <div className="space-y-3">
          <div className="p-4 bg-red-950/30 border border-red-900/50 rounded-2xl space-y-2 text-xs text-red-200">
            <div className="flex items-center space-x-2 text-red-400 font-black uppercase text-[11px] tracking-wider">
              <AlertTriangle className="w-4 h-4" />
              <span>¿Qué sucederá al confirmar el reseteo?</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-red-200/90 text-xs leading-relaxed">
              <li>
                Se eliminarán <strong>todas las {totalSessions} sesiones de entrenamiento</strong> y sus series registradas.
              </li>
              <li>
                Los <strong>gráficos de tonelaje, 1RM y cumplimiento</strong> volverán a 0.
              </li>
              <li>
                Se reiniciarán a <strong>cero (0x)</strong> los contadores de veces completadas de cada grupo muscular.
              </li>
              <li>
                Se eliminarán los registros de <strong>peso corporal</strong> del alumno.
              </li>
            </ul>
          </div>

          <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-2xl text-xs text-emerald-300/90 flex items-start space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>Lo que NO se borrará:</strong> Las rutinas asignadas y el usuario del alumno permanecerán activos. El alumno podrá volver a comenzar sus rutinas con los pesos base que prescribiste.
            </p>
          </div>
        </div>

        {/* Error si ocurre */}
        {errorMsg && (
          <div className="p-3 bg-red-950/80 border border-red-500 text-red-300 rounded-xl text-xs flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Checkbox de Confirmación */}
        <label className="flex items-start space-x-3 p-3 bg-gray-950/80 border border-gray-800 rounded-xl cursor-pointer select-none">
          <input
            type="checkbox"
            checked={confirmedCheckbox}
            onChange={(e) => setConfirmedCheckbox(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-700 text-red-600 focus:ring-red-500 focus:ring-offset-gray-900 bg-gray-900"
          />
          <span className="text-xs text-gray-300 leading-snug">
            He leído la advertencia y confirmo que deseo <strong className="text-red-400">borrar definitivamente</strong> el avance y registros acumulados de este alumno.
          </span>
        </label>

        {/* Botones */}
        <div className="flex items-center justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={resetting}
            className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl text-xs font-bold transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleReset}
            disabled={!confirmedCheckbox || resetting}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-lg shadow-red-900/40 transition"
          >
            {resetting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Reseteando datos...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Sí, Resetear Progreso</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
