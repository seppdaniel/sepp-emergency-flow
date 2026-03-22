import { createCanvas } from 'canvas';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('public/icons', { recursive: true });

function generateIcon(size) {
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#030712';
  ctx.fillRect(0, 0, size, size);

  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = size * 0.06;
  ctx.stroke();

  ctx.fillStyle = '#10b981';
  const crossW = size * 0.12;
  const crossH = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  ctx.fillRect(cx - crossW / 2, cy - crossH / 2, crossW, crossH);
  ctx.fillRect(cx - crossH / 2, cy - crossW / 2, crossH, crossW);

  return canvas.toBuffer('image/png');
}

writeFileSync('public/icons/icon-192.png', generateIcon(192));
writeFileSync('public/icons/icon-512.png', generateIcon(512));
console.log('Icons generated successfully');
