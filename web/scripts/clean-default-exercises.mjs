import fs from 'fs';

const filePath = 'src/lib/data/defaultExercises.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Reemplazar cualquier "gif_url": "https://...jpg" por "gif_url": null
content = content.replace(/"gif_url": "https:\/\/[^"]+\.jpg",/g, '"gif_url": null,');

fs.writeFileSync(filePath, content, 'utf8');
console.log('✅ defaultExercises.ts actualizado y limpiado con éxito!');
