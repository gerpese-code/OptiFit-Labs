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
import { Dumbbell, User, Mail, Lock, AlertCircle, CheckCircle2, Send, Cake } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import GymBackground from '@/components/common/GymBackground';
import { supabase } from '@/lib/supabase';
import { buildBirthDateString, calculateAgeFromBirthDate } from '@/lib/birthDateUtils';

export default function RegisterScreen() {
  const router = useRouter();
  const { signUp, loading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDay, setBirthDay] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);

  const computedBirthDateStr = buildBirthDateString(birthDay, birthMonth, birthYear);
  const computedAge = computedBirthDateStr ? calculateAgeFromBirthDate(computedBirthDateStr) : null;

  const handleResendConfirmation = async () => {
    if (!registeredEmail) return;
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: registeredEmail,
      });
      if (error) {
        Alert.alert('Aviso', error.message || 'No se pudo reenviar el correo.');
      } else {
        Alert.alert('¡Enviado!', 'Hemos reenviado el enlace de confirmación a tu correo.');
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Ocurrió un problema de conexión.');
    } finally {
      setResending(false);
    }
  };

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setErrorMsg(t('auth.fill_all_fields', 'Por favor completa todos los campos.'));
      return;
    }

    if (password.length < 6) {
      setErrorMsg(t('auth.password_min_length', 'La contraseña debe tener al menos 6 caracteres.'));
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg(t('auth.passwords_dont_match', 'Las contraseñas no coinciden.'));
      return;
    }

    setErrorMsg(null);

    const { data, error } = await signUp(email, password, fullName, computedBirthDateStr || undefined);
    if (error) {
      setErrorMsg(error.message || 'Error al crear la cuenta. Intenta con otro correo.');
    } else {
      try {
        await supabase.from('registration_notifications').insert({
          user_id: data?.user?.id || null,
          email: email.trim().toLowerCase(),
          full_name: fullName.trim(),
          birth_date: computedBirthDateStr || null,
          email_sent: false,
        });
      } catch (_) {}

      if (data?.session) {
        router.replace('/(tabs)');
      } else {
        // Cuenta creada pero requiere confirmación por correo electrónico
        setRegisteredEmail(email.trim().toLowerCase());
      }
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
        <View style={styles.brandContainer}>
          <View style={styles.logoCircle}>
            <Dumbbell size={36} color="#10b981" />
          </View>
          <Text style={styles.brandTitle}>OPTIFIT<Text style={styles.brandHighlight}> LABS</Text></Text>
          <Text style={styles.brandSubtitle}>{language === 'en' ? 'Student Registration / Registro de Alumno' : 'Registro de Nuevo Alumno / Student Sign Up'}</Text>
        </View>

        {registeredEmail ? (
          <View style={styles.formCard}>
            <View style={{ alignItems: 'center', paddingVertical: 12 }}>
              <View
                style={[
                  styles.logoCircle,
                  {
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                    marginBottom: 16,
                  },
                ]}
              >
                <Mail size={32} color="#10b981" />
              </View>

              <Text style={[styles.formTitle, { textAlign: 'center', fontSize: 20 }]}>
                {language === 'en' ? 'Check Your Inbox!' : '¡Revisa tu Correo!'}
              </Text>
              <Text style={[styles.formSubtitle, { textAlign: 'center', marginTop: 6, marginBottom: 12 }]}>
                {language === 'en' ? 'We sent an activation link to:' : 'Hemos enviado un enlace de activación a:'}
              </Text>

              <View style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.2)', marginBottom: 16 }}>
                <Text style={{ color: '#34d399', fontWeight: 'bold', fontSize: 14, textAlign: 'center' }}>
                  {registeredEmail}
                </Text>
              </View>

              <Text style={{ color: '#94a3b8', fontSize: 12.5, lineHeight: 19, textAlign: 'center', marginBottom: 24, paddingHorizontal: 8 }}>
                {language === 'en' ? 'To activate your student account and sign into the app, open your inbox or spam folder and tap the confirmation link.' : 'Para activar tu cuenta de alumno y poder ingresar a la aplicación, abre tu bandeja de entrada o carpeta de spam y haz clic en el enlace de confirmación.'}
              </Text>

              <TouchableOpacity
                style={[styles.submitBtn, { width: '100%', marginBottom: 14 }]}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={styles.submitBtnText}>{language === 'en' ? 'Go to Sign In / Iniciar Sesión' : 'Ir a Iniciar Sesión / Sign In'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ paddingVertical: 10, paddingHorizontal: 16 }}
                onPress={handleResendConfirmation}
                disabled={resending}
              >
                {resending ? (
                  <ActivityIndicator color="#10b981" size="small" />
                ) : (
                  <Text style={{ color: '#10b981', fontSize: 13, fontWeight: 'bold' }}>
                    {language === 'en' ? 'Resend confirmation email' : 'Reenviar correo de confirmación'}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 8, paddingVertical: 6 }}
                onPress={() => setRegisteredEmail(null)}
              >
                <Text style={{ color: '#64748b', fontSize: 12 }}>
                  {language === 'en' ? 'Sign up with another email' : 'Registrarme con otro correo'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>{language === 'en' ? 'Create Your Account' : 'Crea tu Cuenta de Alumno'}</Text>
            <Text style={styles.formSubtitle}>{language === 'en' ? 'Start tracking your workouts and nutrition' : 'Empieza a registrar tus entrenamientos y nutrición'}</Text>

            {errorMsg && (
              <View style={styles.errorBox}>
                <AlertCircle size={16} color="#ef4444" />
                <Text style={styles.errorText}>{errorMsg}</Text>
              </View>
            )}

            {/* Full Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{language === 'en' ? 'FULL NAME / NOMBRE COMPLETO' : 'NOMBRE COMPLETO / FULL NAME'}</Text>
              <View style={styles.inputContainer}>
                <User size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Ej. Martín Rodríguez"
                  placeholderTextColor="#475569"
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>

            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{language === 'en' ? 'EMAIL / CORREO ELECTRÓNICO' : 'CORREO ELECTRÓNICO / EMAIL'}</Text>
              <View style={styles.inputContainer}>
                <Mail size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="martin@ejemplo.com"
                  placeholderTextColor="#475569"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>
            </View>

            {/* Fecha de Nacimiento */}
            <View style={styles.inputGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.inputLabel}>
                  {language === 'en' ? 'DATE OF BIRTH / FECHA DE NACIMIENTO' : 'FECHA DE NACIMIENTO / DATE OF BIRTH'}
                </Text>
                {computedAge !== null && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <Cake size={11} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>
                      {computedAge} {language === 'en' ? 'years old' : 'años'}
                    </Text>
                  </View>
                )}
              </View>

              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    {language === 'en' ? 'DAY (DD)' : 'DÍA (DD)'}
                  </Text>
                  <View style={[styles.inputContainer, { paddingHorizontal: 6 }]}>
                    <TextInput
                      style={[styles.textInput, { textAlign: 'center' }]}
                      placeholder="DD"
                      placeholderTextColor="#475569"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={birthDay}
                      onChangeText={setBirthDay}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    {language === 'en' ? 'MONTH (MM)' : 'MES (MM)'}
                  </Text>
                  <View style={[styles.inputContainer, { paddingHorizontal: 6 }]}>
                    <TextInput
                      style={[styles.textInput, { textAlign: 'center' }]}
                      placeholder="MM"
                      placeholderTextColor="#475569"
                      keyboardType="number-pad"
                      maxLength={2}
                      value={birthMonth}
                      onChangeText={setBirthMonth}
                    />
                  </View>
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={{ color: '#64748b', fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    {language === 'en' ? 'YEAR (YYYY)' : 'AÑO (AAAA)'}
                  </Text>
                  <View style={[styles.inputContainer, { paddingHorizontal: 6 }]}>
                    <TextInput
                      style={[styles.textInput, { textAlign: 'center' }]}
                      placeholder="AAAA"
                      placeholderTextColor="#475569"
                      keyboardType="number-pad"
                      maxLength={4}
                      value={birthYear}
                      onChangeText={setBirthYear}
                    />
                  </View>
                </View>
              </View>
              <Text style={{ color: '#64748b', fontSize: 11, marginTop: 5 }}>
                🎂 {language === 'en' ? 'Used for accurate caloric metrics and birthday greetings' : 'Para calibrar tu gasto calórico y saludarte en tu cumpleaños'}
              </Text>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{language === 'en' ? 'PASSWORD / CONTRASEÑA' : 'CONTRASEÑA / PASSWORD'}</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Mínimo 6 caracteres"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                />
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>{language === 'en' ? 'CONFIRM PASSWORD / CONFIRMAR CONTRASEÑA' : 'CONFIRMAR CONTRASEÑA / CONFIRM PASSWORD'}</Text>
              <View style={styles.inputContainer}>
                <Lock size={18} color="#64748b" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Repite la contraseña"
                  placeholderTextColor="#475569"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleRegister}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitBtnText}>{language === 'en' ? 'Sign Up / Registrarme' : 'Registrarme / Sign Up'}</Text>
              )}
            </TouchableOpacity>

            <View style={styles.footerLink}>
              <Text style={styles.footerText}>{t('auth.have_account_prompt', '¿Ya tienes una cuenta?')} </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity>
                  <Text style={styles.linkText}>{language === 'en' ? 'Sign In / Iniciar Sesión' : 'Iniciar Sesión / Sign In'}</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    width: '100%',
    maxWidth: 440,
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
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#00ff87',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#00ff87',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  brandTitle: {
    fontSize: 24,
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
    marginBottom: 18,
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 12,
    color: '#34d399',
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 14,
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
