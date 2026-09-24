import fs from 'fs';
import zlib from 'zlib';
import { createRequire } from 'module';
import { createClient } from '@supabase/supabase-js';

const require = createRequire(import.meta.url);
const omggif = require('./lib/omggif.js');

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabaseUrl = urlMatch[1].trim();
const supabase = createClient(supabaseUrl, keyMatch[1].trim());

// Pure Node.js RGBA to PNG Encoder
function rgbaToPng(width, height, rgba) {
  const scanlines = Buffer.alloc(height * (1 + width * 4));
  let scanlineOffset = 0;
  let rgbaOffset = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanlineOffset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      scanlines[scanlineOffset++] = rgba[rgbaOffset++]; // R
      scanlines[scanlineOffset++] = rgba[rgbaOffset++]; // G
      scanlines[scanlineOffset++] = rgba[rgbaOffset++]; // B
      scanlines[scanlineOffset++] = rgba[rgbaOffset++]; // A
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
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

const corrections = {
  // 1. Pullover en Polea Alta con Brazos Rectos (Principal feedback del usuario)
  'Pullover en Polea Alta con Brazos Rectos': 'lats/cable-pushdown-straight-arm-v-2.gif',
  'Pullover en Polea Alta con Cuerda': 'lats/cable-straight-arm-pulldown-with-rope.gif',

  // 2. Pecho
  'Press Plano con Mancuernas (Flat DB Press)': 'pectorals/dumbbell-bench-press.gif',
  'Press de Banca Plano con Barra (Bench Press)': 'pectorals/barbell-bench-press.gif',
  'Press Inclinado con Mancuernas': 'pectorals/dumbbell-incline-bench-press.gif',
  'Press Inclinado con Mancuernas (Incline DB Press)': 'pectorals/dumbbell-incline-bench-press.gif',
  'Cruces en Polea Media / Cruz de Hierro': 'pectorals/cable-middle-fly.gif',

  // 3. Glúteos y Piernas
  'Hip Thrust con Barra en Banco (Barbell Hip Thrust)': 'glutes/barbell-glute-bridge-two-legs-on-bench-male.gif',
  'Prensa de Piernas 45° (Leg Press)': 'glutes/sled-45-leg-press.gif',
  'Subidas al Banco con Barra (Step-Ups)': 'glutes/barbell-step-up.gif',
  'Subidas al Banco con Elevación de Rodilla': 'glutes/dumbbell-step-up.gif',
  'Zancadas Caminando con Peso Corporal': 'glutes/walking-lunge.gif',
  'Zancadas Caminando con Barra para Glúteos': 'glutes/barbell-lunge.gif',
  'Sentadilla Trasera con Barra (Back Squat)': 'glutes/barbell-full-squat.gif',

  // 4. Hombros
  'Face Pull en Polea Alta con Cuerda': 'delts/cable-standing-rear-delt-row-with-rope.gif',
  'Press de Hombros Sentado con Mancuernas': 'delts/dumbbell-seated-shoulder-press.gif',
  'Press Militar de Pie con Barra (Military Press)': 'delts/barbell-standing-wide-military-press.gif',
  'Press Militar de Pie con Barra (OHP)': 'delts/barbell-standing-wide-military-press.gif',
  'Pájaros Tumbado en Banco Inclinado': 'delts/dumbbell-incline-rear-lateral-raise.gif',

  // 5. Tríceps
  'Press Francés con Barra Z en Banco Plano': 'triceps/barbell-lying-triceps-extension.gif',
  'Press Francés con Barra Z en Banco (Skull Crushers)': 'triceps/barbell-lying-triceps-extension.gif',
  'Extensión Unilateral en Polea Alta': 'triceps/cable-one-arm-tricep-pushdown.gif',

  // 6. Bíceps y Antebrazos
  'Curl Martillo con Mancuernas': 'biceps/dumbbell-hammer-curl.gif',
  'Flexiones de Muñeca con Barra (Flexores)': 'forearms/barbell-palms-up-wrist-curl-over-a-bench.gif',
  'Extensiones de Muñeca con Barra (Extensores)': 'forearms/barbell-palms-down-wrist-curl-over-a-bench.gif',

  // 7. Espalda
  'Remo Unilateral con Mancuerna (Kroc Row)': 'upper-back/dumbbell-one-arm-bent-over-row.gif',
  'Remo Unilateral con Mancuerna (Dumbbell Row)': 'upper-back/dumbbell-one-arm-bent-over-row.gif',
  'Remo con Barra 45° (Barbell Row)': 'upper-back/barbell-bent-over-row.gif',
  'Dominadas Pronas (Pull-Ups)': 'lats/pull-up.gif',
  'Jalón al Pecho con Agarre Cerrado Neutro (V-Bar Pulldown)': 'lats/cable-lateral-pulldown-with-v-bar.gif',

  // 8. Abdomen & Cardio
  'Abs Oblicuos con Banda Elástica': 'abs/band-standing-twisting-crunch.gif',
  'Rueda Abdominal (Ab Wheel Rollout)': 'abs/wheel-rollerout.gif',
  'Navajas / Jackknife Abdominal': 'abs/jackknife-sit-up.gif',
  'Plancha Abdominal Frontal (Plank)': 'abs/front-plank-with-twist.gif',
  'Remo Indoor en Máquina (Concept2 Rower)': 'cardio/cycle-cross-trainer.gif'
};

async function fetchWithRetry(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      if (res.ok) return Buffer.from(await res.arrayBuffer());
      throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      if (attempt === maxRetries) throw err;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  console.log('🚀 APLICANDO CORRECCIONES DE MULTIMEDIA Y MODELOS 3D...\n');

  const { data: dbExercises, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group');

  if (error || !dbExercises) {
    console.error('Error al obtener ejercicios de Supabase:', error);
    return;
  }

  const nameMap = new Map();
  for (const ex of dbExercises) {
    nameMap.set(ex.name.trim(), ex);
  }

  const updatedCatalog = [];
  const entries = Object.entries(corrections);
  let processed = 0;

  for (const [exName, gifRelPath] of entries) {
    const dbEx = nameMap.get(exName.trim());
    if (!dbEx) {
      console.warn(`⚠️ Ejercicio no encontrado en DB con nombre exacto: "${exName}"`);
      continue;
    }

    const gifUrl = `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/${gifRelPath}`;
    console.log(`[${++processed}/${entries.length}] 🔄 Procesando: "${exName}" -> ${gifRelPath}`);

    try {
      const buf = await fetchWithRetry(gifUrl);

      // Decodificar con omggif
      const reader = new omggif.GifReader(buf);
      const w = reader.width;
      const h = reader.height;
      const totalFrames = reader.numFrames();
      const midIdx = Math.max(1, Math.floor(totalFrames / 2));

      // Fase 0 (Inicio / Descenso)
      const rgba0 = new Uint8Array(w * h * 4);
      reader.decodeAndBlitFrameRGBA(0, rgba0);
      const pngPhase0 = rgbaToPng(w, h, Buffer.from(rgba0));

      // Fase 1 (Contracción / Final)
      const rgbaMid = new Uint8Array(w * h * 4);
      for (let f = 0; f <= midIdx; f++) {
        reader.decodeAndBlitFrameRGBA(f, rgbaMid);
      }
      const pngPhase1 = rgbaToPng(w, h, Buffer.from(rgbaMid));

      // Subir a Supabase Storage
      const path0 = `exercises/${dbEx.id}/phase-0.png`;
      const path1 = `exercises/${dbEx.id}/phase-1.png`;

      await Promise.all([
        supabase.storage.from('exercise-media').upload(path0, pngPhase0, { contentType: 'image/png', upsert: true }),
        supabase.storage.from('exercise-media').upload(path1, pngPhase1, { contentType: 'image/png', upsert: true })
      ]);

      const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
      const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;

      // Actualizar registro en Supabase
      const { error: updateError } = await supabase
        .from('exercises')
        .update({
          image_urls: [publicUrl0, publicUrl1],
          gif_url: gifUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbEx.id);

      if (updateError) {
        throw updateError;
      }

      updatedCatalog.push({
        id: dbEx.id,
        name: dbEx.name,
        gif_url: gifUrl,
        image_urls: [publicUrl0, publicUrl1]
      });

      console.log(`   ✅ "${exName}" actualizado con éxito en Supabase y Storage!`);
    } catch (err) {
      console.error(`   ❌ Error en "${exName}":`, err.message);
    }
  }

  console.log(`\n🎉 PROCESO COMPLETADO: ${updatedCatalog.length} ejercicios corregidos en Supabase.`);

  // Actualizar también defaultExercises.ts
  const defPath = 'src/lib/data/defaultExercises.ts';
  if (fs.existsSync(defPath)) {
    console.log('\n📝 Sincronizando defaultExercises.ts...');
    let defContent = fs.readFileSync(defPath, 'utf8');

    for (const item of updatedCatalog) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`("name":\\s*"${escapedName}"[\\s\\S]*?"gif_url":\\s*)(?:null|"[^"]*")([\\s\\S]*?"image_urls":\\s*\\[)[^\\]]*(\\])`);
      if (regex.test(defContent)) {
        defContent = defContent.replace(regex, `$1"${item.gif_url}"$2\n      "${item.image_urls[0]}",\n      "${item.image_urls[1]}"\n    $3`);
      }
    }

    fs.writeFileSync(defPath, defContent, 'utf8');
    console.log('✅ defaultExercises.ts actualizado y sincronizado!');
  }
}

main().catch(console.error);
