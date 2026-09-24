import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

const freeDb = JSON.parse(fs.readFileSync('scripts/free-exercise-db.json', 'utf8'));

// Get exercises missing media
const { data: exercises, error } = await supabase
  .from('exercises')
  .select('id, name, muscle_group, image_urls, gif_url')
  .order('name');

const missing = exercises.filter(
  (e) => (!e.image_urls || e.image_urls.length === 0) && !e.gif_url
);

console.log(`Found ${missing.length} exercises missing media in Supabase:\n`);

function findInFreeDb(terms) {
  for (const t of terms) {
    const termLower = t.toLowerCase();
    const found = freeDb.filter((e) =>
      e.name.toLowerCase().includes(termLower) || e.id.toLowerCase().includes(termLower)
    );
    if (found.length > 0) return found;
  }
  return [];
}

for (const ex of missing) {
  console.log(`Exercise: "${ex.name}" (${ex.muscle_group})`);
  let matches = [];
  if (ex.name.includes('Smith') && ex.name.includes('Thrust')) {
    matches = findInFreeDb(['hip thrust', 'glute bridge']);
  } else if (ex.name.includes('Smith') && ex.name.includes('Profunda')) {
    matches = findInFreeDb(['smith machine squat', 'barbell squat', 'squat']);
  } else if (ex.name.includes('Búlgaras')) {
    matches = findInFreeDb(['split squat', 'bulgarian']);
  } else if (ex.name.includes('Femorales')) {
    matches = findInFreeDb(['lying leg curl', 'seated leg curl', 'leg curl']);
  } else if (ex.name.includes('Pantorrillas')) {
    matches = findInFreeDb(['smith machine calf', 'calf raise', 'standing calf']);
  } else if (ex.name.includes('Dorsales') && ex.name.includes('Cerrado')) {
    matches = findInFreeDb(['v-bar pulldown', 'close-grip pulldown', 'pulldown']);
  } else if (ex.name.includes('Batman') || ex.name.includes('Pullover Polea')) {
    matches = findInFreeDb(['straight-arm pulldown', 'lat pulldown', 'pullover']);
  } else if (ex.name.includes('Soga') || ex.name.includes('Cuerda')) {
    matches = findInFreeDb(['rope attachment', 'triceps pushdown', 'pushdown']);
  } else if (ex.name.includes('Scott') || ex.name.includes('Predicador')) {
    matches = findInFreeDb(['preacher curl']);
  } else if (ex.name.includes('Hack')) {
    matches = findInFreeDb(['hack squat', 'sled hack']);
  } else if (ex.name.includes('Sissy') || ex.name.includes('Sisi')) {
    matches = findInFreeDb(['sissy squat', 'leg extension']);
  } else if (ex.name.includes('Press Militar Sentado')) {
    matches = findInFreeDb(['seated dumbbell press', 'shoulder press', 'overhead press']);
  } else if (ex.name.includes('Vuelos Laterales')) {
    matches = findInFreeDb(['side lateral raise', 'lateral raise']);
  } else if (ex.name.includes('Patada de Glúteos') || ex.name.includes('Cable')) {
    matches = findInFreeDb(['glute kickback', 'cable kickback', 'kickback']);
  } else if (ex.name.includes('Banco Inclinado') && ex.name.includes('Abs')) {
    matches = findInFreeDb(['incline leg', 'lying leg raise', 'leg raise']);
  } else if (ex.name.includes('Oblicuos')) {
    matches = findInFreeDb(['hyperextension', 'side bend', 'wood chop']);
  } else if (ex.name.includes('Smith / Barra / Rollout')) {
    matches = findInFreeDb(['ab roller', 'rollout', 'crunch']);
  }

  console.log(`   Matches found: ${matches.slice(0, 3).map((m) => `${m.name} [id: ${m.id}, imgs: ${m.images.length}]`).join(' | ')}`);
}
