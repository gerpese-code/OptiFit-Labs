import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from 'react-native';
import {
  Lock,
  ShieldAlert,
  MessageCircle,
  RefreshCw,
  LogOut,
  User,
  CheckCircle2,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'expo-router';
import { useLanguage } from '@/context/LanguageContext';

interface AccountInactiveLockProps {
  sectionName?: string;
}

export default function AccountInactiveLock({ sectionName = 'esta sección' }: AccountInactiveLockProps) {
  const { profile, refreshProfile, signOut } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();
  const [checking, setChecking] = useState(false);

  const handleCheckStatus = async () => {
    setChecking(true);
    await refreshProfile();
    setTimeout(() => {
      setChecking(false);
    }, 600);
  };

  const handleContactCoach = () => {
    // Si hay correo o canal de contacto, abrir mailto o mensajería
    Linking.openURL('mailto:gerpese.fitness@gmail.com?subject=Reactivar%20mi%20cuenta%20OptiFit%20Labs').catch(() => {});
  };

  const studentName = profile?.full_name?.split(' ')[0] || 'Alumno';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icono de Candado / Bloqueo */}
        <View style={styles.iconCircle}>
          <ShieldAlert size={36} color="#f59e0b" />
          <View style={styles.lockBadge}>
            <Lock size={14} color="#ffffff" />
          </View>
        </View>

        {/* Badge de Estado */}
        <View style={styles.statusBadge}>
          <View style={styles.statusDot} />
          <Text style={styles.statusBadgeText}>{t('lock.title', 'MEMBRESÍA INACTIVA / EN PAUSA')}</Text>
        </View>

        {/* Título Principal */}
        <Text style={styles.title}>Acceso Temporalmente Limitado</Text>

        {/* Mensaje Explicativo */}
        <Text style={styles.message}>
          Hola <Text style={styles.boldText}>{studentName}</Text>, tu cuenta se encuentra actualmente inactiva o tu plan de entrenamiento ha concluido.
        </Text>

        <Text style={styles.submessage}>
          Puedes ingresar a la app para ver tu perfil, pero para acceder a {sectionName}, registrar series o consultar tu progreso, solicita a tu Coach la reactivación de tu plan.
        </Text>

        {/* Lista de Funciones Bloqueadas */}
        <View style={styles.restrictionsList}>
          <View style={styles.restrictionItem}>
            <Lock size={13} color="#ef4444" />
            <Text style={styles.restrictionText}>Rutinas y programas personalizados bloqueados</Text>
          </View>
          <View style={styles.restrictionItem}>
            <Lock size={13} color="#ef4444" />
            <Text style={styles.restrictionText}>Registro de series y cronómetros de cardio pausados</Text>
          </View>
          <View style={styles.restrictionItem}>
            <Lock size={13} color="#ef4444" />
            <Text style={styles.restrictionText}>Consulta de métricas, reportes y asistencia limitada</Text>
          </View>
        </View>

        {/* Botón Principal: Contactar al Coach */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleContactCoach}
          activeOpacity={0.8}
        >
          <MessageCircle size={18} color="#ffffff" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Contactar a mi Coach</Text>
        </TouchableOpacity>

        {/* Botón Secundario: Comprobar Reactivación */}
        <TouchableOpacity
          style={styles.secondaryBtn}
          onPress={handleCheckStatus}
          disabled={checking}
          activeOpacity={0.7}
        >
          {checking ? (
            <ActivityIndicator size="small" color="#34d399" />
          ) : (
            <>
              <RefreshCw size={15} color="#34d399" style={{ marginRight: 6 }} />
              <Text style={styles.secondaryBtnText}>Comprobar Si Ya Fui Reactivado</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Enlace al perfil */}
        <TouchableOpacity
          style={styles.profileLink}
          onPress={() => router.push('/(tabs)/profile')}
        >
          <User size={14} color="#94a3b8" style={{ marginRight: 4 }} />
          <Text style={styles.profileLinkText}>Ver Mi Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    position: 'relative',
  },
  lockBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#0f172a',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#ef4444',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 13,
    color: '#e2e8f0',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 6,
  },
  boldText: {
    fontWeight: '800',
    color: '#ffffff',
  },
  submessage: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 17,
    marginBottom: 16,
  },
  restrictionsList: {
    width: '100%',
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    gap: 8,
    marginBottom: 20,
  },
  restrictionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  restrictionText: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
    flex: 1,
  },
  primaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 10,
  },
  primaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  secondaryBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingVertical: 11,
    marginBottom: 12,
  },
  secondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#34d399',
  },
  profileLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 6,
  },
  profileLinkText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94a3b8',
  },
});
