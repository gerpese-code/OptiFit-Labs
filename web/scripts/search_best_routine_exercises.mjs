import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1].trim();
const supabase = createClient(supabaseUrl, serviceKey);

async function searchExercises() {
  const { data: allEx, error } = await supabase.from('exercises').select('id, name, muscle_group');
  if (error) {
    console.error('Error fetching exercises:', error);
    return;
  }
  console.log('Total catalog exercises:', allEx?.length);

  const targets = [
    { query: 'plano', label: '1. PRESS PECHO PLANO' },
    { query: 'inclinado', label: '2. PRESS PECHO INCLINADO' },
    { query: 'fondos', label: '3. FONDOS PARALELAS' },
    { query: 'apertura', label: '4. APERTURAS MARIPOSA' },
    { query: 'superior', label: '5. PECHO SUPERIOR EN MAQUINA EMPUJE INDIVIDUAL' },
    { query: 'barra', label: '6. TRICEPS POLEA CON BARRA' },
    { query: 'cuerda', label: '7. TRICEPS CUERDA' },
    { query: 'oblicuos', label: '8. ABS OBLICUOS EN BANCO DE LUMBARES' },
    { query: 'inferiores', label: '9. ABS INFERIORES EN BANCO INCLINADO' },
  ];

  for (const t of targets) {
    console.log(`\n=== Target: ${t.label} (keyword: ${t.query}) ===`);
    const matches = allEx.filter(e => e.name.toLowerCase().includes(t.query.toLowerCase()));
    matches.forEach(m => console.log(`  • "${m.name}" | Muscle: ${m.muscle_group} | ID: ${m.id}`));
  }
}

searchExercises();
