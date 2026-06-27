import { PNG } from 'pngjs';
import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('public/La libertad avanza 1.png');

const data = fs.readFileSync(inputPath);
const png = PNG.sync.read(data);

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) * 4;
    const r = png.data[idx];
    const g = png.data[idx + 1];
    const b = png.data[idx + 2];

    // Saturación HSV: (max - min) / max.
    // Blanco puro → saturación 0 (opaco).
    // Cualquier tono coloreado (púrpura, lavanda) → saturación > 0 (transparente).
    const maxC = Math.max(r, g, b);
    const minC = Math.min(r, g, b);
    const saturation = maxC > 0 ? (maxC - minC) / maxC : 0;

    // Factor 6: saturación > ~0.17 → completamente transparente.
    // Anti-aliasing (saturación baja) queda semitransparente → bordes suaves.
    const alpha = Math.max(0, Math.min(255, Math.round(255 * (1 - saturation * 6))));
    png.data[idx + 3] = alpha;
  }
}

const output = PNG.sync.write(png);
fs.writeFileSync(inputPath, output);
console.log('Fondo eliminado por saturación.');
