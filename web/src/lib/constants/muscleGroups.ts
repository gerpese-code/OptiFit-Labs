export type StandardMuscleGroup =
  | 'Pecho'
  | 'Espalda'
  | 'Cuádriceps'
  | 'Glúteos'
  | 'Isquiosurales'
  | 'Hombros'
  | 'Bíceps'
  | 'Tríceps'
  | 'Core'
  | 'Pantorrillas'
  | 'Cuerpo Completo';

export interface MuscleGroupDefinition {
  id: StandardMuscleGroup;
  nameEs: string;
  nameEn: string;
  icon: string;
  color: string;
  badgeBg: string;
  badgeBorder: string;
  descriptionEs: string;
  descriptionEn: string;
}

export const STANDARD_MUSCLE_GROUPS: MuscleGroupDefinition[] = [
  {
    id: 'Pecho',
    nameEs: 'Pecho',
    nameEn: 'Chest',
    icon: 'Dumbbell',
    color: '#38bdf8',
    badgeBg: 'rgba(56, 189, 248, 0.15)',
    badgeBorder: 'rgba(56, 189, 248, 0.35)',
    descriptionEs: 'Pectoral mayor y menor, empujes y aperturas',
    descriptionEn: 'Pectoralis major and minor, presses and flyes',
  },
  {
    id: 'Espalda',
    nameEs: 'Espalda',
    nameEn: 'Back',
    icon: 'Activity',
    color: '#818cf8',
    badgeBg: 'rgba(129, 140, 248, 0.15)',
    badgeBorder: 'rgba(129, 140, 248, 0.35)',
    descriptionEs: 'Dorsales, trapecios, romboides y tracciones',
    descriptionEn: 'Lats, traps, rhomboids and pulls',
  },
  {
    id: 'Cuádriceps',
    nameEs: 'Cuádriceps',
    nameEn: 'Quads',
    icon: 'Flame',
    color: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.15)',
    badgeBorder: 'rgba(16, 185, 129, 0.35)',
    descriptionEs: 'Sentadillas, prensas, extensiones y empuje de pierna',
    descriptionEn: 'Squats, leg presses, extensions and leg drive',
  },
  {
    id: 'Glúteos',
    nameEs: 'Glúteos',
    nameEn: 'Glutes',
    icon: 'Sparkles',
    color: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.15)',
    badgeBorder: 'rgba(236, 72, 153, 0.35)',
    descriptionEs: 'Hip thrust, patadas, puentes y abducciones',
    descriptionEn: 'Hip thrusts, kickbacks, bridges and abductions',
  },
  {
    id: 'Isquiosurales',
    nameEs: 'Isquiosurales',
    nameEn: 'Hamstrings',
    icon: 'RotateCcw',
    color: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.15)',
    badgeBorder: 'rgba(245, 158, 11, 0.35)',
    descriptionEs: 'Peso muerto rumano, curl femoral y cadena posterior',
    descriptionEn: 'Romanian deadlifts, hamstring curls and posterior chain',
  },
  {
    id: 'Hombros',
    nameEs: 'Hombros',
    nameEn: 'Shoulders',
    icon: 'Zap',
    color: '#f97316',
    badgeBg: 'rgba(249, 115, 22, 0.15)',
    badgeBorder: 'rgba(249, 115, 22, 0.35)',
    descriptionEs: 'Deltoides anterior, lateral y posterior',
    descriptionEn: 'Anterior, lateral and posterior deltoids',
  },
  {
    id: 'Bíceps',
    nameEs: 'Bíceps',
    nameEn: 'Biceps',
    icon: 'Dumbbell',
    color: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.15)',
    badgeBorder: 'rgba(6, 182, 212, 0.35)',
    descriptionEs: 'Curles de bíceps, barra Z, mancuernas y poleas',
    descriptionEn: 'Bicep curls, EZ bar, dumbbells and cables',
  },
  {
    id: 'Tríceps',
    nameEs: 'Tríceps',
    nameEn: 'Triceps',
    icon: 'Target',
    color: '#a855f7',
    badgeBg: 'rgba(168, 85, 247, 0.15)',
    badgeBorder: 'rgba(168, 85, 247, 0.35)',
    descriptionEs: 'Extensiones de tríceps, press cerrado y fondos',
    descriptionEn: 'Tricep extensions, close-grip press and dips',
  },
  {
    id: 'Core',
    nameEs: 'Core / Abdomen',
    nameEn: 'Core / Abs',
    icon: 'ShieldCheck',
    color: '#14b8a6',
    badgeBg: 'rgba(20, 184, 166, 0.15)',
    badgeBorder: 'rgba(20, 184, 166, 0.35)',
    descriptionEs: 'Planchas, elevaciones de piernas y estabilidad central',
    descriptionEn: 'Planks, leg raises and trunk stability',
  },
  {
    id: 'Pantorrillas',
    nameEs: 'Pantorrillas',
    nameEn: 'Calves',
    icon: 'Activity',
    color: '#84cc16',
    badgeBg: 'rgba(132, 204, 22, 0.15)',
    badgeBorder: 'rgba(132, 204, 22, 0.35)',
    descriptionEs: 'Elevaciones de talones de pie y sentado',
    descriptionEn: 'Standing and seated calf raises',
  },
  {
    id: 'Cuerpo Completo',
    nameEs: 'Cuerpo Completo',
    nameEn: 'Full Body',
    icon: 'TrendingUp',
    color: '#eab308',
    badgeBg: 'rgba(234, 179, 8, 0.15)',
    badgeBorder: 'rgba(234, 179, 8, 0.35)',
    descriptionEs: 'Entrenamiento funcional, circuitos y acondicionamiento',
    descriptionEn: 'Functional training, circuits and conditioning',
  },
];

export const PAIRED_MUSCLE_GROUP_ORDER: StandardMuscleGroup[] = [
  'Pecho',
  'Tríceps',
  'Glúteos',
  'Cuádriceps',
  'Espalda',
  'Bíceps',
  'Isquiosurales',
  'Pantorrillas',
  'Hombros',
  'Core',
  'Cuerpo Completo',
];

interface MuscleClassificationRule {
  primaryMg: string[];
  nameKeywords: string[];
  excludeMg: string[];
  excludeNameKeywords?: string[];
}

const MUSCLE_RULES: Record<StandardMuscleGroup, MuscleClassificationRule> = {
  Pantorrillas: {
    primaryMg: ['pantorrillas', 'pantorrilla', 'gemelos', 'gemelo', 'calves', 'calf', 'soleo', 'talon', 'talones'],
    nameKeywords: ['pantorrilla', 'gemelo', 'talon', 'talones', 'calf', 'soleo'],
    excludeMg: ['cuadriceps', 'isquios', 'femoral', 'gluteo', 'pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'core'],
  },
  Isquiosurales: {
    primaryMg: ['isquiosurales', 'isquiosural', 'isquios', 'isquiotibiales', 'isquiotibial', 'femoral', 'femorales', 'hamstrings', 'hamstring', 'pierna posterior', 'cadena posterior'],
    nameKeywords: ['femoral', 'isquio', 'peso muerto rumano', 'rdl', 'leg curl', 'curl femoral', 'curl pierna', 'buenos dias', 'good morning'],
    excludeMg: ['pantorrilla', 'gemelo', 'cuadriceps', 'gluteo', 'pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'core'],
    excludeNameKeywords: ['gemelo', 'pantorrilla', 'talon', 'talones'],
  },
  Cuádriceps: {
    primaryMg: ['cuadriceps', 'cuadricep', 'quads', 'quad', 'pierna anterior'],
    nameKeywords: ['sentadilla', 'squat', 'prensa', 'leg press', 'extension de pierna', 'extensiones de cuadriceps', 'extension cuadriceps', 'sentadilla bulgara', 'hack', 'zancada', 'lunge'],
    excludeMg: ['pantorrilla', 'gemelo', 'isquios', 'femoral', 'gluteo', 'pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'core'],
    excludeNameKeywords: ['femoral', 'isquio', 'gemelo', 'pantorrilla', 'hip thrust', 'patada'],
  },
  Glúteos: {
    primaryMg: ['gluteos', 'gluteo', 'glutes', 'glute', 'cadera'],
    nameKeywords: ['hip thrust', 'patada gluteo', 'patada de gluteo', 'abduccion', 'abducciones', 'puente gluteo', 'puente de gluteos', 'kickback'],
    excludeMg: ['cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'gemelo', 'pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'core'],
  },
  Pecho: {
    primaryMg: ['pecho', 'pectoral', 'pectorales', 'chest'],
    nameKeywords: ['press banca', 'press plano', 'press inclinado', 'press declinado', 'apertura', 'aperturas', 'cruce polea', 'cruces polea', 'dips pecho', 'chest press', 'flexion brazos', 'flexiones brazos', 'push-up'],
    excludeMg: ['triceps', 'biceps', 'hombro', 'espalda', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'core'],
    excludeNameKeywords: ['triceps', 'frances', 'skull crusher', 'militar', 'overhead press'],
  },
  Tríceps: {
    primaryMg: ['triceps', 'tricep'],
    nameKeywords: ['triceps', 'tricep', 'press frances', 'extension triceps', 'extension de triceps', 'fondos triceps', 'fondos paralelas', 'fondos entre bancos', 'skull crusher', 'copa', 'pushdown', 'patada triceps', 'press cerrado'],
    excludeMg: ['pecho', 'biceps', 'hombro', 'espalda', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'core'],
    excludeNameKeywords: ['pecho', 'banca', 'biceps'],
  },
  Bíceps: {
    primaryMg: ['biceps', 'bicep'],
    nameKeywords: ['biceps', 'bicep', 'curl martillo', 'hammer curl', 'banco scott', 'predicador', 'curl concentrado', 'chin-up'],
    excludeMg: ['triceps', 'espalda', 'pecho', 'hombro', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'core'],
    excludeNameKeywords: ['triceps'],
  },
  Espalda: {
    primaryMg: ['espalda', 'dorsal', 'dorsales', 'back', 'lats', 'trapecio', 'trapecios', 'romboides'],
    nameKeywords: ['dominada', 'dominadas', 'pull-up', 'jalon', 'jalones', 'lat pulldown', 'remo', 'row', 'pullover', 'face pull', 'shrug', 'encogimiento'],
    excludeMg: ['biceps', 'triceps', 'pecho', 'hombro', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'core'],
    excludeNameKeywords: ['biceps'],
  },
  Hombros: {
    primaryMg: ['hombros', 'hombro', 'deltoides', 'deltoide', 'shoulders', 'shoulder', 'delts'],
    nameKeywords: ['press militar', 'overhead press', 'elevaciones laterales', 'lateral raises', 'elevaciones frontales', 'pajaros', 'arnold press', 'deltoides'],
    excludeMg: ['pecho', 'triceps', 'espalda', 'biceps', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla', 'core'],
    excludeNameKeywords: ['banca'],
  },
  Core: {
    primaryMg: ['core', 'abs', 'abdominales', 'abdomen', 'abdominal', 'oblicuos'],
    nameKeywords: ['plancha', 'plank', 'crunch', 'crunches', 'rueda abdominal', 'ab wheel', 'elevacion piernas', 'elevaciones piernas', 'vacuum', 'twist'],
    excludeMg: ['pecho', 'espalda', 'hombro', 'biceps', 'triceps', 'cuadriceps', 'isquios', 'femoral', 'pantorrilla'],
  },
  'Cuerpo Completo': {
    primaryMg: ['cuerpo completo', 'full body', 'fullbody', 'total body'],
    nameKeywords: ['burpee', 'clean', 'snatch', 'thruster', 'kettlebell swing'],
    excludeMg: [],
  },
};

const normalizeStr = (s?: string | null): string =>
  (s || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

/**
 * Determina si un ejercicio pertenece de forma estricta a un grupo muscular específico
 */
export function isExerciseInMuscleGroup(
  exercise: { name?: string | null; muscle_group?: string | null } | null | undefined,
  targetMg: StandardMuscleGroup
): boolean {
  if (!exercise) return false;
  const rule = MUSCLE_RULES[targetMg];
  if (!rule) return false;

  const exMg = normalizeStr(exercise.muscle_group);
  const exName = normalizeStr(exercise.name);

  // 1. Si el ejercicio tiene grupo muscular explícito
  if (exMg) {
    // Si coincide con el grupo objetivo
    const matchesTarget = rule.primaryMg.some((t) => exMg.includes(t));
    if (matchesTarget) {
      return true;
    }

    // Si coincide con un grupo excluido para este targetMg (ej. tríceps en Pecho)
    const matchesExcluded = rule.excludeMg.some((t) => exMg.includes(t));
    if (matchesExcluded) {
      return false;
    }
  }

  // 2. Si el grupo muscular es genérico (ej. 'Piernas', 'Brazos', 'Torso', 'General' o vacío)
  if (rule.excludeNameKeywords && rule.excludeNameKeywords.some((k) => exName.includes(k))) {
    return false;
  }

  const nameMatches = rule.nameKeywords.some((k) => exName.includes(k));
  if (nameMatches) {
    return true;
  }

  if (targetMg === 'Cuerpo Completo' && (exMg.includes('completo') || exMg.includes('full'))) {
    return true;
  }

  return false;
}

/**
 * Filtra una lista de routine_exercises para que SOLO incluya los que pertenecen a targetMg
 */
export function filterRoutineExercisesByMuscleGroup<T extends { exercise?: any }>(
  routineExercises: T[],
  targetMg: StandardMuscleGroup
): T[] {
  if (!routineExercises || routineExercises.length === 0) return [];
  return routineExercises.filter((rx) => isExerciseInMuscleGroup(rx.exercise, targetMg));
}

/**
 * Identifica el grupo muscular estándar de un ejercicio
 */
export function getMuscleGroupForExercise(
  exercise: { name?: string | null; muscle_group?: string | null } | null | undefined
): StandardMuscleGroup | null {
  if (!exercise) return null;
  for (const mg of STANDARD_MUSCLE_GROUPS) {
    if (isExerciseInMuscleGroup(exercise, mg.id)) {
      return mg.id;
    }
  }
  return null;
}

