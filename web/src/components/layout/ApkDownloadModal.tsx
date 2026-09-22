'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Smartphone,
  Download,
  QrCode,
  Copy,
  Check,
  X,
  ExternalLink,
  MessageCircle,
  Sparkles,
} from 'lucide-react';

interface ApkDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName?: string;
  clientEmail?: string;
  clientPassword?: string;
}

export const LATEST_APK_VERSION = 'v1.0.10';
export const LATEST_APK_URL =
  'https://expo.dev/artifacts/eas/vM-A9tJYnvntNKBItXzubqOrNMHD16pgNOYL98W6How.apk';
export const LOCAL_APK_PATH = '/FitnessPro.apk';
export const DOWNLOAD_LANDING_PATH = '/download';

export default function ApkDownloadModal({
  isOpen,
  onClose,
  clientName,
  clientEmail,
  clientPassword,
}: ApkDownloadModalProps) {
  const [copiedApkUrl, setCopiedApkUrl] = useState(false);
  const [copiedWhatsAppMsg, setCopiedWhatsAppMsg] = useState(false);
  const [copiedPageUrl, setCopiedPageUrl] = useState(false);

  if (!isOpen) return null;

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    LATEST_APK_URL
  )}`;

  const handleCopyApkUrl = () => {
    navigator.clipboard.writeText(LATEST_APK_URL);
    setCopiedApkUrl(true);
    setTimeout(() => setCopiedApkUrl(false), 3000);
  };

  const handleCopyPageUrl = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const fullUrl = `${origin}${DOWNLOAD_LANDING_PATH}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedPageUrl(true);
    setTimeout(() => setCopiedPageUrl(false), 3000);
  };

  const handleCopyWhatsApp = () => {
    const name = clientName ? clientName : 'Campeón/a';
    let text = `¡Hola ${name}! 💪 Ya está disponible la aplicación oficial de OptiFit Labs.\n\n`;
    text += `📲 *Descarga la aplicación en tu celular Android aquí:*\n${LATEST_APK_URL}\n\n`;
    text += `🌐 *O ingresa a la página de instalación con instrucciones:*\n${
      typeof window !== 'undefined' ? window.location.origin : ''
    }${DOWNLOAD_LANDING_PATH}\n\n`;

    if (clientEmail && clientPassword) {
      text += `🔑 *Tus credenciales de acceso:*\n`;
      text += `📧 Correo: ${clientEmail}\n`;
      text += `🔒 Contraseña: ${clientPassword}\n\n`;
    }

    text += `¡Instálala y a darle con todo al entrenamiento! 🔥🏋️`;

    navigator.clipboard.writeText(text);
    setCopiedWhatsAppMsg(true);
    setTimeout(() => setCopiedWhatsAppMsg(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl space-y-5 relative max-h-[92vh] overflow-y-auto">
        {/* Botón Cerrar */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-400 hover:text-white p-1.5 rounded-xl hover:bg-gray-800 transition"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Encabezado */}
        <div className="flex items-center space-x-3 text-emerald-400 pr-8">
          <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-2xl shadow-inner">
            <Smartphone className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-black text-white">Instalar App OptiFit Labs</h3>
              <span className="text-[10px] uppercase font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                {LATEST_APK_VERSION}
              </span>
            </div>
            <p className="text-xs text-emerald-400 font-semibold">
              Última versión oficial para celulares Android
            </p>
          </div>
        </div>

        {/* Explicación breve */}
        <p className="text-xs text-gray-300 leading-relaxed">
          Apunta con la cámara de tu teléfono móvil al código QR para iniciar la descarga inmediata
          del APK, o utiliza los enlaces de descarga directa y opciones para compartir con tus alumnos.
        </p>

        {/* Contenedor del Código QR */}
        <div className="flex flex-col items-center justify-center p-5 bg-gray-950 border border-gray-800 rounded-2xl">
          <div className="relative group">
            <img
              src={qrApiUrl}
              alt="Código QR de Descarga APK OptiFit Labs"
              className="w-52 h-52 rounded-2xl bg-white p-2.5 shadow-2xl border-2 border-emerald-500/40 object-contain"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition rounded-2xl backdrop-blur-[1px] pointer-events-none">
              <span className="text-xs text-white font-bold bg-gray-900/90 px-3 py-1.5 rounded-lg border border-gray-700 shadow">
                Escanear con Celular
              </span>
            </div>
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold mt-3 flex items-center gap-1.5">
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            Apunta con la cámara para descargar en Android
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">
            Compatible con Android 8.0 en adelante (110.8 MB)
          </span>
        </div>

        {/* Botones de Descarga y Acciones Rápidas */}
        <div className="space-y-2.5">
          {/* Descargar APK Directo */}
          <a
            href={LOCAL_APK_PATH}
            download="FitnessPro.apk"
            className="w-full inline-flex items-center justify-center space-x-2 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-gray-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/50 transition transform active:scale-[0.99]"
          >
            <Download className="w-4 h-4" />
            <span>Descargar FitnessPro.apk Directo ({LATEST_APK_VERSION})</span>
          </a>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* Copiar enlace directo APK */}
            <button
              type="button"
              onClick={handleCopyApkUrl}
              className="inline-flex items-center justify-center space-x-2 py-2.5 px-3 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl text-xs font-bold border border-gray-700 transition"
              title="Copiar enlace de descarga directa en la nube"
            >
              {copiedApkUrl ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Enlace APK copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-gray-400" />
                  <span>Copiar Enlace Directo APK</span>
                </>
              )}
            </button>

            {/* Copiar Mensaje para WhatsApp */}
            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className="inline-flex items-center justify-center space-x-2 py-2.5 px-3 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 rounded-xl text-xs font-bold border border-emerald-800/60 transition"
              title="Copiar mensaje con saludo e instrucciones para enviar por WhatsApp"
            >
              {copiedWhatsAppMsg ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">¡Mensaje copiado!</span>
                </>
              ) : (
                <>
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copiar para WhatsApp</span>
                </>
              )}
            </button>
          </div>

          {/* Enlace a la página pública de instalación */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-800/80 text-xs">
            <Link
              href={DOWNLOAD_LANDING_PATH}
              target="_blank"
              className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1.5 transition"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Ver página de descarga con guía paso a paso</span>
            </Link>

            <button
              type="button"
              onClick={handleCopyPageUrl}
              className="text-gray-400 hover:text-gray-200 text-[11px] underline"
            >
              {copiedPageUrl ? '¡URL copiada!' : 'Copiar link de página'}
            </button>
          </div>
        </div>

        {/* Novedades v1.0.8 */}
        <div className="p-3 bg-gray-950/60 border border-gray-800/60 rounded-xl space-y-1 text-[11px] text-gray-400">
          <div className="flex items-center gap-1.5 font-bold text-gray-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            <span>Novedades en esta versión:</span>
          </div>
          <p className="leading-relaxed">
            • Temporizador de descanso ultra-preciso con reloj real del sistema y cero desfase.<br />
            • Identificación unificada con ID oficial de sistema y sincronización offline en segundo plano.<br />
            • 145 Ejercicios con doble imagen técnica oficial.<br />
            • Curvas de 1RM Epley y tonelaje acumulado optimizadas.<br />
            • Módulo BioHacker Peptides y selector de períodos en progresos.
          </p>
        </div>
      </div>
    </div>
  );
}
