'use client';

import React, { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { NutritionMacros, Profile } from '@/types/database';
import { Apple, FileText, UploadCloud, X, Loader2, PieChart } from 'lucide-react';

interface NutritionPlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function NutritionPlanForm({
  isOpen,
  onClose,
  onSuccess,
}: NutritionPlanFormProps) {
  const supabase = createClient();

  const [clients, setClients] = useState<Profile[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');

  // Macros estructurados
  const [macros, setMacros] = useState<NutritionMacros>({
    calories: 2200,
    protein_g: 160,
    carbs_g: 220,
    fats_g: 65,
  });

  // Archivo PDF
  const [pdfFile, setPdfFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [fetchingClients, setFetchingClients] = useState(true);
  const [uploadStatus, setUploadStatus] = useState<string>('');
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
        setClients(data || []);
        if (data && data.length > 0) {
          setSelectedClientId(data[0].id);
        }
      } catch (err) {
        console.error('Error al cargar alumnos:', err);
      } finally {
        setFetchingClients(false);
      }
    };

    fetchClients();
  }, [isOpen]);

  if (!isOpen) return null;

  // Cálculo de calorías sumadas a partir de gramos para validación visual
  const calculatedKcal =
    macros.protein_g * 4 + macros.carbs_g * 4 + macros.fats_g * 9;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      setErrorMsg('Debes seleccionar un alumno para este plan.');
      return;
    }

    if (!title.trim()) {
      setErrorMsg('El título del plan es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let uploadedPdfUrl: string | null = null;

      // 1. Subir PDF al bucket privado 'nutrition-files' si fue adjuntado
      if (pdfFile) {
        setUploadStatus('Subiendo documento PDF al almacenamiento privado...');
        const cleanName = pdfFile.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = `${selectedClientId}/${Date.now()}-${cleanName}`;

        const { error: uploadError } = await supabase.storage
          .from('nutrition-files')
          .upload(filePath, pdfFile, {
            contentType: 'application/pdf',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Guardamos la ruta del storage para generar URLs firmadas cuando el cliente la solicite
        uploadedPdfUrl = filePath;
      }

      setUploadStatus('Actualizando planes anteriores del alumno...');

      // 2. Desactivar planes anteriores de este cliente para que este sea el único activo
      await supabase
        .from('nutrition_plans')
        .update({ active: false })
        .eq('client_id', selectedClientId);

      setUploadStatus('Guardando nuevo plan nutricional...');

      // 3. Insertar nuevo plan
      const { error: insertError } = await supabase
        .from('nutrition_plans')
        .insert({
          client_id: selectedClientId,
          title: title.trim(),
          pdf_url: uploadedPdfUrl,
          macros_json: macros,
          active: true,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error al guardar plan de nutrición:', err);
      setErrorMsg(err.message || 'Ocurrió un error al guardar el plan.');
    } finally {
      setLoading(false);
      setUploadStatus('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Apple className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">
              Nuevo Plan Nutricional
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
                Alumno Asignado *
              </label>
              {fetchingClients ? (
                <div className="text-xs text-gray-400 flex items-center py-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-2 text-emerald-400" />
                  Cargando alumnos...
                </div>
              ) : (
                <select
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Título del Plan *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Definición / Déficit Fase 1"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Desglose de Macronutrientes */}
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                <PieChart className="w-3.5 h-3.5 mr-1" />
                Estructura de Macronutrientes (JSONB)
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

          {/* Subida de Pauta en PDF (Bucket Privado) */}
          <div className="bg-gray-950/70 border border-gray-800 rounded-xl p-4 space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              <FileText className="w-3.5 h-3.5 mr-1" />
              Pauta o Menú en PDF (Bucket: nutrition-files)
            </span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
              className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-emerald-400 hover:file:bg-gray-700 cursor-pointer w-full"
            />
            {pdfFile && (
              <span className="text-[11px] text-emerald-400 block font-mono">
                {pdfFile.name} ({(pdfFile.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Recomendaciones y Suplementación
            </label>
            <textarea
              rows={2}
              placeholder="Horarios sugeridos de comidas, consumo de creatina, hidratación..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Footer */}
          <div className="pt-3 border-t border-gray-800 flex items-center justify-between">
            <div className="text-xs text-emerald-400 font-medium">
              {uploadStatus && (
                <span className="flex items-center animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  {uploadStatus}
                </span>
              )}
            </div>

            <div className="flex space-x-3">
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
                    Asignando...
                  </>
                ) : (
                  'Guardar y Activar Plan'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
