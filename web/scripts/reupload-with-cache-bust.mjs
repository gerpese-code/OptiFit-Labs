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

const corrections = {
  // 1. Pullover en Polea Alta con Brazos Rectos
  'Pullover en Polea Alta con Brazos Rectos': 'lats/cable-pushdown-straight-arm-v-2.gif',
  'Pullover en Polea Alta con Cuerda': 'lats/cable-straight-arm-pulldown-with-rope.gif',
  'Dorsales en Polea Batman / Pullover Polea': 'lats/cable-straight-arm-pulldown-with-rope.gif',

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

async function main() {
  console.log('🔄 RE-SUBIENDO IMÁGENES CON VERSIÓN V2 (CACHE-BUSTING)...\n');

  const { data: dbExercises } = await supabase.from('exercises').select('id, name, muscle_group');
  const nameMap = new Map();
  for (const ex of dbExercises || []) {
    nameMap.set(ex.name.trim(), ex);
  }

  const updatedCatalog = [];

  for (const [name, path] of Object.entries(corrections)) {
    const dbEx = nameMap.get(name.trim());
    if (!dbEx) {
      console.log(`⚠️ No encontrado en DB: ${name}`);
      continue;
    }

    const gifUrl = `https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/${path}`;
    try {
      const res = await fetch(gifUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());

      const reader = new omggif.GifReader(buf);
      const w = reader.width;
      const h = reader.height;
      const totalFrames = reader.numFrames();
      const midIdx = Math.max(1, Math.floor(totalFrames / 2));

      // Fase 0
      const rgba0 = new Uint8Array(w * h * 4);
      reader.decodeAndBlitFrameRGBA(0, rgba0);
      const png0 = rgbaToPng(w, h, Buffer.from(rgba0));

      // Fase 1
      const rgbaMid = new Uint8Array(w * h * 4);
      for (let f = 0; f <= midIdx; f++) {
        reader.decodeAndBlitFrameRGBA(f, rgbaMid);
      }
      const png1 = rgbaToPng(w, h, Buffer.from(rgbaMid));

      // Subir con nombres v2 para romper cualquier caché
      const path0 = `exercises/${dbEx.id}/phase-0-v2.png`;
      const path1 = `exercises/${dbEx.id}/phase-1-v2.png`;

      await Promise.all([
        supabase.storage.from('exercise-media').upload(path0, png0, { contentType: 'image/png', upsert: true }),
        supabase.storage.from('exercise-media').upload(path1, png1, { contentType: 'image/png', upsert: true })
      ]);

      const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
      const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;

      await supabase
        .from('exercises')
        .update({
          image_urls: [publicUrl0, publicUrl1],
          gif_url: gifUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', dbEx.id);

      updatedCatalog.push({
        id: dbEx.id,
        name: dbEx.name,
        gif_url: gifUrl,
        image_urls: [publicUrl0, publicUrl1]
      });

      console.log(`✅ ${name} -> V2 subida con éxito (${publicUrl0})`);
    } catch (e) {
      console.error(`❌ Error en ${name}:`, e.message);
    }
  }

  // Sincronizar defaultExercises.ts
  const defPath = 'src/lib/data/defaultExercises.ts';
  if (fs.existsSync(defPath)) {
    let defContent = fs.readFileSync(defPath, 'utf8');
    for (const item of updatedCatalog) {
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`("name":\\s*"${escapedName}"[\\s\\S]*?"gif_url":\\s*)(?:null|"[^"]*")([\\s\\S]*?"image_urls":\\s*\\[)[^\\]]*(\\])`);
      if (regex.test(defContent)) {
        defContent = defContent.replace(regex, `$1"${item.gif_url}"$2\n      "${item.image_urls[0]}",\n      "${item.image_urls[1]}"\n    $3`);
      }
    }
    fs.writeFileSync(defPath, defContent, 'utf8');
    console.log('✅ defaultExercises.ts sincronizado con URLs v2!');
  }
}

main().catch(console.error);
