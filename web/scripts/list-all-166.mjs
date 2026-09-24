import fs from 'fs';
const exercises = JSON.parse(fs.readFileSync('all_exercises_audit.json', 'utf8'));
for (let i = 0; i < 82; i++) {
  const e = exercises[i];
  const file = e.gif_url ? e.gif_url.split('/').pop() : 'NO_GIF';
  console.log(`${i+1}. [${e.muscle_group}] "${e.name}" ===> ${file}`);
}
