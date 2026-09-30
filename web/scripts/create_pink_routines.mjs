import fs from 'fs';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabaseUrl = urlMatch[1].trim();
const supabase = createClient(supabaseUrl, keyMatch[1].trim());

const DAY_1_EXERCISES = [
  {
    exercise_id: '7d8e5b85-c3dd-4fe9-b86c-f1d39d5df3d2', // Sentadilla en Smith Profunda
    label: 'SENTADILLA PROFUNDA',
    sets: 4,
    reps: 12,
    weight_kg: 40,
    rest: 60,
    notes: 'Sentadilla profunda con rango de movimiento completo. Mantén la espalda recta y control en la bajada.',
  },
  {
    exercise_id: '0225b3a0-fb91-4c67-aa27-3d8213ba6776', // Hip Thrust con Barra en Banco
    label: 'HIP TRUST',
    sets: 5,
    reps: 12,
    weight_kg: 70,
    rest: 60,
    notes: 'Pausa de 1 segundo en máxima contracción de glúteos arriba. Aprieta fuerte.',
  },
  {
    exercise_id: '450565e9-160f-47b3-aa6d-f11bcc3e7c49', // Subidas al Cajón para Glúteos (Agarre Cruzado)
    label: 'SUBIDAS AL CAJON',
    sets: 3,
    reps: 10,
    weight_kg: 0,
    rest: 60,
    notes: 'Subidas al cajón para glúteo con agarre cruzado de soporte. Empuje desde el talón de la pierna sobre el cajón.',
  },
  {
    exercise_id: 'bdf1cccb-e275-455a-ac1c-b7aff18f133d', // Abducciones de Cadera en Máquina
    label: 'ABDUCTORES',
    sets: 4,
    reps: 12,
    weight_kg: 30,
    rest: 60,
    notes: 'Abducciones en máquina con tronco ligeramente adelantado para máxima activación de glúteo medio.',
  },
  {
    exercise_id: '9daa2a61-80b8-4d24-9adc-1c6556badbf4', // Hiperextensiones a 45° para Femorales / Isquiosurales (Banco de Lumbares)
    label: 'ISQUIOS EN MAQUINA DE LUMBARES',
    sets: 4,
    reps: 10,
    weight_kg: 0,
    rest: 60,
    notes: 'Hiperextensiones en banco de lumbares focalizadas en isquiotibiales con espalda neutra y bisagra de cadera.',
  },
  {
    exercise_id: '96ef2fec-6e2b-4688-a69b-7e5cad517c51', // Patada de Glúteos en Polea (Cable)
    label: 'PATADA DE GLUTEOS',
    sets: 3,
    reps: 10,
    weight_kg: 15,
    rest: 60,
    notes: 'Patada en polea con tobillera. Movimiento controlado sin arquear la zona lumbar.',
  },
];

const DAY_2_EXERCISES = [
  {
    exercise_id: '82c41945-b096-46fd-88d9-5694e6e8ecfb', // Sentadilla Hack Inclinada
    label: 'HACK INCLINADO',
    sets: 4,
    reps: 10,
    weight_kg: 20,
    rest: 60,
    notes: 'Sentadilla Hack inclinada. Descenso profundo y controlado con tensión continua en cuádriceps.',
  },
  {
    exercise_id: 'cc34d3dc-b8f9-49b6-a464-d4a38036fd9e', // Prensa de Piernas a 45°
    label: 'PRENSA',
    sets: 3,
    reps: 15,
    weight_kg: 30,
    rest: 60,
    notes: '15*5*5: 15 repeticiones seguidas de 2 micropausas de 10-15s para sacar 5 y 5 repeticiones más (Rest-Pause).',
  },
  {
    exercise_id: '548ed9d4-259b-4415-9387-e5ec3b4bc0aa', // Sentadilla Sissy (Sisi Cuádriceps)
    label: 'SISI CUADRICEPS',
    sets: 3,
    reps: 10,
    weight_kg: 0,
    rest: 60,
    notes: 'En máquina de Sissy Squat con pies trabados. Aislamiento y máxima extensión de cuádriceps.',
  },
  {
    exercise_id: 'ca5831ee-2d23-43b9-94bc-b93b965ac149', // Extensiones de Cuádriceps en Máquina
    label: 'CUADRICERA',
    sets: 2,
    reps: 25,
    weight_kg: 30,
    rest: 60,
    notes: 'Serie de alta congestión metabólica a 25 repeticiones con ritmo continuo.',
  },
  {
    exercise_id: 'f4bad94a-d1c4-42c1-bd6f-17e105871ad0', // Aductores en Máquina (Adductor Machine)
    label: 'ADUCTORES MAQUINA',
    sets: 3,
    reps: 12,
    weight_kg: 30,
    rest: 60,
    notes: 'Cierre completo y controlado apretando 1 segundo en el punto de máxima contracción.',
  },
  {
    exercise_id: 'f18614a8-1b30-4ab4-bcdf-8f708b6cc6b7', // Elevación de Piernas en Banco Inclinado (Abs Inferiores)
    label: 'ABS INFERIOR BANCO INCLINADO',
    sets: 4,
    reps: 15,
    weight_kg: 0,
    rest: 60,
    notes: 'Elevaciones de piernas en banco inclinado con elevación de pelvis arriba sin usar balanceo.',
  },
  {
    exercise_id: 'd67f10d2-b651-4097-a667-374aeae17508', // Oblicuos en Banco de Hiperextensiones / Lumbares
    label: 'ABS OBLICUO MAQUINA LUMBARES',
    sets: 4,
    reps: 15,
    weight_kg: 0,
    rest: 60,
    notes: 'Flexión lateral de tronco en banco de hiperextensiones para activación de oblicuos por lado.',
  },
  {
    exercise_id: 'c4d28a3f-f82f-4a13-9e2f-085cc0d9abd8', // Crunches en Polea Alta de Rodillas (Cable Crunch)
    label: 'ABS CRUNCH POLEA',
    sets: 4,
    reps: 15,
    weight_kg: 0,
    rest: 60,
    notes: 'Crunches arrodillado con cuerda en polea alta flexionando la columna hacia las rodillas.',
  },
];

const DAY_3_EXERCISES = [
  {
    exercise_id: '1e75cbb8-0def-415d-a9f7-db332ee926dd', // Jalón al Pecho en Polea Alta
    label: 'DORSALES BARRA',
    sets: 3,
    reps: 12,
    weight_kg: 20,
    rest: 60,
    notes: 'Jalón en polea alta con barra ancha al pecho, retracción escapular y codos hacia los costados.',
  },
  {
    exercise_id: 'd013319e-404d-45b2-b902-64c55d43c95d', // Remo en Polea Baja Sentado
    label: 'REMO SENTADO POLEA',
    sets: 4,
    reps: 12,
    weight_kg: 20,
    rest: 60,
    notes: 'Remo sentado en polea baja con agarre neutro. Pecho erguido y recorrido completo.',
  },
  {
    exercise_id: 'b4a8edb1-43e0-469d-9157-04301a6f3ea3', // Jalón al Pecho con Agarre Cerrado Neutro
    label: 'DORSALES AGARRE CERRADO',
    sets: 3,
    reps: 12,
    weight_kg: 20,
    rest: 60,
    notes: 'Jalón con agarre cerrado en V para activación de la parte baja y media de los dorsales.',
  },
  {
    exercise_id: '3185a0a5-8722-49b5-a9f5-94233877356e', // Press Militar Sentado con Mancuernas
    label: 'PRESS MILITAR',
    sets: 4,
    reps: 12,
    weight_kg: 5,
    rest: 60,
    notes: 'Press militar sentado con mancuernas. Codos a 75° respecto al torso, sin arquear la zona lumbar.',
  },
  {
    exercise_id: '41f72c6a-54d2-4c18-9b4a-69731e998906', // Elevaciones Laterales con Mancuernas
    label: 'VUELOS LATERALES',
    sets: 4,
    reps: 10,
    weight_kg: 3,
    rest: 60,
    notes: 'Elevaciones laterales con codos ligeramente flexionados, subiendo hasta la altura de los hombros.',
  },
  {
    exercise_id: 'bf481a2a-6549-4dc3-addb-615436755307', // Elevaciones Frontales con Mancuernas
    label: 'VUELOS FRONTALES',
    sets: 4,
    reps: 10,
    weight_kg: 3,
    rest: 60,
    notes: 'Elevaciones frontales con mancuernas alternadas o simultáneas con control excéntrico.',
  },
  {
    exercise_id: 'e62d44c0-5306-491e-b26a-283b30900b23', // Face Pull con Cuerda en Polea Alta
    label: 'PULL FACE',
    sets: 4,
    reps: 12,
    weight_kg: 20,
    rest: 60,
    notes: 'Face pull hacia la frente con rotación externa al final para deltoides posterior y salud escapular.',
  },
  {
    exercise_id: '2581b87d-1c85-4c96-9a20-fbc40e09754e', // Extensiones de Tríceps en Polea Alta con Cuerda
    label: 'TRICEPS',
    sets: 4,
    reps: 12,
    weight_kg: 20,
    rest: 60,
    notes: 'Extensiones de tríceps en polea alta con cuerda abriendo al final para máxima contracción.',
  },
];

async function createRoutineTemplate(title, description, days) {
  console.log(`\n=== Creando Rutina Plantilla: "${title}" ===`);

  // 1. Insertar Rutina Maestra / Plantilla
  const routineId = crypto.randomUUID();
  const { error: rErr } = await supabase.from('routines').insert({
    id: routineId,
    title,
    description,
    is_template: true,
    is_active: true,
    client_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  if (rErr) throw new Error(`Error insertando rutina (${title}): ${rErr.message}`);
  console.log(`✅ Rutina creada: ${routineId}`);

  // 2. Insertar Días
  for (let dIdx = 0; dIdx < days.length; dIdx++) {
    const dayDef = days[dIdx];
    const dayId = crypto.randomUUID();

    const { error: dayErr } = await supabase.from('routine_days').insert({
      id: dayId,
      routine_id: routineId,
      name: dayDef.name,
      day_number: dIdx + 1,
      order_index: dIdx,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (dayErr) throw new Error(`Error insertando día (${dayDef.name}): ${dayErr.message}`);
    console.log(`  📅 Día ${dIdx + 1}: "${dayDef.name}" (${dayId})`);

    // 3. Insertar Ejercicios y Series
    for (let eIdx = 0; eIdx < dayDef.exercises.length; eIdx++) {
      const exItem = dayDef.exercises[eIdx];
      const rxId = crypto.randomUUID();

      const { error: rxErr } = await supabase.from('routine_exercises').insert({
        id: rxId,
        routine_day_id: dayId,
        exercise_id: exItem.exercise_id,
        order_index: eIdx,
        notes: exItem.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (rxErr) throw new Error(`Error insertando routine_exercise (${exItem.label}): ${rxErr.message}`);

      const setsToInsert = [];
      for (let s = 1; s <= exItem.sets; s++) {
        setsToInsert.push({
          id: crypto.randomUUID(),
          routine_exercise_id: rxId,
          set_number: s,
          target_reps: exItem.reps,
          target_weight_kg: exItem.weight_kg,
          target_rpe: 8,
          rest_seconds: exItem.rest,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }

      const { error: setsErr } = await supabase.from('routine_exercise_sets').insert(setsToInsert);
      if (setsErr) throw new Error(`Error insertando series (${exItem.label}): ${setsErr.message}`);

      console.log(`     [${eIdx + 1}/${dayDef.exercises.length}] ${exItem.label} -> ${exItem.sets}x${exItem.reps} (${exItem.weight_kg} kg, ${exItem.rest}s)`);
    }
  }

  return routineId;
}

async function main() {
  console.log('🚀 Iniciando creación de las rutinas PINK...');

  // 1. PINK - Isquios & Glúteos
  const idR1 = await createRoutineTemplate(
    'PINK - Isquios & Glúteos',
    'Rutina PINK (Día 1): Enfoque especializado en cadena posterior, hipertrofia de glúteos e isquiotibiales con sentadilla profunda, hip thrust, subidas al cajón y abductores.',
    [
      {
        name: 'Isquios & Glúteos',
        exercises: DAY_1_EXERCISES,
      },
    ]
  );

  // 2. PINK - Cuádriceps y ABS
  const idR2 = await createRoutineTemplate(
    'PINK - Cuádriceps y ABS',
    'Rutina PINK (Día 2): Desarrollo de fuerza y volumen en cuádriceps y aductores (Hack, prensa myo-reps 15*5*5, sissy squats, cuadricera) más circuito de abdomen inferior, oblicuos y crunch en polea.',
    [
      {
        name: 'Cuádriceps y ABS',
        exercises: DAY_2_EXERCISES,
      },
    ]
  );

  // 3. PINK - Espalda, Hombros y Brazos
  const idR3 = await createRoutineTemplate(
    'PINK - Espalda, Hombros y Brazos',
    'Rutina PINK (Día 3): Tonificación y definición completa de tren superior: dorsales en barra, remo sentado, jaloneo agarre cerrado, press militar, vuelos laterales, vuelos frontales, pull face y tríceps.',
    [
      {
        name: 'Espalda, Hombros y Brazos',
        exercises: DAY_3_EXERCISES,
      },
    ]
  );

  // 4. PINK - Programa Completo (3 Días)
  const idR4 = await createRoutineTemplate(
    'PINK (Programa Completo - 3 Días)',
    'Programa Oficial PINK Completo de 3 Días para adjudicar en un solo clic: Día 1 Isquios & Glúteos, Día 2 Cuádriceps y ABS, Día 3 Espalda, Hombros y Brazos.',
    [
      {
        name: 'Día 1: Isquios & Glúteos',
        exercises: DAY_1_EXERCISES,
      },
      {
        name: 'Día 2: Cuádriceps y ABS',
        exercises: DAY_2_EXERCISES,
      },
      {
        name: 'Día 3: Espalda, Hombros y Brazos',
        exercises: DAY_3_EXERCISES,
      },
    ]
  );

  console.log('\n======================================================');
  console.log('🎉 ¡Todas las rutinas PINK han sido creadas exitosamente!');
  console.log(`1. PINK - Isquios & Glúteos (ID: ${idR1})`);
  console.log(`2. PINK - Cuádriceps y ABS (ID: ${idR2})`);
  console.log(`3. PINK - Espalda, Hombros y Brazos (ID: ${idR3})`);
  console.log(`4. PINK (Programa Completo - 3 Días) (ID: ${idR4})`);
  console.log('======================================================\n');
}

main().catch((err) => {
  console.error('Error fatal:', err);
  process.exit(1);
});
