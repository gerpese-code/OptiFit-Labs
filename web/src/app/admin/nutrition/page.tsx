'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NutritionPlan, Profile } from '@/types/database';
import NutritionPlanForm from '@/components/nutrition/NutritionPlanForm';
import NutritionPlanEditModal from '@/components/nutrition/NutritionPlanEditModal';
import {
  Apple,
  Plus,
  FileText,
  Flame,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Loader2,
  Edit3,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';

interface ExtendedNutritionPlan extends NutritionPlan {
  profiles?: Profile;
}

export default function NutritionPage() {
  const supabase = createClient();

  const [plans, setPlans] = useState<ExtendedNutritionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [planToEdit, setPlanToEdit] = useState<NutritionPlan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('nutrition_plans')
        .select('*, profiles:client_id (id, full_name, weight_unit_preference)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPlans(data || []);
    } catch (err) {
      console.error('Error al cargar planes de nutrición:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleDownloadPdf = async (pdfPath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('nutrition-files')
        .createSignedUrl(pdfPath, 60);

      if (error) throw error;
      if (data?.signedUrl) {
        window.open(data.signedUrl, '_blank');
      }
    } catch (err: any) {
      alert(`No se pudo abrir el archivo PDF: ${err.message}`);
    }
  };

  const handleToggleActive = async (plan: NutritionPlan) => {
    const nextState = !plan.active;
    try {
      if (nextState) {
        // Desactivar otros planes del mismo alumno
        await supabase
          .from('nutrition_plans')
          .update({ active: false })
          .eq('client_id', plan.client_id);
      }

      await supabase
        .from('nutrition_plans')
        .update({ active: nextState })
        .eq('id', plan.id);

      await fetchPlans();
    } catch (err: any) {
      alert(`Error al cambiar estado del plan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Deseas eliminar este plan nutricional?')) return;
    try {
      const { error } = await supabase.from('nutrition_plans').delete().eq('id', id);
      if (error) throw error;
      setPlans((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight flex items-center">
            <Apple className="w-6 h-6 mr-2.5 text-emerald-400" />
            Planes de Nutrición y Macronutrientes
          </h2>
          <p className="text-sm text-gray-400">
            Asigna y edita pautas dietéticas, macros estructurados y documentos PDF.
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Plan Nutricional
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center text-gray-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          <span className="text-xs">Cargando pautas nutricionales...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="h-64 border border-dashed border-gray-800 rounded-2xl flex flex-col items-center justify-center p-6 text-center space-y-3">
          <Apple className="w-10 h-10 text-gray-600" />
          <h3 className="text-sm font-semibold text-white">No hay planes activos</h3>
          <p className="text-xs text-gray-400 max-w-sm">
            Estructura los macros y sube una pauta en PDF para tu primer alumno.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Crear Plan de Nutrición
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan) => {
            const clientName = plan.profiles?.full_name || 'Alumno sin nombre';

            return (
              <div
                key={plan.id}
                className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col justify-between hover:border-gray-700 transition shadow-lg"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(plan)}
                      className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center transition ${
                        plan.active
                          ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40 hover:bg-emerald-900'
                          : 'bg-gray-800 text-gray-400 hover:text-white'
                      }`}
                      title="Haz clic para activar o desactivar este plan"
                    >
                      {plan.active ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Plan Activo
                        </>
                      ) : (
                        'Inactivo'
                      )}
                    </button>

                    {/* Acciones de Edición y Eliminación */}
                    <div className="flex items-center space-x-1">
                      <button
                        type="button"
                        onClick={() => setPlanToEdit(plan)}
                        className="text-gray-400 hover:text-emerald-400 p-1 rounded-md transition hover:bg-gray-800"
                        title="Editar plan nutricional"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDelete(plan.id)}
                        className="text-gray-400 hover:text-red-400 p-1 rounded-md transition hover:bg-gray-800"
                        title="Eliminar plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white leading-snug">
                    {plan.title}
                  </h3>
                  <p className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Alumno: {clientName}
                  </p>

                  {/* Macros Box */}
                  <div className="mt-4 bg-gray-950 p-3 rounded-xl border border-gray-800 grid grid-cols-4 gap-2 text-center">
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                        Kcal
                      </span>
                      <span className="text-xs font-bold text-white flex items-center justify-center">
                        <Flame className="w-3 h-3 text-amber-400 mr-0.5" />
                        {plan.macros_json?.calories || 0}
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                        Prot (g)
                      </span>
                      <span className="text-xs font-bold text-sky-400">
                        {plan.macros_json?.protein_g || 0}g
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                        Carbs (g)
                      </span>
                      <span className="text-xs font-bold text-emerald-400">
                        {plan.macros_json?.carbs_g || 0}g
                      </span>
                    </div>
                    <div>
                      <span className="block text-[10px] text-gray-500 uppercase font-semibold">
                        Grasas (g)
                      </span>
                      <span className="text-xs font-bold text-rose-400">
                        {plan.macros_json?.fats_g || 0}g
                      </span>
                    </div>
                  </div>

                  {plan.notes && (
                    <p className="text-xs text-gray-400 mt-3 line-clamp-2 italic">
                      "{plan.notes}"
                    </p>
                  )}
                </div>

                {/* PDF Action */}
                <div className="mt-5 pt-3 border-t border-gray-800 flex items-center justify-between">
                  <span className="text-[11px] text-gray-500">
                    {new Date(plan.created_at).toLocaleDateString()}
                  </span>

                  {plan.pdf_url ? (
                    <button
                      onClick={() => handleDownloadPdf(plan.pdf_url!)}
                      className="inline-flex items-center text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-3 py-1.5 rounded-xl transition"
                    >
                      <FileText className="w-3.5 h-3.5 mr-1" />
                      Ver PDF Privado
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </button>
                  ) : (
                    <span className="text-[11px] text-gray-500">Sin PDF adjunto</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear */}
      <NutritionPlanForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => fetchPlans()}
      />

      {/* Modal Editar */}
      <NutritionPlanEditModal
        plan={planToEdit}
        isOpen={!!planToEdit}
        onClose={() => setPlanToEdit(null)}
        onSuccess={() => fetchPlans()}
      />
    </div>
  );
}
