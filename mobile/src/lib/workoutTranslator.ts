// Fitness & Workout Bilingual Translation Engine (ES <-> EN)

export interface ExerciseTranslation {
  name_es: string;
  name_en: string;
  muscle_es: string;
  muscle_en: string;
  notes_es?: string;
  notes_en?: string;
  desc_es?: string;
  desc_en?: string;
}

// 1. Diccionario de Ejercicios habituales
const EXERCISE_DICTIONARY: Record<string, { es: string; en: string }> = {
  // Pectoral / Pecho
  'press de banca plano con barra': { es: 'Press de Banca Plano con Barra', en: 'Barbell Flat Bench Press' },
  'press de banca plano': { es: 'Press de Banca Plano', en: 'Flat Bench Press' },
  'press de banca inclinado con barra': { es: 'Press de Banca Inclinado con Barra', en: 'Barbell Incline Bench Press' },
  'press inclinado con mancuernas': { es: 'Press Inclinado con Mancuernas', en: 'Incline Dumbbell Press' },
  'press plano con mancuernas': { es: 'Press Plano con Mancuernas', en: 'Flat Dumbbell Press' },
  'aperturas con mancuernas': { es: 'Aperturas con Mancuernas', en: 'Dumbbell Chest Flyes' },
  'cruces en polea': { es: 'Cruces en Polea', en: 'Cable Crossover Flyes' },
  'fondos en paralelas': { es: 'Fondos en Paralelas (Dips)', en: 'Parallel Bar Dips' },
  'flexiones de brazos': { es: 'Flexiones de Brazos (Push-ups)', en: 'Push-ups' },

  // Espalda / Dorsal
  'dominadas pronas': { es: 'Dominadas Pronas (Pull-ups)', en: 'Pull-ups (Overhand Grip)' },
  'dominadas pronas (pull-ups)': { es: 'Dominadas Pronas (Pull-ups)', en: 'Pull-ups (Overhand Grip)' },
  'dominadas supinas': { es: 'Dominadas Supinas (Chin-ups)', en: 'Chin-ups (Underhand Grip)' },
  'dominadas neutras': { es: 'Dominadas Neutras', en: 'Neutral Grip Pull-ups' },
  'jalon al pecho en polea': { es: 'Jalón al Pecho en Polea', en: 'Lat Pulldown' },
  'remo con barra': { es: 'Remo con Barra', en: 'Barbell Bent-over Row' },
  'remo con mancuerna': { es: 'Remo con Mancuerna a una Mano', en: 'One-arm Dumbbell Row' },
  'remo en polea baja': { es: 'Remo en Polea Baja (Gironda)', en: 'Seated Cable Row' },
  'remo en punta con barra t': { es: 'Remo en Barra T', en: 'T-Bar Row' },
  'pullover con mancuerna o polea': { es: 'Pullover en Polea / Mancuerna', en: 'Cable / Dumbbell Pullover' },
  'face pull': { es: 'Face Pull en Polea Alta', en: 'Cable Face Pull' },

  // Piernas / Tren Inferior
  'sentadilla trasera con barra': { es: 'Sentadilla Trasera con Barra', en: 'Barbell Back Squat' },
  'sentadilla frontal': { es: 'Sentadilla Frontal', en: 'Front Squat' },
  'sentadilla goblet': { es: 'Sentadilla Goblet', en: 'Goblet Squat' },
  'prensa de piernas 45°': { es: 'Prensa de Piernas 45°', en: '45° Leg Press' },
  'prensa de piernas': { es: 'Prensa de Piernas', en: 'Leg Press' },
  'extensiones de cuadriceps': { es: 'Extensiones de Cuádriceps', en: 'Leg Extensions' },
  'peso muerto convencional': { es: 'Peso Muerto Convencional', en: 'Conventional Deadlift' },
  'peso muerto rumano': { es: 'Peso Muerto Rumano (RDL)', en: 'Romanian Deadlift (RDL)' },
  'peso muerto sumo': { es: 'Peso Muerto Sumo', en: 'Sumo Deadlift' },
  'curl femoral tumbado': { es: 'Curl Femoral Tumbado', en: 'Lying Leg Curl' },
  'curl femoral sentado': { es: 'Curl Femoral Sentado', en: 'Seated Leg Curl' },
  'hip thrust con barra': { es: 'Hip Thrust con Barra', en: 'Barbell Hip Thrust' },
  'zancadas con mancuerna': { es: 'Zancadas con Mancuerna', en: 'Dumbbell Walking Lunges' },
  'zancadas estaticas': { es: 'Zancadas Estáticas / Búlgaras', en: 'Bulgarian Split Squats' },
  'sentadilla bulgara': { es: 'Sentadilla Búlgara', en: 'Bulgarian Split Squat' },
  'elevacion de gemelos de pie': { es: 'Elevación de Gemelos de Pie', en: 'Standing Calf Raise' },
  'elevacion de gemelos sentado': { es: 'Elevación de Gemelos Sentado', en: 'Seated Calf Raise' },

  // Hombros
  'press militar con barra': { es: 'Press Militar con Barra', en: 'Barbell Overhead Press (OHP)' },
  'press militar con mancuernas': { es: 'Press Militar con Mancuernas', en: 'Dumbbell Overhead Press' },
  'press militar sentado': { es: 'Press de Hombros Sentado', en: 'Seated Shoulder Press' },
  'elevaciones laterales': { es: 'Elevaciones Laterales con Mancuerna', en: 'Dumbbell Lateral Raises' },
  'elevaciones laterales en polea': { es: 'Elevaciones Laterales en Polea', en: 'Cable Lateral Raises' },
  'elevaciones frontales': { es: 'Elevaciones Frontales', en: 'Front Raises' },
  'pajaros posteriores': { es: 'Pájaros / Deltoides Posterior', en: 'Rear Delt Flyes' },

  // Brazos
  'curl de biceps con barra': { es: 'Curl de Bíceps con Barra', en: 'Barbell Biceps Curl' },
  'curl de biceps con mancuernas': { es: 'Curl de Bíceps con Mancuernas', en: 'Dumbbell Biceps Curl' },
  'curl martillo': { es: 'Curl Martillo', en: 'Hammer Curl' },
  'curl concentrado': { es: 'Curl Concentrado', en: 'Concentration Curl' },
  'curl predicador en banco scott': { es: 'Curl Predicador en Banco Scott', en: 'Preacher Curl' },
  'press frances con barra z': { es: 'Press Francés con Barra Z', en: 'Skull Crushers (EZ Bar)' },
  'extension de triceps en polea': { es: 'Extensión de Tríceps en Polea', en: 'Triceps Cable Pushdown' },
  'fondos entre bancos': { es: 'Fondos de Tríceps', en: 'Triceps Dips' },
  'patada de triceps': { es: 'Patada de Tríceps con Mancuerna', en: 'Dumbbell Triceps Kickback' },

  // Core / Abdominales
  'plancha abdominal': { es: 'Plancha Abdominal', en: 'Abdominal Plank' },
  'rueda abdominal': { es: 'Rueda Abdominal (Ab Wheel)', en: 'Ab Wheel Rollout' },
  'elevacion de piernas colgado': { es: 'Elevación de Piernas Colgado', en: 'Hanging Leg Raises' },
  'crunches abdominales': { es: 'Crunches / Encogimientos', en: 'Abdominal Crunches' },
  'vacuum abdominal': { es: 'Vacío Abdominal (Vacuum)', en: 'Stomach Vacuum' },
};

// 2. Diccionario de Grupos Musculares
const MUSCLE_DICTIONARY: Record<string, { es: string; en: string }> = {
  pecho: { es: 'Pecho', en: 'Chest' },
  pectoral: { es: 'Pectoral', en: 'Chest' },
  espalda: { es: 'Espalda', en: 'Back' },
  dorsal: { es: 'Dorsal', en: 'Back / Lats' },
  cuadriceps: { es: 'Cuádriceps', en: 'Quadriceps' },
  piernas: { es: 'Piernas', en: 'Legs' },
  pierna: { es: 'Pierna', en: 'Legs' },
  isquiotibiales: { es: 'Isquiotibiales', en: 'Hamstrings' },
  femorales: { es: 'Femorales', en: 'Hamstrings' },
  gluteos: { es: 'Glúteos', en: 'Glutes' },
  gluteo: { es: 'Glúteo', en: 'Glutes' },
  hombros: { es: 'Hombros', en: 'Shoulders' },
  deltoides: { es: 'Deltoides', en: 'Shoulders' },
  biceps: { es: 'Bíceps', en: 'Biceps' },
  triceps: { es: 'Tríceps', en: 'Triceps' },
  brazos: { es: 'Brazos', en: 'Arms' },
  core: { es: 'Core', en: 'Core' },
  abdomen: { es: 'Abdomen', en: 'Abs' },
  gemelos: { es: 'Gemelos', en: 'Calves' },
  pantorrillas: { es: 'Pantorrillas', en: 'Calves' },
  cardio: { es: 'Cardio', en: 'Cardio' },
  general: { es: 'General', en: 'General' },
};

// 3. Diccionario de Títulos de Rutinas
const ROUTINE_DICTIONARY: Record<string, { es: string; en: string }> = {
  'rutina pro: fuerza e hipertrofia': { es: 'Rutina Pro: Fuerza e Hipertrofia', en: 'Pro Routine: Strength & Hypertrophy' },
  'rutina pro: acondicionamiento': { es: 'Rutina Pro: Acondicionamiento', en: 'Pro Routine: Conditioning' },
  'rutina pro: definicion muscular': { es: 'Rutina Pro: Definición Muscular', en: 'Pro Routine: Muscle Definition' },
  'rutina pro: perdida de grasa': { es: 'Rutina Pro: Pérdida de Grasa', en: 'Pro Routine: Fat Loss & Tone' },
  'rutina starter pro': { es: 'Rutina Pro de Inicio', en: 'Pro Starter Routine' },
  'empuje, traccion, pierna (ppl)': { es: 'Empuje, Tracción, Pierna (PPL)', en: 'Push, Pull, Legs (PPL)' },
  'torso / pierna': { es: 'Torso / Pierna', en: 'Upper / Lower Body' },
  'cuerpo completo (full body)': { es: 'Cuerpo Completo (Full Body)', en: 'Full Body Routine' },
};

// 4. Diccionario de Días de Rutina
const DAY_DICTIONARY: Record<string, { es: string; en: string }> = {
  'dia 1: torso, fuerza & control': { es: 'Día 1: Torso, Fuerza & Control', en: 'Day 1: Upper Body, Strength & Control' },
  'dia 2: pierna, potencia & estabilidad': { es: 'Día 2: Pierna, Potencia & Estabilidad', en: 'Day 2: Legs, Power & Stability' },
  'dia 3: empuje & hombros': { es: 'Día 3: Empuje & Hombros', en: 'Day 3: Push & Shoulders' },
  'dia 4: traccion & espalda': { es: 'Día 4: Tracción & Espalda', en: 'Day 4: Pull & Back' },
  'dia 5: piernas & gluteos': { es: 'Día 5: Piernas & Glúteos', en: 'Day 5: Legs & Glutes' },
  'dia 6: brazos & core': { es: 'Día 6: Brazos & Core', en: 'Day 6: Arms & Core' },
};

// 5. Diccionario de Notas del Coach Habituales
const NOTES_DICTIONARY: Record<string, { es: string; en: string }> = {
  'retraccion escapular activa y 1s de pausa en el pecho': {
    es: 'Retracción escapular activa y 1s de pausa en el pecho',
    en: 'Active scapular retraction and 1s pause on chest',
  },
  'tirar con los codos y pecho hacia la barra con rango completo': {
    es: 'Tirar con los codos y pecho hacia la barra con rango completo',
    en: 'Pull through elbows, chest to bar with full range of motion',
  },
  'romper el paralelo controlando 3s en la bajada excentrica': {
    es: 'Romper el paralelo controlando 3s en la bajada excéntrica',
    en: 'Break parallel with a 3s controlled eccentric descent',
  },
  'empujar vertical sin arquear la espalda baja, bloquear arriba': {
    es: 'Empujar vertical sin arquear la espalda baja, bloquear arriba',
    en: 'Press overhead without arching lower back, lockout at top',
  },
};

function normalizeKey(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Traduce el nombre de un ejercicio dinámicamente al idioma seleccionado
 */
export function translateExerciseName(name: string, lang: 'es' | 'en' = 'es'): string {
  if (!name) return '';
  if (lang === 'es') return name;

  const key = normalizeKey(name);
  if (EXERCISE_DICTIONARY[key]) {
    return EXERCISE_DICTIONARY[key].en;
  }

  // Comprobar si coincide parcialmente con alguna clave
  for (const [dictKey, val] of Object.entries(EXERCISE_DICTIONARY)) {
    if (key.includes(dictKey) || dictKey.includes(key)) {
      return val.en;
    }
  }

  // Traducción general de palabras clave
  let translated = name
    .replace(/press de banca plano/gi, 'Flat Bench Press')
    .replace(/press de banca inclinado/gi, 'Incline Bench Press')
    .replace(/press militar/gi, 'Overhead Press')
    .replace(/sentadilla trasera/gi, 'Back Squat')
    .replace(/sentadilla frontal/gi, 'Front Squat')
    .replace(/peso muerto/gi, 'Deadlift')
    .replace(/dominadas/gi, 'Pull-ups')
    .replace(/remo con barra/gi, 'Barbell Row')
    .replace(/remo con mancuerna/gi, 'Dumbbell Row')
    .replace(/aperturas/gi, 'Flyes')
    .replace(/elevaciones laterales/gi, 'Lateral Raises')
    .replace(/curl de biceps/gi, 'Biceps Curl')
    .replace(/extensiones de triceps/gi, 'Triceps Extensions')
    .replace(/extensiones de cuadriceps/gi, 'Leg Extensions')
    .replace(/curl femoral/gi, 'Leg Curl')
    .replace(/prensa de piernas/gi, 'Leg Press')
    .replace(/con barra/gi, 'with Barbell')
    .replace(/con mancuernas?/gi, 'with Dumbbells')
    .replace(/en polea/gi, 'on Cable')
    .replace(/en maquina/gi, 'on Machine');

  return translated;
}

/**
 * Traduce el grupo muscular (Pecho -> Chest, Espalda -> Back...)
 */
export function translateMuscleGroup(muscle: string, lang: 'es' | 'en' = 'es'): string {
  if (!muscle) return '';
  const isUpper = muscle === muscle.toUpperCase();
  const key = normalizeKey(muscle);

  let result = muscle;
  if (MUSCLE_DICTIONARY[key]) {
    result = lang === 'en' ? MUSCLE_DICTIONARY[key].en : MUSCLE_DICTIONARY[key].es;
  } else if (lang === 'en') {
    if (key.includes('pecho')) result = 'Chest';
    else if (key.includes('espalda')) result = 'Back';
    else if (key.includes('pierna') || key.includes('cuad')) result = 'Legs';
    else if (key.includes('hombro') || key.includes('deltoide')) result = 'Shoulders';
    else if (key.includes('bicep') || key.includes('tricep') || key.includes('brazo')) result = 'Arms';
    else if (key.includes('core') || key.includes('abdo')) result = 'Core / Abs';
    else if (key.includes('glute')) result = 'Glutes';
  }

  return isUpper ? result.toUpperCase() : result;
}

/**
 * Traduce el título de la rutina (Rutina Pro -> Pro Routine)
 */
export function translateRoutineTitle(title: string, lang: 'es' | 'en' = 'es'): string {
  if (!title) return '';
  if (lang === 'es') return title;

  const key = normalizeKey(title);
  if (ROUTINE_DICTIONARY[key]) {
    return ROUTINE_DICTIONARY[key].en;
  }

  return title
    .replace(/rutina pro:?/gi, 'Pro Routine:')
    .replace(/rutina de inicio:?/gi, 'Starter Routine:')
    .replace(/fuerza e hipertrofia/gi, 'Strength & Hypertrophy')
    .replace(/acondicionamiento/gi, 'Conditioning')
    .replace(/definicion muscular/gi, 'Muscle Definition')
    .replace(/torso \/ pierna/gi, 'Upper / Lower')
    .replace(/cuerpo completo/gi, 'Full Body');
}

/**
 * Traduce el nombre del día (Día 1: Torso, Fuerza... -> Day 1: Upper Body...)
 */
export function translateDayName(name: string, lang: 'es' | 'en' = 'es'): string {
  if (!name) return '';
  let cleanName = name;
  if (typeof name === 'string' && name.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(name);
      cleanName = parsed.dayName || parsed.title || name;
    } catch (_) {}
  }
  if (lang === 'es') return cleanName;

  const key = normalizeKey(cleanName);
  if (DAY_DICTIONARY[key]) {
    return DAY_DICTIONARY[key].en;
  }

  // Traducción regex sistemática: "Día X" -> "Day X"
  let translated = cleanName.replace(/d[ií]a\s*(\d+)/gi, 'Day $1');

  // Traducir subtítulo del día
  translated = translated
    .replace(/torso/gi, 'Upper Body')
    .replace(/piernas?/gi, 'Legs')
    .replace(/empuje/gi, 'Push')
    .replace(/tracci[oó]n/gi, 'Pull')
    .replace(/brazos?/gi, 'Arms')
    .replace(/hombros?/gi, 'Shoulders')
    .replace(/fuerza\s*&?\s*control/gi, 'Strength & Control')
    .replace(/fuerza/gi, 'Strength')
    .replace(/hipertrofia/gi, 'Hypertrophy')
    .replace(/potencia/gi, 'Power')
    .replace(/estabilidad/gi, 'Stability');

  return translated;
}

/**
 * Traduce notas técnicas del Coach
 */
export function translateWorkoutNotes(notes: string, lang: 'es' | 'en' = 'es'): string {
  if (!notes) return '';
  if (lang === 'es') return notes;

  const key = normalizeKey(notes);
  if (NOTES_DICTIONARY[key]) {
    return NOTES_DICTIONARY[key].en;
  }

  // Reemplazos de frases de entrenamiento comunes
  return notes
    .replace(/retracci[oó]n escapular activa/gi, 'Active scapular retraction')
    .replace(/pausa en el pecho/gi, 'pause on chest')
    .replace(/tirar con los codos/gi, 'pull with elbows')
    .replace(/pecho hacia la barra/gi, 'chest to bar')
    .replace(/rango completo/gi, 'full range of motion')
    .replace(/romper el paralelo/gi, 'break parallel')
    .replace(/bajada exc[eé]ntrica/gi, 'eccentric descent')
    .replace(/empujar vertical/gi, 'press vertically')
    .replace(/sin arquear la espalda/gi, 'without arching back')
    .replace(/bloquear arriba/gi, 'lockout at top')
    .replace(/espalda recta/gi, 'straight back')
    .replace(/empujar con los talones/gi, 'drive with heels');
}

/**
 * Traduce la descripción del ejercicio
 */
export function translateExerciseDescription(desc: string, lang: 'es' | 'en' = 'es'): string {
  if (!desc) return '';
  if (lang === 'es') return desc;

  return desc
    .replace(/b[aá]sico multiarticular para desarrollo de fuerza y masa en pectoral mayor\.?/gi, 'Compound core lift for developing chest strength and pectoral hypertrophy.')
    .replace(/constructor de amplitud dorsal\. Iniciar desde depresi[oó]n escapular\.?/gi, 'Premier back width builder. Initiate with active scapular depression.')
    .replace(/patr[oó]n rey de empuje inferior\. Bajar controlando y empujar el suelo con firmeza\.?/gi, 'King of lower body push movements. Descend under control and drive firmly into floor.');
}
