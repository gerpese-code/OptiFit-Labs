import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabaseUrl = urlMatch[1].trim();
const supabase = createClient(supabaseUrl, keyMatch[1].trim());

async function checkExercises() {
  const { data: exercises, error } = await supabase
    .from('exercises')
    .select('id, name, muscle_group, gif_url, image_urls');

  if (error) {
    console.error('Error fetching exercises:', error);
    return;
  }

  console.log(`Total exercises in catalog: ${exercises.length}`);

  const queries = [
    // Routine 1
    'sentadilla',
    'hip',
    'cajon',
    'abduct',
    'isquio',
    'lumbar',
    'patada',
    // Routine 2
    'hack',
    'prensa',
    'sisi',
    'sissy',
    'cuadric',
    'adduct',
    'aduct',
    'banco inclinado',
    'oblicuo',
    'crunch',
    // Routine 3
    'dorsal',
    'jalon',
    'remo',
    'militar',
    'lateral',
    'frontal',
    'face',
    'tricep'
  ];

  for (const q of queries) {
    const matches = exercises.filter(e => e.name.toLowerCase().includes(q));
    console.log(`\n--- Query "${q}" (${matches.length} matches) ---`);
    matches.slice(0, 8).forEach(m => {
      console.log(`   [${m.id}] "${m.name}" | Muscle: ${m.muscle_group} | GIF: ${m.gif_url ? 'YES' : 'NO'}`);
    });
  }
}

checkExercises();
