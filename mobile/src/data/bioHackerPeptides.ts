export interface PeptideItem {
  id: string;
  name: string;
  dose: string;
  subtitle: string;
  category: 'metabolism' | 'muscle_gh' | 'skin_dermis' | 'energy_longevity' | 'tissue_repair' | 'solution';
  categoryLabel: { es: string; en: string };
  tagColor: string;
  badge: string;
  description: { es: string; en: string };
  keyBenefits: { es: string[]; en: string[] };
  mechanism: { es: string; en: string };
  scientificNote: { es: string; en: string };
}

export interface PotentialBenefit {
  id: string;
  title: { es: string; en: string };
  description: { es: string; en: string };
  iconName: string;
  color: string;
}

export const POTENTIAL_BENEFITS: PotentialBenefit[] = [
  {
    id: 'weight_loss',
    title: {
      es: 'Pérdida de peso y control metabólico',
      en: 'Weight Loss & Metabolic Control',
    },
    description: {
      es: 'Optimización de receptores hormonales (GLP-1/GIP/Glucagón) que favorecen el gasto calórico basal y la saciedad celular.',
      en: 'Optimization of hormonal receptors (GLP-1/GIP/Glucagon) enhancing basal caloric expenditure and cellular satiety.',
    },
    iconName: 'Flame',
    color: '#ef4444',
  },
  {
    id: 'muscle_strength',
    title: {
      es: 'Masa muscular y fuerza',
      en: 'Muscle Mass & Strength',
    },
    description: {
      es: 'Estimulación del eje GH/IGF-1 que potencia la síntesis de proteínas contráctiles y la preservación de tejido magro.',
      en: 'Stimulation of the GH/IGF-1 axis boosting contractile protein synthesis and lean tissue preservation.',
    },
    iconName: 'Dumbbell',
    color: '#38bdf8',
  },
  {
    id: 'tissue_repair',
    title: {
      es: 'Regeneración y reparación tisular',
      en: 'Tissue Repair & Regeneration',
    },
    description: {
      es: 'Aceleración de procesos angiogénicos y síntesis de colágeno en tendones, ligamentos, articulaciones y mucosa gástrica.',
      en: 'Acceleration of angiogenic pathways and collagen synthesis in tendons, ligaments, joints, and gastric mucosa.',
    },
    iconName: 'ShieldCheck',
    color: '#10b981',
  },
  {
    id: 'radiant_skin',
    title: {
      es: 'Piel más firme, radiante y saludable',
      en: 'Firmer, Radiant & Healthy Skin',
    },
    description: {
      es: 'Tratamientos cosmocéuticos y bio-péptidos que redensifican la matriz extracelular dérmica y combaten el fotoenvejecimiento.',
      en: 'Cosmeceutical therapies and bio-peptides redensifying dermal extracellular matrix and reversing photoaging.',
    },
    iconName: 'Sparkles',
    color: '#ec4899',
  },
  {
    id: 'energy_vitality',
    title: {
      es: 'Energía y vitalidad mitocondrial',
      en: 'Cellular Energy & Vitality',
    },
    description: {
      es: 'Incremento de la producción intracelular de ATP mediante coenzimas como NAD+ y moduladores mitocondriales.',
      en: 'Increase in intracellular ATP production through vital coenzymes like NAD+ and mitochondrial peptides.',
    },
    iconName: 'Zap',
    color: '#eab308',
  },
  {
    id: 'longevity_wellness',
    title: {
      es: 'Longevidad y bienestar integral',
      en: 'Longevity & Holistic Wellness',
    },
    description: {
      es: 'Activación de sirtuinas, reparación de daño oxidativo en el ADN y equilibrio homeostático para un envejecimiento saludable.',
      en: 'Sirtuin pathway activation, DNA oxidative repair, and homeostatic balance for optimal healthy aging.',
    },
    iconName: 'Activity',
    color: '#8b5cf6',
  },
];

export const BIOHACKER_PEPTIDES: PeptideItem[] = [
  {
    id: 'reta',
    name: 'RETA',
    dose: '30 mg',
    subtitle: 'Retatrutide • Tri-Agonista Metabólico Avanzado',
    category: 'metabolism',
    categoryLabel: { es: 'Metabolismo & Peso', en: 'Metabolism & Weight' },
    tagColor: '#ef4444',
    badge: 'Triple Agonista GLP-1 / GIP / GCG',
    description: {
      es: 'Molécula de última generación que actúa sobre tres receptores clave del apetito y la quema de energía: GLP-1, GIP y receptor de glucagón.',
      en: 'Next-generation molecule acting simultaneously on three master appetite and energy sensors: GLP-1, GIP, and glucagon receptor.',
    },
    keyBenefits: {
      es: [
        'Mayor aceleración metabólica y gasto de energía en reposo',
        'Regulación profunda de la saciedad y control del apetito',
        'Apoyo en la reducción de grasa visceral y esteatosis hepática',
      ],
      en: [
        'Superior metabolic acceleration and resting energy expenditure',
        'Profound satiety regulation and appetite management',
        'Support in visceral fat reduction and hepatic health',
      ],
    },
    mechanism: {
      es: 'Sinergia hormonal triple que amplifica la lipólisis celular y optimiza la sensibilidad a los hidratos de carbono sin pérdida muscular severa.',
      en: 'Triple hormonal synergy amplifying cellular lipolysis and optimizing carbohydrate sensitivity while sparing muscle mass.',
    },
    scientificNote: {
      es: 'Actualmente en fase de investigación clínica destacada por su efectividad en protocolos de remodelación corporal y salud metabólica.',
      en: 'Under high-profile clinical trials showing unprecedented efficacy in body recomposition and metabolic wellness.',
    },
  },
  {
    id: 'tesamorelin',
    name: 'TESAMORELIN',
    dose: '20 mg',
    subtitle: 'GHRH Análogo • Especializado en Grasa Visceral',
    category: 'muscle_gh',
    categoryLabel: { es: 'Masa & Recuperación', en: 'Muscle & Repair' },
    tagColor: '#38bdf8',
    badge: 'Estimulador Selectivo de GH',
    description: {
      es: 'Péptido sintético análogo del factor liberador de la hormona del crecimiento que induce la producción natural de GH en la hipófisis.',
      en: 'Synthetic peptide analog of growth hormone releasing factor that triggers endogenous GH pulses in the anterior pituitary.',
    },
    keyBenefits: {
      es: [
        'Reducción clínicamente documentada del tejido adiposo visceral profundo',
        'Mejora de los perfiles lipídicos y sensibilidad insulínica',
        'Favorece la tonicidad y densidad muscular limpia',
      ],
      en: [
        'Clinically proven reduction of deep visceral abdominal adipose tissue',
        'Improvement of lipid profiles and insulin sensitivity',
        'Supports lean muscle density, tone, and nocturnal recovery',
      ],
    },
    mechanism: {
      es: 'Se une a los receptores GHRH pituitarios estimulando la secreción pulsátil fisiológica de hormona de crecimiento sin desregular otros ejes.',
      en: 'Binds to pituitary GHRH receptors, sparking physiological, pulsatile GH secretion without suppressing other endocrine pathways.',
    },
    scientificNote: {
      es: 'Reconocido por su capacidad única de atacar la grasa visceral metabólicamente dañina que rodea los órganos internos.',
      en: 'Celebrated for its specific ability to target hazardous visceral fat surrounding abdominal organs.',
    },
  },
  {
    id: 'ipamorelin',
    name: 'IPAMORELIN',
    dose: '10 mg',
    subtitle: 'Secretagogo Pentapéptido de GH',
    category: 'muscle_gh',
    categoryLabel: { es: 'Masa & Recuperación', en: 'Muscle & Repair' },
    tagColor: '#0ea5e9',
    badge: 'Alta Pureza & Cero Pico de Cortisol',
    description: {
      es: 'Uno de los péptidos secretagogos de GH más limpios y seguros, que mimetiza la grelina sin aumentar el apetito descontrolado ni elevar prolactina.',
      en: 'One of the cleanest and most selective GH secretagogues, mimicking ghrelin without spikes in hunger, cortisol, or prolactin.',
    },
    keyBenefits: {
      es: [
        'Estimulación pulsátil de GH de alta pureza',
        'Aumento de la síntesis proteica y recuperación nocturna profunda',
        'Optimización de la elasticidad de tendones y articulaciones',
      ],
      en: [
        'High-purity pulsatile GH stimulation',
        'Enhanced protein synthesis and deep stage-4 sleep recovery',
        'Improved tendon and joint elasticity',
      ],
    },
    mechanism: {
      es: 'Agonista selectivo de los receptores secretagogos de hormona del crecimiento (GHS-R1a), respetando los niveles normales de cortisol.',
      en: 'Selective agonist of growth hormone secretagogue receptor (GHS-R1a), maintaining calm, normal cortisol levels.',
    },
    scientificNote: {
      es: 'A menudo utilizado en protocolos combinados con CJC-1295 para crear una sinergia liberadora altamente sinérgica.',
      en: 'Frequently paired synergistically with CJC-1295 to maximize natural growth hormone pulses.',
    },
  },
  {
    id: 'cjc1295',
    name: 'CJC 1295',
    dose: '10 mg',
    subtitle: 'GHRH de Vida Media Prolongada',
    category: 'muscle_gh',
    categoryLabel: { es: 'Masa & Recuperación', en: 'Muscle & Repair' },
    tagColor: '#6366f1',
    badge: 'Sinergia GH / IGF-1',
    description: {
      es: 'Tetrapéptido modificado que actúa como análogo de la GHRH, diseñado para proporcionar una liberación de GH sostenida y fisiológica.',
      en: 'Modified 29-amino acid peptide analog of GHRH engineered to provide sustained, physiologic pulses of GH and IGF-1.',
    },
    keyBenefits: {
      es: [
        'Elevación natural sostenida de los niveles de IGF-1 plasmático',
        'Regeneración tisular acelerada pos-entrenamiento',
        'Mantenimiento de la masa muscular magra y quema de grasa',
      ],
      en: [
        'Sustained natural elevation of plasma IGF-1 levels',
        'Accelerated post-workout tissue and connective repair',
        'Preservation of lean mass and enhanced lipolysis',
      ],
    },
    mechanism: {
      es: 'Estimula la producción y liberación continua de GH por parte de los somatotrofos de la glándula pituitaria.',
      en: 'Promotes regular, amplified pulses of GH from the anterior pituitary somatotrophs.',
    },
    scientificNote: {
      es: 'Excelente aliado para deportistas y personas enfocadas en longevidad que buscan preservar su masa contráctil con el paso de los años.',
      en: 'Prime choice for athletes and longevity enthusiasts seeking to preserve contractile lean mass through the aging process.',
    },
  },
  {
    id: 'klow',
    name: 'KLOW',
    dose: '80 mg',
    subtitle: 'Complejo Celular Dérmico & Síntesis de Colágeno',
    category: 'skin_dermis',
    categoryLabel: { es: 'Piel & Dermis', en: 'Skin & Dermis' },
    tagColor: '#06b6d4',
    badge: 'Regeneración Dérmica & Colágeno',
    description: {
      es: 'Complejo biológico concentrado de péptidos dérmicos formulado para la regeneración intensiva de la matriz extracelular cutánea.',
      en: 'Concentrated dermal bio-peptide complex engineered for intensive skin extracellular matrix regeneration and tone.',
    },
    keyBenefits: {
      es: [
        'Estimula la síntesis de colágeno tipo I y III',
        'Aumenta la densidad y turgencia de la piel en áreas de alta exposición',
        'Atenúa líneas de expresión y combate el fotoenvejecimiento ambiental',
      ],
      en: [
        'Stimulates Type I and Type III collagen synthesis',
        'Increases skin turgor and firmness across treated areas',
        'Diminishes fine expression lines and counters environmental photoaging',
      ],
    },
    mechanism: {
      es: 'Activa los fibroblastos dérmicos mediante secuencias de señalización peptídica, promoviendo la neo-colagenogénesis y elastina.',
      en: 'Directly activates dermal fibroblasts through signaling peptide cascades, stimulating neo-collagenesis and elastogenesis.',
    },
    scientificNote: {
      es: 'Utilizado en biohacking celular para rejuvenecimiento de tejidos y nutrición dérmica profunda.',
      en: 'Utilized in cellular biohacking for tissue rejuvenation and deep dermal nourishment.',
    },
  },
  {
    id: 'glow',
    name: 'GLOW',
    dose: '50 mg',
    subtitle: 'Péptido de Luminosidad & Firmeza Cutánea',
    category: 'skin_dermis',
    categoryLabel: { es: 'Piel & Dermis', en: 'Skin & Dermis' },
    tagColor: '#38bdf8',
    badge: 'Hidratación & Firmeza Celular',
    description: {
      es: 'Fórmula cosmocéutica avanzada orientada a restaurar la hidratación transepidérmica y la suavidad de la piel.',
      en: 'Advanced cosmeceutical formulation focused on restoring barrier hydration and supple skin texture.',
    },
    keyBenefits: {
      es: [
        'Efecto tensor visible y luminosidad dérmica',
        'Refuerzo de la barrera de hidratación natural de la epidermis',
        'Protección celular contra el estrés oxidativo diario y la polución',
      ],
      en: [
        'Visible tightening effect and dermal luminosity',
        'Reinforcement of epidermal natural moisture barrier',
        'Cellular antioxidant defense against pollution and daily stressors',
      ],
    },
    mechanism: {
      es: 'Promueve la hidratación celular endógena y la cohesión celular entre corneocitos y fibroblastos dérmicos.',
      en: 'Promotes endogenous hydration retention and tighter cellular cohesion between corneocytes and fibroblasts.',
    },
    scientificNote: {
      es: 'Ideal para quienes desean optimizar la hidratación celular y salud dérmica junto a su plan de entrenamiento.',
      en: 'Ideal for those seeking to optimize cellular hydration and dermal health alongside their training plan.',
    },
  },
  {
    id: 'motsc',
    name: 'MOTS-C',
    dose: '40 mg',
    subtitle: 'Péptido Derivado de la Mitocondria (MDP)',
    category: 'energy_longevity',
    categoryLabel: { es: 'Energía & Longevidad', en: 'Energy & Longevity' },
    tagColor: '#eab308',
    badge: 'Mimetizador del Ejercicio & AMPK',
    description: {
      es: 'Péptido codificado en el ADN mitocondrial. Se conoce en la ciencia como un "ejercicio-mimético" por su capacidad de activar la AMPK.',
      en: 'Mitochondrial-derived peptide encoded in mtDNA. Dubbed an "exercise-mimetic" in modern research for its powerful AMPK activation.',
    },
    keyBenefits: {
      es: [
        'Aumenta la sensibilidad a la insulina y captación muscular de glucosa',
        'Optimiza la capacidad aeróbica y resistencia a la fatiga',
        'Promueve la flexibilidad metabólica entre carbohidratos y grasas',
      ],
      en: [
        'Enhances whole-body insulin sensitivity and muscular glucose disposal',
        'Boosts aerobic stamina, endurance, and fatigue resistance',
        'Improves metabolic flexibility switching between fat and carbohydrate oxidation',
      ],
    },
    mechanism: {
      es: 'Activa la proteína quinasa activada por AMP (AMPK) en el músculo esquelético, simulando los efectos metabólicos del entrenamiento de fondo.',
      en: 'Directly triggers AMP-activated protein kinase (AMPK) in skeletal muscle, mimicking endurance exercise adaptations.',
    },
    scientificNote: {
      es: 'Estudiado extensamente en biología del envejecimiento como un factor clave para la preservación de la función metabólica juvenil.',
      en: 'Heavily researched in biogerontology as a critical factor in preserving youthful metabolic homeostasis.',
    },
  },
  {
    id: 'nad_plus',
    name: 'NAD+',
    dose: '500 mg',
    subtitle: 'Nicotinamida Adenina Dinucleótido • Coenzima de Vida',
    category: 'energy_longevity',
    categoryLabel: { es: 'Energía & Longevidad', en: 'Energy & Longevity' },
    tagColor: '#8b5cf6',
    badge: 'Reparación de ADN & Vitalidad',
    description: {
      es: 'Coenzima esencial presente en cada célula humana. Participa en más de 500 reacciones bioquímicas, especialmente en la generación de energía ATP.',
      en: 'Crucial coenzyme present in all living cells. Catalyzes over 500 biochemical reactions, centrally powering mitochondrial ATP production.',
    },
    keyBenefits: {
      es: [
        'Combate la fatiga física y el agotamiento mental crónico',
        'Nutre el sistema de sirtuinas (SIRT1-7) vinculadas a la longevidad',
        'Facilita la reparación de hebras de ADN dañadas por el estrés diario',
      ],
      en: [
        'Relieves physical exhaustion and enhances mental clarity and focus',
        'Fuels sirtuin longevity enzymes (SIRT1-7) regulating gene expression',
        'Assists PARP enzymes in repairing DNA single-strand breaks',
      ],
    },
    mechanism: {
      es: 'Aporta los sustratos directos para la cadena respiratoria de transporte de electrones y activa enzimas clave de reparación genómica.',
      en: 'Supplies essential reducing equivalents for oxidative phosphorylation and fuels genomic repair machineries.',
    },
    scientificNote: {
      es: 'Los niveles de NAD+ declinan hasta un 50% entre los 20 y 50 años; su reposición es uno de los pilares del biohacking moderno.',
      en: 'Cellular NAD+ drops by up to 50% between youth and midlife; replenishing it is a cornerstone of advanced biohacking.',
    },
  },
  {
    id: 'bpc157',
    name: 'BPC-157',
    dose: '10 mg',
    subtitle: 'Body Protection Compound • Regeneración Tisular',
    category: 'tissue_repair',
    categoryLabel: { es: 'Regeneración Tisular', en: 'Tissue Repair' },
    tagColor: '#10b981',
    badge: 'Reparación Articular & Tendinosa',
    description: {
      es: 'Péptido de 15 aminoácidos aislado originalmente de secreciones gástricas, célebre por su inigualable capacidad de cicatrización y angiogénesis.',
      en: '15-amino acid peptide derived from gastric juice, celebrated worldwide for exceptional soft-tissue healing and angiogenic properties.',
    },
    keyBenefits: {
      es: [
        'Acelera la recuperación de tendinitis, esguinces y desgarros articulares',
        'Promueve la formación de nuevos microvasos sanguíneos (angiogénesis)',
        'Ejerce un efecto protector sobre la mucosa intestinal y el epitelio gástrico',
      ],
      en: [
        'Dramatically accelerates recovery of tendinopathies, sprains, and ligaments',
        'Upregulates VEGF promoting new micro-capillary formation (angiogenesis)',
        'Protective support for intestinal mucosal integrity and gut balance',
      ],
    },
    mechanism: {
      es: 'Aumenta la expresión de receptores del factor de crecimiento (como VEGF y EGR-1) y organiza el colágeno en la dirección del estrés mecánico.',
      en: 'Upregulates growth factor receptors (VEGF, EGR-1) and aligns collagen fibers systematically along lines of mechanical stress.',
    },
    scientificNote: {
      es: 'El estándar de oro en biohacking deportivo para recuperar rápidamente articulaciones sobrecargadas por levantamiento de pesas.',
      en: 'The gold standard among strength athletes for rehabilitating stressed joints and tendon strain from heavy lifting.',
    },
  },
  {
    id: 'bac_water',
    name: 'BACTERIOSTATIC WATER',
    dose: '30 ml',
    subtitle: 'Agua Bacteriostática Estéril para Reconstitución',
    category: 'solution',
    categoryLabel: { es: 'Solución & Pureza', en: 'Solution & Purity' },
    tagColor: '#64748b',
    badge: 'Pureza & Conservación Segura',
    description: {
      es: 'Agua estéril y apirogénica que contiene alcohol bencílico al 0.9% (v/v) como conservante bacteriostático para mantener la pureza de las fórmulas.',
      en: 'Sterile, non-pyrogenic water containing 0.9% benzyl alcohol as a bacteriostatic preservative to maintain peptide integrity and sterility.',
    },
    keyBenefits: {
      es: [
        'Garantiza la esterilidad y previene proliferación bacteriana en frío',
        'Permite conservación óptima de péptidos reconstituidos en refrigeración',
        'Cumple con los estándares farmacéuticos de pureza estéril',
      ],
      en: [
        'Ensures multi-dose sterility and prevents microbial growth under refrigeration',
        'Maintains biological activity of reconstituted peptide solutions',
        'Conforms to highest pharmaceutical sterility benchmarks',
      ],
    },
    mechanism: {
      es: 'El conservante bacteriostático inhibe el crecimiento y multiplicación de microorganismos manteniendo el pH y la estabilidad molecular.',
      en: 'Bacteriostatic agent inhibits microbial proliferation while preserving optimal pH and molecular stability.',
    },
    scientificNote: {
      es: 'Componente indispensable en cualquier protocolo profesional de biohacking y reconstitución para asegurar máxima bioseguridad.',
      en: 'An indispensable component in any professional biohacking and reconstitution protocol to guarantee absolute safety and purity.',
    },
  },
];
