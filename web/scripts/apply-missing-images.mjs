import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

const mapping = [
  {
    namePattern: 'Abdominales en Smith / Barra / Rollout con Disco',
    folder: 'Ab_Roller'
  },
  {
    namePattern: 'Curl de Bíceps con Barra en Banco (Scott / Predicador)',
    folder: 'Preacher_Curl'
  },
  {
    namePattern: 'Curl de Femorales en Máquina (Acostado / Sentado)',
    folder: 'Lying_Leg_Curls'
  },
  {
    namePattern: 'Dorsales Barra Polea Alta Agarre Cerrado',
    folder: 'V-Bar_Pulldown'
  },
  {
    namePattern: 'Dorsales en Polea Batman / Pullover Polea',
    folder: 'Rope_Straight-Arm_Pulldown'
  },
  {
    namePattern: 'Elevación de Pantorrillas',
    folder: 'Smith_Machine_Calf_Raise'
  },
  {
    namePattern: 'Elevación de Piernas en Banco Inclinado (Abs Inferiores)',
    folder: 'Flat_Bench_Lying_Leg_Raise'
  },
  {
    namePattern: 'Estocadas Búlgaras en Smith',
    folder: 'Smith_Single-Leg_Split_Squat'
  },
  {
    namePattern: 'Extensiones de Tríceps con Soga (Cuerda)',
    folder: 'Triceps_Pushdown_-_Rope_Attachment'
  },
  {
    namePattern: 'Hip Thrust en Máquina Smith',
    folder: 'Barbell_Hip_Thrust'
  },
  {
    namePattern: 'Oblicuos en Banco de Hiperextensiones / Lumbares',
    folder: 'Hyperextensions_Back_Extensions'
  },
  {
    namePattern: 'Patada de Glúteos en Polea (Cable)',
    folder: 'Glute_Kickback'
  },
  {
    namePattern: 'Press Militar Sentado con Mancuernas',
    folder: 'Seated_Dumbbell_Press'
  },
  {
    namePattern: 'Sentadilla en Smith Profunda',
    folder: 'Smith_Machine_Squat'
  },
  {
    namePattern: 'Sentadilla Hack Inclinada',
    folder: 'Hack_Squat'
  },
  {
    namePattern: 'Sentadilla Sissy (Sisi Cuádriceps)',
    folder: 'Weighted_Sissy_Squat'
  },
  {
    namePattern: 'Vuelos Laterales y Frontales Combinados',
    folder: 'Side_Lateral_Raise'
  }
];

async function updateExercises() {
  console.log('--- ACTUALIZANDO IMÁGENES DE EJERCICIOS EN SUPABASE ---\n');

  for (const item of mapping) {
    const img0 = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${item.folder}/0.jpg`;
    const img1 = `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${item.folder}/1.jpg`;
    const imageUrls = [img0, img1];

    const { data: matched, error: findErr } = await supabase
      .from('exercises')
      .select('id, name')
      .ilike('name', `%${item.namePattern}%`);

    if (findErr) {
      console.error('Error buscando', item.namePattern, findErr);
      continue;
    }

    if (!matched || matched.length === 0) {
      console.warn(`No se encontró ejercicio con patrón "${item.namePattern}"`);
      continue;
    }

    for (const ex of matched) {
      const { error: updErr } = await supabase
        .from('exercises')
        .update({
          image_urls: imageUrls,
          gif_url: img0,
          updated_at: new Date().toISOString()
        })
        .eq('id', ex.id);

      if (updErr) {
        console.error(`Error actualizando ${ex.name}:`, updErr);
      } else {
        console.log(`✅ [OK] Actualizado: "${ex.name}" -> ${item.folder} (2 fotos)`);
      }
    }
  }

  console.log('\n--- VERIFICACIÓN FINAL DE TODAS LAS RUTINAS ---');
  const { data: routines } = await supabase
    .from('routines')
    .select('id, title, routine_days(name, routine_exercises(exercise_id, exercises(id, name, image_urls, gif_url)))');

  for (const r of routines || []) {
    let total = 0;
    let withImgs = 0;
    for (const d of r.routine_days || []) {
      for (const rx of d.routine_exercises || []) {
        total++;
        if (rx.exercises?.image_urls && rx.exercises.image_urls.length > 0) {
          withImgs++;
        }
      }
    }
    if (total > 0) {
      console.log(`${r.title}: ${withImgs}/${total} con imágenes (${total - withImgs === 0 ? '100% COMPLETO 🎉' : (total - withImgs) + ' FALTANTES'})`);
    }
  }
}

updateExercises();
