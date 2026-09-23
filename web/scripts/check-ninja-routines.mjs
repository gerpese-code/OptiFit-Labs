import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/);
const keyMatch = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/);
const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function run() {
  const { data: routines } = await supabase.from('routines').select('id, title').ilike('title', '%Ninja%');
  for (const r of routines || []) {
    console.log('\n======================================================');
    console.log('RUTINA: ' + r.title);
    console.log('======================================================');
    const { data: days } = await supabase.from('routine_days').select('id, name, day_number').eq('routine_id', r.id).order('order_index');
    for (const d of days || []) {
      console.log('  [Día: ' + d.name + ']');
      const { data: rxs } = await supabase.from('routine_exercises').select('id, exercise_id, notes').eq('routine_day_id', d.id).order('order_index');
      for (const rx of rxs || []) {
        const { data: ex } = await supabase.from('exercises').select('id, name, muscle_group, image_urls, gif_url').eq('id', rx.exercise_id).single();
        console.log(`    • ${ex?.name} (${ex?.muscle_group})`);
        console.log(`      Fotos (${ex?.image_urls?.length || 0}): ${ex?.image_urls?.join(' | ')}`);
        console.log(`      GIF: ${ex?.gif_url || 'Ninguno'}`);
      }
    }
  }
}

run();
