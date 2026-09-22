'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Profile, WorkoutSession, Routine } from '@/types/database';
import { getClientActivityInfo, ClientActivityInfo } from '@/lib/utils/activity';
import Link from 'next/link';
import {
  Users,
  Search,
  ArrowUpRight,
  Loader2,
  Calendar,
  Clock,
  Dumbbell,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Download,
  Lock,
  Unlock,
  Info,
  UserPlus,
  Trash2,
  Eye,
  EyeOff,
  Copy,
  Check,
  KeyRound,
  AlertTriangle,
  X,
  Smartphone,
  QrCode,
  Cake,
  Plus,
  Edit3,
  RotateCcw,
} from 'lucide-react';
import {
  isBirthdayToday,
  calculateAgeFromBirthDate,
  formatBirthDateShort,
  formatBirthDateFull,
} from '@/lib/birthDateUtils';
import { getClientCode, formatClientBadge } from '@/lib/utils/clientCode';
import ClientRoutineModal from '@/components/clients/ClientRoutineModal';
import ResetProgressModal from '@/components/clients/ResetProgressModal';
import ApkDownloadModal, { LATEST_APK_URL, DOWNLOAD_LANDING_PATH } from '@/components/layout/ApkDownloadModal';

interface EnrichedClientRoutine {
  id: string;
  title: string;
  isActive: boolean;
  muscle_group?: string | null;
}

interface EnrichedClient extends Profile {
  email?: string | null;
  activityInfo: ClientActivityInfo;
  latestSession?: WorkoutSession | null;
  assignedRoutineId?: string | null;
  assignedRoutineTitle?: string | null;
  assignedRoutines: EnrichedClientRoutine[];
  completedSessionsCount: number;
  clientCode: string;
}

export default function AdminClientsDirectoryPage() {
  const supabase = createClient();

  const [clients, setClients] = useState<EnrichedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [togglingClientId, setTogglingClientId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'online' | 'today' | 'inactive' | 'birthdays'>('all');

  // Modal Crear Alumno
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newBirthDate, setNewBirthDate] = useState('');
  const [newUnit, setNewUnit] = useState<'kg' | 'lbs'>('kg');
  const [showPassword, setShowPassword] = useState(false);
  const [creatingClient, setCreatingClient] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdResult, setCreatedResult] = useState<{
    fullName: string;
    email: string;
    password: string;
    usedAdminBypass: boolean;
  } | null>(null);
  const [copiedCredentials, setCopiedCredentials] = useState(false);

  // Modal Eliminar Alumno
  const [clientToDelete, setClientToDelete] = useState<EnrichedClient | null>(null);
  const [deletingClient, setDeletingClient] = useState(false);

  // Modal Código QR APK
  const [isApkQrModalOpen, setIsApkQrModalOpen] = useState(false);

  // Modal Asignar / Cambiar Rutina Alumno
  const [selectedClientForRoutine, setSelectedClientForRoutine] = useState<EnrichedClient | null>(null);
  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);

  // Modal Resetear Progreso / Rendimiento del Alumno
  const [clientToResetProgress, setClientToResetProgress] = useState<EnrichedClient | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 8; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(pwd);
  };

  const copyWhatsAppText = () => {
    if (!createdResult) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const text = `¡Hola ${createdResult.fullName}! 💪 Ya creé tu cuenta en OptiFit Labs.\n\n` +
      `Para empezar a entrenar:\n` +
      `1. Descarga la aplicación en tu celular Android desde este enlace:\n${LATEST_APK_URL}\n\n` +
      `2. O accede a la guía con instrucciones y código QR:\n${origin}${DOWNLOAD_LANDING_PATH}\n\n` +
      `3. Instálala en tu celular e ingresa con tus credenciales:\n` +
      `📧 Correo: ${createdResult.email}\n` +
      `🔑 Contraseña: ${createdResult.password}\n\n` +
      `¡Bienvenido y a darle con todo! 🔥🏋️`;
    navigator.clipboard.writeText(text);
    setCopiedCredentials(true);
    setTimeout(() => setCopiedCredentials(false), 3000);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim() || !newEmail.trim() || !newPassword) {
      setCreateError('Por favor completa todos los campos.');
      return;
    }
    if (newPassword.length < 6) {
      setCreateError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setCreatingClient(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: newFullName,
          email: newEmail,
          password: newPassword,
          unitPreference: newUnit,
          birthDate: newBirthDate || null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al crear el alumno.');
      }

      setCreatedResult({
        fullName: newFullName.trim(),
        email: newEmail.trim().toLowerCase(),
        password: newPassword,
        usedAdminBypass: !!data.usedAdminBypass,
      });

      // Recargar lista de alumnos
      await loadClientsData();
    } catch (err: any) {
      setCreateError(err.message || 'Ocurrió un error inesperado al registrar el alumno.');
    } finally {
      setCreatingClient(false);
    }
  };

  const handleDeleteClient = async () => {
    if (!clientToDelete) return;
    setDeletingClient(true);

    try {
      const res = await fetch('/api/admin/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientId: clientToDelete.id }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Error al eliminar el alumno.');
      }

      setClients((prev) => prev.filter((c) => c.id !== clientToDelete.id));
      setStatusMessage({
        type: 'success',
        text: `Alumno "${clientToDelete.full_name}" eliminado correctamente del sistema.`,
      });
      setClientToDelete(null);
    } catch (err: any) {
      console.error('Error al eliminar alumno:', err);
      alert(err.message || 'No se pudo eliminar al alumno.');
    } finally {
      setDeletingClient(false);
    }
  };

  const handleToggleClientStatus = async (client: EnrichedClient) => {
    const isCurrentlyActive = client.is_active !== false;
    const nextStatus = !isCurrentlyActive;
    setTogglingClientId(client.id);
    setStatusMessage(null);

    try {
      // 1. Actualizar profiles.is_active
      const { error: profErr } = await supabase
        .from('profiles')
        .update({ is_active: nextStatus, updated_at: new Date().toISOString() })
        .eq('id', client.id);

      if (profErr) {
        console.warn('Nota sobre profiles.is_active en Supabase:', profErr.message);
      }

      // 2. Sincronizar rutinas del alumno para que directivas RLS bloqueen/habiliten acceso
      const { error: routErr } = await supabase
        .from('routines')
        .update({ is_active: nextStatus })
        .eq('client_id', client.id);

      if (routErr) {
        console.warn('Nota sobre routines.is_active en Supabase:', routErr.message);
      }

      // 3. Actualizar estado local inmediatamente
      setClients((prev) =>
        prev.map((c) =>
          c.id === client.id ? { ...c, is_active: nextStatus } : c
        )
      );

      setStatusMessage({
        type: 'success',
        text: nextStatus
          ? `Membresía de "${client.full_name}" REACTIVADA. El alumno tiene acceso total a sus rutinas y progreso.`
          : `Membresía de "${client.full_name}" PAUSADA / LIMITADA. El alumno puede iniciar sesión pero sus rutinas y progreso están bloqueados.`,
      });
    } catch (err: any) {
      console.error('Error al alternar estado del alumno:', err);
      setStatusMessage({
        type: 'error',
        text: 'Ocurrió un error al actualizar el estado del alumno. Revisa la conexión con Supabase.',
      });
    } finally {
      setTogglingClientId(null);
    }
  };

  const loadClientsData = async () => {
    setLoading(true);
    try {
      // 1. Cargar todos los usuarios (alumnos y coach) activos ordenados por fecha de registro para indexar códigos
      const { data: profilesData, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', '1e838c07-f020-4694-b0f7-b4d44bb0b61a') // Excluir cuenta bot/técnica del sistema admin@optifitlabs.com
        .is('deleted_at', null)
        .order('created_at', { ascending: true });

      if (profErr) throw profErr;
      const profiles: Profile[] = profilesData || [];

      // 1.1 Cargar códigos únicos y correos de alumno desde la API de administración
      let clientCodesMap: Record<string, string> = {};
      let clientEmailsMap: Record<string, string> = {};
      try {
        const codesRes = await fetch('/api/admin/clients');
        const codesData = await codesRes.json();
        if (codesData?.success) {
          if (codesData.codes) clientCodesMap = codesData.codes;
          if (codesData.emails) clientEmailsMap = codesData.emails;
        }
      } catch (e) {
        console.warn('Nota consultando códigos/correos de alumno:', e);
      }

      // 2. Cargar sesiones para calcular última actividad y conteo
      const { data: sessionsData } = await supabase
        .from('workout_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      const allSessions: WorkoutSession[] = sessionsData || [];

      // 3. Cargar rutinas de los alumnos (activas o pausadas)
      const { data: routinesData } = await supabase
        .from('routines')
        .select('id, title, is_active, client_id')
        .not('client_id', 'is', null)
        .order('created_at', { ascending: false });

      const allRoutines = routinesData || [];

      // Enriquecer cada alumno con su actividad, última sesión, código único de 3 letras + 3 números, correo y rutinas
      const enriched: EnrichedClient[] = profiles.map((client, idx) => {
        const clientSessions = allSessions.filter((s) => s.client_id === client.id);
        const latestSession = clientSessions.length > 0 ? clientSessions[0] : null;
        const clientRoutines: EnrichedClientRoutine[] = allRoutines
          .filter((r) => r.client_id === client.id)
          .map((r) => ({
            id: r.id,
            title: r.title,
            isActive: r.is_active !== false,
          }));
        const primaryRoutine = clientRoutines.find((r) => r.isActive) || clientRoutines[0];

        const activityInfo = getClientActivityInfo(client, latestSession);
        const code = clientCodesMap[client.id] || getClientCode(client, idx);
        const userEmail = clientEmailsMap[client.id] || null;

        return {
          ...client,
          email: userEmail,
          activityInfo,
          latestSession,
          assignedRoutineId: primaryRoutine?.id || null,
          assignedRoutineTitle: primaryRoutine?.title || null,
          assignedRoutines: clientRoutines,
          completedSessionsCount: clientSessions.filter((s) => s.status === 'completed').length,
          clientCode: code,
        };
      });

      // Ordenar para la visualización: primero los que están en línea, luego los más activos recientemente
      enriched.sort((a, b) => {
        if (a.activityInfo.isOnline && !b.activityInfo.isOnline) return -1;
        if (!a.activityInfo.isOnline && b.activityInfo.isOnline) return 1;
        return (
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
        );
      });

      setClients(enriched);
    } catch (err) {
      console.error('Error al cargar directorio de alumnos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClientsData();
  }, []);

  // Filtrado dinámico
  const filteredClients = useMemo(() => {
    const q = searchQuery.toLowerCase().trim().replace('#', '');
    return clients.filter((client) => {
      const matchesSearch =
        !q ||
        client.full_name.toLowerCase().includes(q) ||
        (client.email && client.email.toLowerCase().includes(q)) ||
        client.id.toLowerCase().includes(q) ||
        client.clientCode.includes(q);

      if (!matchesSearch) return false;

      if (activeFilter === 'birthdays') {
        return !!(client.birth_date && isBirthdayToday(client.birth_date));
      }
      if (activeFilter === 'online') {
        return client.activityInfo.isOnline;
      }
      if (activeFilter === 'today') {
        return client.activityInfo.status === 'online' || client.activityInfo.status === 'today';
      }
      if (activeFilter === 'inactive') {
        return client.activityInfo.status === 'inactive';
      }
      return true;
    });
  }, [clients, searchQuery, activeFilter]);

  const onlineCount = clients.filter((c) => c.activityInfo.isOnline).length;
  const todayCount = clients.filter(
    (c) => c.activityInfo.status === 'online' || c.activityInfo.status === 'today'
  ).length;
  const inactiveCount = clients.filter((c) => c.activityInfo.status === 'inactive').length;
  const birthdayClients = clients.filter((c) => c.birth_date && isBirthdayToday(c.birth_date));
  const birthdayCount = birthdayClients.length;

  return (
    <div className="space-y-6 pb-12">
      {/* Encabezado Principal */}
      <div className="bg-gradient-to-r from-emerald-950/60 via-gray-900 to-gray-900 border border-emerald-900/30 rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Supervisión y Auditoría
          </span>
          <h1 className="text-2xl lg:text-3xl font-black text-white mt-1">
            Alumnos & Actividad en la App
          </h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Supervisa en tiempo real cuándo se registraron tus alumnos y la última vez que
            estuvieron activos entrenando o abriendo la aplicación móvil.
          </p>
        </div>

        <div className="flex items-center space-x-2.5 self-start md:self-auto flex-wrap gap-2">
          <button
            onClick={() => {
              setNewFullName('');
              setNewEmail('');
              setNewPassword('');
              setNewBirthDate('');
              setNewUnit('kg');
              setCreateError(null);
              setCreatedResult(null);
              setIsCreateModalOpen(true);
            }}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 transition"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Alumno</span>
          </button>

          <a
            href="/FitnessPro.apk"
            download="FitnessPro.apk"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-bold border border-emerald-700/60 shadow-lg shadow-emerald-950/30 transition"
            title="Descargar instalador APK directo para celulares Android"
          >
            <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
            <span>App Android (APK)</span>
          </a>

          <button
            onClick={() => setIsApkQrModalOpen(true)}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-800/90 hover:bg-gray-700 text-emerald-300 hover:text-emerald-200 rounded-xl text-xs font-bold border border-gray-700 shadow-lg transition"
            title="Escanear código QR para descargar la App en el celular"
          >
            <QrCode className="w-3.5 h-3.5 text-emerald-400" />
            <span>QR Celular</span>
          </button>

          <a
            href="/Manual_Fitness_Pro.pdf"
            download="Manual_Fitness_Pro.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 hover:text-white rounded-xl text-xs font-bold border border-gray-700 shadow-lg shadow-emerald-950/20 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Manual PDF</span>
          </a>

          <button
            onClick={loadClientsData}
            className="inline-flex items-center space-x-2 px-4 py-2.5 bg-gray-800/80 hover:bg-gray-800 text-gray-300 hover:text-white rounded-xl border border-gray-700 text-xs font-bold transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Actualizar Estado</span>
          </button>
        </div>
      </div>

      {/* Aviso de Cumpleaños para el Coach si hay cumpleañeros hoy */}
      {birthdayCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-gray-900 to-amber-950/50 border border-amber-500/40 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-xl shrink-0">
              🎂
            </div>
            <div>
              <h4 className="text-sm font-black text-amber-300 flex items-center space-x-2">
                <span>¡{birthdayCount === 1 ? '1 Alumno cumple años hoy' : `${birthdayCount} Alumnos cumplen años hoy`}!</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 font-bold">
                  🎉 ¡Felicidades!
                </span>
              </h4>
              <p className="text-xs text-amber-100/70 mt-0.5">
                {birthdayClients.map((c) => c.full_name).join(', ')} · Aprovecha para enviarles un saludo y felicitarlos por WhatsApp.
              </p>
            </div>
          </div>
          <button
            onClick={() => setActiveFilter('birthdays')}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-gray-950 rounded-xl text-xs font-black transition self-start sm:self-auto shrink-0 shadow"
          >
            Ver Cumpleañeros
          </button>
        </div>
      )}

      {/* Banner Informativo de Membresías y Control de Acceso */}
      <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-2xl p-4 flex items-start space-x-3 text-xs text-gray-300">
        <Info className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold text-emerald-300 block">
            Control de Membresías (Activo / Inactivo):
          </span>
          <p className="text-gray-400 leading-relaxed">
            Puedes activar o pausar el acceso de cada alumno directamente desde la tabla inferior. Si marcas a un alumno como <strong>Inactivo</strong>, podrá iniciar sesión en la app pero tendrá bloqueadas sus rutinas, el registro de series y sus gráficos de progreso, mostrándole un aviso para coordinar contigo su reactivación.
          </p>
        </div>
      </div>

      {/* Mensaje de Confirmación tras alternar estado */}
      {statusMessage && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/80 border-emerald-600/60 text-emerald-200'
              : 'bg-red-950/80 border-red-600/60 text-red-200'
          }`}
        >
          <div className="flex items-center space-x-2.5">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button
            onClick={() => setStatusMessage(null)}
            className="text-gray-400 hover:text-white text-xs font-bold ml-4 px-2 py-0.5 hover:bg-gray-800/50 rounded-lg"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tarjetas KPI de Estado de Conexión */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Total Alumnos
            </span>
            <div className="p-2 bg-gray-800 text-gray-300 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-white mt-2">{clients.length}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Cuentas registradas en Supabase
          </span>
        </div>

        <div className="bg-gray-900 border border-emerald-900/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-400 uppercase">
              En Línea Ahora
            </span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl border border-emerald-800/40 relative">
              <span className="animate-ping absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="relative w-2 h-2 rounded-full bg-emerald-500 block"></span>
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-400 mt-2">{onlineCount}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Activos en los últimos 15 min
          </span>
        </div>

        <div className="bg-gray-900 border border-amber-900/40 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-400 uppercase">
              Activos Hoy
            </span>
            <div className="p-2 bg-amber-950/60 text-amber-400 rounded-xl border border-amber-800/40">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-400 mt-2">{todayCount}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Sesión o rutina abierta hoy
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase">
              Sin Actividad Reciente
            </span>
            <div className="p-2 bg-gray-800 text-gray-400 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-400 mt-2">{inactiveCount}</p>
          <span className="text-[11px] text-gray-500 mt-1 block">
            Más de 7 días sin conexión
          </span>
        </div>
      </div>

      {/* Barra de Búsqueda y Pestañas de Filtro */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Buscar por nombre o ID del alumno..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'all'
                ? 'bg-gray-800 text-white'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            Todos ({clients.length})
          </button>
          <button
            onClick={() => setActiveFilter('online')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeFilter === 'online'
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-700/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>En Línea ({onlineCount})</span>
          </button>
          <button
            onClick={() => setActiveFilter('today')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
              activeFilter === 'today'
                ? 'bg-amber-950 text-amber-300 border border-amber-700/50'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>Hoy ({todayCount})</span>
          </button>
          {birthdayCount > 0 && (
            <button
              onClick={() => setActiveFilter('birthdays')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center space-x-1.5 ${
                activeFilter === 'birthdays'
                  ? 'bg-amber-950 text-amber-300 border border-amber-500 shadow-sm'
                  : 'text-amber-400 hover:text-amber-200 hover:bg-amber-950/40'
              }`}
            >
              <span>🎂</span>
              <span>Cumpleaños ({birthdayCount})</span>
            </button>
          )}
          <button
            onClick={() => setActiveFilter('inactive')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeFilter === 'inactive'
                ? 'bg-gray-800 text-red-400'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
            }`}
          >
            Inactivos ({inactiveCount})
          </button>
        </div>
      </div>

      {/* Tabla y Tarjetas de Alumnos */}
      <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {loading ? (
          <div className="h-60 flex flex-col items-center justify-center space-y-3 text-gray-500 text-xs">
            <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
            <span>Consultando estado de actividad de alumnos en Supabase...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="py-16 text-center text-xs text-gray-500 space-y-2">
            <Users className="w-8 h-8 text-gray-600 mx-auto" />
            <p>No se encontraron alumnos con los filtros seleccionados.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-gray-950/80 border-b border-gray-800 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Alumno</th>
                  <th className="py-3.5 px-4">Membresía & Acceso</th>
                  <th className="py-3.5 px-4">Estado & Última Conexión</th>
                  <th className="py-3.5 px-4">Fecha Registro</th>
                  <th className="py-3.5 px-4">Rutina Asignada</th>
                  <th className="py-3.5 px-4">Unidad</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-950/40 transition group"
                  >
                    {/* Alumno */}
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 font-black flex items-center justify-center text-sm border border-emerald-500/20">
                            {client.full_name.charAt(0).toUpperCase()}
                          </div>
                          {client.activityInfo.isOnline && (
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-gray-900"></span>
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-white text-sm flex items-center space-x-2">
                            <span>{client.full_name}</span>
                            {client.role === 'admin' && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-black">
                                Coach / Tú
                              </span>
                            )}
                            {client.birth_date && isBirthdayToday(client.birth_date) && (
                              <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-black animate-pulse">
                                <span>🎂</span>
                                <span>¡Cumpleaños Hoy!</span>
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                            {client.email && (
                              <span className="text-emerald-400/90 font-medium">
                                {client.email}
                              </span>
                            )}
                            <span className="text-gray-500 font-mono text-[10px]">
                              ID: {client.id.slice(0, 8)}...
                            </span>
                            {client.birth_date && (
                              <span className="text-gray-400 flex items-center space-x-1 text-[10px]">
                                <Cake className="w-3 h-3 text-amber-400 shrink-0" />
                                <span>
                                  {formatBirthDateShort(client.birth_date)} ({calculateAgeFromBirthDate(client.birth_date)} años)
                                </span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Membresía / Control de Acceso (Activo / Inactivo) */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {client.is_active !== false ? (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 border border-emerald-800 text-emerald-400 font-bold text-[11px]">
                              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Activo</span>
                            </span>
                            <button
                              onClick={() => handleToggleClientStatus(client)}
                              disabled={togglingClientId === client.id}
                              title="Pausar membresía (limita rutinas y progreso en la app)"
                              className="px-2.5 py-1 rounded-lg bg-gray-800 hover:bg-amber-950 text-gray-400 hover:text-amber-300 border border-gray-700 hover:border-amber-700/60 text-[10px] font-bold transition flex items-center space-x-1"
                            >
                              {togglingClientId === client.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Pausar</span>
                                </>
                              )}
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-red-950/70 border border-red-800 text-red-400 font-bold text-[11px]">
                              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                              <span>Inactivo</span>
                            </span>
                            <button
                              onClick={() => handleToggleClientStatus(client)}
                              disabled={togglingClientId === client.id}
                              title="Reactivar acceso completo a rutinas y progreso"
                              className="px-2.5 py-1 rounded-lg bg-emerald-900/60 hover:bg-emerald-800 text-emerald-300 hover:text-white border border-emerald-700 text-[10px] font-bold transition flex items-center space-x-1"
                            >
                              {togglingClientId === client.id ? (
                                <Loader2 className="w-3 h-3 animate-spin text-emerald-400" />
                              ) : (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Activar</span>
                                </>
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Estado & Última Actividad en la App */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold ${client.activityInfo.badgeClass}`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${client.activityInfo.dotColor}`}
                          ></span>
                          <span>{client.activityInfo.label}</span>
                        </span>
                        <div className="text-[10px] text-gray-500 flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{client.activityInfo.lastActiveFormatted}</span>
                        </div>
                      </div>
                    </td>

                    {/* Fecha de Registro */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5 text-gray-300 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-gray-500" />
                        <span>{client.activityInfo.registeredFormatted}</span>
                      </div>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        {new Date(client.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </td>

                    {/* Rutinas Asignadas con Controles de Asignación y Edición */}
                    <td className="py-4 px-4">
                      {client.assignedRoutines && client.assignedRoutines.length > 0 ? (
                        <div className="space-y-1.5">
                          <div className="flex flex-wrap gap-1 max-w-[280px]">
                            {client.assignedRoutines.map((routine) => (
                              <div
                                key={routine.id}
                                className={`inline-flex items-center space-x-1.5 px-2 py-1 rounded-lg border text-[10px] font-bold ${
                                  routine.isActive
                                    ? 'bg-emerald-950/70 border-emerald-800 text-emerald-300'
                                    : 'bg-amber-950/60 border-amber-800/80 text-amber-400'
                                }`}
                              >
                                <Dumbbell className="w-2.5 h-2.5 shrink-0" />
                                <span className="truncate max-w-[120px]" title={routine.title}>
                                  {routine.title}
                                </span>
                                {routine.muscle_group && (
                                  <span className="text-[9px] px-1 py-0.2 bg-emerald-500/20 text-emerald-400 rounded">
                                    {routine.muscle_group}
                                  </span>
                                )}
                                <Link
                                  href={`/admin/routines/${routine.id}/edit`}
                                  className="text-gray-400 hover:text-white ml-0.5"
                                  title="Editar esta rutina"
                                >
                                  <Edit3 className="w-2.5 h-2.5" />
                                </Link>
                              </div>
                            ))}
                          </div>

                          <div className="flex items-center space-x-1.5 pt-0.5">
                            <button
                              onClick={() => {
                                setSelectedClientForRoutine(client);
                                setIsRoutineModalOpen(true);
                              }}
                              className="px-2 py-0.5 rounded-md bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 text-[10px] font-bold transition flex items-center space-x-1"
                              title="Asignar o sumar otra rutina a este alumno"
                            >
                              <Plus className="w-2.5 h-2.5" />
                              <span>Asignar</span>
                            </button>

                            <Link
                              href={`/admin/clients/${client.id}`}
                              className="px-2 py-0.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 text-[10px] font-bold transition flex items-center space-x-1"
                              title="Gestionar todas las rutinas de este alumno en su expediente"
                            >
                              <span>Ver todas ({client.assignedRoutines.length})</span>
                            </Link>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="text-gray-500 italic text-[11px] block">
                            Sin rutinas asignadas
                          </span>
                          <button
                            onClick={() => {
                              setSelectedClientForRoutine(client);
                              setIsRoutineModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-emerald-900/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 text-[10px] font-bold transition inline-flex items-center space-x-1 shadow-sm"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Asignar Rutina</span>
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Unidad Preferida */}
                    <td className="py-4 px-4 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-300 font-mono font-bold text-[10px] border border-gray-700">
                        {client.weight_unit_preference.toUpperCase()}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-4 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1.5">
                        {client.birth_date && isBirthdayToday(client.birth_date) && (
                          <a
                            href={`https://wa.me/?text=${encodeURIComponent(
                              `¡Hola ${client.full_name}! 🎂🎉 Desde OptiFit Labs te deseamos un muy feliz cumpleaños. ¡Que tengas un día extraordinario y sigas cumpliendo todas tus metas de salud y entrenamiento! 💪🔥`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 hover:text-amber-200 border border-amber-500/40 rounded-xl text-xs font-bold transition shadow-sm"
                            title="Enviar felicitación de cumpleaños por WhatsApp"
                          >
                            <Cake className="w-3.5 h-3.5" />
                            <span>Saludar</span>
                          </a>
                        )}
                        <Link
                          href={`/admin/clients/${client.id}`}
                          className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gray-800 hover:bg-emerald-600 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
                        >
                          <span>Expediente</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => setClientToResetProgress(client)}
                          title="Resetear datos de rendimiento (sesiones, tonelaje, peso, calendario)"
                          className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-gray-800/90 hover:bg-red-950/70 text-gray-400 hover:text-red-400 border border-gray-700/60 hover:border-red-800/80 rounded-xl text-xs font-semibold transition shadow-sm"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-red-400" />
                          <span className="hidden xl:inline">Reset Datos</span>
                        </button>
                        <button
                          onClick={() => setClientToDelete(client)}
                          title="Eliminar alumno"
                          className="p-1.5 bg-gray-800/80 hover:bg-red-950 text-gray-400 hover:text-red-400 border border-gray-700/60 hover:border-red-800/80 rounded-xl transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===================================================== */}
      {/* MODAL CREAR ALUMNO */}
      {/* ===================================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl relative space-y-6">
            <button
              onClick={() => {
                if (!creatingClient) setIsCreateModalOpen(false);
              }}
              className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-xl hover:bg-gray-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            {createdResult ? (
              /* Vista de Éxito con Credenciales Generadas */
              <div className="space-y-6">
                <div className="flex items-center space-x-3 text-emerald-400">
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-2xl">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">¡Alumno Creado con Éxito!</h3>
                    <p className="text-xs text-emerald-400">
                      Cuenta lista para usar de inmediato en la app
                    </p>
                  </div>
                </div>

                <div className="bg-gray-950 border border-emerald-900/40 rounded-2xl p-5 space-y-3">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Alumno:</span>
                    <span className="text-white font-bold">{createdResult.fullName}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Correo Electrónico:</span>
                    <span className="text-emerald-300 font-mono font-bold">{createdResult.email}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-400">Contraseña asignada:</span>
                    <span className="text-amber-300 font-mono font-bold bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                      {createdResult.password}
                    </span>
                  </div>
                </div>

                <div className="bg-emerald-950/30 border border-emerald-800/30 rounded-2xl p-3.5 text-xs text-gray-300 space-y-1">
                  <span className="font-bold text-emerald-300 block">⚡ Sin Confirmación de Correo:</span>
                  <p className="text-gray-400 leading-relaxed text-[11px]">
                    El alumno no necesita esperar correos de confirmación. Comparte sus credenciales y podrá descargar Expo Go e ingresar directamente a la app.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={copyWhatsAppText}
                    className="flex-1 inline-flex items-center justify-center space-x-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-emerald-950/50"
                  >
                    {copiedCredentials ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>¡Texto Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copiar Mensaje para WhatsApp</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="py-3 px-5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
                  >
                    Listo, Cerrar
                  </button>
                </div>
              </div>
            ) : (
              /* Formulario de Creación */
              <form onSubmit={handleCreateClient} className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-950/70 border border-emerald-800 rounded-2xl text-emerald-400">
                    <UserPlus className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white">Registrar Nuevo Alumno</h3>
                    <p className="text-xs text-gray-400">
                      Crea sus credenciales para que ingrese a la app móvil sin confirmación
                    </p>
                  </div>
                </div>

                {createError && (
                  <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{createError}</span>
                  </div>
                )}

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                      Nombre Completo *
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. Martín Rodríguez"
                      value={newFullName}
                      onChange={(e) => setNewFullName(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                      Correo Electrónico *
                    </label>
                    <input
                      type="email"
                      placeholder="alumno@ejemplo.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition text-xs"
                      required
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1.5">
                      <label className="block text-gray-400 font-bold uppercase text-[10px] tracking-wider">
                        Contraseña Temporal *
                      </label>
                      <button
                        type="button"
                        onClick={generateRandomPassword}
                        className="text-[10px] text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 font-bold"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Generar segura</span>
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Mínimo 6 caracteres"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full bg-gray-950 border border-gray-800 rounded-xl pl-3.5 pr-10 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition text-xs font-mono"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                      Unidad de Peso Inicial
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewUnit('kg')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                          newUnit === 'kg'
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        Kilogramos (KG)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewUnit('lbs')}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition ${
                          newUnit === 'lbs'
                            ? 'bg-emerald-950 border-emerald-600 text-emerald-300'
                            : 'bg-gray-950 border-gray-800 text-gray-400 hover:bg-gray-800'
                        }`}
                      >
                        Libras (LBS)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-400 font-bold uppercase text-[10px] tracking-wider mb-1.5">
                      Fecha de Nacimiento (Opcional)
                    </label>
                    <input
                      type="date"
                      value={newBirthDate}
                      onChange={(e) => setNewBirthDate(e.target.value)}
                      className="w-full bg-gray-950 border border-gray-800 rounded-xl px-3.5 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition text-xs"
                    />
                    <span className="text-[10px] text-gray-500 mt-1 block">
                      Permite calcular el gasto metabólico y recordarte su cumpleaños para felicitarlo.
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end space-x-2.5">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    disabled={creatingClient}
                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={creatingClient}
                    className="inline-flex items-center space-x-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-gray-950 rounded-xl text-xs font-black shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
                  >
                    {creatingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    <span>{creatingClient ? 'Creando cuenta...' : 'Crear y Activar Alumno'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ===================================================== */}
      {/* MODAL CONFIRMAR ELIMINACIÓN */}
      {/* ===================================================== */}
      {clientToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5">
            <div className="flex items-center space-x-3 text-red-400">
              <div className="p-2.5 bg-red-950/70 border border-red-800 rounded-2xl">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">¿Eliminar a este alumno?</h3>
                <p className="text-xs text-red-400 font-bold">{clientToDelete.full_name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed">
              Esta acción revocará de inmediato su acceso a la aplicación móvil y desactivará todas sus rutinas asignadas. El correo quedará liberado en caso de que quiera volver a registrarse a futuro.
            </p>

            <div className="flex justify-end space-x-2.5 pt-2">
              <button
                type="button"
                onClick={() => setClientToDelete(null)}
                disabled={deletingClient}
                className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white rounded-xl text-xs font-bold transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteClient}
                disabled={deletingClient}
                className="inline-flex items-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-red-950/50 transition disabled:opacity-50"
              >
                {deletingClient && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{deletingClient ? 'Eliminando...' : 'Sí, Eliminar Alumno'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ===================================================== */}
      {/* MODAL CÓDIGO QR Y DESCARGA DIRECTA DE LA APP (APK) */}
      {/* ===================================================== */}
      <ApkDownloadModal
        isOpen={isApkQrModalOpen}
        onClose={() => setIsApkQrModalOpen(false)}
        clientName={createdResult?.fullName}
        clientEmail={createdResult?.email}
        clientPassword={createdResult?.password}
      />

      {/* Modal para Asignar o Cambiar Rutina de un Alumno */}
      <ClientRoutineModal
        client={selectedClientForRoutine}
        isOpen={isRoutineModalOpen}
        onClose={() => {
          setIsRoutineModalOpen(false);
          setSelectedClientForRoutine(null);
        }}
        onSuccess={async () => {
          await loadClientsData();
        }}
      />

      {/* Modal para Resetear Progreso / Rendimiento del Alumno */}
      {clientToResetProgress && (
        <ResetProgressModal
          isOpen={!!clientToResetProgress}
          onClose={() => setClientToResetProgress(null)}
          clientId={clientToResetProgress.id}
          clientName={clientToResetProgress.full_name || 'Alumno'}
          clientCode={clientToResetProgress.clientCode}
          totalSessions={clientToResetProgress.completedSessionsCount || 0}
          onSuccess={async () => {
            await loadClientsData();
            setStatusMessage({
              type: 'success',
              text: `Progreso y datos de rendimiento de "${clientToResetProgress.full_name}" reseteados con éxito.`,
            });
            setTimeout(() => setStatusMessage(null), 5000);
          }}
        />
      )}
    </div>
  );
}
