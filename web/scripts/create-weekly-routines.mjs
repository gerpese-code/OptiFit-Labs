import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer .env.local
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      envVars[key] = val;
    }
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Error: No se encontró NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function getOrCreateExercise(exerciseDef) {
  // Buscar primero por nombre exacto o similar
  const { data: existing, error: searchErr } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', `%${exerciseDef.searchName}%`)
    .limit(1);

  if (searchErr) {
    console.error('Error buscando ejercicio:', exerciseDef.searchName, searchErr);
    throw searchErr;
  }

  if (existing && existing.length > 0) {
    console.log(` Ejercicio existente encontrado: "${existing[0].name}" (${existing[0].id})`);
    return existing[0].id;
  }

  // Si no existe, crearlo
  console.log(` Creando nuevo ejercicio: "${exerciseDef.name}"...`);
  const { data: inserted, error: insertErr } = await supabase
    .from('exercises')
    .insert({
      name: exerciseDef.name,
      muscle_group: exerciseDef.muscle_group,
      description: exerciseDef.description,
      gif_url: exerciseDef.gif_url || null,
      image_urls: exerciseDef.image_urls || [],
      is_custom: false,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name')
    .single();

  if (insertErr) {
    console.error('Error insertando ejercicio:', exerciseDef.name, insertErr);
    throw insertErr;
  }

  console.log(` Creado con éxito: "${inserted.name}" (${inserted.id})`);
  return inserted.id;
}

async function createRoutineWithDaysAndSets(routineData) {
  console.log(`\n========================================`);
  console.log(`Procesando Rutina: "${routineData.title}"`);
  console.log(`========================================`);

  // Verificar si ya existe para evitar duplicación
  const { data: existingRoutines, error: checkErr } = await supabase
    .from('routines')
    .select('id, title')
    .eq('title', routineData.title)
    .eq('is_template', true)
    .is('client_id', null);

  if (checkErr) throw checkErr;

  if (existingRoutines && existingRoutines.length > 0) {
    console.log(`La rutina "${routineData.title}" ya existe (${existingRoutines[0].id}). Eliminando versión previa para recrearla limpia con todos los datos exactos...`);
    await supabase.from('routines').delete().eq('id', existingRoutines[0].id);
  }

  // 1. Insertar rutina
  const { data: newRoutine, error: rErr } = await supabase
    .from('routines')
    .insert({
      title: routineData.title,
      description: routineData.description,
      is_template: true,
      is_active: true,
      client_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, title')
    .single();

  if (rErr) throw rErr;
  console.log(` Rutina creada: ${newRoutine.title} [ID: ${newRoutine.id}]`);

  // 2. Insertar día
  for (const day of routineData.days) {
    const { data: newDay, error: dErr } = await supabase
      .from('routine_days')
      .insert({
        routine_id: newRoutine.id,
        name: day.name,
        day_number: day.day_number,
        order_index: day.order_index,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('id, name')
      .single();

    if (dErr) throw dErr;
    console.log(`   Día creado: ${newDay.name} [ID: ${newDay.id}]`);

    // 3. Insertar ejercicios y sets
    for (let i = 0; i < day.exercises.length; i++) {
      const item = day.exercises[i];
      const { data: newRx, error: rxErr } = await supabase
        .from('routine_exercises')
        .insert({
          routine_day_id: newDay.id,
          exercise_id: item.exercise_id,
          order_index: i,
          notes: item.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single();

      if (rxErr) throw rxErr;
      console.log(`     Ejercicio #${i + 1} vinculado [ID: ${item.exercise_id}]: ${item.notes || 'Sin notas'}`);

      // 4. Insertar sets
      if (item.sets && item.sets.length > 0) {
        const setsPayload = item.sets.map((s, sIdx) => ({
          routine_exercise_id: newRx.id,
          set_number: sIdx + 1,
          target_reps: s.target_reps,
          target_weight_kg: s.target_weight_kg !== undefined ? s.target_weight_kg : 0,
          target_rpe: s.target_rpe || 8,
          rest_seconds: s.rest_seconds || 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: setsErr } = await supabase
          .from('routine_exercise_sets')
          .insert(setsPayload);

        if (setsErr) throw setsErr;
        console.log(`       ${item.sets.length} series creadas.`);
      }
    }
  }

  console.log(` Rutina "${routineData.title}" completada con éxito!`);
}

async function main() {
  console.log('Iniciando verificación y creación de las 3 Rutinas Semanales...');

  // 1. Obtener o crear los ejercicios requeridos
  const exBicicletaId = await getOrCreateExercise({
    searchName: 'Bicicleta Estática',
    name: 'Bicicleta Estática / Spinning',
    muscle_group: 'Cardio',
    description: 'Ejercicio cardiovascular en bicicleta estática para calentamiento o resistencia metabólica.',
  });

  const exPrensaId = await getOrCreateExercise({
    searchName: 'Prensa de Piernas 45',
    name: 'Prensa de Piernas 45° (Leg Press)',
    muscle_group: 'Cuádriceps',
    description: 'Empuje de piernas a 45° en máquina. Enfoque potente en cuádriceps y glúteos.',
  });

  const exCurlCuadricepsId = await getOrCreateExercise({
    searchName: 'Extensiones de Cuádriceps',
    name: 'Extensiones de Cuádriceps en Máquina (Leg Extension)',
    muscle_group: 'Cuádriceps',
    description: 'Aislamiento de cuádriceps en máquina sentado. Extensión completa y descenso controlado.',
  });

  const exPantorrillasId = await getOrCreateExercise({
    searchName: 'Elevaciones de Talones de Pie',
    name: 'Elevaciones de Talones de Pie en Máquina',
    muscle_group: 'Pantorrillas',
    description: 'Elevación de talones de pie para activación profunda de gemelos y sóleo.',
  });

  const exAbsColchonetaId = await getOrCreateExercise({
    searchName: 'Abdominales sobre Colchoneta',
    name: 'Abdominales sobre Colchoneta (Crunch)',
    muscle_group: 'Core / Abdomen',
    description: 'Flexión de tronco en el suelo sobre colchoneta. Mantener la zona lumbar firme y contracción máxima del recto abdominal.',
    gif_url: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Crunches/0.jpg',
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Crunches/0.jpg',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Crunches/1.jpg'
    ]
  });

  const exAbsInferioresId = await getOrCreateExercise({
    searchName: 'Abdominales Inferiores (Elevación',
    name: 'Abdominales Inferiores (Elevación de Piernas)',
    muscle_group: 'Core / Abdomen',
    description: 'Elevación de piernas controlada sobre colchoneta o banco plano para activación del abdomen inferior.',
    gif_url: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg',
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Flat_Bench_Lying_Leg_Raise/0.jpg'
    ]
  });

  const exCaminadoraId = await getOrCreateExercise({
    searchName: 'Caminata con Inclinación',
    name: 'Caminata con Inclinación en Cinta (Incline Walk)',
    muscle_group: 'Cardio',
    description: 'Caminadora con inclinación para quema calórica de bajo impacto y resistencia aeróbica.',
  });

  const exHipThrustId = await getOrCreateExercise({
    searchName: 'Hip Thrust con Barra',
    name: 'Hip Thrust con Barra en Banco (Barbell Hip Thrust)',
    muscle_group: 'Glúteos',
    description: 'Empuje de cadera con barra sobre banco. Máximo reclutamiento y tensión mecánica sobre el glúteo mayor.',
  });

  const exAductoresId = await getOrCreateExercise({
    searchName: 'Aductores en Máquina',
    name: 'Aductores en Máquina (Adductor Machine)',
    muscle_group: 'Glúteos',
    description: 'Aducción de cadera sentado en máquina para desarrollo y firmeza de la cara interna del muslo.',
    gif_url: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Thigh_Adductor/0.jpg',
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Thigh_Adductor/0.jpg',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Thigh_Adductor/1.jpg'
    ]
  });

  const exZancadasId = await getOrCreateExercise({
    searchName: 'Zancadas Caminando con Peso Corporal',
    name: 'Zancadas Caminando con Peso Corporal',
    muscle_group: 'Glúteos',
    description: 'Desplantes caminando con propio peso corporal. Fortalecimiento unilateral de cuádriceps, glúteos y estabilidad.',
  });

  const exAbsOblicuosId = await getOrCreateExercise({
    searchName: 'Abs Oblicuos con Banda',
    name: 'Abs Oblicuos con Banda Elástica',
    muscle_group: 'Core / Abdomen',
    description: 'Rotación y flexión controlada contra la resistencia elástica para definición y fuerza en oblicuos.',
    gif_url: 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Band_Twisting_Overhead_Press/0.jpg',
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Band_Twisting_Overhead_Press/0.jpg'
    ]
  });

  const exPlanchaId = await getOrCreateExercise({
    searchName: 'Plancha Abdominal Isométrica',
    name: 'Plancha Abdominal Isométrica (Front Plank)',
    muscle_group: 'Core / Abdomen',
    description: 'Sujeción isométrica de antebrazos activando transverso abdominal, core y estabilizadores pélvicos.',
  });

  // 2. Estructurar las 3 rutinas exactas del plan

  // --- RUTINA 1: Cuádriceps y Pantorrillas ---
  const rutina1 = {
    title: 'Rutina 1: Cuádriceps y Pantorrillas',
    description: 'Plan enfocado en el desarrollo de fuerza e hipertrofia en cuádriceps, pantorrillas y core abdominal. Incluye calentamiento en bicicleta y cardio final inclinado al 8%.',
    days: [
      {
        name: 'Día 1 - Cuádriceps y Pantorrillas',
        day_number: 1,
        order_index: 0,
        exercises: [
          {
            exercise_id: exBicicletaId,
            notes: 'Calentamiento: Bicicleta (20 min) | Ritmo moderado | 110-130 RPM',
            sets: [
              { target_reps: 20, target_weight_kg: 0, target_rpe: 6, rest_seconds: 60 }
            ]
          },
          {
            exercise_id: exPrensaId,
            notes: 'Prensa para Cuádriceps: 3 series x 15 reps con 40 kg. Rango completo y controlado.',
            sets: [
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8, rest_seconds: 90 },
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8, rest_seconds: 90 },
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8.5, rest_seconds: 90 },
            ]
          },
          {
            exercise_id: exCurlCuadricepsId,
            notes: 'Curl de Cuádriceps (Extensiones): 3 series x 15 reps con 25 kg. Pausa de 1 seg arriba.',
            sets: [
              { target_reps: 15, target_weight_kg: 25, target_rpe: 8, rest_seconds: 75 },
              { target_reps: 15, target_weight_kg: 25, target_rpe: 8, rest_seconds: 75 },
              { target_reps: 15, target_weight_kg: 25, target_rpe: 8.5, rest_seconds: 75 },
            ]
          },
          {
            exercise_id: exPantorrillasId,
            notes: 'Pantorrillas (Elevación): 3 series x 15 reps con 30 kg. Estiramiento profundo.',
            sets: [
              { target_reps: 15, target_weight_kg: 30, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 30, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 30, target_rpe: 8.5, rest_seconds: 60 },
            ]
          },
          {
            exercise_id: exAbsColchonetaId,
            notes: 'Abdominales sobre Colchoneta: 3 series x 15 reps. Peso corporal.',
            sets: [
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 60 },
            ]
          },
          {
            exercise_id: exAbsInferioresId,
            notes: 'Abdominales Inferiores (Elevación de Piernas): 3 series x 15 reps. Control lumbar.',
            sets: [
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 60 },
            ]
          },
          {
            exercise_id: exCaminadoraId,
            notes: 'Cardio Final: Caminadora Inclinada (8%) durante 20 min.',
            sets: [
              { target_reps: 20, target_weight_kg: 0, target_rpe: 7, rest_seconds: 60 }
            ]
          }
        ]
      }
    ]
  };

  // --- RUTINA 2: Glúteos e Isquios ---
  const rutina2 = {
    title: 'Rutina 2: Glúteos e Isquios',
    description: 'Plan enfocado en hipertrofia y tonificación de glúteos, aductores y estabilidad del core con oblicuos y plancha isométrica. Incluye cardio final inclinado al 8%.',
    days: [
      {
        name: 'Día 1 - Glúteos e Isquios',
        day_number: 1,
        order_index: 0,
        exercises: [
          {
            exercise_id: exBicicletaId,
            notes: 'Calentamiento: Bicicleta (20 min) | 110-130 RPM',
            sets: [
              { target_reps: 20, target_weight_kg: 0, target_rpe: 6, rest_seconds: 60 }
            ]
          },
          {
            exercise_id: exHipThrustId,
            notes: 'Hip Thrust: 3 series x 15 reps con 40 kg. Apretar glúteos arriba 1-2 seg.',
            sets: [
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8, rest_seconds: 90 },
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8, rest_seconds: 90 },
              { target_reps: 15, target_weight_kg: 40, target_rpe: 8.5, rest_seconds: 90 },
            ]
          },
          {
            exercise_id: exAductoresId,
            notes: 'Aductores: 3 series x 15 reps con 10 kg. Cierre controlado y apertura lenta.',
            sets: [
              { target_reps: 15, target_weight_kg: 10, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 10, target_rpe: 8, rest_seconds: 60 },
              { target_reps: 15, target_weight_kg: 10, target_rpe: 8.5, rest_seconds: 60 },
            ]
          },
          {
            exercise_id: exZancadasId,
            notes: 'Zancadas (Desplantes): 3 series x 12 reps con peso corporal. Paso firme y torso erguido.',
            sets: [
              { target_reps: 12, target_weight_kg: 0, target_rpe: 8, rest_seconds: 75 },
              { target_reps: 12, target_weight_kg: 0, target_rpe: 8, rest_seconds: 75 },
              { target_reps: 12, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 75 },
            ]
          },
          {
            exercise_id: exAbsOblicuosId,
            notes: 'Abs Oblicuos (Banda Elástica): 3 series x 30 seg. Mantener tensión constante de la banda.',
            sets: [
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8, rest_seconds: 45 },
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8, rest_seconds: 45 },
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 45 },
            ]
          },
          {
            exercise_id: exPlanchaId,
            notes: 'Plancha Isométrica (Abs): 3 series x 30 seg. Espalda recta y abdomen contraído.',
            sets: [
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8, rest_seconds: 45 },
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8, rest_seconds: 45 },
              { target_reps: 30, target_weight_kg: 0, target_rpe: 8.5, rest_seconds: 45 },
            ]
          },
          {
            exercise_id: exCaminadoraId,
            notes: 'Cardio Final: Caminadora Inclinada (8%) durante 20 min.',
            sets: [
              { target_reps: 20, target_weight_kg: 0, target_rpe: 7, rest_seconds: 60 }
            ]
          }
        ]
      }
    ]
  };

  // --- RUTINA 3: Cardio Integral ---
  const rutina3 = {
    title: 'Rutina 3: Cardio Integral',
    description: 'Sesión integral de acondicionamiento cardiovascular, resistencia y salud metabólica.\n\nNOTAS IMPORTANTES:\n- ¡Mantente hidratado durante toda la sesión!\n- Ajusta progresivamente la velocidad y resistencia.\n- Pulsaciones deseadas: 110-130 RPM en todo el cardio.',
    days: [
      {
        name: 'Día 1 - Cardio Integral',
        day_number: 1,
        order_index: 0,
        exercises: [
          {
            exercise_id: exBicicletaId,
            notes: 'Bicicleta: 25 min continuo (Pulsaciones y ritmo: 110-130 RPM). Mantener buena hidratación.',
            sets: [
              { target_reps: 25, target_weight_kg: 0, target_rpe: 7, rest_seconds: 60 }
            ]
          },
          {
            exercise_id: exCaminadoraId,
            notes: 'Cinta Inclinada (8%): 25 min continuo. Ritmo constante y ajuste progresivo según pulsaciones.',
            sets: [
              { target_reps: 25, target_weight_kg: 0, target_rpe: 7, rest_seconds: 60 }
            ]
          }
        ]
      }
    ]
  };

  await createRoutineWithDaysAndSets(rutina1);
  await createRoutineWithDaysAndSets(rutina2);
  await createRoutineWithDaysAndSets(rutina3);

  console.log('\n======================================================');
  console.log(' ¡LAS 3 RUTINAS HAN SIDO CREADAS Y CONFIGURADAS EXITOSAMENTE!');
  console.log(' Disponibles en el Panel de Administrador para asignación directa.');
  console.log('======================================================');
}

main().catch(err => {
  console.error('Error fatal al crear rutinas:', err);
  process.exit(1);
});
