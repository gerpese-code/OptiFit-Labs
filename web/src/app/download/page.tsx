'use client';

import React, { useState, useEffect } from 'react';
import {
  Share,
  PlusSquare,
  Sparkles,
  Download,
  Cloud,
  Check,
  Copy,
  Smartphone,
  ShieldCheck,
  ChevronRight,
  Info,
} from 'lucide-react';

export default function UniversalDownloadPage() {
  const [platform, setPlatform] = useState<'ios' | 'android'>('android');
  const [copied, setCopied] = useState(false);

  // Detección automática del dispositivo del usuario
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || navigator.vendor || (window as any).opera || '';
      if (/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream) {
        setPlatform('ios');
      } else if (/android/i.test(ua)) {
        setPlatform('android');
      }
    }
  }, []);

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#020503] text-gray-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Luces LED de Neón Ambientales */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_14px_#00ff87,0_0_28px_#10b981] z-50 pointer-events-none" />
      <div className="fixed -top-20 right-1/4 w-[500px] h-[3px] -rotate-12 bg-gradient-to-r from-transparent via-[#00ff87]/60 to-transparent shadow-[0_0_20px_#00ff87] pointer-events-none z-0 opacity-40 blur-[0.5px]" />
      <div className="fixed -bottom-20 -left-20 w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-3xl pointer-events-none z-0" />

      <div className="max-w-md w-full bg-[#040f08]/90 border border-emerald-950/80 rounded-3xl p-6 shadow-2xl shadow-black/80 backdrop-blur-xl relative z-10 my-8">
        
        {/* Encabezado Principal */}
        <div className="text-center mb-6">
          <div className="relative inline-block mb-3">
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur-md opacity-40 animate-pulse" />
            <img
              src="/app-icon.png"
              alt="Icono Oficial OptiFit Labs"
              className="relative w-20 h-20 rounded-2xl border border-[#00ff87]/50 shadow-2xl shadow-emerald-500/30 object-cover"
            />
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">OptiFit Labs</h1>
          <p className="text-xs font-semibold text-[#00ff87] uppercase tracking-widest mt-1">
            Instalador Oficial de la Aplicación
          </p>
          <p className="text-[11px] text-gray-400 mt-1 max-w-xs mx-auto">
            Elige tu dispositivo para comenzar a entrenar:
          </p>
        </div>

        {/* Selector de Plataforma (Tabs: Apple vs Android) */}
        <div className="grid grid-cols-2 gap-2 bg-[#020503] p-1.5 rounded-2xl border border-emerald-950/80 mb-6 shadow-inner">
          <button
            onClick={() => setPlatform('ios')}
            className={`py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              platform === 'ios'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-lg shadow-cyan-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
          >
            <span>🍏</span>
            <span>iPhone / Apple</span>
          </button>

          <button
            onClick={() => setPlatform('android')}
            className={`py-3 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
              platform === 'android'
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/25 scale-[1.02]'
                : 'text-gray-400 hover:text-white hover:bg-gray-900/60'
            }`}
          >
            <span>🤖</span>
            <span>Android</span>
          </button>
        </div>

        {/* VISTA PARA APPLE / IPHONE */}
        {platform === 'ios' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Alerta de Instagram */}
            <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 text-xs text-amber-200">
              <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-300">
                <span className="text-base">⚠️</span>
                <span>¿Abierto desde Instagram?</span>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed mb-3">
                Instagram bloquea la instalación directa. Debes abrir este link en <strong>Safari</strong>:
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
                    <span>Copiar enlace para pegar en Safari</span>
                  </>
                )}
              </button>
            </div>

            {/* Pasos en Safari */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Pasos para instalar en tu iPhone:
              </h3>

              <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Toca el botón Compartir</span>
                    <span className="p-1 bg-slate-800 rounded-md text-cyan-400">
                      <Share className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    En la barra inferior de <strong>Safari</strong>, pulsa el botón central de compartir (el cuadrito con la flecha hacia arriba).
                  </p>
                </div>
              </div>

              <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Selecciona "Agregar a pantalla de inicio"</span>
                    <span className="p-1 bg-slate-800 rounded-md text-emerald-400">
                      <PlusSquare className="w-3 h-3" />
                    </span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Desliza hacia abajo en el menú y toca <strong>"Agregar a pantalla de inicio"</strong> (<em>Add to Home Screen</em>).
                  </p>
                </div>
              </div>

              <div className="bg-[#030905]/90 border border-emerald-950/70 rounded-2xl p-3.5 flex items-start gap-3">
                <div className="w-7 h-7 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-black flex items-center justify-center text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>Confirma tocando "Agregar"</span>
                    <span className="text-[#00ff87] font-bold">✓</span>
                  </h4>
                  <p className="text-[11px] text-gray-400 mt-1 leading-relaxed">
                    Pulsa <strong>"Agregar"</strong> arriba a la derecha. ¡Listo! El icono de OptiFit Labs se instalará en tu pantalla de inicio y abrirá a pantalla completa.
                  </p>
                </div>
              </div>

              <a
                href="/app/"
                className="flex items-center justify-center gap-2 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition-all text-center mt-4"
              >
                <span>🚀 Abrir App en Safari (Instalar) ➔</span>
              </a>
            </div>
          </div>
        )}

        {/* VISTA PARA ANDROID */}
        {platform === 'android' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Novedad destacada v1.0.18 */}
            <div className="bg-[#030905]/90 border border-emerald-500/25 rounded-2xl p-3.5 shadow-inner">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs bg-emerald-500/20 text-[#00ff87] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Versión 1.0.18
                </span>
                <span className="text-xs font-bold text-white">Última Versión Oficial</span>
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                • Botones compactos de Asesorías VIP y Péptidos BioHacker.<br />
                • Rutinas del coach primero y discriminación muscular estricta.<br />
                • Navegación fluida con botón atrás del teléfono.
              </p>
            </div>

            {/* Código QR para escanear desde PC si corresponde */}
            <div className="flex flex-col items-center justify-center p-3.5 bg-[#030905]/90 border border-emerald-950/60 rounded-2xl text-center">
              <img
                src="/apk-download-qr.png"
                alt="Código QR de Descarga APK OptiFit Labs"
                className="w-36 h-36 rounded-xl bg-white p-2 shadow-xl border border-emerald-500/30 object-contain"
              />
              <p className="text-[10px] text-[#00ff87] font-bold mt-2">
                Escanea con la cámara o pulsa el botón de abajo:
              </p>
            </div>

            {/* Botones de Descarga */}
            <div className="space-y-2.5">
              <a
                href="/FitnessPro.apk"
                download="OptiFitLabs.apk"
                className="flex items-center justify-center gap-3 w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-black text-sm shadow-lg shadow-emerald-500/25 transition-all transform active:scale-95 text-center"
              >
                <Download className="w-4 h-4" />
                <span>Descargar APK Directo (111.1 MB)</span>
              </a>

              <a
                href="https://expo.dev/artifacts/eas/-W4xtYDO_zLWkE7yBcV2WJ0cBOVQtIxbOgJY7XPe728.apk"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-bold text-slate-300 transition-colors text-center"
              >
                <Cloud className="w-3.5 h-3.5 text-cyan-400" />
                <span>Enlace Cloud Alternativo (Expo CDN)</span>
              </a>
            </div>

            {/* Instrucción rápida para Android */}
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-[11px] text-slate-400">
              <strong className="text-slate-200">Instalación:</strong> Cuando finalice la descarga, abre la notificación (o tu carpeta de Descargas) y presiona <em>Actualizar</em> o <em>Instalar</em>.
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
