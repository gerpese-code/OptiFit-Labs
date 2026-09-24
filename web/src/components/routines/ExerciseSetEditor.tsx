'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { LBS_PER_KG, KG_PER_LB } from '@/lib/utils/units';

export interface SetDraft {
  id?: string;
  set_number: number;
  target_reps: number;
  target_weight_kg: number;
  target_weight_lbs: number;
  target_rpe: number;
  rest_seconds: number;
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
    // Round to whole integer for lbs as requested
    const valLbs = Math.round(validKg * LBS_PER_KG);

    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      target_weight_kg: validKg,
      target_weight_lbs: valLbs,
    };
    onChange(updated);
  };

  const handleWeightLbsChange = (index: number, rawLbs: string) => {
    const cleanLbs = typeof rawLbs === 'string' ? rawLbs.replace(',', '.') : String(rawLbs);
    const valLbs = cleanLbs === '' ? 0 : parseFloat(cleanLbs);
    const validLbs = isNaN(valLbs) ? 0 : Math.round(valLbs * 10) / 10;
    // Round to clean 0.5 kg increments
    const valKg = Math.round((validLbs * KG_PER_LB) * 2) / 2;

    const updated = [...sets];
    updated[index] = {
      ...updated[index],
      target_weight_lbs: validLbs,
      target_weight_kg: valKg,
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
          className="text-emerald-400 hover:text-emerald-300 flex items-center font-semibold text-xs"
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
              <tr key={idx} className="group">
                <td className="py-2 text-gray-400 font-mono font-bold">
                  #{set.set_number}
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={1}
                    value={set.target_reps}
                    onChange={(e) =>
                      handleUpdateField(idx, 'target_reps', parseInt(e.target.value) || 0)
                    }
                    className="w-16 bg-gray-900 border border-gray-800 rounded-lg px-2 py-1 text-white text-center focus:border-emerald-500 focus:outline-none"
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
                      className="w-20 bg-gray-900 border border-emerald-900/60 focus:border-emerald-500 rounded-lg pl-2 pr-6 py-1 text-emerald-300 font-semibold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
                      className="w-20 bg-gray-900 border border-sky-900/60 focus:border-sky-500 rounded-lg pl-2 pr-6 py-1 text-sky-300 font-semibold text-center focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
