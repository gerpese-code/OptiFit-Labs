'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dumbbell,
  LayoutDashboard,
  CalendarDays,
  Apple,
  Users,
  Activity,
  Smartphone,
  Download,
  QrCode,
} from 'lucide-react';
import ApkDownloadModal from './ApkDownloadModal';

const navigation = [
  { name: 'Dashboard General', href: '/admin', icon: LayoutDashboard },
  { name: 'Alumnos & Actividad', href: '/admin/clients', icon: Users },
  { name: 'Ejercicios Multimedia', href: '/admin/exercises', icon: Dumbbell },
  { name: 'Creador de Rutinas', href: '/admin/routines', icon: CalendarDays },
  { name: 'Planes de Nutrición', href: '/admin/nutrition', icon: Apple },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [isApkModalOpen, setIsApkModalOpen] = useState(false);

  return (
    <aside className="w-64 bg-[#030805]/95 border-r border-emerald-950/60 shadow-[4px_0_24px_rgba(0,0,0,0.8)] backdrop-blur-xl flex flex-col flex-shrink-0 min-h-screen relative after:content-[''] after:absolute after:top-0 after:right-0 after:bottom-0 after:w-[1px] after:bg-gradient-to-b after:from-transparent after:via-[#00ff87]/25 after:to-transparent">
      {/* Brand / Logo */}
      <div className="h-16 flex items-center px-6 border-b border-emerald-950/40">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white font-black shadow-lg shadow-emerald-500/30 ring-1 ring-[#00ff87]/40">
            OL
          </div>
          <div>
            <span className="font-extrabold text-white text-base tracking-wide">
              OPTIFIT<span className="text-[#00ff87]">LABS</span>
            </span>
            <span className="block text-[10px] uppercase font-bold text-emerald-500/70 tracking-wider">
              Coach & Performance Lab
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="text-[11px] font-bold text-emerald-600/70 px-3 mb-2 uppercase tracking-wider">
          Módulos Principales
        </div>
        {navigation.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-[#00ff87] border border-emerald-500/30 shadow-[0_0_12px_rgba(0,255,135,0.1)] font-semibold'
                  : 'text-gray-400 hover:text-emerald-200 hover:bg-[#06140b] border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 mr-3 ${isActive ? 'text-[#00ff87]' : 'text-gray-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Descargas Rápidas (APK & Manual) */}
      <div className="px-4 py-3 space-y-1.5 border-t border-emerald-950/50">
        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600/70 px-3 block">
          Recursos Alumnos
        </span>
        <button
          type="button"
          onClick={() => setIsApkModalOpen(true)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-800/60 shadow-sm transition group"
          title="Ver código QR y opciones de descarga para celular"
        >
          <div className="flex items-center">
            <QrCode className="w-3.5 h-3.5 mr-2 text-[#00ff87] group-hover:scale-110 transition-transform" />
            <span>Descargar App & QR</span>
          </div>
          <span className="text-[9px] bg-emerald-500/20 text-[#00ff87] font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
            v1.0.13
          </span>
        </button>
        <a
          href="/FitnessPro.apk"
          download="FitnessPro.apk"
          className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-gray-300 hover:text-emerald-300 hover:bg-emerald-950/20 border border-emerald-950/60 hover:border-emerald-900/40 transition"
          title="Descargar instalador APK directo para celulares Android"
        >
          <Smartphone className="w-3.5 h-3.5 mr-2.5 text-[#00ff87]" />
          <span>Descarga Directa APK</span>
        </a>
        <a
          href="/Manual_Fitness_Pro.pdf"
          download="Manual_Fitness_Pro.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center px-3 py-2 rounded-xl text-xs font-medium text-gray-400 hover:text-gray-200 hover:bg-[#06140b] transition"
        >
          <Download className="w-3.5 h-3.5 mr-2.5 text-gray-400" />
          <span>Manual PDF Alumnos</span>
        </a>
      </div>

      {/* Realtime Live Status Footer */}
      <div className="p-4 border-t border-emerald-950/50">
        <div className="bg-[#051109]/90 rounded-xl p-3 border border-emerald-900/40 shadow-inner">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff87] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff87]"></span>
            </span>
            <span className="text-xs font-semibold text-[#00ff87]">
              Supabase Realtime Activo
            </span>
          </div>
          <p className="text-[11px] text-gray-400 mt-1">
            Canales listos para sincronización en vivo.
          </p>
        </div>
      </div>

      {/* Modal Global para Descarga de APK y Código QR */}
      <ApkDownloadModal
        isOpen={isApkModalOpen}
        onClose={() => setIsApkModalOpen(false)}
      />
    </aside>
  );
}
