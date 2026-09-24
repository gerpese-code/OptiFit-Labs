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

async function main() {
  console.log('=== Step 1: Check or Create Exercise in Database ===');
  const exerciseName = 'Hiperextensiones a 45° para Femorales / Isquiosurales (Banco de Lumbares)';
  const muscleGroup = 'Isquiosurales';
  const description = 'Aislamiento de femorales e isquiosurales en banco a 45° anulando la tensión lumbar. Ajustar el cojín por debajo de la cresta ilíaca para liberar la flexión de cadera. Mantener columna en ligera flexión (espalda redondeada y mentón al pecho) para inhibir los erectores espinales. Elevar el torso mediante bisagra de cadera traccionando exclusivamente con los femorales y glúteos. Bajar en 3 segundos sintiendo el estiramiento profundo.';
  const gifUrl = 'https://cdn.jsdelivr.net/gh/JahelCuadrado/ExerciseGymGifsDB@v1.1.0/spine/hyperextension.gif';

  // Check if it already exists
  let { data: existingEx } = await supabase
    .from('exercises')
    .select('*')
    .eq('name', exerciseName)
    .maybeSingle();

  let exerciseId = existingEx?.id || crypto.randomUUID();

  console.log(`Exercise ID: ${exerciseId} (Existing: ${!!existingEx})`);

  console.log('=== Step 2: Download GIF and Extract Execution Phases ===');
  const res = await fetch(gifUrl);
  if (!res.ok) throw new Error(`Failed to download GIF: HTTP ${res.status}`);
  const gifBuf = Buffer.from(await res.arrayBuffer());

  const reader = new omggif.GifReader(gifBuf);
  const w = reader.width;
  const h = reader.height;
  const totalFrames = reader.numFrames();
  const midIdx = Math.max(1, Math.floor(totalFrames / 2));

  console.log(`GIF dimensions: ${w}x${h}, frames: ${totalFrames}, mid frame: ${midIdx}`);

  // Frame 0: Contraction / Top position
  const rgba0 = new Uint8Array(w * h * 4);
  reader.decodeAndBlitFrameRGBA(0, rgba0);
  const png0 = rgbaToPng(w, h, Buffer.from(rgba0));

  // Mid frame: Stretch / Bottom position
  const rgbaMid = new Uint8Array(w * h * 4);
  for (let f = 0; f <= midIdx; f++) {
    reader.decodeAndBlitFrameRGBA(f, rgbaMid);
  }
  const png1 = rgbaToPng(w, h, Buffer.from(rgbaMid));

  console.log('=== Step 3: Upload Phase PNGs to Supabase Storage ===');
  const path0 = `exercises/${exerciseId}/phase-0-v2.png`;
  const path1 = `exercises/${exerciseId}/phase-1-v2.png`;

  const [up0, up1] = await Promise.all([
    supabase.storage.from('exercise-media').upload(path0, png0, { contentType: 'image/png', upsert: true }),
    supabase.storage.from('exercise-media').upload(path1, png1, { contentType: 'image/png', upsert: true })
  ]);

  if (up0.error) throw new Error(`Upload path0 failed: ${up0.error.message}`);
  if (up1.error) throw new Error(`Upload path1 failed: ${up1.error.message}`);

  const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
  const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;

  console.log('Phase 0 URL:', publicUrl0);
  console.log('Phase 1 URL:', publicUrl1);

  console.log('=== Step 4: Upsert Exercise into exercises Table ===');
  const exerciseRecord = {
    id: exerciseId,
    name: exerciseName,
    muscle_group: muscleGroup,
    description: description,
    video_url: null,
    gif_url: gifUrl,
    image_urls: [publicUrl0, publicUrl1],
    is_custom: false,
    updated_at: new Date().toISOString()
  };

  const { error: upsertErr } = await supabase
    .from('exercises')
    .upsert(exerciseRecord);

  if (upsertErr) throw new Error(`Upsert exercise failed: ${upsertErr.message}`);
  console.log('✅ Exercise stored in exercises table successfully!');

  console.log('=== Step 5: Replace Exercise in Ninja Routines ===');
  // 1. Standalone routine "Ninja: Piernas Posterior y Glúteos"
  // Day ID: f25032a1-1be0-449f-8898-11145dc5ae47
  // Routine Exercise ID: af9e01d4-276f-46de-9cb6-6414aa53da78 (order_index: 4)
  const notesText = 'Banco de lumbares a 45° enfocado en femorales: Colocar cojín bajo la cresta ilíaca, mantener columna redondeada y mentón al pecho para inhibir lumbares. Subir por bisagra traccionando exclusivamente con los femorales e isquiosurales. 3 series x 10 reps al 90%. Controlar la bajada en 3 segundos.';

  const { error: reErr1 } = await supabase
    .from('routine_exercises')
    .update({
      exercise_id: exerciseId,
      notes: notesText,
      updated_at: new Date().toISOString()
    })
    .eq('id', 'af9e01d4-276f-46de-9cb6-6414aa53da78');

  if (reErr1) throw new Error(`Failed to update routine_exercise in Ninja: Piernas: ${reErr1.message}`);
  console.log('✅ Updated routine_exercise in "Ninja: Piernas Posterior y Glúteos"');

  // Update target_reps to 10 in sets
  await supabase
    .from('routine_exercise_sets')
    .update({ target_reps: 10, target_rpe: 9, rest_seconds: 60 })
    .eq('routine_exercise_id', 'af9e01d4-276f-46de-9cb6-6414aa53da78');

  // 2. Plan Ninja 4 Días (Completo) - Day 1
  // Routine Exercise ID: 40aca015-6ab4-4e2b-8968-be1a68b233d5 (order_index: 4)
  const { error: reErr2 } = await supabase
    .from('routine_exercises')
    .update({
      exercise_id: exerciseId,
      notes: notesText,
      updated_at: new Date().toISOString()
    })
    .eq('id', '40aca015-6ab4-4e2b-8968-be1a68b233d5');

  if (reErr2) throw new Error(`Failed to update routine_exercise in Plan Ninja 4 Días: ${reErr2.message}`);
  console.log('✅ Updated routine_exercise in "Plan Ninja 4 Días (Completo)" Día 1');

  // Update target_reps to 10 in sets
  await supabase
    .from('routine_exercise_sets')
    .update({ target_reps: 10, target_rpe: 9, rest_seconds: 60 })
    .eq('routine_exercise_id', '40aca015-6ab4-4e2b-8968-be1a68b233d5');

  console.log('=== Step 6: Verify Updated Routines in DB ===');
  const { data: verifyData } = await supabase
    .from('routine_exercises')
    .select(`
      id,
      order_index,
      notes,
      routine_day_id,
      exercise:exercises (
        id,
        name,
        muscle_group,
        gif_url,
        image_urls
      ),
      routine_exercise_sets (
        set_number,
        target_reps,
        target_rpe,
        rest_seconds
      )
    `)
    .in('id', ['af9e01d4-276f-46de-9cb6-6414aa53da78', '40aca015-6ab4-4e2b-8968-be1a68b233d5']);

  console.log('Verification data:', JSON.stringify(verifyData, null, 2));

  return { exerciseId, publicUrl0, publicUrl1, gifUrl };
}

main().then(res => {
  console.log('\n🎉 ALL DONE SUCCESSFULLY!', res);
}).catch(err => {
  console.error('\n❌ SCRIPT FAILED:', err);
  process.exit(1);
});
