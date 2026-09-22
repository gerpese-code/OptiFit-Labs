'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lock, Mail, Loader2, AlertCircle, Dumbbell } from 'lucide-react';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get('error');

  const supabase = createClient();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    errorParam === 'unauthorized'
      ? 'Acceso denegado: Tu cuenta no tiene permisos de Administrador.'
      : null
  );

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      // Verificar rol en tabla profiles
      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      console.log('Auth check profile:', { userId: data.user.id, profile, profileErr });

      if (profileErr || profile?.role !== 'admin') {
        await supabase.auth.signOut();
        setErrorMessage(
          `Acceso restringido: La cuenta no posee el rol de Administrador. (Rol encontrado: ${profile?.role || 'ninguno / no registrado en profiles'})`
        );
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Credenciales inválidas. Inténtalo nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl space-y-6">
      {/* Logo */}
      <div className="text-center space-y-2">
        <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 items-center justify-center mb-1 shadow-lg shadow-emerald-500/10">
          <Dumbbell className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">
          Fitness<span className="text-emerald-500">Pro</span> Admin
        </h1>
        <p className="text-xs text-gray-400">
          Ingresa con tus credenciales de coach administrador.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-xl flex items-start space-x-2 text-xs text-red-300">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="email"
              required
              placeholder="admin@fitnesspro.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-300 mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="password"
              required
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Iniciando Sesión...
            </>
          ) : (
            'Acceder al Panel'
          )}
        </button>
      </form>

      <div className="text-center pt-2 border-t border-gray-800">
        <p className="text-[11px] text-gray-500">
          Solo cuentas con rol <code className="text-emerald-400">admin</code> en Supabase pueden acceder.
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4">
      <Suspense
        fallback={
          <div className="text-gray-400 text-xs flex items-center">
            <Loader2 className="w-4 h-4 mr-2 animate-spin text-emerald-500" />
            Cargando...
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
