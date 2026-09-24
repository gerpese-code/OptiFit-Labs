import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data: dbExercises } = await supabase.from('exercises').select('id, name, muscle_group').order('name');
  
  const [esRes, enRes] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json').then(r => r.json()),
    fetch('https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json').then(r => r.json())
  ]);

  const gymEs = esRes.exercises;
  const gymEn = enRes.exercises;

  function norm(str) {
    if (!str) return '';
    return str.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Exact curated overrides for tricky or special names
  const explicit = {
    'Oblicuos en Banco de Hiperextensiones / Lumbares': 'https://burnfit.io/en/wp-content/uploads/sites/3/2026/01/45_SIDE_BEND.gif',
    'Hiperextensiones en Banco 45° (Back Extensions)': 'spine/hyperextension.gif',
    'Sentadilla Hack Inclinada': 'glutes/sled-hack-squat.gif',
    'Sentadilla Sissy (Sisi Cuádriceps)': 'quads/weighted-sissy-squat.gif',
    'Patada de Glúteos en Polea (Cable)': 'glutes/cable-one-leg-kickback.gif',
    'Estocadas Búlgaras en Smith': 'quads/smith-single-leg-split-squat.gif',
    'Sentadilla Búlgara con Mancuernas': 'quads/dumbbell-single-leg-split-squat.gif',
    'Sentadilla en Smith Profunda': 'glutes/smith-squat.gif',
    'Sentadilla en Máquina Smith / Multipower': 'glutes/smith-squat.gif',
    'Press Plano en Máquina Smith / Multipower': 'pectorals/smith-bench-press.gif',
    'Press Inclinado en Máquina Smith / Multipower': 'pectorals/smith-incline-bench-press.gif',
    'Dorsales Barra Polea Alta Agarre Cerrado': 'lats/cable-v-bar-pulldown.gif',
    'Dorsales en Polea Batman / Pullover Polea': 'lats/cable-straight-arm-pulldown-with-rope.gif',
    'Vuelos Laterales y Frontales Combinados': 'delts/dumbbell-lateral-to-front-raise.gif',
    'Elevación de Piernas en Banco Inclinado (Abs Inferiores)': 'abs/incline-leg-hip-raise.gif',
    'Abdominales en Smith / Barra / Rollout con Disco': 'abs/ab-wheel-roller.gif',
    'Hip Thrust en Máquina Smith': 'glutes/barbell-hip-thrust.gif',
    'Aductores en Máquina (Adductor Machine)': 'adductors/lever-seated-hip-adduction.gif',
    'Abducciones de Cadera en Máquina': 'abductors/lever-seated-hip-abduction.gif',
    'Extensiones de Tríceps con Soga (Cuerda)': 'triceps/cable-rope-triceps-pushdown.gif',
    'Extensiones de Tríceps en Polea con Barra V': 'triceps/cable-v-bar-pushdown.gif',
    'Curl de Bíceps con Barra en Banco (Scott / Predicador)': 'biceps/barbell-preacher-curl.gif',
    'Pájaros / Elevaciones Posteriores con Mancuernas': 'delts/dumbbell-rear-lateral-raise.gif',
    'Pájaros Sentado con Mancuernas (Rear Delt Flyes)': 'delts/dumbbell-seated-rear-lateral-raise.gif',
    'Aperturas Planas con Mancuernas (DB Flyes)': 'pectorals/dumbbell-fly.gif',
    'Aperturas Inclinadas con Mancuernas (Incline Flyes)': 'pectorals/dumbbell-incline-fly.gif',
    'Aperturas Declinadas con Mancuernas': 'pectorals/dumbbell-decline-fly.gif',
    'Cruces en Polea Alta (Cable Crossover)': 'pectorals/cable-middle-fly.gif',
    'Cruces en Polea Media / Cruz de Hierro': 'pectorals/cable-iron-cross.gif',
    'Cruces en Polea (Aperturas)': 'pectorals/cable-standing-fly.gif',
    'Fondos en Paralelas (Dips)': 'triceps/chest-dip.gif',
    'Fondos en Paralelas para Pecho (Chest Dips)': 'pectorals/chest-dip.gif',
    'Aperturas en Máquina Peck Deck (Pec Deck Flyes)': 'pectorals/lever-pec-deck-fly.gif',
    'Cable Pull-Through para Cadena Posterior': 'glutes/cable-pull-through.gif',
    'Elevaciones Laterales con Mancuernas (Lateral Raises)': 'delts/dumbbell-lateral-raise.gif',
    'Elevaciones Laterales con Mancuernas': 'delts/dumbbell-lateral-raise.gif',
    'Elevaciones Frontales con Mancuernas (Front Raises)': 'delts/dumbbell-front-raise.gif',
    'Sentadilla Trasera con Barra (Barbell Back Squat)': 'glutes/barbell-full-squat.gif',
    'Zancadas Caminando con Mancuernas': 'glutes/dumbbell-walking-lunge.gif',
    'Zancadas Estáticas con Mancuernas (Lunges)': 'glutes/dumbbell-lunge.gif',
    'Zancadas hacia Atrás con Mancuernas (Reverse Lunge)': 'glutes/dumbbell-rear-lunge.gif',
    'Saltos al Cajón Pliométricos (Box Jumps)': 'cardio/box-jump.gif',
    'Aductores en Polea Baja (Cable Adduction)': 'adductors/cable-hip-adduction.gif',
    'Leñador en Polea (Cable Woodchoppers)': 'abs/cable-twist.gif',
    'Caminata con Inclinación en Cinta (Incline Walk)': 'cardio/walking-on-treadmill.gif',
    'Trote Continuo en Cinta (Treadmill Jogging)': 'cardio/jogging-treadmill.gif',
    'Patada de Glúteo en Cuadrupedia / Máquina': 'glutes/glute-kickback.gif',
    'Elevaciones de Talones en Máquina Smith': 'calves/smith-machine-calf-raise.gif',
    'Elevación de Pantorrillas': 'calves/standing-calf-raise.gif',
    'Peso Muerto Convencional (Deadlift)': 'spine/barbell-deadlift.gif',
    'Remo en Polea Baja Sentado (Seated Cable Row)': 'upper-back/cable-seated-row.gif',
    'Face Pull con Cuerda en Polea Alta': 'delts/cable-face-pull.gif',
    'Extensiones de Cuádriceps en Máquina': 'quads/lever-leg-extension.gif',
    'Prensa de Piernas a 45°': 'quads/lever-alternate-leg-press.gif',
    'Curl de Femorales en Máquina (Acostado / Sentado)': 'hamstrings/lever-lying-leg-curl.gif'
  };

  const results = [];
  let matchedCount = 0;
  let missing = [];

  for (const dbEx of dbExercises) {
    const rawName = dbEx.name;
    let gifUrl = null;

    // 1. Explicit override
    if (explicit[rawName]) {
      const exp = explicit[rawName];
      gifUrl = exp.startsWith('http') ? exp : `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/${exp}`;
    }

    // 2. English in parentheses match
    if (!gifUrl) {
      const parenMatch = rawName.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const enTerm = norm(parenMatch[1]);
        const foundEn = gymEn.find(g => norm(g.name).includes(enTerm) || norm(g.slug).includes(enTerm.replace(/\s+/g, '-')));
        if (foundEn) {
          gifUrl = foundEn.gifUrl;
        }
      }
    }

    // 3. Spanish exact or fuzzy match
    if (!gifUrl) {
      const dbNorm = norm(rawName);
      const foundEs = gymEs.find(g => {
        const gNorm = norm(g.name);
        return gNorm === dbNorm || dbNorm.includes(gNorm) || gNorm.includes(dbNorm);
      });
      if (foundEs) {
        gifUrl = foundEs.gifUrl;
      }
    }

    // 4. Token overlap fuzzy match
    if (!gifUrl) {
      const dbTokens = norm(rawName).split(' ').filter(t => t.length > 3 && !['con', 'para', 'del', 'los', 'las', 'por', 'sobre'].includes(t));
      let best = null;
      let bestScore = 0;
      for (const g of gymEs) {
        const gTokens = norm(g.name).split(' ').filter(t => t.length > 3);
        let common = 0;
        for (const t of dbTokens) {
          if (gTokens.includes(t)) common++;
        }
        const score = common / Math.max(dbTokens.length, 1);
        if (score > bestScore && score >= 0.4) {
          bestScore = score;
          best = g;
        }
      }
      if (best) {
        gifUrl = best.gifUrl;
      }
    }

    if (gifUrl) {
      matchedCount++;
      results.push({ id: dbEx.id, name: rawName, gifUrl });
    } else {
      missing.push(rawName);
    }
  }

  console.log(`\n=== RESULTADO DE MAPEO ===`);
  console.log(`Total en DB: ${dbExercises.length}`);
  console.log(`Mapeados con éxito: ${matchedCount}`);
  console.log(`Sin mapeo: ${missing.length}`);
  if (missing.length > 0) {
    console.log('Ejercicios no mapeados aún:', missing);
  }
}

run();
