import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const sb = createClient(envVars.NEXT_PUBLIC_SUPABASE_URL, envVars.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: routines, error } = await sb
    .from('routines')
    .select(`
      id,
      title,
      is_template,
      is_active,
      client_id,
      routine_days (
        id,
        name,
        routine_exercises (
          id,
          notes,
          order_index,
          exercises (
            name,
            muscle_group
          ),
          routine_exercise_sets (
            set_number,
            target_reps,
            target_weight_kg,
            rest_seconds
          )
        )
      )
    `)
    .in('title', [
      'Rutina 1: Cuádriceps y Pantorrillas',
      'Rutina 2: Glúteos e Isquios',
      'Rutina 3: Cardio Integral'
    ])
    .order('title');

  if (error) {
    console.error(error);
    return;
  }

  routines.forEach(r => {
    console.log('\n====================================');
    console.log('RUTINA:', r.title, '| Template:', r.is_template, '| ID:', r.id);
    r.routine_days.forEach(d => {
      console.log('  DIA:', d.name);
      d.routine_exercises
        .sort((a,b) => a.order_index - b.order_index)
        .forEach(rx => {
          console.log('    - EX:', rx.exercises?.name, '(' + rx.exercises?.muscle_group + ')');
          console.log('      Notes:', rx.notes);
          console.log('      Sets:', rx.routine_exercise_sets?.sort((a,b)=>a.set_number-b.set_number).map(s => `Set ${s.set_number}: ${s.target_reps} reps @ ${s.target_weight_kg}kg (${s.rest_seconds}s rest)`).join(' | '));
        });
    });
  });
}
run();
