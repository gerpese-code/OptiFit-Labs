import fs from 'fs';
import zlib from 'zlib';
import crypto from 'crypto';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const omggif = require('./lib/omggif.js');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabaseUrl = urlMatch[1].trim();
const supabase = createClient(supabaseUrl, keyMatch[1].trim());

function rgbaToPng(width, height, rgba) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let scanlineOffset = 0;
  let rgbaOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanlineOffset++] = 0;
    for (let x = 0; x < width; x++) {
      scanlines[scanlineOffset++] = rgba[rgbaOffset++];
      scanlines[scanlineOffset++] = rgba[rgbaOffset++];
      scanlines[scanlineOffset++] = rgba[rgbaOffset++];
      scanlines[scanlineOffset++] = rgba[rgbaOffset++];
    }
  }

  const compressed = zlib.deflateSync(scanlines);

  const crcTable = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
    }
    crcTable[n] = c;
  }
  function crc32(buf) {
    let c = 0xffffffff;
    for (let i = 0; i < buf.length; i++) {
      c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
    }
    return (c ^ 0xffffffff) >>> 0;
  }

  function makeChunk(type, data) {
    const len = data.length;
    const buf = Buffer.alloc(8 + len + 4);
    buf.writeUInt32BE(len, 0);
    buf.write(type, 4, 4, 'ascii');
    data.copy(buf, 8);
    const crc = crc32(buf.subarray(4, 8 + len));
    buf.writeUInt32BE(crc, 8 + len);
    return buf;
  }

  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

async function ensureExercise5() {
  const name = 'Pecho Superior en Máquina Empuje Individual';
  const { data: existing } = await supabase
    .from('exercises')
    .select('id, name, image_urls, gif_url')
    .eq('name', name)
    .maybeSingle();

  if (existing) {
    console.log(`Exercise 5 already exists with ID: ${existing.id}`);
    return existing.id;
  }

  console.log(`Creating exercise 5: "${name}"...`);
  const exerciseId = crypto.randomUUID();
  const gifUrl = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/pectorals/lever-incline-chest-press.gif';

  console.log('Downloading GIF and extracting phase frames...');
  const res = await fetch(gifUrl);
  if (!res.ok) throw new Error(`Failed to fetch GIF: ${res.statusText}`);
  const gifBuf = Buffer.from(await res.arrayBuffer());

  const reader = new omggif.GifReader(gifBuf);
  const w = reader.width;
  const h = reader.height;
  const totalFrames = reader.numFrames();
  const midIdx = Math.max(1, Math.floor(totalFrames / 2));

  // Frame 0: Contraction / Top
  const rgba0 = new Uint8Array(w * h * 4);
  reader.decodeAndBlitFrameRGBA(0, rgba0);
  const png0 = rgbaToPng(w, h, Buffer.from(rgba0));

  // Mid frame: Stretch / Bottom
  const rgbaMid = new Uint8Array(w * h * 4);
  for (let f = 0; f <= midIdx; f++) {
    reader.decodeAndBlitFrameRGBA(f, rgbaMid);
  }
  const png1 = rgbaToPng(w, h, Buffer.from(rgbaMid));

  console.log('Uploading images to Supabase Storage...');
  const path0 = `exercises/${exerciseId}/phase-0.png`;
  const path1 = `exercises/${exerciseId}/phase-1.png`;

  const [up0, up1] = await Promise.all([
    supabase.storage.from('exercise-media').upload(path0, png0, { contentType: 'image/png', upsert: true }),
    supabase.storage.from('exercise-media').upload(path1, png1, { contentType: 'image/png', upsert: true })
  ]);

  if (up0.error) throw new Error(`Upload path0 failed: ${up0.error.message}`);
  if (up1.error) throw new Error(`Upload path1 failed: ${up1.error.message}`);

  const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
  const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;

  const exerciseRecord = {
    id: exerciseId,
    name: name,
    muscle_group: 'Pecho',
    description: 'Press inclinado en máquina de palancas convergentes con empuje individual / unilateral. Permite un estímulo enfocado en la porción clavicular del pectoral mayor con trayectoria guiada y trabajo simétrico sin desbalances.',
    video_url: null,
    gif_url: gifUrl,
    image_urls: [publicUrl0, publicUrl1],
    is_custom: false,
    updated_at: new Date().toISOString()
  };

  const { error: insErr } = await supabase.from('exercises').insert(exerciseRecord);
  if (insErr) throw new Error(`Failed to insert exercise: ${insErr.message}`);

  console.log(`✅ Created exercise: ${name} (${exerciseId})`);
  return exerciseId;
}

async function main() {
  console.log('=== Step 1: Ensure Exercise 5 exists in catalog ===');
  const ex5Id = await ensureExercise5();

  const routineItems = [
    {
      order: 0,
      label: 'PRESS PECHO PLANO',
      exercise_id: 'da0e4d00-4e7f-446b-9e28-c261bd079cd4', // Press de Banca Plano con Barra (Bench Press)
      sets: 4,
      reps: 6,
      rest: 90,
      notes: 'Press de banca plano con barra. Retracción escapular firme, pies apoyados en el suelo, control de bajada al esternón medio y empuje explosivo sin despegar la espalda.'
    },
    {
      order: 1,
      label: 'PRESS PECHO INCLINADO',
      exercise_id: '20e395fe-2a0b-4a55-aaa5-86d718d67258', // Press Inclinado con Barra (Incline Barbell Press)
      sets: 4,
      reps: 12,
      rest: 90,
      notes: 'Press inclinado en banco a 30°-45°. Bajar la barra a la parte superior del pecho de forma controlada y empujar contrayendo el haz clavicular.'
    },
    {
      order: 2,
      label: 'FONDOS PARALELAS',
      exercise_id: '04993959-2ea6-4375-a327-2af761a7188b', // Fondos en Paralelas para Pecho (Chest Dips)
      sets: 4,
      reps: 12,
      rest: 90,
      notes: 'Fondos en paralelas con ligera inclinación del torso hacia adelante para enfatizar el pectoral inferior y medio. Controlar el descenso hasta 90° en codos.'
    },
    {
      order: 3,
      label: 'APERTURAS MARIPOSA',
      exercise_id: '9e9d85fd-f29a-494b-bf2a-5ec2da80d2a2', // Aperturas en Máquina Peck Deck (Pec Deck Flyes)
      sets: 4,
      reps: 12,
      rest: 90,
      notes: 'Aperturas mariposa en máquina Peck Deck. Codos semiflexionados a la altura de los hombros, juntar al centro con 1 segundo de contracción isométrica.'
    },
    {
      order: 4,
      label: 'PECHO SUPERIOR EN MAQUINA EMPUJE INDIVIDUAL',
      exercise_id: ex5Id, // Pecho Superior en Máquina Empuje Individual
      sets: 3,
      reps: 10,
      rest: 90,
      notes: 'Press inclinado en máquina de palancas convergente con brazos independientes. Empuje constante sintiendo la tensión máxima en la parte alta del pecho.'
    },
    {
      order: 5,
      label: 'TRICEPS POLEA CON BARRA',
      exercise_id: '88bd5712-df63-4498-bd8b-db24ee72317b', // Extensiones de Tríceps en Polea con Barra V
      sets: 3,
      reps: 10,
      rest: 60,
      notes: 'Extensiones de tríceps en polea alta con barra. Codos pegados a los costados sin adelantarlos, extensión completa abajo bloqueando con tríceps.'
    },
    {
      order: 6,
      label: 'TRICEPS CUERDA',
      exercise_id: '2581b87d-1c85-4c96-9a20-fbc40e09754e', // Extensiones de Tríceps en Polea Alta con Cuerda
      sets: 3,
      reps: 12,
      rest: 60,
      notes: 'Extensiones con cuerda en polea alta. Abrir la cuerda en la parte final del recorrido para máxima contracción de la cabeza lateral del tríceps.'
    },
    {
      order: 7,
      label: 'ABS OBLICUOS EN BANCO DE LUMBARES',
      exercise_id: 'd67f10d2-b651-4097-a667-374aeae17508', // Oblicuos en Banco de Hiperextensiones / Lumbares
      sets: 4,
      reps: 12,
      rest: 60,
      notes: 'Flexión lateral de tronco en banco a 45°. Colocar el cuerpo lateralmente, bajar flexionando la cintura y contraer fuertemente el oblicuo al subir.'
    },
    {
      order: 8,
      label: 'ABS INFERIORES EN BANCO INCLINADO',
      exercise_id: 'f18614a8-1b30-4ab4-bcdf-8f708b6cc6b7', // Elevación de Piernas en Banco Inclinado (Abs Inferiores)
      sets: 4,
      reps: 12,
      rest: 60,
      notes: 'Elevaciones de piernas en banco inclinado sujetando la cabecera. Elevar las piernas y despegar ligeramente la pelvis para activar la zona baja del recto abdominal.'
    }
  ];

  console.log('\n=== Step 2: Check or Clean Existing "BEST" Routine ===');
  const { data: existingRoutines } = await supabase
    .from('routines')
    .select('id, title')
    .ilike('title', 'BEST');

  if (existingRoutines && existingRoutines.length > 0) {
    for (const r of existingRoutines) {
      console.log(`Cleaning old routine: ${r.title} (${r.id})...`);
      // Delete days (cascades or delete explicitly)
      const { data: days } = await supabase.from('routine_days').select('id').eq('routine_id', r.id);
      for (const d of days || []) {
        const { data: rxs } = await supabase.from('routine_exercises').select('id').eq('routine_day_id', d.id);
        for (const rx of rxs || []) {
          await supabase.from('routine_exercise_sets').delete().eq('routine_exercise_id', rx.id);
        }
        await supabase.from('routine_exercises').delete().eq('routine_day_id', d.id);
      }
      await supabase.from('routine_days').delete().eq('routine_id', r.id);
      await supabase.from('routines').delete().eq('id', r.id);
    }
  }

  console.log('\n=== Step 3: Create Routine "BEST" as Master Template ===');
  const routineId = crypto.randomUUID();
  const { data: newRoutine, error: routErr } = await supabase
    .from('routines')
    .insert({
      id: routineId,
      title: 'BEST',
      description: 'Rutina BEST - Día de Pecho, Tríceps y Abdominales (Plantilla Maestra lista para asignar a alumnos)',
      is_active: true,
      is_template: true,
      client_id: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (routErr) throw new Error(`Failed to create routine: ${routErr.message}`);
  console.log(`✅ Routine BEST created with ID: ${newRoutine.id}`);

  console.log('\n=== Step 4: Create Routine Day: "Día 1 - Pecho" ===');
  const dayId = crypto.randomUUID();
  const { data: newDay, error: dayErr } = await supabase
    .from('routine_days')
    .insert({
      id: dayId,
      routine_id: routineId,
      name: 'Día 1 - Pecho',
      day_number: 1,
      order_index: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (dayErr) throw new Error(`Failed to create day: ${dayErr.message}`);
  console.log(`✅ Routine Day created with ID: ${newDay.id}`);

  console.log('\n=== Step 5: Insert Exercises and Sets ===');
  for (const item of routineItems) {
    const rxId = crypto.randomUUID();
    const { error: rxErr } = await supabase
      .from('routine_exercises')
      .insert({
        id: rxId,
        routine_day_id: dayId,
        exercise_id: item.exercise_id,
        order_index: item.order,
        notes: item.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (rxErr) throw new Error(`Failed to insert routine_exercise (${item.label}): ${rxErr.message}`);

    const setsToInsert = [];
    for (let s = 1; s <= item.sets; s++) {
      setsToInsert.push({
        id: crypto.randomUUID(),
        routine_exercise_id: rxId,
        set_number: s,
        target_reps: item.reps,
        target_weight_kg: 0,
        target_rpe: 8,
        rest_seconds: item.rest,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }

    const { error: setsErr } = await supabase
      .from('routine_exercise_sets')
      .insert(setsToInsert);

    if (setsErr) throw new Error(`Failed to insert sets for (${item.label}): ${setsErr.message}`);
    console.log(`  [${item.order + 1}/9] ✅ ${item.label} -> ${item.sets} series x ${item.reps} reps`);
  }

  console.log('\n=== Step 6: Final Verification ===');
  const { data: verifyRoutine } = await supabase
    .from('routines')
    .select(`
      id,
      title,
      is_template,
      client_id,
      routine_days (
        id,
        name,
        day_number,
        order_index,
        routine_exercises (
          id,
          order_index,
          notes,
          exercises (
            id,
            name,
            muscle_group,
            gif_url
          ),
          routine_exercise_sets (
            id,
            set_number,
            target_reps,
            target_weight_kg,
            rest_seconds
          )
        )
      )
    `)
    .eq('id', routineId)
    .single();

  console.log(`\n🎉 Verification of "${verifyRoutine.title}" (Template: ${verifyRoutine.is_template}):`);
  const day = verifyRoutine.routine_days[0];
  console.log(`Day: ${day.name}`);
  const sortedExercises = (day.routine_exercises || []).sort((a, b) => a.order_index - b.order_index);
  sortedExercises.forEach((re, idx) => {
    const sCount = re.routine_exercise_sets?.length;
    const reps = re.routine_exercise_sets?.[0]?.target_reps;
    console.log(`  ${idx + 1}. ${re.exercises?.name} -> ${sCount} series x ${reps} reps`);
  });

  console.log('\n✨ Routine BEST created successfully and ready to be assigned to any student!');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
