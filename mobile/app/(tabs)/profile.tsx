import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Shield,
  ShieldAlert,
  Scale,
  LogOut,
  Trash2,
  AlertTriangle,
  Flame,
  Activity,
  HeartPulse,
  Edit3,
  Check,
  Zap,
  Globe,
  HelpCircle,
  Info,
  Sparkles,
  Cake,
  PartyPopper,
  Calendar,
  Smartphone,
  Dumbbell,
} from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useUnit } from '@/context/UnitContext';
import { useLanguage } from '@/context/LanguageContext';
import GymBackground from '@/components/common/GymBackground';
import { supabase } from '@/lib/supabase';
import {
  getUserPreferences,
  saveUserPreferences,
  triggerHaptic,
  UserPreferences,
  DEFAULT_PREFERENCES,
} from '@/lib/userPreferences';
import {
  getStoredBiometrics,
  saveStoredBiometrics,
  calculateBMR,
  calculateTDEE,
  calculateBMI,
  calculateBaseLifestyleExpenditure,
  cmToFtIn,
  ftInToCm,
  UserBiometrics,
  Gender,
  ActivityLevel,
  HeightUnit,
  BodyType,
  DEFAULT_BIOMETRICS,
} from '@/lib/calorieCalculator';
import {
  calculateAgeFromBirthDate,
  isBirthdayToday,
  formatBirthDateShort,
  formatBirthDateFull,
  buildBirthDateString,
} from '@/lib/birthDateUtils';

export default function ProfileScreen() {
  const { user, profile, signOut, deleteAccount } = useAuth();
  const { unit, setUnit, toDisplayWeight, toStandardKg } = useUnit();
  const { language, setLanguage, t } = useLanguage();

  const [biometrics, setBiometrics] = useState<UserBiometrics>(DEFAULT_BIOMETRICS);
  const [loadingBio, setLoadingBio] = useState(true);

  // Preferencias de experiencia de entrenamiento
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);

  // Modal para editar biometría
  const [isBioModalOpen, setIsBioModalOpen] = useState(false);
  const [editWeight, setEditWeight] = useState('75');
  const [editHeightUnit, setEditHeightUnit] = useState<HeightUnit>('cm');
  const [editHeightCm, setEditHeightCm] = useState('175');
  const [editHeightFt, setEditHeightFt] = useState('5');
  const [editHeightIn, setEditHeightIn] = useState('9');
  const [editBodyType, setEditBodyType] = useState<BodyType>('standard');
  const [editAge, setEditAge] = useState('28');
  const [editBirthDay, setEditBirthDay] = useState('15');
  const [editBirthMonth, setEditBirthMonth] = useState('05');
  const [editBirthYear, setEditBirthYear] = useState('1998');
  const [editGender, setEditGender] = useState<Gender>('male');
  const [editActivityLevel, setEditActivityLevel] = useState<ActivityLevel>('moderate');
  const [savingBio, setSavingBio] = useState(false);

  // Modal educativo explicativo
  const [isExplainModalOpen, setIsExplainModalOpen] = useState(false);

  // Modal eliminación de cuenta
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadBiometrics();
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const prefs = await getUserPreferences();
      setPreferences(prefs);
    } catch (e) {
      console.warn('Error loading preferences in Profile:', e);
    }
  };

  const handleTogglePreference = async (key: keyof UserPreferences, value: boolean) => {
    const updated = { ...preferences, [key]: value };
    setPreferences(updated);
    await saveUserPreferences(updated);
    if (key === 'hapticsEnabled' && value) {
      triggerHaptic('tap');
    }
  };

  const loadBiometrics = async () => {
    try {
      const bio = await getStoredBiometrics();
      // Si el alumno tiene registros en Supabase, sincronizar
      if (user?.id) {
        const { data: profData } = await supabase
          .from('profiles')
          .select('birth_date')
          .eq('id', user.id)
          .single();

        if (profData?.birth_date) {
          bio.birthDate = profData.birth_date;
          bio.age = calculateAgeFromBirthDate(profData.birth_date);
        }

        const { data } = await supabase
          .from('client_metrics')
          .select('weight_kg')
          .eq('client_id', user.id)
          .order('date', { ascending: false })
          .limit(1);

        if (data && data.length > 0 && data[0].weight_kg) {
          bio.weightKg = Number(data[0].weight_kg);
        }
      }
      setBiometrics(bio);
    } catch (e) {
      console.warn('Error loading biometrics:', e);
    } finally {
      setLoadingBio(false);
    }
  };

  const openBioModal = () => {
    const displayWeight =
      unit === 'lbs'
        ? (biometrics.weightKg * 2.20462).toFixed(1)
        : biometrics.weightKg.toString();

    const hUnit = biometrics.heightUnit || 'cm';
    setEditHeightUnit(hUnit);
    const ftIn = cmToFtIn(biometrics.heightCm);
    setEditHeightCm(biometrics.heightCm.toString());
    setEditHeightFt(ftIn.feet.toString());
    setEditHeightIn(ftIn.inches.toString());
    setEditBodyType(biometrics.bodyType || 'standard');

    setEditWeight(displayWeight);
    setEditAge(biometrics.age.toString());

    if (biometrics.birthDate && biometrics.birthDate.includes('-')) {
      const parts = biometrics.birthDate.split('-');
      if (parts.length === 3) {
        setEditBirthYear(parts[0]);
        setEditBirthMonth(parts[1]);
        setEditBirthDay(parts[2]);
      }
    } else {
      const curYear = new Date().getFullYear();
      setEditBirthYear((curYear - (biometrics.age || 28)).toString());
      setEditBirthMonth('05');
      setEditBirthDay('15');
    }

    setEditGender(biometrics.gender);
    setEditActivityLevel(biometrics.activityLevel);
    setIsBioModalOpen(true);
  };

  const handleCmChange = (val: string) => {
    setEditHeightCm(val);
    const num = parseFloat(val);
    if (num > 0) {
      const { feet, inches } = cmToFtIn(num);
      setEditHeightFt(feet.toString());
      setEditHeightIn(inches.toString());
    }
  };

  const handleFtChange = (val: string) => {
    setEditHeightFt(val);
    const ft = parseFloat(val) || 0;
    const inch = parseFloat(editHeightIn) || 0;
    const cm = ftInToCm(ft, inch);
    setEditHeightCm(cm.toString());
  };

  const handleInChange = (val: string) => {
    setEditHeightIn(val);
    const ft = parseFloat(editHeightFt) || 0;
    const inch = parseFloat(val) || 0;
    const cm = ftInToCm(ft, inch);
    setEditHeightCm(cm.toString());
  };

  const handleSaveBiometrics = async () => {
    const rawWeight = parseFloat(editWeight);
    const finalHeightCm =
      editHeightUnit === 'ft_in'
        ? ftInToCm(parseFloat(editHeightFt) || 0, parseFloat(editHeightIn) || 0)
        : Math.round(parseFloat(editHeightCm) || 175);

    const birthDateStr = buildBirthDateString(editBirthDay, editBirthMonth, editBirthYear);
    const rawAge = birthDateStr ? calculateAgeFromBirthDate(birthDateStr) : (parseInt(editAge, 10) || 28);

    if (!rawWeight || rawWeight <= 0 || !finalHeightCm || finalHeightCm <= 0 || !rawAge || rawAge <= 0) {
      Alert.alert(
        language === 'en' ? 'Invalid Data' : 'Datos Inválidos',
        language === 'en' ? 'Please enter valid weight, height, and date of birth.' : 'Por favor ingresa peso, altura y fecha de nacimiento válidos.'
      );
      return;
    }

    setSavingBio(true);
    try {
      const weightInKg = unit === 'lbs' ? toStandardKg(rawWeight, 'lbs') : rawWeight;

      const updatedBio: UserBiometrics = {
        weightKg: Number(weightInKg.toFixed(1)),
        heightCm: finalHeightCm,
        heightUnit: editHeightUnit,
        age: rawAge,
        birthDate: birthDateStr || biometrics.birthDate,
        gender: editGender,
        activityLevel: editActivityLevel,
        unitPreference: unit,
        bodyType: editBodyType,
      };

      await saveStoredBiometrics(updatedBio);
      setBiometrics(updatedBio);

      // Guardar también en client_metrics y profiles de Supabase
      if (user?.id) {
        if (birthDateStr) {
          await supabase.from('profiles').update({ birth_date: birthDateStr }).eq('id', user.id);
        }
        const todayStr = new Date().toISOString().split('T')[0];
        await supabase.from('client_metrics').upsert(
          {
            client_id: user.id,
            date: todayStr,
            weight_logged: rawWeight,
            unit_logged: unit,
            weight_kg: Number(weightInKg.toFixed(1)),
            notes: 'Actualizado desde Datos Fisiológicos',
          },
          { onConflict: 'client_id,date' }
        );
      }

      setIsBioModalOpen(false);
      Alert.alert(
        language === 'en' ? 'Data Saved!' : '¡Datos Guardados!',
        language === 'en' ? 'Your physiological and caloric expenditure metrics have been successfully recalculated.' : 'Tus métricas fisiológicas y de gasto calórico han sido recalculadas con éxito.'
      );
    } catch (e: any) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Error',
        e.message || (language === 'en' ? 'Unable to save data.' : 'No se pudieron guardar los datos.')
      );
    } finally {
      setSavingBio(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert(
      language === 'en' ? 'Sign Out' : 'Cerrar Sesión',
      language === 'en' ? 'Are you sure you want to sign out?' : '¿Estás seguro de que deseas salir?',
      [
        { text: language === 'en' ? 'Cancel' : 'Cancelar', style: 'cancel' },
        { text: language === 'en' ? 'Sign Out' : 'Salir', style: 'destructive', onPress: signOut },
      ]
    );
  };

  // Cumplimiento Apple App Store Guideline 5.1.1(v)
  const handleConfirmDelete = async () => {
    setDeleting(true);
    const { error } = await deleteAccount();
    setDeleting(false);
    setIsDeleteModalOpen(false);

    if (error) {
      Alert.alert(
        language === 'en' ? 'Error' : 'Error',
        error.message || (language === 'en' ? 'Could not process account deletion.' : 'No se pudo procesar la eliminación.')
      );
    }
  };

  const bmiInfo = calculateBMI(biometrics, language);
  const bmrKcal = calculateBMR(biometrics);
  const tdeeKcal = calculateTDEE(biometrics);

  // Cálculos dinámicos en vivo para la vista previa del modal
  const previewWeightKg =
    unit === 'lbs'
      ? toStandardKg(parseFloat(editWeight) || 75, 'lbs')
      : parseFloat(editWeight) || 75;
  const previewHeightCm =
    editHeightUnit === 'ft_in'
      ? ftInToCm(parseFloat(editHeightFt) || 0, parseFloat(editHeightIn) || 0)
      : parseFloat(editHeightCm) || 175;
  const previewBirthDateStr = buildBirthDateString(editBirthDay, editBirthMonth, editBirthYear);
  const previewAge = previewBirthDateStr ? calculateAgeFromBirthDate(previewBirthDateStr) : (parseInt(editAge, 10) || 28);
  const previewBio: UserBiometrics = {
    weightKg: previewWeightKg,
    heightCm: previewHeightCm,
    heightUnit: editHeightUnit,
    age: previewAge,
    birthDate: previewBirthDateStr || biometrics.birthDate,
    gender: editGender,
    activityLevel: editActivityLevel,
    unitPreference: unit,
    bodyType: editBodyType,
  };

  const handleLanguageChange = async (newLang: 'es' | 'en') => {
    try {
      await setLanguage(newLang);
      const targetUnit = newLang === 'es' ? 'kg' : 'lbs';
      await setUnit(targetUnit);
      const bio = await getStoredBiometrics();
      const updatedBio: UserBiometrics = {
        ...bio,
        heightUnit: newLang === 'es' ? 'cm' : 'ft_in',
        unitPreference: targetUnit,
      };
      await saveStoredBiometrics(updatedBio);
      setBiometrics(updatedBio);
    } catch (e) {
      console.warn('Error cambiando idioma y medidas en perfil:', e);
    }
  };

  const previewBMI = calculateBMI(previewBio, language);
  const previewBMR = calculateBMR(previewBio);
  const previewTDEE = calculateTDEE(previewBio);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <GymBackground />
      <View style={styles.topBar}>
        <Text style={styles.screenSubtitle}>{t('profile.subtitle', 'CONFIGURACIÓN Y SALUD')}</Text>
        <Text style={styles.screenTitle}>{t('profile.title', 'Mi Perfil & Ajustes')}</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tarjeta de Usuario */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <User size={36} color="#10b981" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}>
            <Text style={styles.userName}>{profile?.full_name || 'Alumno OptiFit Labs'}</Text>
          </View>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.clientCodePill}>
            <Text style={styles.clientCodePillLabel}>ID DE CUENTA:</Text>
            <Text style={styles.clientCodePillValue}>
              {user?.id ? `${user.id.slice(0, 8)}...` : 'ID Establecido'}
            </Text>
          </View>
          {profile?.is_active === false ? (
            <View style={[styles.roleBadge, { backgroundColor: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.4)' }]}>
              <ShieldAlert size={12} color="#ef4444" style={{ marginRight: 4 }} />
              <Text style={[styles.roleBadgeText, { color: '#ef4444' }]}>{t('profile.membership_inactive', 'MEMBRESÍA INACTIVA / EN PAUSA')}</Text>
            </View>
          ) : (
            <View style={styles.roleBadge}>
              <Shield size={12} color="#34d399" style={{ marginRight: 4 }} />
              <Text style={styles.roleBadgeText}>{t('profile.membership_active', 'MEMBRESÍA ACTIVA')}</Text>
            </View>
          )}
        </View>

        {/* Banner de Felicitación de Cumpleaños si hoy es el cumpleaños del usuario */}
        {isBirthdayToday(biometrics.birthDate) && (
          <View style={styles.birthdayBannerCard}>
            <View style={styles.birthdayIconBox}>
              <PartyPopper size={26} color="#f59e0b" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.birthdayTitle}>
                🎂 {language === 'en' ? `Happy Birthday, ${profile?.full_name?.split(' ')[0] || 'Champion'}!` : `¡Feliz Cumpleaños, ${profile?.full_name?.split(' ')[0] || 'Campeón'}!`} 🎉
              </Text>
              <Text style={styles.birthdaySubtitle}>
                {language === 'en'
                  ? 'The entire OptiFit Labs team wishes you a wonderful day full of energy, health, and new achievements!'
                  : '¡El equipo de OptiFit Labs te desea un día extraordinario lleno de energía, salud y nuevos logros!'}
              </Text>
            </View>
          </View>
        )}

        {/* Banner de Aviso si la cuenta está inactiva */}
        {profile?.is_active === false && (
          <View style={styles.inactiveNoticeCard}>
            <ShieldAlert size={20} color="#f59e0b" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.inactiveNoticeTitle}>Acceso a Rutinas y Progreso Restringido</Text>
              <Text style={styles.inactiveNoticeDesc}>
                Tu membresía se encuentra en pausa o inactiva. Comunícate con tu Coach para reactivarla.
              </Text>
            </View>
          </View>
        )}

        {/* Sección: Datos Fisiológicos & Estimación Calórica */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>{t('profile.biometrics_section_title', 'Datos Fisiológicos & Biometría')}</Text>
            <TouchableOpacity style={styles.editPencilBtn} onPress={openBioModal} activeOpacity={0.7}>
              <Edit3 size={13} color="#10b981" style={{ marginRight: 4 }} />
              <Text style={styles.editPencilText}>{t('common.edit', 'Editar')}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bioCard}>
            <View style={styles.bioHeader}>
              <View style={styles.bioTitleGroup}>
                <Flame size={20} color="#f59e0b" />
                <View style={{ marginLeft: 10 }}>
                  <Text style={styles.bioCardTitle}>{t('profile.caloric_params_title', 'Parámetros de Gasto Calórico')}</Text>
                  <Text style={styles.bioCardSubtitle}>
                    {biometrics.bodyType === 'athletic'
                      ? (language === 'en' ? 'Katch-McArdle Formula (Lean Mass Adjusted) & NEAT' : 'Fórmula Katch-McArdle (Ajustada a Masa Magra) & NEAT')
                      : (language === 'en' ? 'Mifflin-St Jeor Formula & NEAT' : 'Fórmula Mifflin-St Jeor & NEAT')}
                  </Text>
                </View>
              </View>
            </View>

            {/* Grid de 4 Valores de Entrada */}
            <View style={styles.bioGrid}>
              <View style={styles.bioGridItem}>
                <Text style={styles.bioGridLabel}>{t('profile.weight_label_short', 'PESO CORPORAL')}</Text>
                <Text style={styles.bioGridValue}>
                  {toDisplayWeight(biometrics.weightKg)}
                  <Text style={styles.bioGridUnit}> {unit.toUpperCase()}</Text>
                </Text>
              </View>

              <View style={styles.bioGridItem}>
                <Text style={styles.bioGridLabel}>{t('profile.height_label_short', 'ESTATURA')}</Text>
                <Text style={styles.bioGridValue}>
                  {biometrics.heightCm}
                  <Text style={styles.bioGridUnit}> cm</Text>
                </Text>
                <Text style={styles.bioGridSubUnit}>
                  ({cmToFtIn(biometrics.heightCm).feet}&apos; {cmToFtIn(biometrics.heightCm).inches}&quot;)
                </Text>
              </View>

              <View style={styles.bioGridItem}>
                <Text style={styles.bioGridLabel}>{t('profile.physique_profile_label', 'PERFIL FÍSICO')}</Text>
                <Text
                  style={[
                    styles.bioGridValue,
                    biometrics.bodyType === 'athletic' && { color: '#10b981' },
                  ]}
                >
                  {biometrics.bodyType === 'athletic' ? (language === 'en' ? 'Athletic' : 'Atlético') : (language === 'en' ? 'Standard' : 'Estándar')}
                </Text>
                <Text style={styles.bioGridSubUnit}>
                  {biometrics.bodyType === 'athletic' ? (language === 'en' ? 'Lean Muscle' : 'Masa Muscular') : (language === 'en' ? 'General Population' : 'Población general')}
                </Text>
              </View>

              <View style={styles.bioGridItem}>
                <Text style={styles.bioGridLabel}>{t('profile.gender_age_label', 'GÉNERO & EDAD')}</Text>
                <Text style={styles.bioGridValue}>
                  {biometrics.gender === 'male' ? (language === 'en' ? 'Male' : 'Hombre') : (language === 'en' ? 'Female' : 'Mujer')}
                </Text>
                <Text style={styles.bioGridSubUnit}>
                  {biometrics.age} {language === 'en' ? 'years' : 'años'}
                  {biometrics.birthDate
                    ? isBirthdayToday(biometrics.birthDate)
                      ? ' (🎉 ¡Hoy!)'
                      : ` (🎂 ${formatBirthDateShort(biometrics.birthDate, language)})`
                    : ''}
                </Text>
              </View>
            </View>

            {/* Indicadores Profesionales Calculados */}
            <View style={styles.calculatedMetricsContainer}>
              {/* IMC */}
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorLeft}>
                  <Activity size={18} color="#38bdf8" />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={styles.indicatorTitle}>{t('profile.bmi_title', 'Índice de Masa Corporal (IMC)')}</Text>
                    <Text style={styles.indicatorDesc}>
                      {bmiInfo.isAthletic
                        ? (language === 'en' ? 'Lean Mass Context (FFMI: ' + (bmiInfo.ffmi || 21.5) + ')' : 'Contextualizado por Masa Magra (FFMI: ' + (bmiInfo.ffmi || 21.5) + ')')
                        : (language === 'en' ? 'WHO Standard Clinical Classification' : 'Clasificación clínica estándar OMS')}
                    </Text>
                    {bmiInfo.isAthletic && (
                      <Text style={styles.athleticNoticeDesc}>
                        {bmiInfo.explanation}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.indicatorRight}>
                  <Text style={styles.indicatorNumber}>{bmiInfo.bmi}</Text>
                  <View
                    style={[
                      styles.bmiBadge,
                      { backgroundColor: `${bmiInfo.color}22`, borderColor: bmiInfo.color },
                    ]}
                  >
                    <Text style={[styles.bmiBadgeText, { color: bmiInfo.color }]}>
                      {bmiInfo.category}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.divider} />

              {/* TMB / BMR */}
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorLeft}>
                  <HeartPulse size={18} color="#10b981" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.indicatorTitle}>{t('profile.bmr_title', 'Tasa Metabólica Basal (TMB)')}</Text>
                    <Text style={styles.indicatorDesc}>
                      {t('profile.bmr_desc', 'Gasto vital en reposo')} ({biometrics.bodyType === 'athletic' ? 'Katch-McArdle' : 'Mifflin-St Jeor'})
                    </Text>
                  </View>
                </View>
                <View style={styles.indicatorRight}>
                  <Text style={[styles.indicatorNumber, { color: '#10b981' }]}>
                    {bmrKcal.toLocaleString()}
                  </Text>
                  <Text style={styles.indicatorUnit}>{language === 'en' ? 'kcal / day' : 'kcal / día'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* TDEE */}
              <View style={styles.indicatorRow}>
                <View style={styles.indicatorLeft}>
                  <Zap size={18} color="#f59e0b" />
                  <View style={{ marginLeft: 10 }}>
                    <Text style={styles.indicatorTitle}>{t('profile.tdee_title', 'Gasto Calórico Diario Base')}</Text>
                    <Text style={styles.indicatorDesc}>
                      {t('profile.tdee_desc', 'TMB + Actividad laboral/cotidiana (sin entrenar)')}
                    </Text>
                  </View>
                </View>
                <View style={styles.indicatorRight}>
                  <Text style={[styles.indicatorNumber, { color: '#f59e0b' }]}>
                    {tdeeKcal.toLocaleString()}
                  </Text>
                  <Text style={styles.indicatorUnit}>{language === 'en' ? 'kcal / day' : 'kcal / día'}</Text>
                </View>
              </View>
            </View>

            {/* Botón Explicativo Científico */}
            <TouchableOpacity
              style={styles.howItWorksBtn}
              onPress={() => setIsExplainModalOpen(true)}
              activeOpacity={0.7}
            >
              <HelpCircle size={15} color="#38bdf8" style={{ marginRight: 6 }} />
              <Text style={styles.howItWorksText}>
                {t('profile.how_calculated_btn', '¿Cómo calculamos IMC, TMB y TDEE? (Explicación científica)')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modifyBioBtn} onPress={openBioModal} activeOpacity={0.8}>
              <Edit3 size={15} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.modifyBioBtnText}>{t('profile.update_bio_btn', 'Actualizar mis Medidas y Datos')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Sección: Preferencias de Visualización */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.title_settings', 'Preferencias & Configuración')}</Text>

          {/* Selector de Idioma / Language */}
          <View style={[styles.settingCard, { marginBottom: 12 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Globe size={20} color="#10b981" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.settingName}>{t('profile.lang_label', 'Idioma del Sistema')}</Text>
                  <Text style={styles.settingDesc}>
                    {t('profile.lang_desc', 'Español o English en toda la app')}
                  </Text>
                </View>
              </View>

              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitBtn,
                    { minWidth: 68, paddingHorizontal: 8 },
                    language === 'es' && styles.unitBtnActive,
                  ]}
                  onPress={() => handleLanguageChange('es')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      language === 'es' && styles.unitBtnTextActive,
                    ]}
                  >
                    🇪🇸 ESP
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unitBtn,
                    { minWidth: 68, paddingHorizontal: 8 },
                    language === 'en' && styles.unitBtnActive,
                  ]}
                  onPress={() => handleLanguageChange('en')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      language === 'en' && styles.unitBtnTextActive,
                    ]}
                  >
                    🇺🇸 ENG
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Scale size={20} color="#10b981" style={{ marginRight: 12 }} />
                <View>
                  <Text style={styles.settingName}>{t('profile.unit_label', 'Unidad de Peso')}</Text>
                  <Text style={styles.settingDesc}>
                    {t('profile.unit_conversion_sub', 'Conversión automática en todo el sistema (kg o lbs)')}
                  </Text>
                </View>
              </View>

              <View style={styles.unitSelector}>
                <TouchableOpacity
                  style={[
                    styles.unitBtn,
                    unit === 'kg' && styles.unitBtnActive,
                  ]}
                  onPress={() => setUnit('kg')}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      unit === 'kg' && styles.unitBtnTextActive,
                    ]}
                  >
                    KG
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.unitBtn,
                    unit === 'lbs' && styles.unitBtnActive,
                  ]}
                  onPress={() => setUnit('lbs')}
                >
                  <Text
                    style={[
                      styles.unitBtnText,
                      unit === 'lbs' && styles.unitBtnTextActive,
                    ]}
                  >
                    LBS
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Sección: Experiencia de Entrenamiento & Dispositivo */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.training_prefs_title', 'EXPERIENCIA DE ENTRENAMIENTO')}</Text>

          {/* Switch 1: Vibración Háptica */}
          <View style={[styles.settingCard, { marginBottom: 12 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Zap size={20} color="#f59e0b" style={{ marginRight: 12 }} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.settingName}>{t('profile.haptics_label', 'Vibración Háptica en Series')}</Text>
                  <Text style={styles.settingDesc}>
                    {t('profile.haptics_desc', 'Vibrar suavemente al marcar series completadas y al terminar el descanso.')}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.hapticsEnabled}
                onValueChange={(val) => handleTogglePreference('hapticsEnabled', val)}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={preferences.hapticsEnabled ? '#ffffff' : '#94a3b8'}
              />
            </View>
          </View>

          {/* Switch 2: Pantalla Siempre Activa */}
          <View style={[styles.settingCard, { marginBottom: 12 }]}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Smartphone size={20} color="#38bdf8" style={{ marginRight: 12 }} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.settingName}>{t('profile.keep_awake_label', 'Pantalla Siempre Activa')}</Text>
                  <Text style={styles.settingDesc}>
                    {t('profile.keep_awake_desc', 'Evita que la pantalla se apague o bloquee durante tu entrenamiento.')}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.keepAwakeEnabled}
                onValueChange={(val) => handleTogglePreference('keepAwakeEnabled', val)}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={preferences.keepAwakeEnabled ? '#ffffff' : '#94a3b8'}
              />
            </View>
          </View>

          {/* Switch 3: Calculadora de Discos de Barra Olímpica */}
          <View style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Dumbbell size={20} color="#a855f7" style={{ marginRight: 12 }} />
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.settingName}>{t('profile.barbell_calc_label', 'Calculadora de Discos de Barra')}</Text>
                  <Text style={styles.settingDesc}>
                    {t('profile.barbell_calc_desc', 'Mostrar botón para desglosar discos por lado en barra olímpica.')}
                  </Text>
                </View>
              </View>
              <Switch
                value={preferences.barbellCalcEnabled}
                onValueChange={(val) => handleTogglePreference('barbellCalcEnabled', val)}
                trackColor={{ false: '#334155', true: '#10b981' }}
                thumbColor={preferences.barbellCalcEnabled ? '#ffffff' : '#94a3b8'}
              />
            </View>
          </View>
        </View>

        {/* Sección: Sesión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.session_title', 'Sesión')}</Text>
          <TouchableOpacity
            style={styles.signOutBtn}
            onPress={handleSignOut}
            activeOpacity={0.8}
          >
            <LogOut size={18} color="#94a3b8" style={{ marginRight: 10 }} />
            <Text style={styles.signOutText}>{t('profile.sign_out_btn', 'Cerrar Sesión')}</Text>
          </TouchableOpacity>
        </View>

        {/* Cumplimiento Directriz Apple App Store (5.1.1v) */}
        <View style={styles.appleComplianceSection}>
          <Text style={styles.complianceTitle}>{t('profile.compliance_title', 'Gestión de Datos y Privacidad')}</Text>
          <Text style={styles.complianceSubtitle}>
            {t('profile.compliance_desc', 'En cumplimiento con los lineamientos de Apple App Store, puedes solicitar la eliminación definitiva de tu cuenta y registros personales.')}
          </Text>

          <TouchableOpacity
            style={styles.deleteAccountBtn}
            onPress={() => setIsDeleteModalOpen(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={16} color="#f87171" style={{ marginRight: 8 }} />
            <Text style={styles.deleteAccountText}>
              {t('profile.delete_account_btn', 'Eliminar mi cuenta y todos mis datos')}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Editar Datos Fisiológicos & Biometría */}
      <Modal visible={isBioModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.bioModalCard}>
            <View style={styles.bioModalTopBar}>
              <View>
                <Text style={styles.bioModalSubtitle}>{t('profile.bio_modal_subtitle', 'ACTUALIZAR BIOMETRÍA')}</Text>
                <Text style={styles.bioModalTitle}>{t('profile.bio_modal_title', 'Mis Datos Fisiológicos')}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsBioModalOpen(false)}>
                <Text style={styles.modalCloseText}>{t('common.close', 'Cerrar')}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              <Text style={styles.modalExplain}>
                {t('profile.bio_modal_explain', 'Estos datos son esenciales para calcular de forma fidedigna tu gasto calórico en la rutina, caminadora con inclinación y cardio.')}
              </Text>

              {/* Selector de Género */}
              <Text style={styles.inputLabel}>{t('profile.gender_label', 'GÉNERO BIOLÓGICO')}</Text>
              <View style={styles.genderToggleRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, editGender === 'male' && styles.genderBtnActive]}
                  onPress={() => setEditGender('male')}
                >
                  <Text style={[styles.genderBtnText, editGender === 'male' && styles.genderBtnTextActive]}>
                    {t('profile.gender_male', 'Hombre')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, editGender === 'female' && styles.genderBtnActive]}
                  onPress={() => setEditGender('female')}
                >
                  <Text style={[styles.genderBtnText, editGender === 'female' && styles.genderBtnTextActive]}>
                    {t('profile.gender_female', 'Mujer')}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Input Peso */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>{language === 'en' ? 'BODY WEIGHT (' + unit.toUpperCase() + ')' : 'PESO CORPORAL (' + unit.toUpperCase() + ')'}</Text>
                  <Text style={styles.inputHint}>{language === 'en' ? (unit === 'kg' ? 'In kilograms' : 'In pounds') : (unit === 'kg' ? 'En kilogramos' : 'En libras')}</Text>
                </View>
                <TextInput
                  style={styles.bioInput}
                  value={editWeight}
                  onChangeText={setEditWeight}
                  keyboardType="numeric"
                  placeholder={language === 'en' ? (unit === 'kg' ? 'e.g. 75.0' : 'e.g. 165.0') : (unit === 'kg' ? 'ej. 75.0' : 'ej. 165.0')}
                  placeholderTextColor="#64748b"
                />
              </View>

              {/* Selector de Unidad de Estatura */}
              <View style={styles.inputLabelRow}>
                <Text style={styles.inputLabel}>{language === 'en' ? 'HEIGHT' : 'ESTATURA'}</Text>
                <View style={styles.heightUnitToggleRow}>
                  <TouchableOpacity
                    style={[
                      styles.heightUnitToggleBtn,
                      editHeightUnit === 'cm' && styles.heightUnitToggleBtnActive,
                    ]}
                    onPress={() => setEditHeightUnit('cm')}
                  >
                    <Text
                      style={[
                        styles.heightUnitToggleBtnText,
                        editHeightUnit === 'cm' && styles.heightUnitToggleBtnTextActive,
                      ]}
                    >
                      CM
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.heightUnitToggleBtn,
                      editHeightUnit === 'ft_in' && styles.heightUnitToggleBtnActive,
                    ]}
                    onPress={() => setEditHeightUnit('ft_in')}
                  >
                    <Text
                      style={[
                        styles.heightUnitToggleBtnText,
                        editHeightUnit === 'ft_in' && styles.heightUnitToggleBtnTextActive,
                      ]}
                    >
                      {language === 'en' ? 'FT / IN (US)' : 'FT / IN (EE.UU.)'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {editHeightUnit === 'cm' ? (
                <View style={styles.inputGroup}>
                  <TextInput
                    style={styles.bioInput}
                    value={editHeightCm}
                    onChangeText={handleCmChange}
                    keyboardType="numeric"
                    placeholder={language === 'en' ? 'e.g. 174' : 'ej. 174'}
                    placeholderTextColor="#64748b"
                  />
                  <Text style={styles.inputConversionHint}>
                    ≈ {cmToFtIn(parseFloat(editHeightCm) || 0).feet}&apos;{' '}
                    {cmToFtIn(parseFloat(editHeightCm) || 0).inches}&quot; ({language === 'en' ? 'feet & inches' : 'pies y pulgadas'})
                  </Text>
                </View>
              ) : (
                <View style={styles.inputGroup}>
                  <View style={styles.ftInInputsRow}>
                    <View style={styles.ftInInputCol}>
                      <Text style={styles.ftInSubLabel}>{language === 'en' ? 'FEET (FT)' : 'PIES (FT)'}</Text>
                      <TextInput
                        style={styles.bioInput}
                        value={editHeightFt}
                        onChangeText={handleFtChange}
                        keyboardType="numeric"
                        placeholder={language === 'en' ? 'e.g. 5' : 'ej. 5'}
                        placeholderTextColor="#64748b"
                      />
                    </View>
                    <View style={styles.ftInInputCol}>
                      <Text style={styles.ftInSubLabel}>{language === 'en' ? 'INCHES (IN)' : 'PULGADAS (IN)'}</Text>
                      <TextInput
                        style={styles.bioInput}
                        value={editHeightIn}
                        onChangeText={handleInChange}
                        keyboardType="numeric"
                        placeholder={language === 'en' ? 'e.g. 8.5' : 'ej. 8.5'}
                        placeholderTextColor="#64748b"
                      />
                    </View>
                  </View>
                  <Text style={styles.inputConversionHint}>
                    ≈{' '}
                    {ftInToCm(
                      parseFloat(editHeightFt) || 0,
                      parseFloat(editHeightIn) || 0
                    )}{' '}
                    cm ({language === 'en' ? 'centimeters' : 'centímetros'})
                  </Text>
                </View>
              )}

              {/* Selector de Composición Corporal & Tipo de Físico */}
              <Text style={styles.inputLabel}>{language === 'en' ? 'BODY COMPOSITION & PHYSIQUE' : 'COMPOSICIÓN CORPORAL & FÍSICO'}</Text>
              <View style={styles.bodyTypeToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.bodyTypeBtn,
                    editBodyType === 'standard' && styles.bodyTypeBtnActive,
                  ]}
                  onPress={() => setEditBodyType('standard')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.bodyTypeBtnText,
                      editBodyType === 'standard' && styles.bodyTypeBtnTextActive,
                    ]}
                  >
                    Estándar
                  </Text>
                  <Text style={styles.bodyTypeBtnSub}>Población general</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.bodyTypeBtn,
                    editBodyType === 'athletic' && styles.bodyTypeBtnActive,
                  ]}
                  onPress={() => setEditBodyType('athletic')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.bodyTypeBtnText,
                      editBodyType === 'athletic' && styles.bodyTypeBtnTextActive,
                    ]}
                  >
                    🏋️ Atlético / Musculado
                  </Text>
                  <Text style={styles.bodyTypeBtnSub}>Masa muscular magra</Text>
                </TouchableOpacity>
              </View>
              {editBodyType === 'athletic' && (
                <View style={styles.athleticTipCard}>
                  <Sparkles size={14} color="#10b981" style={{ marginRight: 6 }} />
                  <Text style={styles.athleticTipText}>
                    {language === 'en'
                      ? 'Athletic Mode enabled: BMI will not classify you as overweight, and your basal expenditure is calculated via Katch-McArdle taking into account lean muscle mass.'
                      : 'Modo Atlético activado: El IMC no te marcará sobrepeso y tu gasto basal se calculará con Katch-McArdle tomando en cuenta el tejido muscular magro.'}
                  </Text>
                </View>
              )}

              {/* Fecha de Nacimiento */}
              <View style={styles.inputGroup}>
                <View style={styles.inputLabelRow}>
                  <Text style={styles.inputLabel}>
                    {language === 'en' ? 'DATE OF BIRTH' : 'FECHA DE NACIMIENTO'}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(16, 185, 129, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(16, 185, 129, 0.3)' }}>
                    <Cake size={11} color="#10b981" style={{ marginRight: 4 }} />
                    <Text style={{ color: '#10b981', fontSize: 11, fontWeight: 'bold' }}>
                      {previewAge} {language === 'en' ? 'years calculated' : 'años calculados'}
                    </Text>
                  </View>
                </View>

                <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ftInSubLabel}>{language === 'en' ? 'DAY (DD)' : 'DÍA (DD)'}</Text>
                    <TextInput
                      style={[styles.bioInput, { textAlign: 'center' }]}
                      value={editBirthDay}
                      onChangeText={setEditBirthDay}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="DD"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ftInSubLabel}>{language === 'en' ? 'MONTH (MM)' : 'MES (MM)'}</Text>
                    <TextInput
                      style={[styles.bioInput, { textAlign: 'center' }]}
                      value={editBirthMonth}
                      onChangeText={setEditBirthMonth}
                      keyboardType="number-pad"
                      maxLength={2}
                      placeholder="MM"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                  <View style={{ flex: 1.5 }}>
                    <Text style={styles.ftInSubLabel}>{language === 'en' ? 'YEAR (YYYY)' : 'AÑO (AAAA)'}</Text>
                    <TextInput
                      style={[styles.bioInput, { textAlign: 'center' }]}
                      value={editBirthYear}
                      onChangeText={setEditBirthYear}
                      keyboardType="number-pad"
                      maxLength={4}
                      placeholder="AAAA"
                      placeholderTextColor="#64748b"
                    />
                  </View>
                </View>
                <Text style={styles.inputConversionHint}>
                  🎂 {previewBirthDateStr ? formatBirthDateFull(previewBirthDateStr, language) : ''} · {language === 'en' ? 'Caloric metrics recalculate automatically' : 'Gasto calórico recalculado automáticamente'}
                </Text>
              </View>

              {/* Actividad Laboral Cotidiana (NEAT) */}
              <Text style={styles.inputLabel}>{language === 'en' ? 'DAILY LIFESTYLE ACTIVITY (NON-GYM)' : 'ACTIVIDAD LABORAL COTIDIANA (FUERA DEL GIMNASIO)'}</Text>
              <Text style={styles.activitySectionHint}>
                {language === 'en'
                  ? 'Baseline expenditure of your daily work. Upon completing any routine or cardio, the app automatically adds your burned calories.'
                  : 'Gasto mínimo de tu trabajo diario. Al terminar cada rutina o cardio, la app le sumará automáticamente las calorías quemadas.'}
              </Text>
              <View style={styles.activityOptions}>
                {[
                  {
                    key: 'sedentary',
                    label: 'Oficina / Escritorio / PC',
                    desc: 'Sentado casi todo el día, mínimo desplazamiento',
                  },
                  {
                    key: 'light',
                    label: 'De pie / Comercio / Docencia',
                    desc: 'Gran parte de la jornada de pie o caminando ligero',
                  },
                  {
                    key: 'moderate',
                    label: 'Movimiento Activo / Salud / Mozo',
                    desc: 'Caminatas y desplazamientos continuos de trabajo',
                  },
                  {
                    key: 'very_active',
                    label: 'Trabajo Físico Pesado / Construcción',
                    desc: 'Esfuerzo muscular continuo y carga manual',
                  },
                ].map((act) => (
                  <TouchableOpacity
                    key={act.key}
                    style={[
                      styles.activityOptionItem,
                      editActivityLevel === act.key && styles.activityOptionActive,
                    ]}
                    onPress={() => setEditActivityLevel(act.key as ActivityLevel)}
                  >
                    <View style={styles.activityOptionInfo}>
                      <Text
                        style={[
                          styles.activityOptionLabel,
                          editActivityLevel === act.key && styles.activityOptionLabelActive,
                        ]}
                      >
                        {act.label}
                      </Text>
                      <Text style={styles.activityOptionDesc}>{act.desc}</Text>
                    </View>
                    {editActivityLevel === act.key && <Check size={18} color="#10b981" />}
                  </TouchableOpacity>
                ))}
              </View>

              {/* Tarjeta de Previsualización en Vivo */}
              <View style={styles.previewBox}>
                <Text style={styles.previewBoxTitle}>{language === 'en' ? 'PREVIEW OF YOUR METRICS' : 'PREVISUALIZACIÓN DE TUS MÉTRICAS'}</Text>
                <View style={styles.previewRow}>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>IMC</Text>
                    <Text style={[styles.previewVal, { color: previewBMI.color }]}>
                      {previewBMI.bmi}
                    </Text>
                    <Text style={[styles.previewSubVal, { color: previewBMI.color }]}>
                      {previewBMI.category}
                    </Text>
                  </View>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>TMB / BMR</Text>
                    <Text style={[styles.previewVal, { color: '#10b981' }]}>
                      {previewBMR} kcal
                    </Text>
                    <Text style={styles.previewSubVal}>
                      {editBodyType === 'athletic' ? 'Katch-McArdle' : 'Mifflin'}
                    </Text>
                  </View>
                  <View style={styles.previewCol}>
                    <Text style={styles.previewLabel}>{language === 'en' ? 'DAILY BASELINE' : 'BASE DIARIA'}</Text>
                    <Text style={[styles.previewVal, { color: '#f59e0b' }]}>
                      {previewTDEE} kcal
                    </Text>
                    <Text style={styles.previewSubVal}>{language === 'en' ? 'Non-training burn' : 'Gasto sin entreno'}</Text>
                  </View>
                </View>
              </View>

              {/* Botón Guardar */}
              <TouchableOpacity
                style={styles.saveBioBtn}
                onPress={handleSaveBiometrics}
                disabled={savingBio}
              >
                {savingBio ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.saveBioBtnText}>{language === 'en' ? 'Save and Recalculate' : 'Guardar y Recalcular'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmación de Eliminación de Cuenta */}
      <Modal visible={isDeleteModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.warnCircle}>
              <AlertTriangle size={36} color="#ef4444" />
            </View>

            <Text style={styles.modalTitle}>{language === 'en' ? 'Permanently Delete Account?' : '¿Eliminar Cuenta Permanentemente?'}</Text>
            <Text style={styles.modalDesc}>
              {language === 'en'
                ? 'This action is irreversible. Your profile, logged sets history, nutritional guidelines, and progress photos will be deleted from the servers.'
                : 'Esta acción es irreversible. Se eliminarán tu perfil, historial de series registradas, pautas nutricionales y fotos de progreso de los servidores de Supabase.'}
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setIsDeleteModalOpen(false)}
                disabled={deleting}
              >
                <Text style={styles.cancelBtnText}>{language === 'en' ? 'Cancel' : 'Cancelar'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.confirmDeleteBtnText}>{language === 'en' ? 'Yes, Delete' : 'Sí, Eliminar'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Educativo: ¿Cómo medimos IMC, TMB y TDEE? */}
      <Modal visible={isExplainModalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.explainModalCard}>
            <View style={styles.explainModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <HelpCircle size={22} color="#38bdf8" style={{ marginRight: 8 }} />
                <Text style={styles.explainModalTitle}>{language === 'en' ? 'Physiology & Energy Expenditure' : 'Fisiología & Gasto Energético'}</Text>
              </View>
              <TouchableOpacity onPress={() => setIsExplainModalOpen(false)}>
                <Text style={styles.modalCloseText}>{language === 'en' ? 'Close' : 'Cerrar'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              {/* 1. IMC / BMI */}
              <View style={styles.explainSection}>
                <Text style={styles.explainSectionTitle}>
                  {language === 'en' ? '1. Body Mass Index (BMI)' : '1. Índice de Masa Corporal (IMC)'}
                </Text>
                <Text style={styles.explainText}>
                  • <Text style={{ fontWeight: '800', color: '#ffffff' }}>{language === 'en' ? 'Is it accurate?' : '¿Es exacto?'}</Text>{' '}
                  {language === 'en'
                    ? 'The mathematical calculation (weight / height²) is 100% exact, but as a body fat indicator in athletes it is merely statistical.'
                    : 'El cálculo aritmético (peso / estatura²) es 100% exacto, pero como indicador de grasa corporal en deportistas es meramente estadístico.'}
                </Text>
                <Text style={styles.explainText}>
                  • <Text style={{ fontWeight: '800', color: '#ffffff' }}>{language === 'en' ? 'The overweight myth in athletes:' : 'El mito del sobrepeso en atletas:'}</Text>{' '}
                  {language === 'en'
                    ? '1 kg of dense muscle weighs exactly the same on the scale as 1 kg of fat. In people who strength train (e.g. 1.74m and 80kg), standard BMI mistakenly reports "overweight". With '
                    : '1 kg de músculo denso pesa exactamente lo mismo en la balanza que 1 kg de grasa. En personas que entrenan con pesas (como medir 1.74m y pesar 80kg), el IMC estándar marca erróneamente "sobrepeso". Con el '}
                  <Text style={{ color: '#10b981', fontWeight: '800' }}>
                    {language === 'en' ? 'Athletic Mode' : 'Modo Atlético'}
                  </Text>
                  {language === 'en'
                    ? ', the app recognizes your lean muscle mass and does not penalize you.'
                    : ', la app reconoce tu masa muscular y no te penaliza.'}
                </Text>
              </View>

              {/* 2. TMB / BMR */}
              <View style={styles.explainSection}>
                <Text style={styles.explainSectionTitle}>
                  {language === 'en' ? '2. Basal Metabolic Rate (BMR / TMB)' : '2. Tasa Metabólica Basal (TMB / BMR)'}
                </Text>
                <Text style={styles.explainText}>
                  • <Text style={{ fontWeight: '800', color: '#ffffff' }}>{language === 'en' ? 'What does it measure?' : '¿Qué mide?'}</Text>{' '}
                  {language === 'en'
                    ? 'The minimum vital calories your organs burn at absolute rest.'
                    : 'Las calorías mínimas vitales que queman tus órganos en reposo absoluto.'}
                </Text>
                <Text style={styles.explainText}>
                  • <Text style={{ fontWeight: '800', color: '#ffffff' }}>{language === 'en' ? 'Exact or estimated?' : '¿Es exacto o estimativo?'}</Text>{' '}
                  {language === 'en'
                    ? 'It is a clinical medical estimation with 92% to 95% accuracy (margin of error ±5-8% compared to laboratory indirect calorimetry).'
                    : 'Es una estimación médica con una precisión de entre el 92% y el 95% (margen de error de apenas ±5-8% respecto a una prueba de calorimetría de laboratorio).'}
                </Text>
                <Text style={styles.explainText}>
                  • {language === 'en' ? 'In Athletic Mode we calculate your BMR with ' : 'En el modo atlético calculamos tu TMB con '}
                  <Text style={{ color: '#10b981', fontWeight: '800' }}>Katch-McArdle</Text>
                  {language === 'en' ? ', which takes into account your lean fat-free mass.' : ', que toma en cuenta tu masa libre de grasa.'}
                </Text>
              </View>

              {/* 3. TDEE y Suma de Entrenamientos */}
              <View style={styles.explainSection}>
                <Text style={styles.explainSectionTitle}>
                  {language === 'en' ? '3. Total Expenditure & Live Workout Addition' : '3. Gasto Total y Suma en Vivo de Entrenamientos'}
                </Text>
                <Text style={styles.explainText}>
                  • <Text style={{ fontWeight: '800', color: '#ffffff' }}>{language === 'en' ? 'How does OptiFit Labs calculate it?' : '¿Cómo lo calcula OptiFit Labs?'}</Text>{' '}
                  {language === 'en'
                    ? 'The app does not use a flat static multiplier. It establishes your baseline daily expenditure (office, standing, or active) and, every time you complete a strength workout or cardio/sports session, '
                    : 'La app no usa un multiplicador estático y plano como otras apps. Establece tu gasto básico de vida laboral (oficina, de pie o activo) y, cada vez que finalizas una rutina de fuerza o una sesión de cardio/deporte, '}
                  <Text style={{ color: '#10b981', fontWeight: '800' }}>
                    {language === 'en' ? 'automatically adds that real expenditure to your day' : 'suma automáticamente ese gasto real al día'}
                  </Text>.
                </Text>
              </View>

              <TouchableOpacity
                style={styles.explainCloseBtn}
                onPress={() => setIsExplainModalOpen(false)}
              >
                <Text style={styles.explainCloseBtnText}>{language === 'en' ? 'Got It' : 'Entendido'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#020503',
  },
  topBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1.5,
    borderBottomColor: 'rgba(16, 185, 129, 0.25)',
    backgroundColor: 'rgba(2, 6, 4, 0.94)',
  },
  screenSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#00ff87',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  userCard: {
    backgroundColor: '#051209',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 24,
    alignItems: 'center',
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1.5,
    borderColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  clientCodeBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.4)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  clientCodeBadgeText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '900',
    fontFamily: 'monospace',
    letterSpacing: 0.5,
  },
  clientCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#020617',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  clientCodePillLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94a3b8',
    letterSpacing: 0.5,
  },
  clientCodePillValue: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10b981',
    fontFamily: 'monospace',
  },
  userEmail: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginTop: 12,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  inactiveNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    borderRadius: 16,
    padding: 14,
    marginTop: 12,
  },
  inactiveNoticeTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#f59e0b',
  },
  inactiveNoticeDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 16,
  },
  section: {
    gap: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editPencilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editPencilText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#10b981',
  },
  bioCard: {
    backgroundColor: '#051209',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
  },
  bioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  bioTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bioCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  bioCardSubtitle: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 1,
  },
  bioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#020617',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    gap: 10,
  },
  bioGridItem: {
    width: '48%',
  },
  bioGridLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
  },
  bioGridValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginTop: 2,
  },
  bioGridUnit: {
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '600',
  },
  calculatedMetricsContainer: {
    marginTop: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  indicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  indicatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  indicatorTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  indicatorDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 1,
  },
  indicatorRight: {
    alignItems: 'flex-end',
  },
  indicatorNumber: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  indicatorUnit: {
    fontSize: 10,
    color: '#64748b',
    fontWeight: '700',
  },
  bmiBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 2,
  },
  bmiBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    backgroundColor: '#1e293b',
  },
  modifyBioBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderWidth: 1,
    borderColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 11,
    marginTop: 14,
  },
  modifyBioBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#10b981',
  },
  settingCard: {
    backgroundColor: '#051209',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 16,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
  },
  settingDesc: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: '#020617',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: '#10b981',
  },
  unitBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
  },
  unitBtnTextActive: {
    color: '#ffffff',
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#051209',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    paddingVertical: 14,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  appleComplianceSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    gap: 8,
  },
  complianceTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    textTransform: 'uppercase',
  },
  complianceSubtitle: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },
  deleteAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    paddingVertical: 12,
    marginTop: 6,
  },
  deleteAccountText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#f87171',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  bioModalCard: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: '#10b981',
    padding: 20,
    maxHeight: '90%',
  },
  bioModalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  bioModalSubtitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
    letterSpacing: 1,
  },
  bioModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
    padding: 4,
  },
  modalExplain: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: 0.5,
    marginBottom: 6,
    marginTop: 8,
  },
  genderToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  genderBtn: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10b981',
  },
  genderBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#94a3b8',
  },
  genderBtnTextActive: {
    color: '#10b981',
    fontWeight: '900',
  },
  inputGroup: {
    marginBottom: 10,
  },
  inputLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  inputHint: {
    fontSize: 10,
    color: '#64748b',
  },
  bioInput: {
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  activityOptions: {
    gap: 6,
    marginBottom: 12,
  },
  activityOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#020617',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  activityOptionActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  activityOptionInfo: {
    flex: 1,
  },
  activityOptionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#e2e8f0',
  },
  activityOptionLabelActive: {
    color: '#10b981',
  },
  activityOptionDesc: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  previewBox: {
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#334155',
    padding: 12,
    marginVertical: 10,
  },
  previewBoxTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  previewCol: {
    flex: 1,
  },
  previewLabel: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '700',
  },
  previewVal: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  saveBioBtn: {
    backgroundColor: '#10b981',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  saveBioBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalCard: {
    width: '90%',
    maxWidth: 340,
    backgroundColor: '#0f172a',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#ef4444',
    padding: 24,
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 'auto',
    marginTop: 'auto',
  },
  warnCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderWidth: 1.5,
    borderColor: '#ef4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#1e293b',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  confirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  confirmDeleteBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  bioGridSubUnit: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  athleticNoticeDesc: {
    fontSize: 11,
    lineHeight: 15,
    color: '#10b981',
    marginTop: 4,
  },
  howItWorksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.3)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  howItWorksText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#38bdf8',
  },
  heightUnitToggleRow: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 2,
  },
  heightUnitToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heightUnitToggleBtnActive: {
    backgroundColor: '#10b981',
  },
  heightUnitToggleBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748b',
  },
  heightUnitToggleBtnTextActive: {
    color: '#ffffff',
  },
  inputConversionHint: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
    marginTop: 4,
  },
  ftInInputsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ftInInputCol: {
    flex: 1,
  },
  ftInSubLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748b',
    marginBottom: 4,
  },
  bodyTypeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  bodyTypeBtn: {
    flex: 1,
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    alignItems: 'center',
  },
  bodyTypeBtnActive: {
    borderColor: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  bodyTypeBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748b',
  },
  bodyTypeBtnTextActive: {
    color: '#ffffff',
  },
  bodyTypeBtnSub: {
    fontSize: 10,
    color: '#64748b',
    marginTop: 2,
  },
  athleticTipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
    padding: 10,
    marginBottom: 12,
  },
  athleticTipText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#a7f3d0',
  },
  activitySectionHint: {
    fontSize: 11,
    lineHeight: 15,
    color: '#64748b',
    marginBottom: 8,
    marginTop: -4,
  },
  previewSubVal: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748b',
    marginTop: 2,
  },
  explainModalCard: {
    backgroundColor: '#090d16',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  explainModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    marginBottom: 14,
  },
  explainModalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  explainSection: {
    backgroundColor: '#0f172a',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
    marginBottom: 12,
    gap: 8,
  },
  explainSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#38bdf8',
  },
  explainText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#94a3b8',
  },
  explainCloseBtn: {
    backgroundColor: '#10b981',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  explainCloseBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  birthdayBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(245, 158, 11, 0.4)',
    padding: 16,
    marginBottom: 20,
    gap: 14,
  },
  birthdayIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  birthdayTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#fbbf24',
    marginBottom: 4,
  },
  birthdaySubtitle: {
    fontSize: 12,
    lineHeight: 17,
    color: '#fef3c7',
  },
});
