import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  X,
  Sparkles,
  Flame,
  Dumbbell,
  ShieldCheck,
  Zap,
  Activity,
  Heart,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
} from 'lucide-react-native';
import { useLanguage } from '@/context/LanguageContext';
import {
  BIOHACKER_PEPTIDES,
  POTENTIAL_BENEFITS,
  PeptideItem,
} from '@/data/bioHackerPeptides';

interface BioHackerPeptidesModalProps {
  visible: boolean;
  onClose: () => void;
}

type MainTab = 'peptides' | 'benefits' | 'infographic';

export default function BioHackerPeptidesModal({
  visible,
  onClose,
}: BioHackerPeptidesModalProps) {
  const { language } = useLanguage();
  const [activeTab, setActiveTab] = useState<MainTab>('peptides');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPeptideId, setExpandedPeptideId] = useState<string | null>(null);

  const lang = language === 'en' ? 'en' : 'es';

  const categories = [
    { id: 'all', label: lang === 'es' ? 'Todos (10)' : 'All (10)' },
    { id: 'metabolism', label: lang === 'es' ? 'Metabolismo' : 'Metabolism' },
    { id: 'muscle_gh', label: lang === 'es' ? 'Masa / GH' : 'Muscle / GH' },
    { id: 'skin_dermis', label: lang === 'es' ? 'Piel & Dermis' : 'Skin & Dermis' },
    { id: 'energy_longevity', label: lang === 'es' ? 'Energía' : 'Energy' },
    { id: 'tissue_repair', label: lang === 'es' ? 'Reparación' : 'Repair' },
  ];

  const filteredPeptides =
    selectedCategory === 'all'
      ? BIOHACKER_PEPTIDES
      : BIOHACKER_PEPTIDES.filter((p) => p.category === selectedCategory);

  const toggleExpand = (id: string) => {
    setExpandedPeptideId((prev) => (prev === id ? null : id));
  };

  const renderBenefitIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'Flame':
        return <Flame size={20} color={color} />;
      case 'Dumbbell':
        return <Dumbbell size={20} color={color} />;
      case 'ShieldCheck':
        return <ShieldCheck size={20} color={color} />;
      case 'Sparkles':
        return <Sparkles size={20} color={color} />;
      case 'Zap':
        return <Zap size={20} color={color} />;
      case 'Activity':
      default:
        return <Activity size={20} color={color} />;
    }
  };

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
          <View style={{ flex: 1 }}>
            <View style={styles.headerBadge}>
              <Sparkles size={11} color="#10b981" style={{ marginRight: 4 }} />
              <Text style={styles.headerBadgeText}>
                {lang === 'es' ? 'BIOHACKING & SALUD CELULAR' : 'BIOHACKING & CELLULAR HEALTH'}
              </Text>
            </View>
            <Text style={styles.headerTitle}>BioHacker Peptides</Text>
            <Text style={styles.headerSubtitle}>
              {lang === 'es'
                ? 'Ciencia de vanguardia en longevidad, hipertrofia y regeneración'
                : 'Cutting-edge science in longevity, hypertrophy & repair'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.closeBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Pestañas Principales de Navegación (Péptidos, Beneficios, Infografía) */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'peptides' && styles.tabBtnActive]}
            onPress={() => setActiveTab('peptides')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'peptides' && styles.tabBtnTextActive,
              ]}
            >
              🧬 {lang === 'es' ? 'Péptidos' : 'Peptides'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'benefits' && styles.tabBtnActive]}
            onPress={() => setActiveTab('benefits')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'benefits' && styles.tabBtnTextActive,
              ]}
            >
              ✨ {lang === 'es' ? 'Beneficios' : 'Benefits'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'infographic' && styles.tabBtnActive]}
            onPress={() => setActiveTab('infographic')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'infographic' && styles.tabBtnTextActive,
              ]}
            >
              🖼️ {lang === 'es' ? 'Infografía' : 'Infographic'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Contenido según Pestaña */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* 1. SECCIÓN PÉPTIDOS */}
          {activeTab === 'peptides' && (
            <View>
              {/* Filtro horizontal por categoría */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryScroll}
              >
                {categories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      selectedCategory === cat.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        selectedCategory === cat.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Lista de Fichas de Péptidos */}
              <View style={styles.peptidesList}>
                {filteredPeptides.map((peptide) => {
                  const isExpanded = expandedPeptideId === peptide.id;
                  return (
                    <View key={peptide.id} style={styles.peptideCard}>
                      <TouchableOpacity
                        style={styles.peptideHeader}
                        onPress={() => toggleExpand(peptide.id)}
                        activeOpacity={0.8}
                      >
                        <View style={{ flex: 1, paddingRight: 10 }}>
                          <View style={styles.peptideTitleRow}>
                            <Text style={styles.peptideName}>{peptide.name}</Text>
                            <View
                              style={[
                                styles.doseBadge,
                                { backgroundColor: `${peptide.tagColor}22` },
                              ]}
                            >
                              <Text
                                style={[
                                  styles.doseBadgeText,
                                  { color: peptide.tagColor },
                                ]}
                              >
                                {peptide.dose}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.peptideSubtitle}>
                            {peptide.subtitle}
                          </Text>

                          <View style={styles.badgePill}>
                            <Text style={styles.badgePillText}>
                              {peptide.badge}
                            </Text>
                          </View>
                        </View>

                        <View style={styles.expandIconBox}>
                          {isExpanded ? (
                            <ChevronUp size={18} color="#94a3b8" />
                          ) : (
                            <ChevronDown size={18} color="#94a3b8" />
                          )}
                        </View>
                      </TouchableOpacity>

                      {/* Cuerpo desplegable con información científica completa */}
                      {isExpanded && (
                        <View style={styles.peptideDetails}>
                          <Text style={styles.sectionLabel}>
                            {lang === 'es' ? 'RESUMEN CIENTÍFICO' : 'SCIENTIFIC SUMMARY'}
                          </Text>
                          <Text style={styles.descriptionText}>
                            {peptide.description[lang]}
                          </Text>

                          <Text style={styles.sectionLabel}>
                            {lang === 'es' ? 'BENEFICIOS POTENCIALES' : 'POTENTIAL BENEFITS'}
                          </Text>
                          {peptide.keyBenefits[lang].map((benefit, bIdx) => (
                            <View key={bIdx} style={styles.bulletRow}>
                              <View style={styles.bulletCheck}>
                                <Check size={11} color="#10b981" />
                              </View>
                              <Text style={styles.bulletText}>{benefit}</Text>
                            </View>
                          ))}

                          <View style={styles.mechanismBox}>
                            <Text style={styles.mechanismTitle}>
                              🔬 {lang === 'es' ? 'Mecanismo Biológico' : 'Biological Mechanism'}
                            </Text>
                            <Text style={styles.mechanismText}>
                              {peptide.mechanism[lang]}
                            </Text>
                          </View>

                          <View style={styles.clinicalNoteBox}>
                            <Info size={13} color="#38bdf8" style={{ marginRight: 6, marginTop: 1 }} />
                            <Text style={styles.clinicalNoteText}>
                              {peptide.scientificNote[lang]}
                            </Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* 2. SECCIÓN BENEFICIOS */}
          {activeTab === 'benefits' && (
            <View style={styles.benefitsSection}>
              <Text style={styles.benefitsIntroTitle}>
                {lang === 'es'
                  ? '6 Vías de Transformación Celular'
                  : '6 Cellular Transformation Pathways'}
              </Text>
              <Text style={styles.benefitsIntroSubtitle}>
                {lang === 'es'
                  ? 'Los péptidos bioactivos modulan rutas de señalización específicas que optimizan la vitalidad y la regeneración del organismo.'
                  : 'Bioactive peptides modulate specific signaling cascades optimizing vitality and natural organismic repair.'}
              </Text>

              <View style={styles.benefitsGrid}>
                {POTENTIAL_BENEFITS.map((b) => (
                  <View key={b.id} style={styles.benefitCard}>
                    <View
                      style={[
                        styles.benefitIconCircle,
                        { backgroundColor: `${b.color}20` },
                      ]}
                    >
                      {renderBenefitIcon(b.iconName, b.color)}
                    </View>
                    <Text style={styles.benefitTitle}>{b.title[lang]}</Text>
                    <Text style={styles.benefitDesc}>{b.description[lang]}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* 3. SECCIÓN INFOGRAFÍA COMPLETA */}
          {activeTab === 'infographic' && (
            <View style={styles.infographicSection}>
              <View style={styles.infographicHeader}>
                <Text style={styles.infographicTitle}>
                  {lang === 'es' ? 'Infografía Oficial de Productos' : 'Official Product Infographic'}
                </Text>
                <Text style={styles.infographicSubtitle}>
                  {lang === 'es'
                    ? 'Visualiza la presentación y especificaciones científicas oficiales de la línea BioHacker Peptides.'
                    : 'View the official scientific presentation and specifications of the BioHacker Peptides line.'}
                </Text>
              </View>

              <View style={styles.imageWrapper}>
                <Image
                  source={require('../../../assets/biohacker_peptides.jpg')}
                  style={styles.infographicImage}
                  resizeMode="contain"
                />
              </View>
            </View>
          )}

          {/* Descargo de Responsabilidad Profesional y Educativo */}
          <View style={styles.disclaimerBox}>
            <Text style={styles.disclaimerText}>
              {lang === 'es'
                ? 'Aviso Profesional: El contenido de este apartado es estrictamente divulgativo y educativo sobre biohacking y ciencia de péptidos. No comercializa medicamentos ni productos desde la app, ni sustituye el asesoramiento, diagnóstico o prescripción médica personalizada.'
                : 'Professional Notice: The content in this section is strictly educational and informative regarding biohacking and peptide science. No pharmaceutical items are sold through this application, nor does it replace personalized medical guidance.'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const screenWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030712',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1f2937',
  },
  headerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#f472b6',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#0b0f19',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 6,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  tabBtnActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: '#10b981',
  },
  tabBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  tabBtnTextActive: {
    color: '#34d399',
    fontWeight: '900',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  categoryChipActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  categoryChipTextActive: {
    color: '#ffffff',
    fontWeight: '900',
  },
  peptidesList: {
    gap: 12,
  },
  peptideCard: {
    backgroundColor: '#0b0f19',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
  },
  peptideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
  },
  peptideTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  peptideName: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  doseBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  doseBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    fontFamily: 'monospace',
  },
  peptideSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    marginBottom: 6,
  },
  badgePill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  badgePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#38bdf8',
  },
  expandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
  },
  peptideDetails: {
    padding: 14,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#64748b',
    letterSpacing: 0.5,
    marginTop: 12,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 12,
    color: '#cbd5e1',
    lineHeight: 18,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
    color: '#e2e8f0',
    lineHeight: 16,
  },
  mechanismBox: {
    backgroundColor: '#030712',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f2937',
    marginTop: 10,
  },
  mechanismTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#38bdf8',
    marginBottom: 4,
  },
  mechanismText: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  clinicalNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(56, 189, 248, 0.08)',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.2)',
    marginTop: 8,
  },
  clinicalNoteText: {
    flex: 1,
    fontSize: 10,
    color: '#7dd3fc',
    lineHeight: 15,
  },
  benefitsSection: {
    gap: 12,
  },
  benefitsIntroTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  benefitsIntroSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 17,
    marginBottom: 8,
  },
  benefitsGrid: {
    gap: 10,
  },
  benefitCard: {
    backgroundColor: '#0b0f19',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  benefitIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  benefitTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  benefitDesc: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  infographicSection: {
    alignItems: 'center',
  },
  infographicHeader: {
    marginBottom: 14,
    width: '100%',
  },
  infographicTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
    marginBottom: 4,
  },
  infographicSubtitle: {
    fontSize: 11,
    color: '#94a3b8',
    lineHeight: 16,
  },
  imageWrapper: {
    width: '100%',
    backgroundColor: '#000000',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  infographicImage: {
    width: screenWidth - 40,
    height: (screenWidth - 40) * 1.33,
  },
  disclaimerBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  disclaimerText: {
    fontSize: 10,
    color: '#64748b',
    lineHeight: 15,
    textAlign: 'center',
  },
});
