import fs from 'fs';
import zlib from 'zlib';
import crypto from 'crypto';
import jpeg from 'jpeg-js';
import gifenc from 'gifenc';
import { createClient } from '@supabase/supabase-js';

const { GIFEncoder, quantize, applyPalette } = gifenc;

const env = fs.readFileSync('.env.local', 'utf8');
const supabaseUrl = env.match(/NEXT_PUBLIC_SUPABASE_URL=([^\r\n]+)/)[1].trim();
const serviceKey = env.match(/SUPABASE_SERVICE_ROLE_KEY=([^\r\n]+)/)[1].trim();
const supabase = createClient(supabaseUrl, serviceKey);

async function main() {
  const exerciseName = 'Subidas al Cajón para Glúteos (Agarre Cruzado)';
  let { data: existingEx } = await supabase
    .from('exercises')
    .select('id, name, image_urls, gif_url')
    .eq('name', exerciseName)
    .maybeSingle();

  if (!existingEx) {
    throw new Error('Exercise not found in exercises table!');
  }
  const exerciseId = existingEx.id;
  console.log(`Found exercise: ${exerciseName} (${exerciseId})`);
  console.log(`Images: ${existingEx.image_urls}`);
  console.log(`GIF: ${existingEx.gif_url}`);

  const targetDayIds = [
    'fe7138d3-708d-48b6-8490-8d1ed4d5e679', // Template Día 4: Glúteos y Abdominales
    '5604418d-5e42-43b6-befe-333923fbbc2c', // German Día 4: Glúteos y Abdominales
    '6f54a64c-896d-4089-bbe3-1872fd315458', // Client Día 4: Glúteos y Abdominales
  ];

  const exerciseNotes = 'Subidas al cajón para glúteo: Torso inclinado a 45° en bisagra de cadera, pie completo en el cajón y mano contralateral sujetando el soporte para máxima estabilidad. Impulso exclusivo desde el glúteo de la pierna en el cajón (sin rebotar con el pie trasero). Bajar en 3 segundos sintiendo el estiramiento profundo.';

  for (const dayId of targetDayIds) {
    console.log(`\n========================================`);
    console.log(`Processing Day ID: ${dayId}...`);

    // Fetch existing exercises in this day
    const { data: currentRxs } = await supabase
      .from('routine_exercises')
      .select('id, order_index, exercise_id')
      .eq('routine_day_id', dayId)
      .order('order_index');

    console.log(`Currently has ${currentRxs?.length} exercises`);

    // Check if new exercise is already attached
    let rxRecord = (currentRxs || []).find(r => r.exercise_id === exerciseId);
    let rxId = rxRecord?.id;

    if (!rxId) {
      // Step A: temporary offset to prevent unique constraint conflict
      for (let i = 0; i < (currentRxs || []).length; i++) {
        await supabase
          .from('routine_exercises')
          .update({ order_index: 500 + i })
          .eq('id', currentRxs[i].id);
      }

      // Step B: Reassign clean order placing new exercise at index 3 (after Abducciones)
      let otherExercises = (currentRxs || []).filter(r => r.exercise_id !== exerciseId);
      let orderedList = [];
      // Put first 3 exercises
      orderedList.push(...otherExercises.slice(0, 3));
      // Insert new one
      rxId = crypto.randomUUID();
      orderedList.push({ id: rxId, isNew: true });
      // Put remaining exercises
      orderedList.push(...otherExercises.slice(3));

      // Now insert new record with high index first
      const { error: insErr } = await supabase
        .from('routine_exercises')
        .insert({
          id: rxId,
          routine_day_id: dayId,
          exercise_id: exerciseId,
          order_index: 999,
          notes: exerciseNotes,
        });

      if (insErr) throw new Error(`Insert failed: ${insErr.message}`);

      // Now update all to their clean consecutive 0..N indices
      for (let idx = 0; idx < orderedList.length; idx++) {
        const item = orderedList[idx];
        await supabase
          .from('routine_exercises')
          .update({ order_index: idx })
          .eq('id', item.id);
      }
      console.log(`  ✅ Added exercise to day ${dayId} at position 3.`);
    } else {
      console.log(`  Exercise already attached with rxId: ${rxId}`);
      await supabase
        .from('routine_exercises')
        .update({ notes: exerciseNotes })
        .eq('id', rxId);
    }

    // Now set the 4 series of 10 repetitions
    await supabase.from('routine_exercise_sets').delete().eq('routine_exercise_id', rxId);

    const setsToInsert = [1, 2, 3, 4].map((setNum) => ({
      routine_exercise_id: rxId,
      set_number: setNum,
      target_reps: 10,
      target_weight_kg: 0,
      target_rpe: 8,
      rest_seconds: 60,
    }));

    const { error: setsErr } = await supabase
      .from('routine_exercise_sets')
      .insert(setsToInsert);

    if (setsErr) throw new Error(`Insert sets failed: ${setsErr.message}`);
    console.log(`  ✅ Created 4 sets of 10 reps for routine_exercise ${rxId}`);
  }

  console.log('\n=== Step 5: Verification ===');
  for (const dayId of targetDayIds) {
    const { data: dayInfo } = await supabase.from('routine_days').select('name, routines(title)').eq('id', dayId).single();
    const { data: rxs } = await supabase
      .from('routine_exercises')
      .select('id, order_index, exercises(name, muscle_group, gif_url), routine_exercise_sets(set_number, target_reps, target_weight_kg, rest_seconds, target_rpe)')
      .eq('routine_day_id', dayId)
      .order('order_index');

    console.log(`\nRoutine: "${dayInfo?.routines?.title}" | Day: "${dayInfo?.name}" (ID: ${dayId}):`);
    rxs?.forEach((rx) => {
      const setsStr = rx.routine_exercise_sets?.map(s => `Set ${s.set_number}: ${s.target_reps} reps`).join(', ');
      console.log(`  [Pos ${rx.order_index}] ${rx.exercises?.name} (${rx.exercises?.muscle_group}) -> ${rx.routine_exercise_sets?.length} series [${setsStr}]`);
    });
  }

  console.log('\n🎉 ALL DONE SUCCESSFULLY!');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
