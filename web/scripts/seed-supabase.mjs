import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Leer .env.local manualmente
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
  console.error('Error: No se encontró NEXT_PUBLIC_SUPABASE_URL o clave en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function runSeed() {
  console.log('Cargando DEFAULT_EXERCISES...');
  // Leer defaultExercises.ts directamente
  const tsPath = path.join(__dirname, '../src/lib/data/defaultExercises.ts');
  const fileStr = fs.readFileSync(tsPath, 'utf-8');
  const jsonMatch = fileStr.match(/export const DEFAULT_EXERCISES: PreloadedExercise\[\] = (\[[\s\S]*?\]);/);
  if (!jsonMatch) {
    throw new Error('No se pudo extraer DEFAULT_EXERCISES');
  }
  const DEFAULT_EXERCISES = JSON.parse(jsonMatch[1]);
  console.log(`Total de ejercicios curados: ${DEFAULT_EXERCISES.length}`);

  console.log('Consultando ejercicios existentes en Supabase...');
  const { data: existing, error: fetchErr } = await supabase.from('exercises').select('id, name');
  if (fetchErr) {
    console.error('Error consultando exercises:', fetchErr);
    process.exit(1);
  }

  const existingMap = new Map((existing || []).map(e => [e.name.toLowerCase().trim(), e.id]));
  console.log(`Ejercicios existentes en Supabase: ${existingMap.size}`);

  const toInsert = [];
  const toUpdate = [];

  for (const ex of DEFAULT_EXERCISES) {
    const key = ex.name.toLowerCase().trim();
    const payload = {
      name: ex.name,
      muscle_group: ex.muscle_group,
      description: ex.description,
      video_url: ex.video_url,
      gif_url: ex.gif_url,
      image_urls: ex.image_urls,
      updated_at: new Date().toISOString(),
    };

    if (existingMap.has(key)) {
      toUpdate.push({ id: existingMap.get(key), payload });
    } else {
      toInsert.push(payload);
    }
  }

  console.log(`Nuevos a insertar: ${toInsert.length} | Existentes a actualizar con fotos técnicas: ${toUpdate.length}`);

  if (toInsert.length > 0) {
    const batchSize = 40;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      const batch = toInsert.slice(i, i + batchSize);
      const { error: insErr } = await supabase.from('exercises').insert(batch);
      if (insErr) {
        console.error('Error insertando lote:', insErr);
        process.exit(1);
      }
      console.log(`Insertado lote de ${batch.length} ejercicios.`);
    }
  }

  if (toUpdate.length > 0) {
    console.log(`Actualizando ${toUpdate.length} ejercicios existentes...`);
    for (const item of toUpdate) {
      const { error: upErr } = await supabase.from('exercises').update(item.payload).eq('id', item.id);
      if (upErr) {
        console.warn(`Aviso al actualizar ${item.id}:`, upErr.message);
      }
    }
  }

  const { count } = await supabase.from('exercises').select('*', { count: 'exact', head: true });
  console.log(`\n==============================================`);
  console.log(`¡SINCRONIZACIÓN EXITOSA!`);
  console.log(`Total de ejercicios en tu catálogo Supabase: ${count}`);
  console.log(`==============================================\n`);
}

runSeed().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
