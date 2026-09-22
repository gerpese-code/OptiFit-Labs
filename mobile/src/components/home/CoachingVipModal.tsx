import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Target,
  BicepsFlexed,
  MessageCircle,
  Dumbbell,
  Utensils,
  CheckCircle2,
  Award,
  Zap,
  ShieldCheck,
  ArrowRight,
  UserCheck,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import { triggerHaptic } from '@/lib/userPreferences';

interface CoachingVipModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function CoachingVipModal({ visible, onClose }: CoachingVipModalProps) {
  const { language } = useLanguage();
  const lang = language === 'en' ? 'en' : 'es';

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleOpenWhatsApp = () => {
    triggerHaptic('tap');
    const message =
      lang === 'en'
        ? "Hi Coach! 👋 I'm writing from the OptiFit Labs app 📱. I would like to inquire about 1-on-1 Coaching and Custom Training & Nutrition Plans. Could you provide more details, pricing, and availability? Thank you!"
        : '¡Hola Coach! 👋 Te escribo desde la app OptiFit Labs 📱. Me gustaría consultar sobre las Asesorías 1 a 1 y Planes Personalizados de Entrenamiento y Nutrición para lograr mis objetivos. ¿Me podrías brindar más información, planes y disponibilidad? ¡Muchas gracias!';
    const url = `https://wa.me/5493364254391?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert(
        'WhatsApp',
        lang === 'en'
          ? 'Could not open WhatsApp automatically. You can contact directly at +54 9 3364 25 4391.'
          : 'No se pudo abrir WhatsApp automáticamente. Puedes escribir directamente al +54 9 3364 25 4391.'
      );
    });
  };

  const pillars = [
    {
      id: 'training',
      icon: <Dumbbell size={22} color="#38bdf8" />,
      tagColor: '#38bdf8',
      title: lang === 'es' ? 'Rutina 100% Personalizada' : '100% Tailored Workout Routine',
      badge: lang === 'es' ? 'ENTRENAMIENTO' : 'TRAINING',
      description:
        lang === 'es'
          ? 'Diseñada a medida de tus objetivos (hipertrofia, definición, fuerza), nivel y lugar de entrenamiento (gimnasio o casa). Cargada directamente en tu app con series, repeticiones, cargas y videos.'
          : 'Custom-built for your goals (hypertrophy, fat loss, strength), experience level, and gym or home equipment. Loaded directly into your app with sets, reps, weights, and video guides.',
    },
    {
      id: 'nutrition',
      icon: <Utensils size={22} color="#10b981" />,
      tagColor: '#10b981',
      title: lang === 'es' ? 'Pauta Nutricional & Macros' : 'Precision Nutrition & Macros',
      badge: lang === 'es' ? 'NUTRICIÓN' : 'NUTRITION',
      description:
        lang === 'es'
          ? 'Cálculo individualizado de calorías, proteínas, carbohidratos y grasas. Guía de porciones y alimentos estratégicos sin dietas restrictivas extremas ni efecto rebote.'
          : 'Individualized calculation of calories, protein, carbs, and fats. Flexible food choices and sustainable portion guides without starvation diets or rebound effect.',
    },
    {
      id: 'monitoring',
      icon: <Award size={22} color="#f59e0b" />,
      tagColor: '#f59e0b',
      title: lang === 'es' ? 'Monitoreo & Sobrecarga Progresiva' : 'Continuous Tracking & Progression',
      badge: lang === 'es' ? 'PROGRESIÓN' : 'PROGRESSION',
      description:
        lang === 'es'
          ? 'Supervisión constante de tus cargas y repeticiones registradas en la app. Corrección de técnica mediante videos y ajustes periódicos para que nunca te estanques.'
          : 'Continuous monitoring of your logged weights and reps. Video form checks and periodic adjustments ensuring consistent linear and undulating progression.',
    },
    {
      id: 'support',
      icon: <MessageCircle size={22} color="#25D366" />,
      tagColor: '#25D366',
      title: lang === 'es' ? 'Contacto Directo por WhatsApp' : 'Direct Coach WhatsApp Access',
      badge: lang === 'es' ? '1 A 1 EN VIVO' : '1-ON-1 LIVE',
      description:
        lang === 'es'
          ? 'Línea prioritaria con tu Coach para resolver dudas inmediatas, adaptar entrenamientos por viajes o imprevistos y mantener alta la disciplina y motivación.'
          : 'Priority communication channel with your coach for immediate questions, schedule adjustments for travel or busy days, and unwavering motivation.',
    },
  ];

  const steps = [
    {
      step: '01',
      title: lang === 'es' ? 'Contacto & Evaluación' : 'Initial Consultation',
      desc:
        lang === 'es'
          ? 'Escribes por WhatsApp para analizar tus objetivos, experiencia previa, horarios disponibles y requerimientos especiales.'
          : 'Reach out via WhatsApp to review your goals, previous experience, daily schedule, and specific needs.',
    },
    {
      step: '02',
      title: lang === 'es' ? 'Diseño y Carga en tu App' : 'Plan Design & App Setup',
      desc:
        lang === 'es'
          ? 'Tu Coach diseña tu planificación y la sincroniza en tu cuenta de OptiFit Labs. Todo listo para empezar.'
          : 'Your coach crafts your custom regimen and syncs it directly to your OptiFit Labs account.',
    },
    {
      step: '03',
      title: lang === 'es' ? 'Entrenamiento & Feedback Semanal' : 'Training & Ongoing Feedback',
      desc:
        lang === 'es'
          ? 'Registras cada sesión, sigues tu progreso en tiempo real y recibes ajustes continuos para maximizar resultados.'
          : 'Log your sets, track progression in real-time, and receive continuous updates to maximize physical gains.',
    },
  ];

  const faqs = [
    {
      q: lang === 'es' ? '¿Es necesario tener experiencia previa en el gimnasio?' : 'Do I need prior gym experience?',
      a:
        lang === 'es'
          ? 'No. La asesoría se adapta tanto a principiantes que nunca han pisado un gimnasio y buscan aprender técnica correcta con seguridad, como a atletas avanzados que buscan romper estancamientos.'
          : 'Not at all. The program is fully customized for absolute beginners needing safe form guidance as well as advanced lifters breaking plateaus.',
    },
    {
      q: lang === 'es' ? '¿Qué pasa si entreno en casa o tengo poco tiempo?' : 'What if I train at home or have limited time?',
      a:
        lang === 'es'
          ? 'La rutina se adapta exactamente a tus condiciones: mancuernas, barras, bandas o peso corporal, y al tiempo real que puedas dedicarle (30, 45 o 60 minutos).'
          : 'Your routine is built around your reality: dumbbells, bands, bodyweight, or commercial gym equipment, and your available time (30, 45, or 60 min).',
    },
    {
      q: lang === 'es' ? '¿Cómo se sincroniza con mi app OptiFit Labs?' : 'How does it sync with my OptiFit Labs app?',
      a:
        lang === 'es'
          ? 'Tu Coach tiene acceso al panel de administración donde te asigna tus rutinas clasificadas por grupo muscular, con tus series, repeticiones y notas técnicas personalizadas.'
          : 'Your coach uses the centralized admin board to assign routines classified by muscle group, with your exact target sets, reps, and technical notes.',
    },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Barra Superior */}
        <View style={styles.topHeader}>
          <View style={{ flex: 1, paddingRight: 12 }}>
            <View style={styles.headerBadge}>
              <BicepsFlexed size={11} color="#38bdf8" style={{ marginRight: 4 }} />
              <Text style={styles.headerBadgeText}>
                {lang === 'es' ? 'ASESORÍAS 1 A 1 • PERSONAL TRAINER VIP' : '1-ON-1 COACHING • VIP PERSONAL TRAINER'}
              </Text>
            </View>
            <Text style={styles.headerTitle}>
              {lang === 'es' ? 'Planes & Asesorías 1 a 1' : '1-on-1 VIP Coaching'}
            </Text>
            <Text style={styles.headerSubtitle}>
              {lang === 'es'
                ? 'Planificación a medida, nutrición de precisión y contacto directo con tu Coach'
                : 'Custom programming, precision nutrition & direct coach access'}
            </Text>
          </View>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Hero Banner */}
          <View style={styles.heroCard}>
            <View style={styles.heroGlow} />
            <View style={styles.heroBadgeRow}>
              <View style={styles.heroBadge}>
                <Zap size={11} color="#10b981" style={{ marginRight: 4 }} />
                <Text style={styles.heroBadgeText}>
                  {lang === 'es' ? 'ALTO RENDIMIENTO' : 'HIGH PERFORMANCE'}
                </Text>
              </View>
              <View style={styles.vipTag}>
                <ShieldCheck size={11} color="#f59e0b" style={{ marginRight: 3 }} />
                <Text style={styles.vipTagText}>VIP 100%</Text>
              </View>
            </View>

            <Text style={styles.heroTitle}>
              {lang === 'es'
                ? 'Deja de adivinar y acelera tus resultados físicos'
                : 'Stop guessing and accelerate your physical results'}
            </Text>

            <Text style={styles.heroDescription}>
              {lang === 'es'
                ? 'Cada cuerpo responde de forma única. Con una asesoría 1 a 1, tu entrenamiento y nutrición son diseñados milimétricamente según tu metabolismo, estructura anatómica y objetivos.'
                : 'Every body responds uniquely. With 1-on-1 coaching, your programming and nutrition are calibrated specifically to your metabolism, biomechanics, and lifestyle.'}
            </Text>

            <TouchableOpacity
              style={styles.heroCtaBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.88}
            >
              <MessageCircle size={16} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.heroCtaBtnText}>
                {lang === 'es' ? 'Consultar Cupos por WhatsApp' : 'Inquire Availability on WhatsApp'}
              </Text>
              <ArrowRight size={15} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {/* Sección Pilares */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>
              {lang === 'es' ? 'LOS 4 PILARES' : 'THE 4 PILLARS'}
            </Text>
            <Text style={styles.sectionTitle}>
              {lang === 'es' ? '¿Qué incluye la Asesoría 1 a 1?' : "What's Included in 1-on-1 Coaching?"}
            </Text>
          </View>

          <View style={styles.pillarsGrid}>
            {pillars.map((item) => (
              <View key={item.id} style={styles.pillarCard}>
                <View style={styles.pillarHeader}>
                  <View
                    style={[
                      styles.pillarIconBox,
                      { backgroundColor: `${item.tagColor}1a`, borderColor: `${item.tagColor}40` },
                    ]}
                  >
                    {item.icon}
                  </View>
                  <View
                    style={[
                      styles.pillarBadge,
                      { backgroundColor: `${item.tagColor}15`, borderColor: `${item.tagColor}35` },
                    ]}
                  >
                    <Text style={[styles.pillarBadgeText, { color: item.tagColor }]}>
                      {item.badge}
                    </Text>
                  </View>
                </View>

                <Text style={styles.pillarTitle}>{item.title}</Text>
                <Text style={styles.pillarDescription}>{item.description}</Text>
              </View>
            ))}
          </View>

          {/* Cómo Empezar (Paso a Paso) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>
              {lang === 'es' ? 'PASO A PASO' : 'HOW IT WORKS'}
            </Text>
            <Text style={styles.sectionTitle}>
              {lang === 'es' ? '¿Cómo empezar tu planificación?' : 'How to get started?'}
            </Text>
          </View>

          <View style={styles.stepsCard}>
            {steps.map((st, idx) => (
              <View key={st.step} style={styles.stepRow}>
                <View style={styles.stepNumCol}>
                  <View style={styles.stepNumberCircle}>
                    <Text style={styles.stepNumberText}>{st.step}</Text>
                  </View>
                  {idx < steps.length - 1 && <View style={styles.stepConnectorLine} />}
                </View>
                <View style={styles.stepContentCol}>
                  <Text style={styles.stepTitle}>{st.title}</Text>
                  <Text style={styles.stepDesc}>{st.desc}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Preguntas Frecuentes (FAQ) */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionCategory}>
              {lang === 'es' ? 'DUDAS FRECUENTES' : 'FAQ'}
            </Text>
            <Text style={styles.sectionTitle}>
              {lang === 'es' ? 'Preguntas Frecuentes' : 'Frequently Asked Questions'}
            </Text>
          </View>

          <View style={styles.faqList}>
            {faqs.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <TouchableOpacity
                  key={idx}
                  style={styles.faqCard}
                  onPress={() => setExpandedFaq(isOpen ? null : idx)}
                  activeOpacity={0.8}
                >
                  <View style={styles.faqHeader}>
                    <HelpCircle size={16} color="#38bdf8" style={{ marginRight: 8 }} />
                    <Text style={styles.faqQuestion}>{faq.q}</Text>
                    {isOpen ? (
                      <ChevronUp size={16} color="#94a3b8" />
                    ) : (
                      <ChevronDown size={16} color="#94a3b8" />
                    )}
                  </View>
                  {isOpen && <Text style={styles.faqAnswer}>{faq.a}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Banner de Contacto Final */}
          <View style={styles.bottomContactCard}>
            <View style={styles.bottomContactIconBox}>
              <MessageCircle size={28} color="#25D366" />
            </View>
            <Text style={styles.bottomContactTitle}>
              {lang === 'es'
                ? '¿Listo para llevar tu entrenamiento al siguiente nivel?'
                : 'Ready to elevate your training to the next level?'}
            </Text>
            <Text style={styles.bottomContactSubtitle}>
              {lang === 'es'
                ? 'Escríbenos directamente al WhatsApp oficial del Coach (+54 9 3364 25 4391) para conocer cupos y planes activos.'
                : 'Message the coach directly on official WhatsApp (+54 9 3364 25 4391) to check current availability.'}
            </Text>
            <TouchableOpacity
              style={styles.whatsAppMainBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.85}
            >
              <MessageCircle size={18} color="#ffffff" style={{ marginRight: 8 }} />
              <Text style={styles.whatsAppMainBtnText}>
                {lang === 'es' ? 'Abrir Chat de WhatsApp con el Coach' : 'Chat with Coach on WhatsApp'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#090d16',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
    lineHeight: 15,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  heroCard: {
    backgroundColor: '#0a1020',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    padding: 18,
    marginBottom: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#38bdf8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  heroGlow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: '#38bdf8',
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.35)',
  },
  heroBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },
  vipTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.35)',
  },
  vipTagText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#fbbf24',
  },
  heroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    lineHeight: 22,
    marginBottom: 8,
  },
  heroDescription: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 18,
    marginBottom: 16,
  },
  heroCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  heroCtaBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionCategory: {
    fontSize: 10,
    fontWeight: '900',
    color: '#38bdf8',
    letterSpacing: 1,
    marginBottom: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  pillarsGrid: {
    gap: 12,
    marginBottom: 22,
  },
  pillarCard: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  pillarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pillarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  pillarBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  pillarTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
  },
  pillarDescription: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 17,
  },
  stepsCard: {
    backgroundColor: '#090d16',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
    marginBottom: 22,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepNumCol: {
    alignItems: 'center',
    width: 34,
    marginRight: 12,
  },
  stepNumberCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1.5,
    borderColor: '#38bdf8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#38bdf8',
  },
  stepConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
    marginVertical: 4,
  },
  stepContentCol: {
    flex: 1,
    paddingBottom: 16,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 3,
  },
  stepDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  faqList: {
    gap: 10,
    marginBottom: 24,
  },
  faqCard: {
    backgroundColor: '#090d16',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqQuestion: {
    flex: 1,
    fontSize: 12.5,
    fontWeight: '800',
    color: '#ffffff',
    lineHeight: 17,
  },
  faqAnswer: {
    fontSize: 11.5,
    color: '#94a3b8',
    lineHeight: 17,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  bottomContactCard: {
    backgroundColor: '#0a1020',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: 'rgba(37, 211, 102, 0.35)',
    padding: 18,
    alignItems: 'center',
    textAlign: 'center',
  },
  bottomContactIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(37, 211, 102, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(37, 211, 102, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  bottomContactTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 6,
    lineHeight: 20,
  },
  bottomContactSubtitle: {
    fontSize: 11.5,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  whatsAppMainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  whatsAppMainBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});
