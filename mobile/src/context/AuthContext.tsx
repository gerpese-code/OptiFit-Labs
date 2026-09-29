import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchUserActivity, startPresenceTracker } from '@/lib/activityTracker';
import { getStoredBiometrics, saveStoredBiometrics } from '@/lib/calorieCalculator';
import { calculateAgeFromBirthDate } from '@/lib/birthDateUtils';

const SESSION_STORAGE_KEY = '@fitnesspro_active_session';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (emailOrUser: string, pass: string) => Promise<{ data: any; error: Error | null }>;
  signUp: (email: string, pass: string, fullName: string, birthDate?: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Directorio inteligente de resolución de usuario / código a correo oficial
const KNOWN_USER_MAP: Record<string, string> = {
  carlos: 'carlos83quiroztulum@gmail.com',
  carlos83: 'carlos83quiroztulum@gmail.com',
  carlos83quiroztulum: 'carlos83quiroztulum@gmail.com',
  sylvia: 'sylviazekrynakhla@gmail.com',
  sylviazekrynakhla: 'sylviazekrynakhla@gmail.com',
  victoria: 'sharryvictoria@gmail.com',
  sharry: 'sharryvictoria@gmail.com',
  sharryvictoria: 'sharryvictoria@gmail.com',
  fer: 'csj.feravila@gmail.com',
  flores: 'csj.feravila@gmail.com',
  ferflores: 'csj.feravila@gmail.com',
  feravila: 'csj.feravila@gmail.com',
  german: 'pesedagger@gmail.com',
  pesedagger: 'pesedagger@gmail.com',
  hgd563: 'pesedagger@gmail.com',
  admin: 'admin@optifitlabs.com',
};

function resolveEmailFromInput(input: string): string {
  const clean = input.trim().toLowerCase();
  if (clean.includes('@')) {
    return clean;
  }
  // Buscar coincidencia exacta o por inicio en el directorio
  if (KNOWN_USER_MAP[clean]) {
    return KNOWN_USER_MAP[clean];
  }
  // Coincidencia parcial si el usuario escribió solo el primer nombre
  for (const [key, email] of Object.entries(KNOWN_USER_MAP)) {
    if (clean.startsWith(key) || key.startsWith(clean)) {
      return email;
    }
  }
  return clean;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, userMeta?: any) => {
    // 0. Cargar de inmediato desde la memoria caché local (offline-first)
    try {
      const cached = await AsyncStorage.getItem(`@fitnesspro_cached_profile_${userId}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.id === userId) {
          setProfile(parsed);
        }
      }
    } catch {}

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .is('deleted_at', null)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        // Auto-crear perfil si no existe para que aparezca en el panel del coach
        const fullName = userMeta?.full_name || user?.user_metadata?.full_name || 'Alumno OptiFit Labs';
        const bDate = userMeta?.birth_date || user?.user_metadata?.birth_date || null;
        const newProfile: any = {
          id: userId,
          full_name: fullName,
          role: 'client',
        };
        if (bDate) {
          newProfile.birth_date = bDate;
        }

        const { data: inserted } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();

        if (inserted) {
          setProfile(inserted as Profile);
          await AsyncStorage.setItem(`@fitnesspro_cached_profile_${userId}`, JSON.stringify(inserted));
          if (bDate) {
            const currentBio = await getStoredBiometrics();
            await saveStoredBiometrics({
              ...currentBio,
              birthDate: bDate,
              age: calculateAgeFromBirthDate(bDate),
            });
          }
          return;
        }
      }

      if (data) {
        setProfile(data as Profile);
        await AsyncStorage.setItem(`@fitnesspro_cached_profile_${userId}`, JSON.stringify(data));

        // Sincronizar fecha de nacimiento a biometría local si existe
        const existingBDate = (data as any)?.birth_date || userMeta?.birth_date || user?.user_metadata?.birth_date;
        if (existingBDate) {
          const currentBio = await getStoredBiometrics();
          await saveStoredBiometrics({
            ...currentBio,
            birthDate: existingBDate,
            age: calculateAgeFromBirthDate(existingBDate),
          });
        }

        // Registrar última actividad en la base de datos para el entrenador
        touchUserActivity(userId);
      }
    } catch (err) {
      console.warn('Detalle al cargar el perfil del usuario (modo offline):', err);
      // En modo sin conexión o error de red, preservar el perfil de caché local
      try {
        const cached = await AsyncStorage.getItem(`@fitnesspro_cached_profile_${userId}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.id === userId) {
            setProfile(parsed);
          }
        }
      } catch {}
    }
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Restauración inmediata desde almacenamiento local persistente
    const initAuth = async () => {
      try {
        const savedSession = await AsyncStorage.getItem(SESSION_STORAGE_KEY);
        if (savedSession && isMounted) {
          const parsed = JSON.parse(savedSession);
          if (parsed?.user) {
            setSession(parsed);
            setUser(parsed.user);
            fetchProfile(parsed.user.id, parsed.user.user_metadata);
          }
        }
      } catch (storageErr) {
        console.warn('Error leyendo sesión persistente de AsyncStorage:', storageErr);
      }

      // Validar y refrescar con Supabase Auth
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (isMounted) {
          if (currentSession) {
            setSession(currentSession);
            setUser(currentSession.user);
            await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession));
            fetchProfile(currentSession.user.id, currentSession.user.user_metadata);
          }
        }
      } catch (authErr) {
        console.warn('Operando en modo sin conexión para sesión de usuario:', authErr);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // 2. Suscripción a cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        // Cierre de sesión explícito: limpiar estado y almacenamiento
        setSession(null);
        setUser(null);
        setProfile(null);
        await AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {});
        setLoading(false);
      } else if (currentSession) {
        // Nueva sesión o token refrescado con éxito
        setSession(currentSession);
        setUser(currentSession.user);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(currentSession)).catch(() => {});
        if (currentSession.user) {
          fetchProfile(currentSession.user.id, currentSession.user.user_metadata);
        }
        setLoading(false);
      } else if (event === 'TOKEN_REFRESHED' && !currentSession) {
        // Fallo temporal de red durante refresco de token: NO cerrar sesión del alumno
        console.warn('Fallo transitorio al refrescar token; se conserva la sesión local.');
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Rastreo de presencia activa: el alumno figura en línea únicamente mientras tenga la pantalla abierta
  useEffect(() => {
    if (!user?.id) return;
    const cleanup = startPresenceTracker(user.id);
    return () => {
      cleanup();
    };
  }, [user?.id]);

  const refreshProfile = async () => {
    try {
      const { data: freshData } = await supabase.auth.getUser();
      const currentUser = freshData?.user || user;
      if (currentUser) {
        setUser(currentUser);
        await fetchProfile(currentUser.id, currentUser.user_metadata);
      }
    } catch {
      if (user) {
        await fetchProfile(user.id, user.user_metadata);
      }
    }
  };

  const signIn = async (emailOrUser: string, pass: string) => {
    // NOTA: NO cambiamos loading a true aquí para evitar desmontar la pantalla de Login
    try {
      const targetEmail = resolveEmailFromInput(emailOrUser);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: pass,
      });

      if (error) {
        // Si el usuario intentó con un username que no tenía @ y falló, intentar fallback
        if (!emailOrUser.includes('@') && targetEmail === emailOrUser.trim().toLowerCase()) {
          const fallbackEmail = `${emailOrUser.trim().toLowerCase()}@gmail.com`;
          const fallbackRes = await supabase.auth.signInWithPassword({
            email: fallbackEmail,
            password: pass,
          });
          if (fallbackRes.data?.session) {
            const sess = fallbackRes.data.session;
            setSession(sess);
            setUser(fallbackRes.data.user);
            await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sess));
            if (fallbackRes.data.user) {
              await fetchProfile(fallbackRes.data.user.id, fallbackRes.data.user.user_metadata);
            }
            return { data: fallbackRes.data, error: null };
          }
        }
        throw error;
      }

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
        if (data.user) {
          await fetchProfile(data.user.id, data.user.user_metadata);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, birthDate?: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: pass,
        options: {
          data: {
            full_name: fullName.trim(),
            birth_date: birthDate || null,
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(data.session));
        if (data.user) {
          await fetchProfile(data.user.id, data.user.user_metadata);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut().catch(() => {});
      await AsyncStorage.removeItem(SESSION_STORAGE_KEY).catch(() => {});
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    }
  };

  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No hay usuario autenticado') };
    try {
      // 1. Apple Guideline 5.1.1(v): Intento de borrado vía RPC
      try {
        await supabase.rpc('delete_own_user_account');
      } catch (rpcErr) {
        console.warn('RPC delete_own_user_account no configurada aún, procediendo con soft-delete:', rpcErr);
      }

      // 2. Marcar perfil como eliminado en public.profiles
      await supabase
        .from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user.id);

      await signOut();
      return { error: null };
    } catch (err: any) {
      console.error('Error al eliminar cuenta:', err);
      return { error: err };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user,
        profile,
        loading,
        signIn,
        signUp,
        signOut,
        deleteAccount,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};
