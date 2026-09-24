import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function verifyAllUrls() {
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

  const explicit = {
    'Crunches Bicicleta (Air Bike / Bicycle Crunch)': 'abs/air-bike.gif',
    'Zancadas con Barra (Barbell Lunges)': 'glutes/barbell-lunge.gif',
    'Oblicuos en Banco de Hiperextensiones / Lumbares': 'https://burnfit.io/en/wp-content/uploads/sites/3/2026/01/45_SIDE_BEND.gif',
    'Hiperextensiones en Banco 45° (Back Extensions)': 'spine/hyperextension.gif',
    'Sentadilla Hack Inclinada': 'glutes/sled-hack-squat.gif',
    'Sentadilla Sissy (Sisi Cuádriceps)': 'quads/weighted-sissy-squat.gif',
    'Patada de Glúteos en Polea (Cable)': 'glutes/cable-standing-hip-extension.gif',
    'Estocadas Búlgaras en Smith': 'quads/smith-single-leg-split-squat.gif',
    'Sentadilla Búlgara con Mancuernas': 'quads/dumbbell-single-leg-split-squat.gif',
    'Sentadilla en Smith Profunda': 'glutes/smith-squat.gif',
    'Sentadilla en Máquina Smith / Multipower': 'glutes/smith-squat.gif',
    'Press Plano en Máquina Smith / Multipower': 'pectorals/smith-bench-press.gif',
    'Press Inclinado en Máquina Smith / Multipower': 'pectorals/smith-incline-bench-press.gif',
    'Dorsales Barra Polea Alta Agarre Cerrado': 'lats/cable-lateral-pulldown-with-v-bar.gif',
    'Dorsales en Polea Batman / Pullover Polea': 'lats/cable-straight-arm-pulldown-with-rope.gif',
    'Vuelos Laterales y Frontales Combinados': 'delts/dumbbell-lateral-to-front-raise.gif',
    'Elevación de Piernas en Banco Inclinado (Abs Inferiores)': 'abs/incline-leg-hip-raise-leg-straight.gif',
    'Abdominales en Smith / Barra / Rollout con Disco': 'abs/barbell-standing-ab-rollerout.gif',
    'Hip Thrust en Máquina Smith': 'https://burnfit.io/wp-content/uploads/HIP_THRUST.gif',
    'Aductores en Máquina (Adductor Machine)': 'adductors/lever-seated-hip-adduction.gif',
    'Abducciones de Cadera en Máquina': 'abductors/lever-seated-hip-abduction.gif',
    'Extensiones de Tríceps con Soga (Cuerda)': 'triceps/cable-pushdown-with-rope-attachment.gif',
    'Extensiones de Tríceps en Polea con Barra V': 'triceps/cable-pushdown.gif',
    'Curl de Bíceps con Barra en Banco (Scott / Predicador)': 'biceps/barbell-preacher-curl.gif',
    'Pájaros / Elevaciones Posteriores con Mancuernas': 'delts/dumbbell-rear-lateral-raise.gif',
    'Pájaros Sentado con Mancuernas (Rear Delt Flyes)': 'delts/dumbbell-incline-rear-lateral-raise.gif',
    'Aperturas Planas con Mancuernas (DB Flyes)': 'pectorals/dumbbell-fly.gif',
    'Aperturas Inclinadas con Mancuernas (Incline Flyes)': 'pectorals/dumbbell-incline-fly.gif',
    'Aperturas Declinadas con Mancuernas': 'pectorals/dumbbell-decline-fly.gif',
    'Cruces en Polea Alta (Cable Crossover)': 'pectorals/cable-middle-fly.gif',
    'Cruces en Polea Media / Cruz de Hierro': 'delts/dumbbell-iron-cross.gif',
    'Cruces en Polea (Aperturas)': 'pectorals/cable-standing-fly.gif',
    'Fondos en Paralelas (Dips)': 'pectorals/chest-dip-on-dip-pull-up-cage.gif',
    'Fondos en Paralelas para Pecho (Chest Dips)': 'pectorals/chest-dip-on-dip-pull-up-cage.gif',
    'Aperturas en Máquina Peck Deck (Pec Deck Flyes)': 'https://burnfit.io/wp-content/uploads/PEC_DECK_MC.gif',
    'Cable Pull-Through para Cadena Posterior': 'glutes/cable-pull-through-with-rope.gif',
    'Elevaciones Laterales con Mancuernas (Lateral Raises)': 'delts/dumbbell-lateral-raise.gif',
    'Elevaciones Laterales con Mancuernas': 'delts/dumbbell-lateral-raise.gif',
    'Elevaciones Frontales con Mancuernas (Front Raises)': 'delts/dumbbell-front-raise.gif',
    'Sentadilla Trasera con Barra (Barbell Back Squat)': 'glutes/barbell-full-squat.gif',
    'Zancadas Caminando con Mancuernas': 'glutes/walking-lunge.gif',
    'Zancadas Estáticas con Mancuernas (Lunges)': 'glutes/dumbbell-lunge.gif',
    'Zancadas hacia Atrás con Mancuernas (Reverse Lunge)': 'glutes/dumbbell-rear-lunge.gif',
    'Saltos al Cajón Pliométricos (Box Jumps)': 'cardio/semi-squat-jump-male.gif',
    'Aductores en Polea Baja (Cable Adduction)': 'adductors/cable-hip-adduction.gif',
    'Leñador en Polea (Cable Woodchoppers)': 'abs/cable-twist.gif',
    'Caminata con Inclinación en Cinta (Incline Walk)': 'cardio/walking-on-incline-treadmill.gif',
    'Trote Continuo en Cinta (Treadmill Jogging)': 'cardio/run.gif',
    'Patada de Glúteo en Cuadrupedia / Máquina': 'glutes/lever-hip-extension-v-2.gif',
    'Elevaciones de Talones en Máquina Smith': 'calves/smith-standing-leg-calf-raise.gif',
    'Elevación de Pantorrillas': 'calves/barbell-standing-leg-calf-raise.gif',
    'Peso Muerto Convencional (Deadlift)': 'glutes/barbell-deadlift.gif',
    'Remo en Polea Baja Sentado (Seated Cable Row)': 'upper-back/cable-seated-row.gif',
    'Face Pull con Cuerda en Polea Alta': 'https://burnfit.io/wp-content/uploads/FACE_PULL.gif',
    'Extensiones de Cuádriceps en Máquina': 'quads/lever-leg-extension.gif',
    'Prensa de Piernas a 45°': 'quads/lever-alternate-leg-press.gif',
    'Curl de Femorales en Máquina (Acostado / Sentado)': 'hamstrings/lever-lying-leg-curl.gif'
  };

  const mapList = [];
  for (const dbEx of dbExercises) {
    const rawName = dbEx.name;
    let gifUrl = null;
    if (explicit[rawName]) {
      const exp = explicit[rawName];
      gifUrl = exp.startsWith('http') ? exp : `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/${exp}`;
    }
    if (!gifUrl) {
      const parenMatch = rawName.match(/\(([^)]+)\)/);
      if (parenMatch) {
        const enTerm = norm(parenMatch[1]);
        const foundEn = gymEn.find(g => norm(g.name).includes(enTerm) || norm(g.slug).includes(enTerm.replace(/\s+/g, '-')));
        if (foundEn) gifUrl = foundEn.gifUrl;
      }
    }
    if (!gifUrl) {
      const dbNorm = norm(rawName);
      const foundEs = gymEs.find(g => {
        const gNorm = norm(g.name);
        return gNorm === dbNorm || dbNorm.includes(gNorm) || gNorm.includes(dbNorm);
      });
      if (foundEs) gifUrl = foundEs.gifUrl;
    }
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
      if (best) gifUrl = best.gifUrl;
    }
    mapList.push({ id: dbEx.id, name: rawName, gifUrl });
  }

  console.log(`Verificando 200 OK para los ${mapList.length} ejercicios...`);
  let okCount = 0;
  let failCount = 0;

  for (let i = 0; i < mapList.length; i += 20) {
    const chunk = mapList.slice(i, i + 20);
    await Promise.all(chunk.map(async item => {
      try {
        const res = await fetch(item.gifUrl, { method: 'HEAD' });
        if (res.status === 200) {
          okCount++;
        } else {
          failCount++;
          console.log(`❌ ${item.name} -> HTTP ${res.status}: ${item.gifUrl}`);
        }
      } catch (err) {
        failCount++;
        console.log(`⚠️ ${item.name} -> ERROR: ${err.message}`);
      }
    }));
  }

  console.log(`\nVerificación final: ${okCount} OK, ${failCount} fallidos de ${mapList.length}`);
}

verifyAllUrls();
