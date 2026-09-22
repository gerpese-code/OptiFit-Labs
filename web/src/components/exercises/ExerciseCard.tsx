'use client';

import React, { useState } from 'react';
import { Exercise } from '@/types/database';
import { Film, Image as ImageIcon, Play, Trash2, Edit3, User } from 'lucide-react';

interface ExerciseCardProps {
  exercise: Exercise;
  onEdit?: (exercise: Exercise) => void;
  onDelete?: (id: string, name?: string) => void;
}

export default function ExerciseCard({
  exercise,
  onEdit,
  onDelete,
}: ExerciseCardProps) {
  const [showVideo, setShowVideo] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imgError, setImgError] = useState(false);

  const hasMultipleImages = exercise.image_urls && exercise.image_urls.length > 1;
  const currentImg = (isHovered && hasMultipleImages)
    ? exercise.image_urls[1]
    : (exercise.gif_url || (exercise.image_urls && exercise.image_urls[0]));

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-gray-700 transition flex flex-col group shadow-lg"
    >
      {/* Media Preview Box */}
      <div className="relative aspect-video bg-gray-950 flex items-center justify-center overflow-hidden">
        {showVideo && exercise.video_url ? (
          <video
            src={exercise.video_url}
            controls
            autoPlay
            className="w-full h-full object-cover"
          />
        ) : currentImg && !imgError ? (
          <>
            <img
              src={currentImg}
              alt={exercise.name}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover transition-all duration-300 group-hover:scale-105"
            />
            {hasMultipleImages && (
              <span className="absolute bottom-2 left-2 text-[9px] font-bold text-gray-300 bg-gray-950/80 backdrop-blur px-1.5 py-0.5 rounded border border-gray-800/80">
                {isHovered ? '2. Contracción' : '1. Inicio'}
              </span>
            )}
          </>
        ) : (
          <div className="text-gray-600 flex flex-col items-center">
            <ImageIcon className="w-8 h-8 mb-1" />
            <span className="text-[11px]">Sin multimedia</span>
          </div>
        )}

        {/* Video overlay trigger if video exists */}
        {!showVideo && exercise.video_url && (
          <button
            onClick={() => setShowVideo(true)}
            className="absolute inset-0 bg-black/40 hover:bg-black/20 flex items-center justify-center transition group/btn"
            title="Reproducir video"
          >
            <div className="w-10 h-10 rounded-full bg-emerald-500/90 text-white flex items-center justify-center shadow-lg group-hover/btn:scale-110 transition transform">
              <Play className="w-5 h-5 ml-0.5 fill-current" />
            </div>
          </button>
        )}

        {/* Media Badges */}
        <div className="absolute top-2.5 left-2.5 flex space-x-1">
          {exercise.video_url && (
            <span className="px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur text-[10px] font-semibold text-emerald-400 flex items-center border border-gray-800">
              <Film className="w-3 h-3 mr-1" />
              Video
            </span>
          )}
          {exercise.gif_url && (
            <span className="px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur text-[10px] font-semibold text-amber-400 border border-gray-800">
              GIF
            </span>
          )}
          {exercise.image_urls && exercise.image_urls.length > 0 && (
            <span className="px-2 py-0.5 rounded-md bg-gray-900/80 backdrop-blur text-[10px] font-semibold text-sky-400 border border-gray-800">
              {exercise.image_urls.length} Fotos
            </span>
          )}
        </div>
      </div>

      {/* Info Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
              {exercise.muscle_group}
            </span>
            <div className="flex items-center space-x-1">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => onEdit(exercise)}
                  className="text-gray-400 hover:text-emerald-400 p-1 rounded-md transition hover:bg-gray-800"
                  title="Editar ejercicio y multimedia"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              )}
              {onDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(exercise.id, exercise.name)}
                  className="text-gray-400 hover:text-red-400 p-1 rounded-md transition hover:bg-gray-800"
                  title="Eliminar ejercicio"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <h3 className="font-bold text-white text-base leading-snug line-clamp-1">
            {exercise.name}
          </h3>

          <p className="text-xs text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">
            {exercise.description || 'Sin notas ni descripción técnica agregada.'}
          </p>

          {exercise.is_custom && (
            <div className="mt-3 pt-2.5 border-t border-gray-800 flex items-center gap-1.5 text-[11px] font-medium text-amber-300 bg-amber-950/30 border border-amber-800/40 px-2 py-1 rounded-lg">
              <User className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">
                Alumno: <strong className="text-white">{exercise.creator?.full_name || 'Personalizado'}</strong>
                {exercise.creator?.client_code ? ` (#${exercise.creator.client_code})` : ''}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
