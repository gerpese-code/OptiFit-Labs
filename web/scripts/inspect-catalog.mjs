import fs from 'fs';

const content = fs.readFileSync('src/lib/data/defaultExercises.ts', 'utf8');
const exercises = [];
const blocks = content.split('{\n    "name":');

for (let i = 1; i < blocks.length; i++) {
  const b = '{\n    "name":' + blocks[i];
  const nameMatch = b.match(/"name":\s*"([^"]+)"/);
  const gifMatch = b.match(/"gif_url":\s*(?:"([^"]+)"|null)/);
  const imgMatch = b.match(/"image_urls":\s*\[\s*([\s\S]*?)\]/);
  
  if (nameMatch) {
    let images = [];
    if (imgMatch && imgMatch[1]) {
      images = [...imgMatch[1].matchAll(/"([^"]+)"/g)].map(m => m[1]);
    }
    exercises.push({
      name: nameMatch[1],
      gif_url: gifMatch ? gifMatch[1] : null,
      images,
    });
  }
}

console.log(`Parsed ${exercises.length} exercises from defaultExercises.ts`);

const keywords = [
  'smith', 'thrust', 'sentadilla', 'hack', 'búlgar', 'bulgar', 'sissy',
  'militar', 'vuelo', 'lateral', 'patada', 'pantorrill', 'polea', 'jalón',
  'tríceps', 'triceps', 'bíceps', 'biceps', 'femoral', 'curl', 'abs',
  'abdominal', 'oblicuo', 'elevación', 'pierna', 'prensa'
];

exercises.forEach(e => {
  const match = keywords.some(k => e.name.toLowerCase().includes(k));
  if (match) {
    console.log(`- ${e.name} [${e.images.length} imgs]`);
    if (e.images[0]) console.log(`    URL: ${e.images[0]}`);
  }
});
