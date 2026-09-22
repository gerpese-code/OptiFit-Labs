'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Exercise } from '@/types/database';
import {
  X,
  UploadCloud,
  Film,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Plus,
  Save,
} from 'lucide-react';

interface ExerciseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (exercise: Exercise) => void;
}

const MUSCLE_GROUPS = [
  'Pecho',
  'Espalda',
  'Hombros',
  'Cuádriceps',
  'Isquiosurales',
  'Glúteos',
  'Bíceps',
  'Tríceps',
  'Core / Abdomen',
  'Pantorrillas',
  'Cuerpo Completo',
  'Cardio',
];

export default function ExerciseFormModal({
  isOpen,
  onClose,
  onSuccess,
}: ExerciseFormModalProps) {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [description, setDescription] = useState('');

  // Modos de entrada multimedia: 'file' | 'url'
  const [videoMode, setVideoMode] = useState<'file' | 'url'>('url');
  const [gifMode, setGifMode] = useState<'file' | 'url'>('url');

  // Valores de URL directa
  const [videoDirectUrl, setVideoDirectUrl] = useState('');
  const [gifDirectUrl, setGifDirectUrl] = useState('');
  const [imageDirectUrl, setImageDirectUrl] = useState('');

  // Lista de URLs de imágenes agregadas
  const [customImageUrls, setCustomImageUrls] = useState<string[]>([]);

  // Archivos multimedia locales
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [gifFile, setGifFile] = useState<File | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setName('');
    setMuscleGroup(MUSCLE_GROUPS[0]);
    setDescription('');
    setVideoDirectUrl('');
    setGifDirectUrl('');
    setImageDirectUrl('');
    setCustomImageUrls([]);
    setVideoFile(null);
    setGifFile(null);
    setImageFiles([]);
    setErrorMsg(null);
  };

  const uploadFileToBucket = async (file: File, folder: string): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);

    const res = await fetch('/api/admin/exercises/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.url) {
      throw new Error(data.message || `Error al subir ${file.name}`);
    }

    return data.url;
  };

  const handleAddImageUrl = () => {
    const trimmed = imageDirectUrl.trim();
    if (trimmed.length > 0) {
      setCustomImageUrls((prev) => [...prev, trimmed]);
      setImageDirectUrl('');
    }
  };

  const handleRemoveCustomImageUrl = (index: number) => {
    setCustomImageUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('El nombre del ejercicio es obligatorio.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      let finalVideoUrl: string | null = videoDirectUrl.trim() || null;
      let finalGifUrl: string | null = gifDirectUrl.trim() || null;
      const finalImageUrls: string[] = [...customImageUrls];

      // 1. Subir Video si se seleccionó archivo
      if (videoMode === 'file' && videoFile) {
        setUploadProgress('Subiendo video explicativo al almacenamiento...');
        finalVideoUrl = await uploadFileToBucket(videoFile, 'videos');
      }

      // 2. Subir GIF / Imagen si se seleccionó archivo
      if (gifMode === 'file' && gifFile) {
        setUploadProgress('Subiendo imagen de demostración...');
        finalGifUrl = await uploadFileToBucket(gifFile, 'gifs');
      }

      // 3. Subir Imágenes locales si existen
      if (imageFiles.length > 0) {
        setUploadProgress(`Subiendo ${imageFiles.length} imagen(es)...`);
        for (const img of imageFiles) {
          const url = await uploadFileToBucket(img, 'photos');
          finalImageUrls.push(url);
        }
      }

      setUploadProgress('Guardando en catálogo predeterminado...');

      // 4. Insertar fila en tabla exercises vía API segura
      const saveRes = await fetch('/api/admin/exercises/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          muscle_group: muscleGroup,
          description: description.trim() || null,
          video_url: finalVideoUrl,
          gif_url: finalGifUrl,
          image_urls: finalImageUrls,
        }),
      });

      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.exercise) {
        throw new Error(saveData.message || 'Error al guardar el ejercicio en la base de datos.');
      }

      resetForm();
      onSuccess(saveData.exercise as Exercise);
      onClose();
    } catch (err: any) {
      console.error('Error al crear ejercicio:', err);
      setErrorMsg(err.message || 'Error inesperado al guardar el ejercicio.');
    } finally {
      setLoading(false);
      setUploadProgress('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between sticky top-0 bg-gray-900 z-10">
          <div>
            <h2 className="text-lg font-bold text-white">Nuevo Ejercicio Oficial</h2>
            <p className="text-xs text-gray-400">
              Crea un ejercicio predeterminado disponible para todos los alumnos en sus rutinas.
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre del Ejercicio *
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Press Militar con Barra"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Grupo Muscular Principal *
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
              >
                {MUSCLE_GROUPS.map((mg) => (
                  <option key={mg} value={mg}>
                    {mg}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Descripción e Indicaciones Técnicas
            </label>
            <textarea
              rows={3}
              placeholder="Pautas sobre agarre, postura, respiración, rango de movimiento o precauciones..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Subida Multimedia Dual */}
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/60 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Recursos Multimedia (Videos, GIFs e Imágenes)
            </h3>

            {/* Video */}
            <div className="space-y-2 p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <Film className="w-3.5 h-3.5 text-emerald-400" />
                  Video Demostrativo
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setVideoMode('url')}
                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition ${
                      videoMode === 'url'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white bg-gray-800'
                    }`}
                  >
                    🔗 Enlace URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setVideoMode('file')}
                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition ${
                      videoMode === 'file'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-400 hover:text-white bg-gray-800'
                    }`}
                  >
                    📁 Subir Archivo
                  </button>
                </div>
              </div>

              {videoMode === 'url' ? (
                <input
                  type="url"
                  placeholder="https://... video directo (mp4, webm o enlace)"
                  value={videoDirectUrl}
                  onChange={(e) => setVideoDirectUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              ) : (
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-emerald-400 hover:file:bg-gray-700 cursor-pointer"
                  />
                  {videoFile && (
                    <span className="text-[11px] text-emerald-400 font-mono block">
                      Seleccionado: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(1)} MB)
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* GIF o Foto Principal */}
            <div className="space-y-2 p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Demostración Visual Principal (GIF, Imagen o Foto)
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setGifMode('url')}
                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition ${
                      gifMode === 'url'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white bg-gray-800'
                    }`}
                  >
                    🔗 Enlace URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setGifMode('file')}
                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition ${
                      gifMode === 'file'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white bg-gray-800'
                    }`}
                  >
                    📁 Subir Archivo
                  </button>
                </div>
              </div>

              {gifMode === 'url' ? (
                <input
                  type="url"
                  placeholder="https://... animacion.gif o foto.jpg"
                  value={gifDirectUrl}
                  onChange={(e) => setGifDirectUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                />
              ) : (
                <div className="space-y-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => setGifFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-amber-400 hover:file:bg-gray-700 cursor-pointer"
                  />
                  {gifFile && (
                    <span className="text-[11px] text-amber-400 font-mono block">
                      Seleccionado: {gifFile.name}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Galería de Fotos e Infografías */}
            <div className="space-y-3 p-3 bg-gray-900/60 border border-gray-800/80 rounded-xl">
              <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                Fotos o Infografías de Técnica
              </label>

              {/* Miniaturas de URLs agregadas */}
              {customImageUrls.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {customImageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-gray-800 aspect-video bg-gray-950"
                    >
                      <img src={url} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomImageUrl(idx)}
                        className="absolute inset-0 bg-red-950/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-red-300 font-semibold text-xs transition gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Agregar por URL */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Pegar URL directa de foto (https://... foto.jpg)..."
                  value={imageDirectUrl}
                  onChange={(e) => setImageDirectUrl(e.target.value)}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-sky-500"
                />
                <button
                  type="button"
                  onClick={handleAddImageUrl}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg transition shrink-0 flex items-center"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Agregar URL
                </button>
              </div>

              {/* O Subir archivos de imagen locales */}
              <div className="pt-1 border-t border-gray-800/60">
                <label className="block text-[11px] text-gray-400 mb-1">
                  O subir fotos locales (JPG, PNG, WebP):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-sky-400 hover:file:bg-gray-700 cursor-pointer"
                />
                {imageFiles.length > 0 && (
                  <span className="block text-[11px] text-sky-400 mt-1 font-medium">
                    +{imageFiles.length} foto(s) lista(s) para subirse
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Footer & Acciones */}
          <div className="pt-3 flex items-center justify-between border-t border-gray-800">
            <div>
              {uploadProgress && (
                <span className="text-xs text-emerald-400 flex items-center font-medium animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  {uploadProgress}
                </span>
              )}
            </div>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
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
                    Subiendo...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    Guardar Ejercicio
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
