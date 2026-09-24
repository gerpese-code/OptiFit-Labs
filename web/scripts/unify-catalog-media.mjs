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

// Pure Node.js RGBA to PNG Encoder (Fast & Zero external dependencies)
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

  // CRC32 table
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

async function main() {
  console.log('🚀 INICIANDO SINCRONIZACIÓN Y UNIFORMACIÓN DE TODO EL CATÁLOGO...\n');

  const { data: dbExercises } = await supabase.from('exercises').select('id, name, muscle_group').order('name');
  console.log(`📋 Total de ejercicios en base de datos: ${dbExercises.length}`);

  const [esRes, enRes] = await Promise.all([
    fetch('https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/es/exercises.json').then(r => r.json()),
    fetch('https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/api/en/exercises.json').then(r => r.json())
  ]);

  const gymEs = esRes.exercises;
  const gymEn = enRes.exercises;

  // 1. Mapear cada ejercicio a su GIF oficial
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

  console.log(`✅ ${mapList.length} ejercicios mapeados. Extrayendo fases PNG y subiendo a Supabase Storage...\n`);

  let completed = 0;
  const updatedCatalog = [];

  // Procesar con concurrencia de 5 trabajadores
  const concurrency = 5;
  const queue = [...mapList];

  async function worker(workerId) {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) break;

      try {
        // Descargar GIF
        const res = await fetch(item.gifUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status} al descargar GIF`);
        const buf = Buffer.from(await res.arrayBuffer());

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

        // Subir a Supabase Storage bucket 'exercise-media'
        const path0 = `exercises/${item.id}/phase-0.png`;
        const path1 = `exercises/${item.id}/phase-1.png`;

        await Promise.all([
          supabase.storage.from('exercise-media').upload(path0, pngPhase0, { contentType: 'image/png', upsert: true }),
          supabase.storage.from('exercise-media').upload(path1, pngPhase1, { contentType: 'image/png', upsert: true })
        ]);

        const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
        const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;

        // Actualizar registro en base de datos
        await supabase
          .from('exercises')
          .update({
            image_urls: [publicUrl0, publicUrl1],
            gif_url: item.gifUrl,
            updated_at: new Date().toISOString()
          })
          .eq('id', item.id);

        completed++;
        updatedCatalog.push({
          id: item.id,
          name: item.name,
          image_urls: [publicUrl0, publicUrl1],
          gif_url: item.gifUrl
        });

        console.log(`[${completed}/${mapList.length}] ✅ ${item.name} -> 2 Fases 3D PNG + GIF Dinámico`);
      } catch (err) {
        console.error(`[Error] ❌ ${item.name}: ${err.message}`);
      }
    }
  }

  const workers = Array.from({ length: concurrency }, (_, i) => worker(i));
  await Promise.all(workers);

  console.log(`\n🎉 PROCESAMIENTO COMPLETADO: ${completed} / ${mapList.length} ejercicios actualizados en Supabase.`);

  // Actualizar también el archivo defaultExercises.ts para preservar consistencia
  console.log('📝 Actualizando defaultExercises.ts con las nuevas URLs uniformes...');
  const defPath = 'src/lib/data/defaultExercises.ts';
  if (fs.existsSync(defPath)) {
    let defContent = fs.readFileSync(defPath, 'utf8');
    for (const item of updatedCatalog) {
      // Reemplazar de forma segura si el nombre coincide
      const escapedName = item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`("name":\\s*"${escapedName}"[\\s\\S]*?"gif_url":\\s*)(?:null|"[^"]*")([\\s\\S]*?"image_urls":\\s*\\[)[^\\]]*(\\])`);
      if (regex.test(defContent)) {
        defContent = defContent.replace(regex, `$1"${item.gif_url}"$2\n      "${item.image_urls[0]}",\n      "${item.image_urls[1]}"\n    $3`);
      }
    }
    fs.writeFileSync(defPath, defContent, 'utf8');
    console.log('✅ defaultExercises.ts sincronizado con éxito!');
  }
}

main().catch(err => console.error('Error fatal:', err));
