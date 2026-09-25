import fs from 'fs';
import zlib from 'zlib';
import jpeg from 'jpeg-js';
import { createClient } from '@supabase/supabase-js';

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
  console.log('=== Step 1: Prepare Phase Images and GIF ===');
  const initialJpgPath = 'C:/Users/germa/.gemini/antigravity/brain/bc1aacba-5a01-4e0d-9450-9c8be20b0918/sissy_squat_machine_initial_1790368596425.jpg';
  const contractionJpgPath = 'C:/Users/germa/.gemini/antigravity/brain/bc1aacba-5a01-4e0d-9450-9c8be20b0918/sissy_squat_machine_contraction_1790368834423.jpg';
  const gifPath = 'C:/Users/germa/.gemini/antigravity/brain/bc1aacba-5a01-4e0d-9450-9c8be20b0918/sissy-squat-machine-snappy.gif';

  const d0 = jpeg.decode(fs.readFileSync(initialJpgPath));
  const d1 = jpeg.decode(fs.readFileSync(contractionJpgPath));
  const gifBuf = fs.readFileSync(gifPath);

  const png0 = rgbaToPng(d0.width, d0.height, d0.data);
  const png1 = rgbaToPng(d1.width, d1.height, d1.data);

  console.log(`Phase 0 PNG size: ${png0.length} bytes`);
  console.log(`Phase 1 PNG size: ${png1.length} bytes`);
  console.log(`GIF size: ${gifBuf.length} bytes`);

  const exerciseId = '548ed9d4-259b-4415-9387-e5ec3b4bc0aa';
  const timestamp = Date.now();

  const path0 = `exercises/${exerciseId}/phase-0-machine-${timestamp}.png`;
  const path1 = `exercises/${exerciseId}/phase-1-machine-${timestamp}.png`;
  const pathGif = `exercises/${exerciseId}/sissy-machine-${timestamp}.gif`;

  console.log('=== Step 2: Upload to Supabase Storage ===');
  const [up0, up1, upGif] = await Promise.all([
    supabase.storage.from('exercise-media').upload(path0, png0, { contentType: 'image/png', upsert: true }),
    supabase.storage.from('exercise-media').upload(path1, png1, { contentType: 'image/png', upsert: true }),
    supabase.storage.from('exercise-media').upload(pathGif, gifBuf, { contentType: 'image/gif', upsert: true }),
  ]);

  if (up0.error) throw new Error(`Upload phase 0 failed: ${up0.error.message}`);
  if (up1.error) throw new Error(`Upload phase 1 failed: ${up1.error.message}`);
  if (upGif.error) throw new Error(`Upload GIF failed: ${upGif.error.message}`);

  const publicUrl0 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path0}`;
  const publicUrl1 = `${supabaseUrl}/storage/v1/object/public/exercise-media/${path1}`;
  const publicGifUrl = `${supabaseUrl}/storage/v1/object/public/exercise-media/${pathGif}`;

  console.log('Phase 0 Public URL:', publicUrl0);
  console.log('Phase 1 Public URL:', publicUrl1);
  console.log('GIF Public URL:', publicGifUrl);

  console.log('=== Step 3: Update exercises Table ===');
  const updateData = {
    image_urls: [publicUrl0, publicUrl1],
    gif_url: publicGifUrl,
    description: 'Sentadilla Sissy en máquina específica con pies y pantorrillas trabados. Pies asegurados bajo los rodillos frontales y pantorrillas firmes contra la almohadilla posterior. Mantener tronco y muslos alineados mientras se flexionan las rodillas hacia adelante reclinando el torso hacia atrás. Máximo aislamiento y tensión profunda en el recto femoral y cuádriceps.',
    updated_at: new Date().toISOString()
  };

  const { error: exErr } = await supabase
    .from('exercises')
    .update(updateData)
    .eq('id', exerciseId);

  if (exErr) throw new Error(`Update exercises failed: ${exErr.message}`);
  console.log('✅ exercises table updated successfully!');

  console.log('=== Step 4: Update routine_exercises notes ===');
  const machineNotes = 'Sentadilla Sissy en máquina (pies trabados): Empeines firmes bajo los rodillos y pantorrillas contra el soporte acolchado. Mantener tronco y muslos alineados mientras flexionas rodillas hacia adelante inclinándote hacia atrás. Tensión permanente en recto femoral sin despegar los talones.';

  const { error: reErr } = await supabase
    .from('routine_exercises')
    .update({ notes: machineNotes, updated_at: new Date().toISOString() })
    .eq('exercise_id', exerciseId);

  if (reErr) console.warn('Warning updating routine_exercises notes:', reErr.message);
  else console.log('✅ routine_exercises notes updated successfully!');

  console.log('=== Step 5: Verification ===');
  const { data: verified } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, description, gif_url, image_urls')
    .eq('id', exerciseId)
    .single();

  console.log('Verified Exercise:', JSON.stringify(verified, null, 2));
}

main().catch(err => {
  console.error('Execution error:', err);
  process.exit(1);
});
