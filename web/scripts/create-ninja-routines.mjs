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
envContent.split('\n').forEach((line) => {
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

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL || 'https://uvqkdcsetadyecgnyyem.supabase.co';
const serviceKey =
  envVars.SUPABASE_SERVICE_ROLE_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV2cWtkY3NldGFkeWVjZ255eWVtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQ2MTUxNSwiZXhwIjoyMTA0MDM3NTE1fQ.Ek25x6x6EzJ0ygMXphYs08uxhQx9TK3lq6o4WBQ6mBE';

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Helper para buscar o crear un ejercicio
async function getOrCreateExercise(def) {
  const { data: existing } = await supabase
    .from('exercises')
    .select('id, name, image_urls')
    .ilike('name', `%${def.searchName}%`)
    .limit(1);

  if (existing && existing.length > 0) {
    console.log(`  [OK] Ejercicio existente: "${existing[0].name}" (${existing[0].id})`);
    if (def.image_urls && def.image_urls.length > 0 && (!existing[0].image_urls || existing[0].image_urls.length === 0)) {
      await supabase.from('exercises').update({ image_urls: def.image_urls, gif_url: def.gif_url }).eq('id', existing[0].id);
    }
    return existing[0].id;
  }

  console.log(`  [NUEVO] Creando ejercicio: "${def.name}"...`);
  const { data: inserted, error: insertErr } = await supabase
    .from('exercises')
    .insert({
      name: def.name,
      muscle_group: def.muscle_group,
      description: def.description || `Ejercicio para ${def.muscle_group}`,
      gif_url: def.gif_url || (def.image_urls && def.image_urls.length > 0 ? def.image_urls[0] : null),
      image_urls: def.image_urls || [],
      is_custom: false,
      created_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select('id, name')
    .single();

  if (insertErr) {
    console.error('Error insertando ejercicio:', def.name, insertErr);
    throw insertErr;
  }

  console.log(`  [OK] Creado: "${inserted.name}" (${inserted.id})`);
  return inserted.id;
}

// Helper para crear una rutina con sus días, ejercicios y series
async function createTemplateRoutine(routineDef) {
  console.log(`\n======================================================`);
  console.log(`Creando Rutina Plantilla: "${routineDef.title}"`);
  console.log(`======================================================`);

  // Eliminar si ya existe con ese título para recrearla limpia
  const { data: existing } = await supabase
    .from('routines')
    .select('id')
    .eq('title', routineDef.title)
    .eq('is_template', true)
    .is('client_id', null);

  if (existing && existing.length > 0) {
    for (const r of existing) {
      console.log(`  Eliminando versión previa de "${routineDef.title}" (${r.id})...`);
      await supabase.from('routines').delete().eq('id', r.id);
    }
  }

  // 1. Insertar rutina
  const { data: routine, error: rErr } = await supabase
    .from('routines')
    .insert({
      title: routineDef.title,
      description: routineDef.description,
      is_template: true,
      is_active: true,
      client_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (rErr) throw rErr;
  console.log(` [RUTINA] Creada con éxito: ${routine.title} [ID: ${routine.id}]`);

  // 2. Insertar días
  for (let dIdx = 0; dIdx < routineDef.days.length; dIdx++) {
    const day = routineDef.days[dIdx];
    const { data: routineDay, error: dErr } = await supabase
      .from('routine_days')
      .insert({
        routine_id: routine.id,
        name: day.name,
        day_number: dIdx + 1,
        order_index: dIdx,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (dErr) throw dErr;
    console.log(`   [DÍA ${dIdx + 1}] ${routineDay.name} [ID: ${routineDay.id}]`);

    // 3. Insertar ejercicios del día
    for (let eIdx = 0; eIdx < day.exercises.length; eIdx++) {
      const exItem = day.exercises[eIdx];
      const { data: rx, error: rxErr } = await supabase
        .from('routine_exercises')
        .insert({
          routine_day_id: routineDay.id,
          exercise_id: exItem.exercise_id,
          order_index: eIdx,
          notes: exItem.notes || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (rxErr) throw rxErr;
      console.log(`     [EX ${eIdx + 1}] ${exItem.displayName || 'Ejercicio'}: ${exItem.notes || ''}`);

      // 4. Insertar sets del ejercicio
      if (exItem.sets && exItem.sets.length > 0) {
        const setsRows = exItem.sets.map((s, sIdx) => ({
          routine_exercise_id: rx.id,
          set_number: sIdx + 1,
          target_reps: s.reps,
          target_weight_kg: s.weight_kg !== undefined ? s.weight_kg : 0,
          target_rpe: s.rpe || 8,
          rest_seconds: s.rest || 60,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }));

        const { error: setsErr } = await supabase
          .from('routine_exercise_sets')
          .insert(setsRows);

        if (setsErr) throw setsErr;
      }
    }
  }

  console.log(` [COMPLETO] Rutina "${routineDef.title}" guardada.`);
  return routine;
}

async function run() {
  console.log('Iniciando creación de Rutinas Ninja OptiFit Labs...');

  // -------------------------------------------------------------------------
  // PASO 1: DEFINICIÓN Y OBTENCIÓN DE TODOS LOS EJERCICIOS
  // -------------------------------------------------------------------------
  console.log('\n--- Verificando / Creando Ejercicios del Catálogo ---');

  const exHipTrustSmith = await getOrCreateExercise({
    name: 'Hip Thrust en Máquina Smith',
    searchName: 'Hip Thrust en Máquina Smith',
    muscle_group: 'Glúteos',
    description: 'Empuje de cadera apoyando espalda alta en banco con barra en Smith. Colocar almohadilla protectora.',
  });

  const exSentadillaSmith = await getOrCreateExercise({
    name: 'Sentadilla en Smith Profunda',
    searchName: 'Sentadilla en Smith Profunda',
    muscle_group: 'Cuádriceps',
    description: 'Sentadilla profunda en máquina Smith con pies apenas más abiertos que el ancho de hombros.',
  });

  const exPesoMuertoBarra = await getOrCreateExercise({
    name: 'Peso Muerto con Barra Convencional',
    searchName: 'Peso Muerto Convencional',
    muscle_group: 'Espalda',
    description: 'Peso muerto tradicional con barra. Espalda neutra y empuje con cadera e isquiotibiales.',
  });

  const exEstocadasBulgarasSmith = await getOrCreateExercise({
    name: 'Estocadas Búlgaras en Smith',
    searchName: 'Estocadas Búlgaras en Smith',
    muscle_group: 'Glúteos',
    description: 'Sentadilla búlgara en máquina Smith con empeine apoyado en banco trasero.',
  });

  const exCurlFemorales = await getOrCreateExercise({
    name: 'Curl de Femorales en Máquina (Acostado / Sentado)',
    searchName: 'Curl de Femorales',
    muscle_group: 'Piernas',
    description: 'Flexión de rodillas en máquina para aislamiento de isquiotibiales y femorales.',
  });

  const exPantorrillas = await getOrCreateExercise({
    name: 'Elevación de Pantorrillas',
    searchName: 'Pantorrillas',
    muscle_group: 'Piernas',
    description: 'Elevación de talones de pie o sentado con pausa en contracción máxima.',
  });

  const exDorsalesPoleaAlta = await getOrCreateExercise({
    name: 'Dorsales Barra Polea Alta Agarre Cerrado',
    searchName: 'Dorsales Barra Polea Alta',
    muscle_group: 'Espalda',
    description: 'Jalón dorsal al pecho en polea alta con agarre cerrado neutro (triángulo o barra corta).',
  });

  const exRemoPoleaCerrada = await getOrCreateExercise({
    name: 'Remo en Polea Baja Agarre Cerrado',
    searchName: 'Remo en Polea',
    muscle_group: 'Espalda',
    description: 'Remo sentado en polea con agarre estrecho. Traccionar con codos evitando forzar los bíceps.',
  });

  const exDorsalesPoleaBatman = await getOrCreateExercise({
    name: 'Dorsales en Polea Batman / Pullover Polea',
    searchName: 'Dorsales en Polea Batman',
    muscle_group: 'Espalda',
    description: 'Jalón unilateral o pullover dorsal estilo Batman en polea alta con máxima apertura y contracción.',
  });

  const exTricepsPoleaBarra = await getOrCreateExercise({
    name: 'Extensiones de Tríceps en Polea con Barra',
    searchName: 'Extensiones de Tríceps en Polea con Barra',
    muscle_group: 'Brazos',
    description: 'Empuje de tríceps hacia abajo en polea con barra recta o V, codos pegados a los costados.',
  });

  const exTricepsSoga = await getOrCreateExercise({
    name: 'Extensiones de Tríceps con Soga (Cuerda)',
    searchName: 'Tríceps con Soga',
    muscle_group: 'Brazos',
    description: 'Extensión de tríceps en polea alta abriendo la cuerda al final del recorrido.',
  });

  const exBicepsBarraBanco = await getOrCreateExercise({
    name: 'Curl de Bíceps con Barra en Banco (Scott / Predicador)',
    searchName: 'Curl de Bíceps con Barra en Banco',
    muscle_group: 'Brazos',
    description: 'Curl estricto de bíceps apoyado en banco predicador con barra Z o barra recta.',
  });

  const exHackInclinado = await getOrCreateExercise({
    name: 'Sentadilla Hack Inclinada',
    searchName: 'Hack Inclinado',
    muscle_group: 'Cuádriceps',
    description: 'Sentadilla en máquina Hack inclinada a 45°. Descenso controlado hasta romper el paralelo.',
  });

  const exPrensa = await getOrCreateExercise({
    name: 'Prensa de Piernas Inclinada 45°',
    searchName: 'Prensa de Piernas a 45°',
    muscle_group: 'Cuádriceps',
    description: 'Prensa pesada a 45 grados. Empujar con toda la planta del pie sin bloquear rodillas al extender.',
  });

  const exSisiCuadriceps = await getOrCreateExercise({
    name: 'Sentadilla Sissy (Sisi Cuádriceps)',
    searchName: 'Sentadilla Sissy',
    muscle_group: 'Cuádriceps',
    description: 'Sentadilla Sissy con cuerpo reclinado hacia atrás para máximo estiramiento del recto femoral.',
  });

  const exCuadricera = await getOrCreateExercise({
    name: 'Extensiones de Cuádriceps (Cuadricera)',
    searchName: 'Extensiones de Cuádriceps en Máquina',
    muscle_group: 'Cuádriceps',
    description: 'Máquina de extensiones de piernas. Contracción pico de 1 segundo arriba.',
  });

  const exAductoresMaquina = await getOrCreateExercise({
    name: 'Aductores en Máquina Sentada',
    searchName: 'Aductores en Máquina',
    muscle_group: 'Piernas',
    description: 'Aducción de piernas en máquina sentada. Pausa de 1 segundo en máxima contracción.',
  });

  const exPressMilitarMancuernas = await getOrCreateExercise({
    name: 'Press Militar Sentado con Mancuernas',
    searchName: 'Press Militar Sentado con Mancuernas',
    muscle_group: 'Hombros',
    description: 'Press vertical de hombros sentado con mancuernas. Bajar a nivel de las orejas y subir firme.',
  });

  const exVuelosLateralesFrontales = await getOrCreateExercise({
    name: 'Vuelos Laterales y Frontales Combinados',
    searchName: 'Vuelos Laterales y Frontales Combinados',
    muscle_group: 'Hombros',
    description: 'Bisubconjunto sin descanso: 10 elevaciones laterales con mancuerna + 10 elevaciones frontales.',
  });

  const exPullFace = await getOrCreateExercise({
    name: 'Face Pull con Cuerda en Polea Alta',
    searchName: 'Face Pull',
    muscle_group: 'Hombros',
    description: 'Jalón hacia el rostro con cuerda en polea alta con rotación externa y retracción escapular.',
  });

  const exPatadaGluteosCable = await getOrCreateExercise({
    name: 'Patada de Glúteos en Polea (Cable)',
    searchName: 'Patada de Glúteos en Polea',
    muscle_group: 'Glúteos',
    description: 'Extensión trasera de cadera con tobillera en polea baja, manteniendo torso firme.',
  });

  const exAbductoresMaquina = await getOrCreateExercise({
    name: 'Abductores en Máquina Sentada',
    searchName: 'Abducciones de Cadera en Máquina',
    muscle_group: 'Glúteos',
    description: 'Apertura de cadera en máquina. Inclinarse ligeramente hacia adelante para activar glúteo medio.',
  });

  const exAbsInferioresInclinado = await getOrCreateExercise({
    name: 'Elevación de Piernas en Banco Inclinado (Abs Inferiores)',
    searchName: 'Elevación de Piernas en Banco Inclinado',
    muscle_group: 'Abdominales',
    description: 'Elevación de piernas en banco inclinado. Movimiento lento sin impulso.',
  });

  const exAbsOblicuosLumbares = await getOrCreateExercise({
    name: 'Oblicuos en Banco de Hiperextensiones / Lumbares',
    searchName: 'Oblicuos en Banco',
    muscle_group: 'Abdominales',
    description: 'Flexiones laterales de tronco en banco de 45 grados para trabajo de oblicuos y core.',
  });

  const exAbsSmithBarraDisco = await getOrCreateExercise({
    name: 'Abdominales en Smith / Barra / Rollout con Disco',
    searchName: 'Abdominales en Smith',
    muscle_group: 'Abdominales',
    description: 'Rueda o rodamiento con barra en Smith / crunch con disco en pecho. Cadencia lenta y controlada.',
  });

  // -------------------------------------------------------------------------
  // PASO 2: CONSTRUCCIÓN DE LAS RUTINAS
  // -------------------------------------------------------------------------

  // 1. RUTINA 1: PIERNAS POSTERIOR Y GLUTEOS
  const r1Exercises = [
    {
      exercise_id: exHipTrustSmith,
      displayName: 'Hip Thrust (Preferentemente Smith)',
      notes: 'Preferentemente en máquina Smith | 1 calentamiento de 15 reps + 2 series al fallo (150s descanso) + 2 series de 15 reps pesadas (90s descanso)',
      sets: [
        { reps: 15, rpe: 6, rest: 60 }, // Calentar
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 15, rpe: 9.5, rest: 90 }, // MAX
        { reps: 15, rpe: 9.5, rest: 90 }, // MAX
      ],
    },
    {
      exercise_id: exSentadillaSmith,
      displayName: 'Sentadillas Smith Profundas (Apenas más abierto que hombros)',
      notes: 'Pies apenas más abiertos que ancho de hombros. Bajar profundo con control estricto. Carga: 90%.',
      sets: [
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exPesoMuertoBarra,
      displayName: 'Peso Muerto con Barra',
      notes: '2 series pesadas de 8 reps + 1 serie de bombeo a 15 reps. Tensión en isquios y glúteos. Carga: 90%.',
      sets: [
        { reps: 8, rpe: 9, rest: 60 },
        { reps: 8, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exEstocadasBulgarasSmith,
      displayName: 'Estocadas Búlgaras Smith',
      notes: 'Estocadas búlgaras en Smith: 8 reps firmes por pierna. Carga: 90%.',
      sets: [
        { reps: 8, rpe: 9, rest: 60 },
        { reps: 8, rpe: 9, rest: 60 },
        { reps: 8, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exCurlFemorales,
      displayName: 'Curl de Femorales',
      notes: 'Curl femoral en máquina. Contracción sostenida 1 seg arriba. Carga: 90%.',
      sets: [
        { reps: 15, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exPantorrillas,
      displayName: 'Pantorrillas',
      notes: 'Elevaciones de talón con pausa abajo y arriba. Carga: 90%.',
      sets: [
        { reps: 15, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
      ],
    },
  ];

  // 2. RUTINA 2: ESPALDA BICEPS TRICEPS
  const r2Exercises = [
    {
      exercise_id: exDorsalesPoleaAlta,
      displayName: 'Dorsales Barra Polea Alta Agarre Cerrado',
      notes: 'Jalón dorsal agarre cerrado neutro | 1 calentamiento de 15 reps + 3 series al fallo máximo de 8 reps (150s descanso)',
      sets: [
        { reps: 15, rpe: 6, rest: 60 }, // Calentar
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
      ],
    },
    {
      exercise_id: exRemoPoleaCerrada,
      displayName: 'Remo Polea Cerrada (Evitar fuerza con bíceps)',
      notes: 'Traccionar desde los codos hacia la cadera. Evitar tirar con los bíceps. Carga máxima (MAX).',
      sets: [
        { reps: 12, rpe: 9.5, rest: 90 },
        { reps: 12, rpe: 9.5, rest: 90 },
        { reps: 12, rpe: 9.5, rest: 90 },
      ],
    },
    {
      exercise_id: exDorsalesPoleaBatman,
      displayName: 'Dorsales Polea Batman / Polea Cerrada',
      notes: 'Aislamiento dorsal estilo Batman en polea. Tensión pico en máxima contracción. Carga máxima (MAX).',
      sets: [
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
      ],
    },
    {
      exercise_id: exTricepsPoleaBarra,
      displayName: 'Tríceps Polea Barra',
      notes: 'Extensión de tríceps en polea con barra: 2 series x 10 reps + 2 series x 15 reps al 90%.',
      sets: [
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
        { reps: 15, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exTricepsSoga,
      displayName: 'Tríceps Soga (Super Set / Drop Set)',
      notes: 'SUPER SET / Drop Set: 6-6-6-6 reps descendente sin descanso entre micropausas.',
      sets: [
        { reps: 24, rpe: 10, rest: 60 }, // 6-6-6-6
        { reps: 24, rpe: 10, rest: 60 }, // 6-6-6-6
      ],
    },
    {
      exercise_id: exBicepsBarraBanco,
      displayName: 'Bíceps Barra Banco',
      notes: 'Curl con barra en banco Scott / predicador: 6 series estrictas de 10 reps al 90%.',
      sets: [
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
      ],
    },
  ];

  // 3. RUTINA 3: CUADRICEPS Y HOMBROS
  const r3Exercises = [
    {
      exercise_id: exHackInclinado,
      displayName: 'Hack Inclinado',
      notes: 'Sentadilla Hack inclinada | 1 calentamiento de 15 reps + 3 series al fallo de 8 reps (150s descanso)',
      sets: [
        { reps: 15, rpe: 6, rest: 60 }, // Calentar
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
      ],
    },
    {
      exercise_id: exPrensa,
      displayName: 'Prensa (15*5*5)',
      notes: 'Myo-reps / Rest-Pause al 90%: 15 reps + 10s pausa + 5 reps + 10s pausa + 5 reps.',
      sets: [
        { reps: 25, rpe: 9.5, rest: 90 }, // 15*5*5
        { reps: 25, rpe: 9.5, rest: 90 },
        { reps: 25, rpe: 9.5, rest: 90 },
      ],
    },
    {
      exercise_id: exSisiCuadriceps,
      displayName: 'Sisi Cuádriceps (Sentadilla Sissy)',
      notes: 'Sentadilla Sissy estricta. Tensión permanente en recto femoral sin bloquear rodillas.',
      sets: [
        { reps: 10, rpe: 8.5, rest: 60 },
        { reps: 10, rpe: 8.5, rest: 60 },
        { reps: 10, rpe: 8.5, rest: 60 },
      ],
    },
    {
      exercise_id: exCuadricera,
      displayName: 'Cuadricera (Extensiones)',
      notes: '2 series pesadas de 10 reps + 1 Super Set / Drop Set brutal de 6*6*6*6 reps.',
      sets: [
        { reps: 10, rpe: 9.5, rest: 60 },
        { reps: 10, rpe: 9.5, rest: 60 },
        { reps: 24, rpe: 10, rest: 90 }, // Super set 6*6*6*6
      ],
    },
    {
      exercise_id: exAductoresMaquina,
      displayName: 'Aductores Máquina',
      notes: 'Aductores sentada: 3 series x 12 reps con peso máximo (MAX). 1s contracción isométrica.',
      sets: [
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
      ],
    },
    {
      exercise_id: exPressMilitarMancuernas,
      displayName: 'Press Militar con Mancuernas',
      notes: 'Press militar sentado con mancuernas: 4 series x 12 reps con peso máximo (MAX).',
      sets: [
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
        { reps: 12, rpe: 9.5, rest: 60 },
      ],
    },
    {
      exercise_id: exVuelosLateralesFrontales,
      displayName: 'Vuelos Laterales y Frontales Comb (10*10)',
      notes: 'Super Set Combinado: 10 elevaciones laterales con mancuerna + 10 elevaciones frontales sin descanso.',
      sets: [
        { reps: 20, rpe: 9.5, rest: 60 }, // 10*10
        { reps: 20, rpe: 9.5, rest: 60 },
        { reps: 20, rpe: 9.5, rest: 60 },
      ],
    },
    {
      exercise_id: exPullFace,
      displayName: 'Pull Face (Face Pull)',
      notes: 'Face pull en polea alta con cuerda hacia la frente: 4 series x 15 reps con peso máximo (MAX).',
      sets: [
        { reps: 15, rpe: 9.5, rest: 60 },
        { reps: 15, rpe: 9.5, rest: 60 },
        { reps: 15, rpe: 9.5, rest: 60 },
        { reps: 15, rpe: 9.5, rest: 60 },
      ],
    },
  ];

  // 4. RUTINA 4: GLUTEOS Y ABS
  const r4Exercises = [
    {
      exercise_id: exHipTrustSmith,
      displayName: 'Hip Thrust (Preferentemente Smith)',
      notes: 'Preferentemente en máquina Smith | 1 calentamiento de 15 reps + 2 series al fallo (150s descanso) + 2 series de 15 reps pesadas (90s descanso)',
      sets: [
        { reps: 15, rpe: 6, rest: 60 }, // Calentar
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 8, rpe: 10, rest: 150 }, // MAX / FALLO
        { reps: 15, rpe: 9.5, rest: 90 }, // MAX
        { reps: 15, rpe: 9.5, rest: 90 }, // MAX
      ],
    },
    {
      exercise_id: exPatadaGluteosCable,
      displayName: 'Patada de Glúteos Cable',
      notes: 'Patada trasera con tobillera en polea: 3 series x 12 reps por pierna al 90%.',
      sets: [
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exAbductoresMaquina,
      displayName: 'Abductores Máquina',
      notes: 'Máquina de abductores: 3 series x 15 reps con peso máximo (MAX). Torso inclinado al frente.',
      sets: [
        { reps: 15, rpe: 9.5, rest: 60 },
        { reps: 15, rpe: 9.5, rest: 60 },
        { reps: 15, rpe: 9.5, rest: 60 },
      ],
    },
    {
      exercise_id: exCurlFemorales,
      displayName: 'Curl de Femorales Máquina',
      notes: 'Curl femoral en máquina: 3 series x 10 reps al 90%. Controlar fase excéntrica en 3 segundos.',
      sets: [
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exAbsInferioresInclinado,
      displayName: 'Abs Inferiores Banco Inclinado Elevación de Piernas',
      notes: 'Elevación de piernas en banco inclinado: 4 series x 12 reps con MOVIMIENTO LENTO y sin balanceo.',
      sets: [
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
        { reps: 12, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exAbsOblicuosLumbares,
      displayName: 'Abs Oblicuos Máquina Lumbares',
      notes: 'Flexiones laterales en banco de 45°: 4 series x 10 reps por lado con MOVIMIENTO LENTO.',
      sets: [
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
      ],
    },
    {
      exercise_id: exAbsSmithBarraDisco,
      displayName: 'Abs en Smith / Barra / Disco',
      notes: 'Rollout o crunch con barra/disco: 4 series x 10 reps con MOVIMIENTO LENTO.',
      sets: [
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
        { reps: 10, rpe: 9, rest: 60 },
      ],
    },
  ];

  // -------------------------------------------------------------------------
  // PASO 3: CREAR LAS 4 RUTINAS INDIVIDUALES NIVEL NINJA
  // -------------------------------------------------------------------------
  await createTemplateRoutine({
    title: 'Ninja: Piernas Posterior y Glúteos',
    description: 'Rutina Nivel Ninja de alta intensidad enfocada en cadena posterior, glúteos e isquiotibiales.',
    days: [
      {
        name: 'Día 1: Piernas Posterior y Glúteos',
        muscle_group: 'Piernas',
        exercises: r1Exercises,
      },
    ],
  });

  await createTemplateRoutine({
    title: 'Ninja: Espalda, Bíceps y Tríceps',
    description: 'Rutina Nivel Ninja de tracción y brazos: dorsal ancho, remos con aislamiento y super sets de tríceps y bíceps.',
    days: [
      {
        name: 'Día 2: Espalda, Bíceps y Tríceps',
        muscle_group: 'Espalda',
        exercises: r2Exercises,
      },
    ],
  });

  await createTemplateRoutine({
    title: 'Ninja: Cuádriceps y Hombros',
    description: 'Rutina Nivel Ninja de empuje inferior y hombros: Hack squat, prensa en myo-reps, sissy squats y hombro completo.',
    days: [
      {
        name: 'Día 3: Cuádriceps y Hombros',
        muscle_group: 'Cuádriceps',
        exercises: r3Exercises,
      },
    ],
  });

  await createTemplateRoutine({
    title: 'Ninja: Glúteos y Abdominales',
    description: 'Rutina Nivel Ninja de glúteo focalizado, femoral y circuito de core/abdominales a ritmo lento.',
    days: [
      {
        name: 'Día 4: Glúteos y Abdominales',
        muscle_group: 'Glúteos',
        exercises: r4Exercises,
      },
    ],
  });

  // -------------------------------------------------------------------------
  // PASO 4: CREAR LA RUTINA COMPLETA "PLAN NINJA (4 DÍAS)"
  // -------------------------------------------------------------------------
  await createTemplateRoutine({
    title: 'Plan Ninja 4 Días (Completo)',
    description: 'Periodización completa Nivel Ninja de 4 sesiones semanales: Piernas Posterior/Glúteos, Espalda/Brazos, Cuádriceps/Hombros y Glúteos/Abs.',
    days: [
      {
        name: 'Día 1: Piernas Posterior y Glúteos',
        muscle_group: 'Piernas',
        exercises: r1Exercises,
      },
      {
        name: 'Día 2: Espalda, Bíceps y Tríceps',
        muscle_group: 'Espalda',
        exercises: r2Exercises,
      },
      {
        name: 'Día 3: Cuádriceps y Hombros',
        muscle_group: 'Cuádriceps',
        exercises: r3Exercises,
      },
      {
        name: 'Día 4: Glúteos y Abdominales',
        muscle_group: 'Glúteos',
        exercises: r4Exercises,
      },
    ],
  });

  console.log('\n========================================================================');
  console.log('¡TODAS LAS RUTINAS NINJA HAN SIDO CREADAS CON ÉXITO EN SUPABASE!');
  console.log('Disponibles en tu panel de Coach para adjudicar a cualquier alumno.');
  console.log('========================================================================\n');
}

run().catch((err) => {
  console.error('Error fatal ejecutando script de rutinas Ninja:', err);
  process.exit(1);
});
