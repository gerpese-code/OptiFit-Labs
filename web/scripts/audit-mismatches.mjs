import fs from 'fs';

const exercises = JSON.parse(fs.readFileSync('all_exercises_audit.json', 'utf8'));
const gymEs = JSON.parse(fs.readFileSync('gymgifs_es.json', 'utf8'));
const gymEn = JSON.parse(fs.readFileSync('gymgifs_en.json', 'utf8'));

// Map muscle group in DB to expected gif category/folder
const mgToCategory = {
  'pecho': ['pectorals'],
  'espalda': ['lats', 'upper-back', 'traps', 'spine'],
  'hombros': ['delts', 'traps'],
  'bíceps': ['biceps', 'forearms'],
  'biceps': ['biceps', 'forearms'],
  'tríceps': ['triceps'],
  'triceps': ['triceps'],
  'brazos': ['biceps', 'triceps', 'forearms'],
  'antebrazos': ['forearms'],
  'cuádriceps': ['quads', 'glutes'],
  'cuadriceps': ['quads', 'glutes'],
  'isquiosurales': ['hamstrings', 'glutes'],
  'glúteos': ['glutes', 'hamstrings', 'quads', 'adductors', 'abductors'],
  'gluteos': ['glutes', 'hamstrings', 'quads', 'adductors', 'abductors'],
  'pantorrillas': ['calves'],
  'piernas': ['quads', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  'core / abdomen': ['abs', 'spine'],
  'abdominales': ['abs', 'spine'],
  'cardio': ['cardio', 'quads', 'calves']
};

const flagged = [];

for (const ex of exercises) {
  const mg = (ex.muscle_group || '').toLowerCase().trim();
  const gif = ex.gif_url || '';
  
  let folder = '';
  const match = gif.match(/ExerciseGymGifsDB@[^/]+\/([^/]+)\//i);
  if (match) folder = match[1].toLowerCase();
  
  const expectedFolders = mgToCategory[mg];
  if (expectedFolders && folder) {
    if (!expectedFolders.includes(folder)) {
      flagged.push({
        id: ex.id,
        name: ex.name,
        muscle_group: ex.muscle_group,
        current_gif: gif.split('/').pop(),
        gif_url: gif,
        folder: folder,
        expectedFolders: expectedFolders
      });
    }
  } else if (!gif) {
    flagged.push({
      id: ex.id,
      name: ex.name,
      muscle_group: ex.muscle_group,
      current_gif: 'NO_GIF',
      gif_url: '',
      folder: 'NONE',
      expectedFolders: expectedFolders
    });
  }
}

console.log(`FLAGGED MISMATCHES (${flagged.length}):`);
for (const f of flagged) {
  console.log(`- [${f.muscle_group}] "${f.name}" -> folder: [${f.folder}] (${f.current_gif}) -> expected: ${f.expectedFolders ? f.expectedFolders.join(', ') : 'none'}`);
}
