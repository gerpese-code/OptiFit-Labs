'use client';

import React from 'react';
import { Plus, Trash2, Zap } from 'lucide-react';
import { LBS_PER_KG, KG_PER_LB } from '@/lib/utils/units';

export interface SetDraft {
  id?: string;
  set_number: number;
  target_reps: number;
  target_weight_kg: number;
  target_weight_lbs: number;
  target_rpe: number;
  rest_seconds: number;
  is_superset?: boolean;
  superset_count?: number; // 2 a 5
  superset_reps?: number[]; // ej: [6, 6, 6]
  superset_weights_kg?: number[]; // ej: [40, 20, 10]
}

interface ExerciseSetEditorProps {
  sets: SetDraft[];
  onChange: (sets: SetDraft[]) => void;
}

export default function ExerciseSetEditor({ sets, onChange }: ExerciseSetEditorProps) {
  const handleAddSet = () => {
    const lastSet = sets[sets.length - 1];
    const kg = lastSet ? lastSet.target_weight_kg : 20;
    const lbs = Math.round(kg * LBS_PER_KG * 10) / 10;

    const newSet: SetDraft = {
      set_number: sets.length + 1,
      target_reps: lastSet ? lastSet.target_reps : 10,
      target_weight_kg: kg,
      target_weight_lbs: lbs,
      target_rpe: lastSet ? lastSet.target_rpe : 8,
      rest_seconds: lastSet ? lastSet.rest_seconds : 90,
      is_superset: false,
    };
    onChange([...sets, newSet]);
  };

  const handleRemoveSet = (index: number) => {
    const updated = sets
      .filter((_, i) => i !== index)
      .map((s, idx) => ({ ...s, set_number: idx + 1 }));
    onChange(updated);
  };

  const handleWeightKgChange = (index: number, rawKg: string) => {
    const cleanKg = typeof rawKg === 'string' ? rawKg.replace(',', '.') : String(rawKg);
    const valKg = cleanKg === '' ? 0 : parseFloat(cleanKg);
    const validKg = isNaN(valKg) ? 0 : Math.round(valKg * 100) / 100;
    const valLbs = Math.round(validKg * LBS_PER_KG);

    const updated = [...sets];
    const cur = updated[index];
    const sWeights = cur.superset_weights_kg ? [...cur.superset_weights_kg] : [];
    if (sWeights.length > 0) {
      sWeights[0] = validKg;
    }
    updated[index] = {
      ...cur,
      target_weight_kg: validKg,
      target_weight_lbs: valLbs,
      superset_weights_kg: sWeights.length > 0 ? sWeights : undefined,
    };
    onChange(updated);
  };

  const handleWeightLbsChange = (index: number, rawLbs: string) => {
    const cleanLbs = typeof rawLbs === 'string' ? rawLbs.replace(',', '.') : String(rawLbs);
    const valLbs = cleanLbs === '' ? 0 : parseFloat(cleanLbs);
    const validLbs = isNaN(valLbs) ? 0 : Math.round(valLbs * 10) / 10;
    const valKg = Math.round((validLbs * KG_PER_LB) * 2) / 2;

    const updated = [...sets];
    const cur = updated[index];
    const sWeights = cur.superset_weights_kg ? [...cur.superset_weights_kg] : [];
    if (sWeights.length > 0) {
      sWeights[0] = valKg;
    }
    updated[index] = {
      ...cur,
      target_weight_lbs: validLbs,
      target_weight_kg: valKg,
      superset_weights_kg: sWeights.length > 0 ? sWeights : undefined,
    };
    onChange(updated);
  };

  const handleUpdateField = (index: number, field: 'target_reps' | 'target_rpe' | 'rest_seconds', value: number) => {
    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  // Activar o desactivar superserie continua / drop-set para una serie
  const handleToggleSuperset = (index: number) => {
    const updated = [...sets];
    const cur = updated[index];
    const nextIsSuperset = !cur.is_superset;

    if (nextIsSuperset) {
      const count = cur.superset_count || 3;
      const baseReps = 6;
      const baseKg = cur.target_weight_kg > 0 ? cur.target_weight_kg : 40;
      
      const reps = cur.superset_reps && cur.superset_reps.length === count
        ? cur.superset_reps
        : Array(count).fill(baseReps);

      const weights = cur.superset_weights_kg && cur.superset_weights_kg.length === count
        ? cur.superset_weights_kg
        : Array.from({ length: count }).map((_, i) => Math.max(0, Math.round(baseKg * (1 - i * 0.25) * 2) / 2));

      const totalReps = reps.reduce((a, b) => a + b, 0);

      updated[index] = {
        ...cur,
        is_superset: true,
        superset_count: count,
        superset_reps: reps,
        superset_weights_kg: weights,
        target_reps: totalReps,
        target_weight_kg: weights[0] || baseKg,
        target_weight_lbs: Math.round((weights[0] || baseKg) * LBS_PER_KG),
      };
    } else {
      updated[index] = {
        ...cur,
        is_superset: false,
      };
    }
    onChange(updated);
  };

  // Modificar cantidad de etapas de la superserie (2 a 5)
  const handleChangeSupersetCount = (setIdx: number, newCount: number) => {
    const updated = [...sets];
    const cur = updated[setIdx];
    const baseKg = cur.target_weight_kg > 0 ? cur.target_weight_kg : 40;

    const oldReps = cur.superset_reps || [];
    const newReps = Array.from({ length: newCount }).map((_, i) => oldReps[i] || 6);

    const oldWeights = cur.superset_weights_kg || [];
    const newWeights = Array.from({ length: newCount }).map((_, i) => {
      if (oldWeights[i] !== undefined) return oldWeights[i];
      return Math.max(0, Math.round(baseKg * (1 - i * 0.25) * 2) / 2);
    });

    const totalReps = newReps.reduce((a, b) => a + b, 0);

    updated[setIdx] = {
      ...cur,
      superset_count: newCount,
      superset_reps: newReps,
      superset_weights_kg: newWeights,
      target_reps: totalReps,
      target_weight_kg: newWeights[0] || baseKg,
      target_weight_lbs: Math.round((newWeights[0] || baseKg) * LBS_PER_KG),
    };
    onChange(updated);
  };

  // Modificar repeticiones de una etapa específica
  const handleUpdateStageReps = (setIdx: number, stageIdx: number, val: number) => {
    const updated = [...sets];
    const cur = updated[setIdx];
    const count = cur.superset_count || 3;
    const reps = [...(cur.superset_reps || Array(count).fill(6))];
    reps[stageIdx] = Math.max(0, val);
    const totalReps = reps.reduce((a, b) => a + b, 0);

    updated[setIdx] = {
      ...cur,
      superset_reps: reps,
      target_reps: totalReps,
    };
    onChange(updated);
  };

  // Modificar peso en KG de una etapa específica
  const handleUpdateStageWeightKg = (setIdx: number, stageIdx: number, rawKg: string) => {
    const cleanKg = typeof rawKg === 'string' ? rawKg.replace(',', '.') : String(rawKg);
    const valKg = cleanKg === '' ? 0 : parseFloat(cleanKg);
    const validKg = isNaN(valKg) ? 0 : Math.round(valKg * 100) / 100;

    const updated = [...sets];
    const cur = updated[setIdx];
    const count = cur.superset_count || 3;
    const baseKg = cur.target_weight_kg > 0 ? cur.target_weight_kg : 40;
    const weights = [...(cur.superset_weights_kg || Array.from({ length: count }).map((_, i) => Math.max(0, Math.round(baseKg * (1 - i * 0.25) * 2) / 2)))];
    weights[stageIdx] = validKg;

    updated[setIdx] = {
      ...cur,
      superset_weights_kg: weights,
      ...(stageIdx === 0 ? {
        target_weight_kg: validKg,
        target_weight_lbs: Math.round(validKg * LBS_PER_KG),
      } : {}),
    };
    onChange(updated);
  };

  // Modificar peso en LBS de una etapa específica (con autoconversión a KG)
  const handleUpdateStageWeightLbs = (setIdx: number, stageIdx: number, rawLbs: string) => {
    const cleanLbs = typeof rawLbs === 'string' ? rawLbs.replace(',', '.') : String(rawLbs);
    const valLbs = cleanLbs === '' ? 0 : parseFloat(cleanLbs);
    const validLbs = isNaN(valLbs) ? 0 : Math.round(valLbs * 10) / 10;
    const valKg = Math.round((validLbs * KG_PER_LB) * 2) / 2;

    const updated = [...sets];
    const cur = updated[setIdx];
    const count = cur.superset_count || 3;
    const baseKg = cur.target_weight_kg > 0 ? cur.target_weight_kg : 40;
    const weights = [...(cur.superset_weights_kg || Array.from({ length: count }).map((_, i) => Math.max(0, Math.round(baseKg * (1 - i * 0.25) * 2) / 2)))];
    weights[stageIdx] = valKg;

    updated[setIdx] = {
      ...cur,
      superset_weights_kg: weights,
      ...(stageIdx === 0 ? {
        target_weight_kg: valKg,
        target_weight_lbs: validLbs,
      } : {}),
    };
    onChange(updated);
  };

  return (
    <div className="space-y-2 mt-2 bg-gray-950/70 p-3 rounded-xl border border-gray-800">
      <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider px-1">
        <span className="flex items-center space-x-1">
          <span>Series Objetivo</span>
          <span className="text-[10px] text-emerald-400 font-normal lowercase">
            (autoconversión simultánea KG ⇄ LBS)
          </span>
        </span>
        <button
          type="button"
          onClick={handleAddSet}
          className="text-emerald-400 hover:text-emerald-300 flex items-center font-semibold text-xs transition"
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          Agregar Serie
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="text-gray-500 border-b border-gray-800">
              <th className="pb-1.5 font-semibold w-12">Serie</th>
              <th className="pb-1.5 font-semibold w-24">Modalidad</th>
              <th className="pb-1.5 font-semibold">Reps Obj.</th>
              <th className="pb-1.5 font-semibold text-emerald-400">Peso (KG)</th>
              <th className="pb-1.5 font-semibold text-sky-400">Peso (LBS)</th>
              <th className="pb-1.5 font-semibold">RPE</th>
              <th className="pb-1.5 font-semibold">Descanso (s)</th>
              <th className="pb-1.5 font-semibold w-8"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {sets.map((set, idx) => (
              <React.Fragment key={idx}>
                <tr className={`group transition-colors ${set.is_superset ? 'bg-amber-500/5' : ''}`}>
                  <td className="py-2 text-gray-400 font-mono font-bold">
                    #{set.set_number}
                  </td>

                  {/* Botón para identificar y activar Superset / Drop-Set */}
                  <td className="py-2 pr-2">
                    <button
                      type="button"
                      onClick={() => handleToggleSuperset(idx)}
                      className={`px-2 py-1 rounded-lg text-[10.5px] font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                        set.is_superset
                          ? 'bg-amber-500 text-black shadow-amber-500/20 font-black'
                          : 'bg-gray-900 text-gray-400 hover:text-amber-400 hover:bg-gray-800 border border-gray-800'
                      }`}
                      title={set.is_superset ? 'Desactivar superset' : 'Activar modalidad Superset / Drop-set (múltiples reps y pesos continuos)'}
                    >
                      <Zap className={`w-3 h-3 ${set.is_superset ? 'text-black fill-current' : 'text-amber-400'}`} />
                      <span>{set.is_superset ? 'Superset' : '+ Superset'}</span>
                    </button>
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      min={1}
                      value={set.target_reps}
                      onChange={(e) =>
                        handleUpdateField(idx, 'target_reps', parseInt(e.target.value) || 0)
                      }
                      className={`w-16 bg-gray-900 border rounded-lg px-2 py-1 text-white text-center focus:outline-none ${
                        set.is_superset ? 'border-amber-500/50 text-amber-300 font-bold' : 'border-gray-800 focus:border-emerald-500'
                      }`}
                    />
                  </td>

                  {/* Campo KG */}
                  <td className="py-2 pr-2">
                    <div className="relative inline-flex items-center">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={set.target_weight_kg === 0 ? '' : set.target_weight_kg}
                        placeholder="0"
                        onChange={(e) => handleWeightKgChange(idx, e.target.value)}
                        className={`w-20 bg-gray-900 border rounded-lg pl-2 pr-6 py-1 text-emerald-300 font-semibold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          set.is_superset ? 'border-amber-500/50 focus:border-amber-400' : 'border-emerald-900/60 focus:border-emerald-500'
                        }`}
                      />
                      <span className="absolute right-2 text-[10px] text-emerald-500 font-mono pointer-events-none font-bold">
                        kg
                      </span>
                    </div>
                  </td>

                  {/* Campo LBS con autoconversión instantánea */}
                  <td className="py-2 pr-2">
                    <div className="relative inline-flex items-center">
                      <input
                        type="number"
                        step="any"
                        min={0}
                        value={set.target_weight_lbs === 0 ? '' : set.target_weight_lbs}
                        placeholder="0"
                        onChange={(e) => handleWeightLbsChange(idx, e.target.value)}
                        className={`w-20 bg-gray-900 border rounded-lg pl-2 pr-6 py-1 text-sky-300 font-semibold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                          set.is_superset ? 'border-amber-500/50 focus:border-amber-400' : 'border-sky-900/60 focus:border-sky-500'
                        }`}
                      />
                      <span className="absolute right-2 text-[10px] text-sky-500 font-mono pointer-events-none font-bold">
                        lb
                      </span>
                    </div>
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="any"
                      min={1}
                      max={10}
                      value={set.target_rpe}
                      onChange={(e) =>
                        handleUpdateField(
                          idx,
                          'target_rpe',
                          parseFloat(e.target.value.replace(',', '.')) || 0
                        )
                      }
                      className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </td>

                  <td className="py-2 pr-2">
                    <input
                      type="number"
                      step="15"
                      min={0}
                      value={set.rest_seconds}
                      onChange={(e) =>
                        handleUpdateField(idx, 'rest_seconds', parseInt(e.target.value) || 0)
                      }
                      className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white text-center focus:border-emerald-500 focus:outline-none"
                    />
                  </td>

                  <td className="py-2 text-right">
                    {sets.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSet(idx)}
                        className="text-gray-500 hover:text-red-400 p-1 rounded transition"
                        title="Eliminar serie"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>

                {/* Sub-fila expandida para configurar la Superserie / Drop-set (Múltiples Reps y Pesos en la misma serie) */}
                {set.is_superset && (
                  <tr className="bg-gradient-to-r from-amber-950/30 via-gray-950/80 to-amber-950/20 border-b border-amber-800/40">
                    <td colSpan={8} className="py-2.5 px-3">
                      <div className="flex flex-col gap-2">
                        {/* Cabecera de configuración del Superset */}
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-lg border border-amber-500/30">
                              <Zap className="w-3 h-3 fill-current text-amber-400" />
                              Superserie Continua / Drop-set (Descarga de Pesos)
                            </span>
                            <span className="text-[10.5px] text-gray-400">
                              Múltiples repeticiones y pesos en la misma serie:
                            </span>
                          </div>

                          {/* Selector de cantidad de micro-series (2 a 5) */}
                          <div className="flex items-center gap-1 bg-gray-900/90 px-2 py-0.5 rounded-lg border border-amber-900/50">
                            <span className="text-[10px] font-bold text-gray-400 mr-1">Etapas:</span>
                            {[2, 3, 4, 5].map((cnt) => (
                              <button
                                key={cnt}
                                type="button"
                                onClick={() => handleChangeSupersetCount(idx, cnt)}
                                className={`w-5 h-5 rounded text-[10px] font-black transition ${
                                  (set.superset_count || 3) === cnt
                                    ? 'bg-amber-500 text-black shadow'
                                    : 'text-gray-400 hover:text-white bg-gray-800/70'
                                }`}
                              >
                                {cnt}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Fila horizontal con varias repeticiones y varios pesos */}
                        <div className="flex items-center flex-wrap gap-2.5 pt-1">
                          {Array.from({ length: set.superset_count || 3 }).map((_, stageIdx) => {
                            const stageReps = (set.superset_reps && set.superset_reps[stageIdx] !== undefined)
                              ? set.superset_reps[stageIdx]
                              : 6;
                            const stageWeightKg = (set.superset_weights_kg && set.superset_weights_kg[stageIdx] !== undefined)
                              ? set.superset_weights_kg[stageIdx]
                              : Math.max(0, Math.round((set.target_weight_kg || 40) * (1 - stageIdx * 0.25) * 2) / 2);
                            const stageWeightLbs = Math.round(stageWeightKg * LBS_PER_KG);

                            return (
                              <div key={stageIdx} className="flex items-center gap-2">
                                <div className="flex items-center gap-2 bg-gray-900 border border-amber-500/30 rounded-xl px-2.5 py-1.5 shadow-sm">
                                  <span className="text-[10px] font-mono font-black text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    #{stageIdx + 1}
                                  </span>

                                  {/* Repeticiones de la etapa */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      min={1}
                                      value={stageReps === 0 ? '' : stageReps}
                                      placeholder="6"
                                      onChange={(e) =>
                                        handleUpdateStageReps(idx, stageIdx, parseInt(e.target.value) || 0)
                                      }
                                      className="w-12 bg-gray-950 border border-amber-500/30 rounded px-1.5 py-0.5 text-white text-xs text-center font-bold focus:border-amber-400 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-gray-400 font-semibold">reps</span>
                                  </div>

                                  <span className="text-gray-600 font-bold text-xs">@</span>

                                  {/* Peso en KG */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min={0}
                                      value={stageWeightKg === 0 ? '' : stageWeightKg}
                                      placeholder="0"
                                      onChange={(e) => handleUpdateStageWeightKg(idx, stageIdx, e.target.value)}
                                      className="w-14 bg-gray-950 border border-emerald-900/60 rounded px-1.5 py-0.5 text-emerald-400 text-xs text-center font-bold focus:border-emerald-500 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-emerald-500 font-bold">kg</span>
                                  </div>

                                  {/* Peso en LBS */}
                                  <div className="flex items-center gap-1">
                                    <input
                                      type="number"
                                      step="any"
                                      min={0}
                                      value={stageWeightLbs === 0 ? '' : stageWeightLbs}
                                      placeholder="0"
                                      onChange={(e) => handleUpdateStageWeightLbs(idx, stageIdx, e.target.value)}
                                      className="w-14 bg-gray-950 border border-sky-900/60 rounded px-1.5 py-0.5 text-sky-400 text-xs text-center font-bold focus:border-sky-500 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-sky-500 font-bold">lb</span>
                                  </div>
                                </div>

                                {stageIdx < (set.superset_count || 3) - 1 && (
                                  <span className="text-amber-500/80 font-black text-sm">➔</span>
                                )}
                              </div>
                            );
                          })}

                          <div className="bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl ml-auto flex items-center gap-1.5">
                            <span className="text-[11px] font-bold text-amber-300">
                              Total: {(set.superset_reps || [6, 6, 6]).reduce((a, b) => a + b, 0)} reps continuas
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
