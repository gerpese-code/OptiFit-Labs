'use client';

import React from 'react';
import { useUnit } from '@/context/UnitContext';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { LogOut, Scale } from 'lucide-react';

interface AdminHeaderProps {
  title?: string;
  adminEmail?: string;
}

export default function AdminHeader({ title = 'Panel de Administración', adminEmail }: AdminHeaderProps) {
  const { unit, setUnit } = useUnit();
  const supabase = createClient();
  const router = useRouter();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  // Sincronización automática de nuevos registros para despacho de correos
  React.useEffect(() => {
    const syncRegistrations = async () => {
      try {
        await fetch('/api/notifications/new-user?sync=true');
      } catch (err) {
        // Silencioso
      }
    };
    syncRegistrations();
    const interval = setInterval(syncRegistrations, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-emerald-950/50 bg-[#030805]/85 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 relative after:content-[''] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-transparent after:via-[#00ff87]/30 after:to-transparent">
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
      </div>

      <div className="flex items-center space-x-5">
        {/* Selector Global de Unidades (KG / LBS) */}
        <div className="flex items-center bg-[#06140b] p-1 rounded-lg border border-emerald-900/40 shadow-inner">
          <div className="flex items-center px-2 text-xs font-semibold text-emerald-500/70">
            <Scale className="w-3.5 h-3.5 mr-1" />
            <span>UNIDAD:</span>
          </div>
          <button
            type="button"
            onClick={() => setUnit('kg')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              unit === 'kg'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-gray-400 hover:text-emerald-300'
            }`}
          >
            KG
          </button>
          <button
            type="button"
            onClick={() => setUnit('lbs')}
            className={`px-3 py-1 text-xs font-bold rounded-md transition-colors ${
              unit === 'lbs'
                ? 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
                : 'text-gray-400 hover:text-emerald-300'
            }`}
          >
            LBS
          </button>
        </div>

        {/* Perfil y Logout */}
        <div className="flex items-center space-x-3 border-l border-emerald-950/60 pl-5">
          {adminEmail && (
            <span className="text-xs text-emerald-400/80 font-medium hidden sm:inline-block">
              {adminEmail}
            </span>
          )}
          <button
            onClick={handleSignOut}
            className="p-2 rounded-lg text-gray-400 hover:text-red-400 hover:bg-[#0c2415] transition"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
