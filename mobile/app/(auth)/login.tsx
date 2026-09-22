import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Dumbbell, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import GymBackground from '@/components/common/GymBackground';
import { supabase } from '@/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    if (!unconfirmedEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
      });
      if (error) {
        Alert.alert('Aviso', error.message || 'No se pudo reenviar el correo.');
      } else {
        Alert.alert('¡Enlace reenviado!', 'Revisa tu bandeja de entrada o carpeta de spam.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Error de conexión.');
    } finally {
      setResending(false);
    }
  };

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMsg(t('auth.fill_all_fields', 'Por favor ingresa tu correo y contraseña.'));
      return;
    }

    setErrorMsg(null);
    setUnconfirmedEmail(null);

    const { data, error } = await signIn(email, password);

    if (error) {
      let friendlyError = error.message;
      if (error.message.includes('Invalid login credentials')) {
        friendlyError = language === 'en' ? 'Invalid email or password. Please check your credentials.' : 'Correo o contraseña incorrectos. Verifica tus datos.';
      } else if (error.message.includes('Email not confirmed')) {
        setUnconfirmedEmail(email.trim());
        friendlyError = language === 'en' ? 'You must confirm your email before signing in.' : 'Debes confirmar tu correo electrónico antes de ingresar.';
      }
      setErrorMsg(friendlyError);
    } else if (data?.session) {
      // Redirigir directamente al panel de alumno
      router.replace('/(tabs)');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <GymBackground />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.centerContainer}>
          {/* Language Switcher */}
          <View style={styles.langSwitchContainer}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'es' && styles.langBtnActive]}
            onPress={() => setLanguage('es')}
            activeOpacity={0.7}
          >
            <Text style={[styles.langBtnText, language === 'es' && styles.langBtnTextActive]}>
              🇪🇸 ESP
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.7}
          >
            <Text style={[styles.langBtnText, language === 'en' && styles.langBtnTextActive]}>
              🇺🇸 ENG
            </Text>
          </TouchableOpacity>
        </View>

        {/* Brand Header */}
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Dumbbell size={36} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>OPTIFIT<Text style={styles.brandHighlight}> LABS</Text></Text>
          <Text style={styles.brandSubtitle}>{t('auth.brand_subtitle', 'Plataforma de Entrenamiento y Nutrición')}</Text>
        </View>

        {/* Card Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('auth.welcome_title', 'Bienvenido, Alumno')}</Text>
          {unconfirmedEmail && (
            <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.35)', borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <AlertCircle size={18} color="#f59e0b" style={{ marginRight: 8, marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#fbbf24', fontSize: 13, fontWeight: 'bold', marginBottom: 2 }}>
                    Correo pendiente de activación
                  </Text>
                  <Text style={{ color: '#d1d5db', fontSize: 12, lineHeight: 17 }}>
                    Revisa tu bandeja de entrada o carpeta de spam para activar tu cuenta ({unconfirmedEmail}).
                  </Text>
                  <TouchableOpacity
                    style={{ marginTop: 8, alignSelf: 'flex-start' }}
                    onPress={handleResend}
                    disabled={resending}
                  >
                    {resending ? (
                      <ActivityIndicator color="#10b981" size="small" />
                    ) : (
                      <Text style={{ color: '#34d399', fontSize: 12, fontWeight: 'bold', textDecorationLine: 'underline' }}>
                        Reenviar correo de activación
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {errorMsg && !unconfirmedEmail && (
            <View style={styles.errorBox}>
              <AlertCircle size={16} color="#ef4444" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}

          {/* Email Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{language === 'en' ? 'EMAIL / USUARIO (EMAIL / USER)' : 'CORREO / USUARIO (EMAIL / USER)'}</Text>
            <View style={styles.inputContainer}>
              <Mail size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder={t('auth.email_placeholder', 'alumno@ejemplo.com')}
                placeholderTextColor="#475569"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>{language === 'en' ? 'PASSWORD / CONTRASEÑA' : 'CONTRASEÑA / PASSWORD'}</Text>
            <View style={styles.inputContainer}>
              <Lock size={18} color="#64748b" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="••••••••"
                placeholderTextColor="#475569"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
              />
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={styles.submitBtn}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>{language === 'en' ? 'Sign In / Iniciar Sesión' : 'Iniciar Sesión / Sign In'}</Text>
            )}
          </TouchableOpacity>

          {/* Switch to Register */}
          <View style={styles.footerLink}>
            <Text style={styles.footerText}>{t('auth.no_account_prompt', '¿No tienes cuenta?')} </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text style={styles.linkText}>{language === 'en' ? 'Create Account / Crear Cuenta' : 'Crear Cuenta / Sign Up'}</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  langSwitchContainer: {
    flexDirection: 'row',
    alignSelf: 'flex-end',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 3,
    marginBottom: 12,
    gap: 4,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  langBtnActive: {
    backgroundColor: '#10b981',
  },
  langBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  langBtnTextActive: {
    color: '#020617',
    fontWeight: '900',
  },
  container: {
    flex: 1,
    backgroundColor: '#020503',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 28,
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#00ff87',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 1,
  },
  brandHighlight: {
    color: '#00ff87',
  },
  brandSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#051209',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 24,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  formSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    marginBottom: 20,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#f87171',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#94a3b8',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#020503',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
  footerLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#64748b',
  },
  linkText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
});
