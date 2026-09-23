import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  console.log('=== PERFECCIONANDO Y CORRIGIENDO MULTIMEDIA DE EJERCICIOS ===\n');

  // 1. Corregir Oblicuos en Banco de Hiperextensiones / Lumbares
  console.log('1. Corrigiendo Oblicuos en Banco de Hiperextensiones / Lumbares...');
  const obliquesPayload = {
    image_urls: [
      'https://gymvisual.com/36-large_default/45-degree-side-bend.jpg',
      'https://liftmanual.com/wp-content/uploads/2023/04/45-side-bend.jpg'
    ],
    gif_url: 'https://burnfit.io/en/wp-content/uploads/sites/3/2026/01/45_SIDE_BEND.gif',
    description: 'Flexión lateral de tronco en banco de hiperextensiones a 45° para aislamiento de oblicuos. Colocarse de lado con la cadera apoyada en el cojín y pies trabados. Bajar el torso lateralmente de forma controlada y elevarlo contrayendo con fuerza los oblicuos sin girar el torso.',
    updated_at: new Date().toISOString()
  };

  const { data: obliquesMatches } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', '%Oblicuos en Banco%');

  for (const ex of obliquesMatches || []) {
    await supabase.from('exercises').update(obliquesPayload).eq('id', ex.id);
    console.log(`   ✅ Actualizado: "${ex.name}" con imágenes reales de flexión lateral de oblicuos a 45° + GIF animado`);
  }

  // 2. Corregir Patada de Glúteos en Polea (Cable) -> One-Legged Cable Kickback
  console.log('\n2. Corrigiendo Patada de Glúteos en Polea (Cable)...');
  const kickbackPayload = {
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Legged_Cable_Kickback/0.jpg',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/One-Legged_Cable_Kickback/1.jpg'
    ],
    gif_url: null,
    updated_at: new Date().toISOString()
  };
  const { data: kickbackMatches } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', '%Patada de Glúteos en Polea%');

  for (const ex of kickbackMatches || []) {
    await supabase.from('exercises').update(kickbackPayload).eq('id', ex.id);
    console.log(`   ✅ Actualizado: "${ex.name}" con fotos reales de polea/cable (One-Legged Cable Kickback)`);
  }

  // 3. Corregir Vuelos Laterales y Frontales Combinados -> Side Laterals to Front Raise
  console.log('\n3. Corrigiendo Vuelos Laterales y Frontales Combinados...');
  const comboRaisesPayload = {
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Laterals_to_Front_Raise/0.jpg',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Side_Laterals_to_Front_Raise/1.jpg'
    ],
    gif_url: null,
    updated_at: new Date().toISOString()
  };
  const { data: comboMatches } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', '%Vuelos Laterales y Frontales%');

  for (const ex of comboMatches || []) {
    await supabase.from('exercises').update(comboRaisesPayload).eq('id', ex.id);
    console.log(`   ✅ Actualizado: "${ex.name}" con fotos reales de la combinación lateral + frontal`);
  }

  // 4. Corregir Elevación de Piernas en Banco Inclinado (Abs Inferiores) -> Decline Reverse Crunch
  console.log('\n4. Corrigiendo Elevación de Piernas en Banco Inclinado (Abs Inferiores)...');
  const legRaisePayload = {
    image_urls: [
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Reverse_Crunch/0.jpg',
      'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/Decline_Reverse_Crunch/1.jpg'
    ],
    gif_url: null,
    updated_at: new Date().toISOString()
  };
  const { data: legRaiseMatches } = await supabase
    .from('exercises')
    .select('id, name')
    .ilike('name', '%Elevación de Piernas en Banco Inclinado%');

  for (const ex of legRaiseMatches || []) {
    await supabase.from('exercises').update(legRaisePayload).eq('id', ex.id);
    console.log(`   ✅ Actualizado: "${ex.name}" con fotos reales en banco inclinado (Decline Reverse Crunch)`);
  }

  // 5. Eliminar duplicados donde gif_url era idéntico a una foto JPG
  console.log('\n5. Limpiando gif_url duplicados en todos los ejercicios...');
  const { data: allExercises } = await supabase
    .from('exercises')
    .select('id, name, image_urls, gif_url');

  let cleanedGifs = 0;
  for (const ex of allExercises || []) {
    if (ex.gif_url) {
      const isActualGif = ex.gif_url.toLowerCase().includes('.gif');
      const isDuplicateOfImage = ex.image_urls && ex.image_urls.includes(ex.gif_url);
      
      // Si el gif_url no es un .gif real o apunta a la misma foto .jpg, limpiarlo para evitar imágenes repetidas
      if (!isActualGif || isDuplicateOfImage) {
        await supabase
          .from('exercises')
          .update({ gif_url: null, updated_at: new Date().toISOString() })
          .eq('id', ex.id);
        cleanedGifs++;
      }
    }
  }
  console.log(`   ✅ Limpiados ${cleanedGifs} ejercicios que tenían la misma foto asignada falsamente como GIF.`);

  // 6. Verificación final de todos los ejercicios Ninja
  console.log('\n=== REVISIÓN FINAL DE EJERCICIOS NINJA ===\n');
  const { data: ninjaExercises } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, image_urls, gif_url')
    .or('name.ilike.%Smith%,name.ilike.%Oblicuos%,name.ilike.%Hack%,name.ilike.%Vuelos%,name.ilike.%Sissy%,name.ilike.%Dorsales%,name.ilike.%Patada%');

  for (const ex of ninjaExercises || []) {
    console.log(`📌 ${ex.name} (${ex.muscle_group}):`);
    console.log(`   Fotos (${ex.image_urls ? ex.image_urls.length : 0}):`, ex.image_urls);
    console.log(`   GIF real:`, ex.gif_url || 'Ninguno (sin duplicación)');
  }
}

run();
