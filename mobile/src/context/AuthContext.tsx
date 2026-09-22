import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Profile } from '@/types/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { touchUserActivity } from '@/lib/activityTracker';
import { getStoredBiometrics, saveStoredBiometrics } from '@/lib/calorieCalculator';
import { calculateAgeFromBirthDate } from '@/lib/birthDateUtils';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, pass: string) => Promise<{ data: any; error: Error | null }>;
  signUp: (email: string, pass: string, fullName: string, birthDate?: string) => Promise<{ data: any; error: Error | null }>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
    // 1. Cargar sesión inicial y refrescar metadatos desde el servidor
    supabase.auth.getSession().then(async ({ data: { session: initSession } }) => {
      setSession(initSession);
      setUser(initSession?.user ?? null);
      if (initSession?.user) {
        fetchProfile(initSession.user.id, initSession.user.user_metadata);
        try {
          const { data: freshData } = await supabase.auth.getUser();
          if (freshData?.user) {
            setUser(freshData.user);
            fetchProfile(freshData.user.id, freshData.user.user_metadata);
          }
        } catch {
          // Si está sin conexión, continuar con la sesión local
        }
      }
      setLoading(false);
    });

    // 2. Suscribirse a cambios de auth
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      if (currentSession?.user) {
        await fetchProfile(currentSession.user.id, currentSession.user.user_metadata);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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

  const signIn = async (email: string, pass: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });

      if (error) throw error;

      if (data.session) {
        setSession(data.session);
        setUser(data.user);
        if (data.user) {
          await fetchProfile(data.user.id, data.user.user_metadata);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string, birthDate?: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
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
        if (data.user) {
          await fetchProfile(data.user.id, data.user.user_metadata);
        }
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
      await AsyncStorage.clear();
      setSession(null);
      setUser(null);
      setProfile(null);
    } catch (err) {
      console.error('Error al cerrar sesión:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteAccount = async (): Promise<{ error: Error | null }> => {
    if (!user) return { error: new Error('No hay usuario autenticado') };
    setLoading(true);
    try {
      // 1. Apple Guideline 5.1.1(v): Intento de borrado permanente vía RPC
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
    } finally {
      setLoading(false);
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
