'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Share,
  PlusSquare,
  Compass,
  Check,
  Copy,
  ExternalLink,
  Smartphone,
  Sparkles,
  Dumbbell,
  ChevronRight,
  ShieldCheck,
  ArrowRight,
  Info,
} from 'lucide-react';

export default function IosInstallPage() {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#020503] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luces LED Neón Ambientales */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_14px_#00ff87,0_0_28px_#10b981] z-50 pointer-events-none" />
      <div className="fixed -top-24 right-1/4 w-[500px] h-[3px] -rotate-12 bg-gradient-to-r from-transparent via-[#00ff87]/60 to-transparent shadow-[0_0_20px_#00ff87] pointer-events-none z-0 opacity-40 blur-[0.5px]" />
      <div className="fixed -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-md w-full bg-[#040f08]/90 border border-emerald-950/80 rounded-3xl p-6 shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10 my-8">
        
        {/* Cabecera / Identidad Oficial */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-md opacity-40 animate-pulse" />
            <img
              src="/app-icon.png"
              alt="Icono Oficial OptiFit Labs"
              className="relative w-20 h-20 rounded-2xl border border-[#00ff87]/50 shadow-2xl shadow-emerald-500/25 object-cover"
            />
            <span className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-slate-950 font-black text-[10px] px-2 py-0.5 rounded-full border border-cyan-300 shadow">
              iOS
            </span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center justify-center gap-2">
            OptiFit Labs <span className="text-[#00ff87]">Apple</span>
          </h1>
          <p className="text-xs font-semibold text-[#00ff87] uppercase tracking-widest mt-1">
            Instalación Oficial para iPhone & iPad
          </p>
          <p className="text-[11px] text-gray-400 mt-1.5 max-w-xs mx-auto leading-relaxed">
            Instala la aplicación en tu pantalla de inicio en <strong>3 sencillos pasos</strong> sin necesidad de pagar App Store.
          </p>
        </div>

        {/* ALERTA CLAVE PARA USUARIOS DE INSTAGRAM */}
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 mb-6 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-300">
            <span className="text-base">⚠️</span>
            <span>¿Estás viendo esto desde Instagram?</span>
          </div>
          <p className="text-[11px] text-amber-200/90 leading-relaxed mb-3">
            El navegador interno de Instagram no permite instalar apps en tu pantalla de inicio. Debes abrir esta página directamente en <strong>Safari</strong>:
          </p>
          <div className="space-y-1.5 text-[11px] bg-black/40 p-2.5 rounded-xl border border-amber-500/20 font-medium">
            <p>1. Toca los <strong>3 puntitos (...)</strong> arriba a la derecha en Instagram.</p>
            <p>2. Selecciona <strong>"Abrir en el navegador externo"</strong> o <strong>"Abrir en Safari"</strong>.</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="w-full mt-3 py-2 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center justify-center gap-2 transition"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>¡Enlace copiado! Pégalo en Safari</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>O toca aquí para copiar el enlace y pegarlo en Safari</span>
              </>
            )}
          </button>
        </div>

        {/* PASOS DE INSTALACIÓN EN SAFARI */}
        <div className="space-y-3.5 mb-6">
          <h2 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#00ff87]" />
            Pasos para instalar en Safari (iPhone):
          </h2>

          {/* Paso 1 */}
          <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00ff87] font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              1
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Toca el botón Compartir</span>
                <span className="p-1 bg-slate-800 rounded-md text-cyan-400">
                  <Share className="w-3 h-3" />
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                En la barra inferior de <strong>Safari</strong> en tu iPhone, pulsa el botón central de compartir (el cuadrito con la flecha hacia arriba).
              </p>
            </div>
          </div>

          {/* Paso 2 */}
          <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00ff87] font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              2
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Selecciona "Agregar a pantalla de inicio"</span>
                <span className="p-1 bg-slate-800 rounded-md text-emerald-400">
                  <PlusSquare className="w-3 h-3" />
                </span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Desliza la lista de opciones hacia abajo hasta encontrar <strong>"Agregar a pantalla de inicio"</strong> (<em>Add to Home Screen</em>) y tócala.
              </p>
            </div>
          </div>

          {/* Paso 3 */}
          <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[#00ff87] font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
              3
            </div>
            <div>
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Confirma tocando "Agregar"</span>
                <span className="text-[#00ff87] font-bold">✓</span>
              </h3>
              <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                Pulsa el botón azul <strong>"Agregar"</strong> en la esquina superior derecha. ¡Listo! El icono de OptiFit Labs aparecerá en tu iPhone como una aplicación nativa.
              </p>
            </div>
          </div>
        </div>

        {/* BENEFICIOS DE LA APP EN IPHONE */}
        <div className="bg-[#020503] border border-emerald-500/20 rounded-2xl p-3.5 mb-6 text-xs space-y-1.5 text-gray-300">
          <div className="flex items-center gap-2 text-[#00ff87] font-bold text-[11px] uppercase tracking-wide">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Ventajas en tu iPhone:</span>
          </div>
          <p className="text-[11px] text-gray-400">• Pantalla completa sin barra de navegación de Safari.</p>
          <p className="text-[11px] text-gray-400">• Acceso instantáneo a tus rutinas asignadas y progreso.</p>
          <p className="text-[11px] text-gray-400">• Notificaciones y actualizaciones inmediatas sin descargas pesadas.</p>
        </div>

        {/* ENLACE PARA ANDROID */}
        <div className="text-center pt-3 border-t border-gray-800/80">
          <p className="text-[11px] text-gray-500">
            ¿Tu dispositivo es Android?{' '}
            <Link
              href="/download"
              className="text-[#00ff87] hover:underline font-bold inline-flex items-center gap-1"
            >
              <span>Descargar APK para Android</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}
