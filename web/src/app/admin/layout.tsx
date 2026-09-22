import React from 'react';
import AdminSidebar from '@/components/layout/AdminSidebar';
import AdminHeader from '@/components/layout/AdminHeader';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-[#020503] relative overflow-hidden text-gray-100">
      {/* Luces LED de Neón de Gimnasio (Ambiente Superior y Angulado) */}
      <div className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#00ff87] to-transparent shadow-[0_0_14px_#00ff87,0_0_28px_#10b981] z-50 pointer-events-none" />
      <div className="fixed -top-28 right-1/4 w-[600px] h-[3px] -rotate-12 bg-gradient-to-r from-transparent via-[#00ff87]/70 to-transparent shadow-[0_0_25px_#00ff87,0_0_50px_#10b981] pointer-events-none z-0 opacity-40 blur-[0.5px]" />
      <div className="fixed top-1/2 -left-24 w-[450px] h-[2px] rotate-[32deg] bg-gradient-to-r from-transparent via-[#10b981]/50 to-transparent shadow-[0_0_20px_#10b981] pointer-events-none z-0 opacity-25" />

      {/* Sidebar fijo */}
      <AdminSidebar />

      {/* Área de Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <AdminHeader adminEmail={user?.email} />
        <main className="flex-1 p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
