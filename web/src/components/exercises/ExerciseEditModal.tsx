'use client';

import React, { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Exercise } from '@/types/database';
import {
  X,
  UploadCloud,
  Film,
  Image as ImageIcon,
  Loader2,
  Trash2,
  Play,
  Save,
  Plus,
} from 'lucide-react';

interface ExerciseEditModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updated: Exercise) => void;
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

export default function ExerciseEditModal({
  exercise,
  isOpen,
  onClose,
  onSuccess,
}: ExerciseEditModalProps) {
  const supabase = createClient();

  const [name, setName] = useState('');
  const [muscleGroup, setMuscleGroup] = useState(MUSCLE_GROUPS[0]);
  const [description, setDescription] = useState('');

  // URLs activas guardadas o asignadas
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [gifUrl, setGifUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Modos de entrada multimedia: 'file' | 'url'
  const [videoMode, setVideoMode] = useState<'file' | 'url'>('url');
  const [gifMode, setGifMode] = useState<'file' | 'url'>('url');

  // Inputs temporales para escribir URLs sin desatar re-renderizados conflictivos
  const [videoInputUrl, setVideoInputUrl] = useState('');
  const [gifInputUrl, setGifInputUrl] = useState('');
  const [imageInputUrl, setImageInputUrl] = useState('');

  // Nuevos archivos locales seleccionados para subir al bucket
  const [newVideoFile, setNewVideoFile] = useState<File | null>(null);
  const [newGifFile, setNewGifFile] = useState<File | null>(null);
  const [newImageFiles, setNewImageFiles] = useState<File[]>([]);

  // Previsualizaciones locales inmediatas de archivos seleccionados de la PC
  const [newGifPreview, setNewGifPreview] = useState<string | null>(null);
  const [newImagePreviews, setNewImagePreviews] = useState<{ file: File; url: string }[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (exercise && isOpen) {
      setName(exercise.name || '');
      setMuscleGroup(exercise.muscle_group || MUSCLE_GROUPS[0]);
      setDescription(exercise.description || '');
      setVideoUrl(exercise.video_url || null);
      setGifUrl(exercise.gif_url || null);
      setImageUrls(exercise.image_urls ? [...exercise.image_urls] : []);

      setVideoInputUrl(exercise.video_url || '');
      setGifInputUrl(exercise.gif_url || '');
      setImageInputUrl('');

      setNewVideoFile(null);
      setNewGifFile(null);
      setNewImageFiles([]);
      setErrorMsg(null);
    }
  }, [exercise, isOpen]);

  // Previsualización de GIF / Imagen principal de PC
  useEffect(() => {
    if (newGifFile) {
      const objUrl = URL.createObjectURL(newGifFile);
      setNewGifPreview(objUrl);
      return () => URL.revokeObjectURL(objUrl);
    } else {
      setNewGifPreview(null);
    }
  }, [newGifFile]);

  // Previsualización de fotos múltiples de PC
  useEffect(() => {
    const previews = newImageFiles.map((f) => ({
      file: f,
      url: URL.createObjectURL(f),
    }));
    setNewImagePreviews(previews);

    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [newImageFiles]);

  if (!isOpen || !exercise) return null;

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

  const handleApplyVideoUrl = () => {
    const trimmed = videoInputUrl.trim();
    setVideoUrl(trimmed.length > 0 ? trimmed : null);
    setNewVideoFile(null);
  };

  const handleApplyGifUrl = () => {
    const trimmed = gifInputUrl.trim();
    setGifUrl(trimmed.length > 0 ? trimmed : null);
    setNewGifFile(null);
  };

  const handleAddImageUrl = () => {
    const trimmed = imageInputUrl.trim();
    if (trimmed.length > 0) {
      setImageUrls((prev) => [...prev, trimmed]);
      setImageInputUrl('');
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageUrls((prev) => prev.filter((_, idx) => idx !== indexToRemove));
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
      let finalVideoUrl = videoUrl;
      let finalGifUrl = gifUrl;
      const finalImageUrls = [...imageUrls];

      // 1. Subir nuevo Video si se seleccionó archivo local
      if (newVideoFile) {
        setUploadProgress('Subiendo nuevo video al almacenamiento...');
        finalVideoUrl = await uploadFileToBucket(newVideoFile, 'videos');
      }

      // 2. Subir nuevo GIF si se seleccionó archivo local
      if (newGifFile) {
        setUploadProgress('Subiendo animación GIF...');
        finalGifUrl = await uploadFileToBucket(newGifFile, 'gifs');
      }

      // 3. Subir nuevas imágenes locales si se seleccionaron
      if (newImageFiles.length > 0) {
        setUploadProgress(`Subiendo ${newImageFiles.length} imagen(es)...`);
        for (const img of newImageFiles) {
          const url = await uploadFileToBucket(img, 'photos');
          finalImageUrls.push(url);
        }
      }

      setUploadProgress('Guardando cambios en la base de datos...');

      // 4. Guardar cambios en la base de datos vía API administrativa segura
      const saveRes = await fetch('/api/admin/exercises/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: exercise.id,
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
        throw new Error(saveData.message || 'Error al guardar los cambios en la base de datos.');
      }

      onSuccess(saveData.exercise as Exercise);
      onClose();
    } catch (err: any) {
      console.error('Error al actualizar ejercicio:', err);
      setErrorMsg(err.message || 'Error al actualizar el ejercicio.');
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
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Editar Ejercicio
              {exercise.is_custom && (
                <span className="text-[11px] font-semibold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded-full">
                  Alumno: {exercise.creator?.full_name || 'Personalizado'}
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-400">
              Modifica nombre, grupo muscular, indicaciones técnicas o recursos multimedia.
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-500/60 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Nombre y Grupo Muscular */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-1.5">
                Nombre del Ejercicio *
              </label>
              <input
                type="text"
                required
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

          {/* Indicaciones / Descripción Técnica */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1.5">
              Indicaciones y Pautas Técnicas (Postura, agarre, respiración, etc.)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Escribe aquí las pautas que leerá el alumno durante su entrenamiento..."
              className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Gestión Multimedia Integral */}
          <div className="border border-gray-800 rounded-xl p-4 bg-gray-950/60 space-y-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
              <UploadCloud className="w-4 h-4 mr-1.5" />
              Recursos Multimedia (Videos, GIFs e Imágenes)
            </h3>

            {/* 1. SECCIÓN DE VIDEO */}
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

              {/* Vista previa o estado del video actual */}
              {videoUrl ? (
                <div className="flex items-center justify-between bg-gray-950 border border-gray-800 p-2.5 rounded-lg">
                  <div className="flex items-center space-x-2 truncate">
                    <Film className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-xs text-gray-200 truncate font-mono max-w-sm">
                      {videoUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setVideoUrl(null);
                      setVideoInputUrl('');
                      setNewVideoFile(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50 px-2 py-1 rounded transition flex items-center shrink-0 ml-2"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Quitar Video
                  </button>
                </div>
              ) : newVideoFile ? (
                <div className="flex items-center justify-between bg-emerald-950/40 border border-emerald-800/60 p-2.5 rounded-lg">
                  <span className="text-xs text-emerald-300 font-mono truncate">
                    Nuevo archivo: {newVideoFile.name} ({(newVideoFile.size / 1024 / 1024).toFixed(1)} MB)
                  </span>
                  <button
                    type="button"
                    onClick={() => setNewVideoFile(null)}
                    className="text-xs text-gray-400 hover:text-red-400"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-gray-500 italic">
                  No hay video asignado actualmente.
                </div>
              )}

              {/* Formulario de asignación de video */}
              {videoMode === 'url' ? (
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Pegar URL de video (https://... mp4, webm o enlace directo)"
                    value={videoInputUrl}
                    onChange={(e) => setVideoInputUrl(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyVideoUrl}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition shrink-0"
                  >
                    Asignar URL
                  </button>
                </div>
              ) : (
                <div className="pt-1">
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/webm"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewVideoFile(file);
                      if (file) setVideoUrl(null);
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-emerald-400 hover:file:bg-gray-700 cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* 2. SECCIÓN DE DEMOSTRACIÓN VISUAL PRINCIPAL */}
            <div className="space-y-2.5 p-3.5 bg-gray-900/60 border border-gray-800/80 rounded-xl">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-200 flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
                  Demostración Visual Principal (GIF, Imagen o Foto de Técnica)
                </label>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setGifMode('file')}
                    className={`px-2 py-0.5 text-[11px] rounded-md font-medium transition ${
                      gifMode === 'file'
                        ? 'bg-amber-600 text-white'
                        : 'text-gray-400 hover:text-white bg-gray-800'
                    }`}
                  >
                    📁 Subir desde PC
                  </button>
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
                </div>
              </div>

              {/* Vista previa de archivo nuevo seleccionado de la PC */}
              {newGifFile && newGifPreview ? (
                <div className="flex items-center justify-between bg-amber-950/40 border border-amber-800/60 p-2.5 rounded-lg">
                  <div className="flex items-center space-x-2.5 truncate">
                    <img
                      src={newGifPreview}
                      alt="Nuevo archivo preview"
                      className="w-10 h-10 rounded-lg object-cover border border-amber-600/50 shrink-0"
                    />
                    <div className="truncate">
                      <span className="text-xs font-semibold text-amber-300 block truncate">
                        {newGifFile.name}
                      </span>
                      <span className="text-[10px] text-amber-400/80">
                        {(newGifFile.size / 1024).toFixed(0)} KB • Listo para guardar
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewGifFile(null)}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/50 px-2.5 py-1 rounded transition flex items-center shrink-0 ml-2"
                    title="Descartar archivo"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancelar
                  </button>
                </div>
              ) : gifUrl ? (
                /* Vista previa de la imagen/GIF guardada actualmente */
                <div className="flex items-center justify-between bg-gray-950 border border-gray-800 p-2.5 rounded-lg">
                  <div className="flex items-center space-x-2.5 truncate">
                    <img
                      src={gifUrl}
                      alt="Demostración actual"
                      className="w-10 h-10 rounded-lg object-cover border border-gray-800 shrink-0"
                    />
                    <span className="text-xs text-gray-300 font-mono truncate max-w-sm">
                      {gifUrl}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setGifUrl(null);
                      setGifInputUrl('');
                      setNewGifFile(null);
                    }}
                    className="text-xs text-red-400 hover:text-red-300 hover:bg-red-950/60 px-2.5 py-1.5 rounded-lg transition flex items-center shrink-0 ml-2 border border-red-900/50"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" />
                    Quitar Imagen / GIF
                  </button>
                </div>
              ) : (
                <div className="text-[11px] text-gray-500 italic p-1">
                  No hay imagen o GIF de demostración asignado actualmente.
                </div>
              )}

              {/* Selector de archivo o URL según modo */}
              {gifMode === 'file' ? (
                <div className="pt-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      setNewGifFile(file);
                      if (file) setGifUrl(null);
                    }}
                    className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-amber-400 hover:file:bg-gray-700 cursor-pointer"
                  />
                  <span className="text-[10px] text-gray-500 block mt-1">
                    Formatos admitidos desde tu PC: JPG, PNG, WebP o GIF animado.
                  </span>
                </div>
              ) : (
                <div className="flex gap-2 pt-1">
                  <input
                    type="url"
                    placeholder="Pegar URL directa (https://... foto.jpg o gif)"
                    value={gifInputUrl}
                    onChange={(e) => setGifInputUrl(e.target.value)}
                    className="flex-1 bg-gray-950 border border-gray-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={handleApplyGifUrl}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg transition shrink-0"
                  >
                    Asignar URL
                  </button>
                </div>
              )}
            </div>

            {/* 3. GALERÍA DE FOTOS E INFOGRAFÍAS TÉCNICAS */}
            <div className="space-y-3 p-3.5 bg-gray-900/60 border border-gray-800/80 rounded-xl">
              <label className="text-xs font-bold text-gray-200 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <ImageIcon className="w-3.5 h-3.5 text-sky-400" />
                  Galería de Fotos Técnicas ({imageUrls.length} activas)
                </span>
              </label>

              {/* Cuadrícula de fotos existentes */}
              {imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {imageUrls.map((url, idx) => (
                    <div
                      key={idx}
                      className="relative group rounded-xl overflow-hidden border border-gray-800 aspect-video bg-gray-950 shadow"
                    >
                      <img
                        src={url}
                        alt={`Foto ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-1 left-1 bg-black/75 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                        #{idx + 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute bottom-1 right-1 bg-red-600/90 hover:bg-red-600 text-white text-[10px] px-2 py-0.5 rounded font-medium transition flex items-center gap-1 shadow"
                        title="Eliminar esta foto"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[11px] text-gray-500 italic">
                  No hay fotos en la galería técnica actualmente.
                </div>
              )}

              {/* Previews de nuevas fotos locales de la PC seleccionadas */}
              {newImagePreviews.length > 0 && (
                <div className="bg-sky-950/30 border border-sky-800/50 p-2.5 rounded-xl space-y-2">
                  <span className="text-xs font-semibold text-sky-300 block">
                    Fotos seleccionadas de tu PC para subir al guardar ({newImagePreviews.length}):
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {newImagePreviews.map((item, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-sky-700/60 aspect-video bg-gray-950"
                      >
                        <img
                          src={item.url}
                          alt="preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setNewImageFiles((prev) => prev.filter((_, i) => i !== idx));
                          }}
                          className="absolute top-1 right-1 bg-red-600 text-white p-0.5 rounded-full shadow"
                          title="Quitar de la lista"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Agregar fotos por URL directa */}
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="Pegar URL de foto técnica (https://... foto.jpg)..."
                  value={imageInputUrl}
                  onChange={(e) => setImageInputUrl(e.target.value)}
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

              {/* Subir fotos locales de la PC */}
              <div className="pt-1 border-t border-gray-800/60">
                <label className="block text-[11px] text-gray-400 mb-1">
                  O seleccionar fotos de tu PC para la galería (JPG, PNG, WebP):
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => {
                    if (e.target.files) {
                      setNewImageFiles(Array.from(e.target.files));
                    }
                  }}
                  className="w-full text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-800 file:text-sky-400 hover:file:bg-gray-700 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Footer de Acciones */}
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
          </div>
        </form>
      </div>
    </div>
  );
}
