'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NutritionMacros, NutritionPlan } from '@/types/database';
import { Apple, PieChart, X, Loader2, Save } from 'lucide-react';

interface NutritionPlanEditModalProps {
  plan: NutritionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: NutritionPlan) => void;
}

export default function NutritionPlanEditModal({
  plan,
  isOpen,
  onClose,
  onSuccess,
}: NutritionPlanEditModalProps) {
  const supabase = createClient();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [active, setActive] = useState(true);

  const [macros, setMacros] = useState<NutritionMacros>({
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fats_g: 65,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (plan && isOpen) {
      setTitle(plan.title);
      setNotes(plan.notes || '');
      setActive(plan.active);
      setMacros(
        plan.macros_json || {
          calories: 2000,
          protein_g: 150,
          carbs_g: 200,
          fats_g: 60,
        }
      );
      setErrorMsg(null);
    }
  }, [plan, isOpen]);

  if (!isOpen || !plan) return null;

  const calculatedKcal =
    macros.protein_g * 4 + macros.carbs_g * 4 + macros.fats_g * 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('El título del plan es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      // Si se activa este plan, desactivar otros del mismo cliente
      if (active && !plan.active) {
        await supabase
          .from('nutrition_plans')
          .update({ active: false })
          .eq('client_id', plan.client_id);
      }

      const { data: updated, error } = await supabase
        .from('nutrition_plans')
        .update({
          title: title.trim(),
          notes: notes.trim() || null,
          macros_json: macros,
          active,
        })
        .eq('id', plan.id)
        .select()
        .single();

      if (error) throw error;

      onSuccess(updated as NutritionPlan);
      onClose();
    } catch (err: any) {
      console.error('Error al editar plan de nutrición:', err);
      setErrorMsg(err.message || 'Error al guardar los cambios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Apple className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Editar Plan Nutricional
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-950/50 border border-red-500/50 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Título del Plan *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex items-end pb-2">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 bg-gray-950 border-gray-800 focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-gray-300">
                  Plan Activo para el Alumno
                </span>
              </label>
            </div>
          </div>

          {/* Macros */}
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <PieChart className="w-3.5 h-3.5 mr-1" />
                Desglose de Macronutrientes
              </span>
              <span className="text-[11px] text-gray-400 font-mono">
                Suma calculada: <strong className="text-white">{calculatedKcal}</strong> kcal
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Calorías Objetivo
                </label>
                <input
                  type="number"
                  min={500}
                  value={macros.calories}
                  onChange={(e) =>
                    setMacros({ ...macros, calories: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Proteínas (g)
                </label>
                <input
                  type="number"
                  min={0}
                  value={macros.protein_g}
                  onChange={(e) =>
                    setMacros({ ...macros, protein_g: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Carbohidratos (g)
                </label>
                <input
                  type="number"
                  min={0}
                  value={macros.carbs_g}
                  onChange={(e) =>
                    setMacros({ ...macros, carbs_g: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 mb-1">
                  Grasas (g)
                </label>
                <input
                  type="number"
                  min={0}
                  value={macros.fats_g}
                  onChange={(e) =>
                    setMacros({ ...macros, fats_g: parseInt(e.target.value) || 0 })
                  }
                  className="w-full bg-gray-900 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Recomendaciones y Suplementación
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            />
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
              disabled={loading}
              className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-1.5" />
                  Guardar Cambios
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
